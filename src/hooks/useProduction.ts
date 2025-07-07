
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ProductionRecord {
  id: string;
  product_id: string;
  quantity: number;
  production_date: string;
  total_cost?: number;
  notes?: string;
  created_at: string;
}

export interface ProductionMaterial {
  material_id: string;
  quantity_used: number;
  cost_at_time?: number;
}

export const useProduction = () => {
  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProductionRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('production_records')
        .select('*')
        .order('production_date', { ascending: false });

      if (error) throw error;
      setProductionRecords(data || []);
    } catch (error) {
      console.error('Error fetching production records:', error);
      toast({
        title: 'Error',
        description: 'Failed to load production records',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const recordProduction = async (
    productId: string,
    quantity: number,
    materials: ProductionMaterial[],
    productionDate?: string,
    notes?: string
  ) => {
    try {
      // Start a transaction
      const { data: productionRecord, error: productionError } = await supabase
        .from('production_records')
        .insert({
          product_id: productId,
          quantity,
          production_date: productionDate || new Date().toISOString(),
          notes: notes || null
        } as any)
        .select()
        .single();

      if (productionError) throw productionError;

      // Insert production materials
      if (materials.length > 0) {
        const { error: materialsError } = await supabase
          .from('production_materials')
          .insert(materials.map(m => ({
            production_record_id: productionRecord.id,
            material_id: m.material_id,
            quantity_used: m.quantity_used,
            cost_at_time: m.cost_at_time || 0
          })));

        if (materialsError) throw materialsError;
      }

      // Update raw materials stock
      for (const material of materials) {
        const { data: currentMaterial, error: fetchError } = await supabase
          .from('raw_materials')
          .select('current_stock')
          .eq('id', material.material_id)
          .single();

        if (fetchError) throw fetchError;

        const { error: updateError } = await supabase
          .from('raw_materials')
          .update({
            current_stock: currentMaterial.current_stock - material.quantity_used,
            updated_at: new Date().toISOString()
          })
          .eq('id', material.material_id);

        if (updateError) throw updateError;
      }

      // Update product stock
      const { data: currentProduct, error: productFetchError } = await supabase
        .from('products')
        .select('current_stock')
        .eq('id', productId)
        .single();

      if (productFetchError) throw productFetchError;

      const { error: productUpdateError } = await supabase
        .from('products')
        .update({
          current_stock: currentProduct.current_stock + quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (productUpdateError) throw productUpdateError;

      setProductionRecords(prev => [productionRecord, ...prev]);
      
      toast({
        title: 'Success',
        description: 'Production recorded successfully'
      });
      
      return productionRecord;

    } catch (error) {
      console.error('Error recording production:', error);
      toast({
        title: 'Error',
        description: 'Failed to record production',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const updateProductionRecord = async (
    id: string,
    updates: Partial<ProductionRecord>
  ) => {
    try {
      const { data, error } = await supabase
        .from('production_records')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setProductionRecords(prev => prev.map(r => r.id === id ? data : r));
      
      toast({
        title: 'Success',
        description: 'Production record updated successfully'
      });
      
      return data;
    } catch (error) {
      console.error('Error updating production record:', error);
      toast({
        title: 'Error',
        description: 'Failed to update production record. Please check all fields are valid.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const deleteProductionRecord = async (id: string) => {
    try {
      // Check if this will cause issues with stock levels
      const productionRecord = productionRecords.find(r => r.id === id);
      if (!productionRecord) {
        toast({
          title: 'Error',
          description: 'Production record not found',
          variant: 'destructive'
        });
        return;
      }

      // Get current product stock
      const { data: currentProduct, error: productError } = await supabase
        .from('products')
        .select('current_stock')
        .eq('id', productionRecord.product_id)
        .single();

      if (productError) throw productError;

      // Check if we have enough stock to reverse this production
      if (currentProduct.current_stock < productionRecord.quantity) {
        toast({
          title: 'Cannot Delete Production Record',
          description: `Cannot delete this production record because the current product stock (${currentProduct.current_stock}) is less than the produced quantity (${productionRecord.quantity}). This would result in negative stock.`,
          variant: 'destructive'
        });
        return;
      }

      // Delete production materials first
      const { error: materialsDeleteError } = await supabase
        .from('production_materials')
        .delete()
        .eq('production_record_id', id);

      if (materialsDeleteError) throw materialsDeleteError;

      // Delete the production record
      const { error: deleteError } = await supabase
        .from('production_records')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Update product stock (reduce by the production quantity)
      const { error: productUpdateError } = await supabase
        .from('products')
        .update({
          current_stock: currentProduct.current_stock - productionRecord.quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', productionRecord.product_id);

      if (productUpdateError) throw productUpdateError;

      setProductionRecords(prev => prev.filter(r => r.id !== id));
      
      toast({
        title: 'Success',
        description: 'Production record deleted successfully and stock levels adjusted'
      });

    } catch (error) {
      console.error('Error deleting production record:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete production record. Please try again or contact support.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchProductionRecords();
  }, []);

  return {
    productionRecords,
    loading,
    recordProduction,
    updateProductionRecord,
    deleteProductionRecord,
    refetch: fetchProductionRecords
  };
};
