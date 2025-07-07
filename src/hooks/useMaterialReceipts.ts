import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type MaterialReceiptRow = Database['public']['Tables']['material_receipts']['Row'];
type MaterialReceiptInsert = Omit<Database['public']['Tables']['material_receipts']['Insert'], 'user_id'>;

export interface MaterialReceipt extends MaterialReceiptRow {}

export const useMaterialReceipts = () => {
  const [receipts, setReceipts] = useState<MaterialReceipt[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReceipts = async () => {
    try {
      const { data, error } = await supabase
        .from('material_receipts')
        .select(`
          *,
          raw_materials(name, name_ar, unit),
          suppliers(name)
        `)
        .order('received_date', { ascending: false });

      if (error) throw error;
      setReceipts(data || []);
    } catch (error) {
      console.error('Error fetching material receipts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load material receipts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addReceipt = async (receipt: MaterialReceiptInsert) => {
    try {
      const { data, error } = await supabase
        .from('material_receipts')
        .insert(receipt as any)
        .select()
        .single();

      if (error) throw error;
      setReceipts(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error adding material receipt:', error);
      toast({
        title: 'Error',
        description: 'Failed to add material receipt',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const getReceiptsByMaterial = (materialId: string) => {
    return receipts.filter(receipt => receipt.material_id === materialId);
  };

  const getLatestUnitCost = (materialId: string) => {
    const materialReceipts = getReceiptsByMaterial(materialId);
    return materialReceipts.length > 0 ? materialReceipts[0].unit_cost : 0;
  };

  const getAverageUnitCost = (materialId: string) => {
    const materialReceipts = getReceiptsByMaterial(materialId);
    if (materialReceipts.length === 0) return 0;
    
    const totalCost = materialReceipts.reduce((sum, receipt) => sum + (receipt.unit_cost * receipt.quantity_received), 0);
    const totalQuantity = materialReceipts.reduce((sum, receipt) => sum + receipt.quantity_received, 0);
    
    return totalQuantity > 0 ? totalCost / totalQuantity : 0;
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  return {
    receipts,
    loading,
    addReceipt,
    getReceiptsByMaterial,
    getLatestUnitCost,
    getAverageUnitCost,
    refetch: fetchReceipts
  };
};