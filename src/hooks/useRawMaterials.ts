
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/currency';
import type { Database } from '@/integrations/supabase/types';

type RawMaterialRow = Database['public']['Tables']['raw_materials']['Row'];
type RawMaterialInsert = Omit<Database['public']['Tables']['raw_materials']['Insert'], 'user_id'>;
type RawMaterialUpdate = Database['public']['Tables']['raw_materials']['Update'];

export interface RawMaterial extends RawMaterialRow {}

export const useRawMaterials = () => {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('raw_materials')
        .select('*')
        .order('name');

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast({
        title: 'Error',
        description: 'Failed to load raw materials',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addMaterial = async (material: RawMaterialInsert & { total_cost?: number; supplier_id?: string; shipping_cost?: number }) => {
    try {
      const { total_cost, supplier_id, shipping_cost, ...materialData } = material;
      
      // Calculate unit cost: Total Cost ÷ Quantity
      let finalCostPerUnit = 0;
      
      if (total_cost && materialData.current_stock > 0) {
        finalCostPerUnit = total_cost / materialData.current_stock;
      }

      const { data, error } = await supabase
        .from('raw_materials')
        .insert({
          ...materialData,
          cost_per_unit: finalCostPerUnit,
          supplier_id: supplier_id
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Add supplier transaction if supplier and total cost are provided
      if (supplier_id && total_cost && total_cost > 0) {
        const { error: transactionError } = await supabase
          .from('supplier_transactions')
          .insert({
            supplier_id: supplier_id,
            transaction_type: 'purchase',
            amount: total_cost,
            description: `Purchase of ${materialData.current_stock} ${materialData.unit} of ${materialData.name}`,
            transaction_date: new Date().toISOString()
          } as any);

        if (transactionError) {
          console.error('Error creating supplier transaction:', transactionError);
          toast({
            title: 'Warning',
            description: 'Material added but supplier balance not updated',
            variant: 'destructive'
          });
        }
      }

      setMaterials(prev => [...prev, data]);
      
      toast({
        title: 'Success',
        description: 'Raw material added successfully'
      });
      
      return data;
    } catch (error) {
      console.error('Error adding material:', error);
      toast({
        title: 'Error',
        description: 'Failed to add material',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const updateMaterial = async (id: string, updates: RawMaterialUpdate) => {
    try {
      const { data, error } = await supabase
        .from('raw_materials')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setMaterials(prev => prev.map(m => m.id === id ? data : m));
      
      toast({
        title: 'Success',
        description: 'Raw material updated successfully'
      });
      
      return data;
    } catch (error) {
      console.error('Error updating material:', error);
      toast({
        title: 'Error',
        description: 'Failed to update material. Please check if all required fields are filled correctly.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const receiveMaterial = async (
    id: string, 
    quantity: number, 
    supplierId?: string, 
    unitCost?: number,
    shippingCost?: number,
    totalCost?: number
  ) => {
    const material = materials.find(m => m.id === id);
    if (!material) return;

    try {
      // Calculate unit cost if total cost and shipping cost are provided
      let finalUnitCost = unitCost || material.cost_per_unit || 0;
      let finalTotalCost = totalCost;
      
      if (totalCost && !unitCost) {
        // Auto-calculate unit cost: (Total Cost + Shipping Cost) ÷ Quantity
        finalUnitCost = (totalCost + (shippingCost || 0)) / quantity;
        finalTotalCost = totalCost;
      } else if (unitCost && !totalCost) {
        // Calculate total cost from unit cost
        finalTotalCost = (unitCost * quantity) + (shippingCost || 0);
      }

      // Update material stock and cost
      const updatedMaterial = await updateMaterial(id, {
        current_stock: material.current_stock + quantity,
        last_received: new Date().toISOString(),
        supplier_id: supplierId || material.supplier_id,
        cost_per_unit: finalUnitCost
      });

      // Create material receipt record
      const { error: receiptError } = await supabase
        .from('material_receipts')
        .insert({
          material_id: id,
          supplier_id: supplierId,
          quantity_received: quantity,
          unit_cost: finalUnitCost,
          shipping_cost: shippingCost || 0,
          total_cost: finalTotalCost || (finalUnitCost * quantity),
          received_date: new Date().toISOString()
        } as any);

      if (receiptError) {
        console.error('Error creating material receipt:', receiptError);
      }

      // CRITICAL: Always update supplier balance when receiving materials
      if (supplierId && finalTotalCost && finalTotalCost > 0) {
        // Add the full material cost (excluding shipping) to supplier balance
        const materialCostOnly = finalTotalCost - (shippingCost || 0);
        
        if (materialCostOnly > 0) {
          const { error: transactionError } = await supabase
            .from('supplier_transactions')
            .insert({
              supplier_id: supplierId,
              transaction_type: 'purchase',
              amount: materialCostOnly,
              description: `Purchase of ${quantity} ${material.unit} of ${material.name}`,
              transaction_date: new Date().toISOString()
            } as any);

          if (transactionError) {
            console.error('Error creating supplier transaction:', transactionError);
            toast({
              title: 'Warning',
              description: 'Material received but supplier balance not updated',
              variant: 'destructive'
            });
          } else {
            toast({
              title: 'Success',
              description: `Material received and supplier balance updated with ${formatCurrency(materialCostOnly)}`,
            });
          }
        }
      }

      return updatedMaterial;
    } catch (error) {
      console.error('Error receiving material:', error);
      throw error;
    }
  };

  const deleteMaterial = async (id: string) => {
    try {
      // First check if material is used in any production records
      const { data: productionMaterials, error: checkError } = await supabase
        .from('production_materials')
        .select('id')
        .eq('material_id', id)
        .limit(1);

      if (checkError) throw checkError;

      if (productionMaterials && productionMaterials.length > 0) {
        toast({
          title: 'Cannot Delete Material',
          description: 'This raw material cannot be deleted because it is linked to production records. Please remove it from production records first.',
          variant: 'destructive'
        });
        return;
      }

      // Check if material is used in product BOM
      const { data: bomEntries, error: bomError } = await supabase
        .from('product_bom')
        .select('id')
        .eq('material_id', id)
        .limit(1);

      if (bomError) throw bomError;

      if (bomEntries && bomEntries.length > 0) {
        toast({
          title: 'Cannot Delete Material',
          description: 'This raw material cannot be deleted because it is used in product recipes (BOM). Please remove it from product recipes first.',
          variant: 'destructive'
        });
        return;
      }

      const { error } = await supabase
        .from('raw_materials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setMaterials(prev => prev.filter(m => m.id !== id));
      toast({
        title: 'Success',
        description: 'Raw material deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting material:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete material. Please try again or contact support if the issue persists.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  return {
    materials,
    loading,
    addMaterial,
    updateMaterial,
    receiveMaterial,
    deleteMaterial,
    refetch: fetchMaterials
  };
};
