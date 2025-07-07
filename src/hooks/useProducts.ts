
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type ProductRow = Database['public']['Tables']['products']['Row'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];

export interface Product extends ProductRow {}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      // Validate size is not empty
      if (!product.size || product.size.trim() === '') {
        throw new Error('Product size cannot be empty');
      }

        const { data, error } = await supabase
          .from('products')
          .insert({
            ...product,
            size: product.size.trim() // Ensure size is trimmed
          } as any)
          .select()
          .single();

      if (error) throw error;
      setProducts(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: 'Error',
        description: 'Failed to add product',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const updateProduct = async (id: string, updates: ProductUpdate) => {
    // Handle new product creation
    if (id === 'new') {
      return addProduct(updates as any);
    }
    
    try {
      // Validate size if being updated
      if (updates.size !== undefined && (!updates.size || updates.size.trim() === '')) {
        throw new Error('Product size cannot be empty');
      }

      const updatedData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Trim size if provided
      if (updatedData.size) {
        updatedData.size = updatedData.size.trim();
      }

      const { data, error } = await supabase
        .from('products')
        .update(updatedData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setProducts(prev => prev.map(p => p.id === id ? data : p));
      return data;
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: 'Error',
        description: 'Failed to update product',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== id));
      toast({
        title: 'Success',
        description: 'Product deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive'
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    refetch: fetchProducts
  };
};
