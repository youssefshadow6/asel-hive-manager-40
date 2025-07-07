
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type ProductBOMRow = Database['public']['Tables']['product_bom']['Row'];
type ProductBOMInsert = Omit<Database['public']['Tables']['product_bom']['Insert'], 'user_id'>;

export interface ProductBOM extends ProductBOMRow {}

export interface BOMItem {
  material_id: string;
  quantity_per_unit: number;
}

export const useProductBOM = () => {
  const [bomItems, setBomItems] = useState<ProductBOM[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBOMByProduct = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_bom')
        .select(`
          *,
          raw_materials (
            id,
            name,
            name_ar,
            unit,
            current_stock
          )
        `)
        .eq('product_id', productId)
        .order('created_at');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching BOM:', error);
      toast({
        title: 'Error',
        description: 'Failed to load product recipe',
        variant: 'destructive'
      });
      return [];
    }
  };

  const saveBOM = async (productId: string, bomItems: BOMItem[]) => {
    try {
      // Delete existing BOM items for this product
      const { error: deleteError } = await supabase
        .from('product_bom')
        .delete()
        .eq('product_id', productId);

      if (deleteError) throw deleteError;

      // Insert new BOM items
      if (bomItems.length > 0) {
        const { error: insertError } = await supabase
          .from('product_bom')
          .insert(
            bomItems.map(item => ({
              product_id: productId,
              material_id: item.material_id,
              quantity_per_unit: item.quantity_per_unit
            })) as any
          );

        if (insertError) throw insertError;
      }

      toast({
        title: 'Success',
        description: 'Product recipe saved successfully'
      });
    } catch (error) {
      console.error('Error saving BOM:', error);
      toast({
        title: 'Error',
        description: 'Failed to save product recipe',
        variant: 'destructive'
      });
      throw error;
    }
  };

  return {
    bomItems,
    loading,
    fetchBOMByProduct,
    saveBOM
  };
};
