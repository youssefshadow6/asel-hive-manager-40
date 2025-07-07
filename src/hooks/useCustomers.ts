import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type CustomerRow = Database['public']['Tables']['customers']['Row'];
type CustomerInsert = Omit<Database['public']['Tables']['customers']['Insert'], 'user_id'>;
type CustomerUpdate = Database['public']['Tables']['customers']['Update'];
type CustomerTransactionInsert = Omit<Database['public']['Tables']['customer_transactions']['Insert'], 'user_id'>;

export interface Customer extends CustomerRow {}

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load customers',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addCustomer = async (customer: CustomerInsert) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert(customer as any)
        .select()
        .single();

      if (error) throw error;
      setCustomers(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error adding customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to add customer',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const updateCustomer = async (id: string, updates: CustomerUpdate) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setCustomers(prev => prev.map(c => c.id === id ? data : c));
      return data;
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to update customer',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCustomers(prev => prev.filter(c => c.id !== id));
      toast({
        title: 'Success',
        description: 'Customer deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete customer',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const recordPayment = async (customerId: string, amount: number, description?: string) => {
    try {
      const transaction: CustomerTransactionInsert = {
        customer_id: customerId,
        transaction_type: 'payment',
        amount,
        description: description || 'Payment from customer'
      };

      const { error } = await supabase
        .from('customer_transactions')
        .insert(transaction as any);

      if (error) throw error;

      // Refresh customers to get updated balance
      fetchCustomers();
      
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
    fetchCustomers();
  }, []);

  return {
    customers,
    loading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    recordPayment,
    refetch: fetchCustomers
  };
};