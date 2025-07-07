import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type SupplierRow = Database['public']['Tables']['suppliers']['Row'];
type SupplierInsert = Omit<Database['public']['Tables']['suppliers']['Insert'], 'user_id'>;
type SupplierUpdate = Database['public']['Tables']['suppliers']['Update'];
type SupplierTransactionInsert = Omit<Database['public']['Tables']['supplier_transactions']['Insert'], 'user_id'>;

export interface Supplier extends SupplierRow {}

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load suppliers',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addSupplier = async (supplier: SupplierInsert) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert(supplier as any)
        .select()
        .single();

      if (error) throw error;
      setSuppliers(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error adding supplier:', error);
      toast({
        title: 'Error',
        description: 'Failed to add supplier',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const updateSupplier = async (id: string, updates: SupplierUpdate) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setSuppliers(prev => prev.map(s => s.id === id ? data : s));
      return data;
    } catch (error) {
      console.error('Error updating supplier:', error);
      toast({
        title: 'Error',
        description: 'Failed to update supplier',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSuppliers(prev => prev.filter(s => s.id !== id));
      toast({
        title: 'Success',
        description: 'Supplier deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete supplier',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const recordPayment = async (supplierId: string, amount: number, description?: string) => {
    try {
      const transaction: SupplierTransactionInsert = {
        supplier_id: supplierId,
        transaction_type: 'payment',
        amount,
        description: description || 'Payment to supplier'
      };

      const { error } = await supabase
        .from('supplier_transactions')
        .insert(transaction as any);

      if (error) throw error;

      // Refresh suppliers to get updated balance
      fetchSuppliers();
      
      toast({
        title: 'Success',
        description: 'Payment recorded successfully'
      });
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to record payment',
        variant: 'destructive'
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  return {
    suppliers,
    loading,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    recordPayment,
    refetch: fetchSuppliers
  };
};