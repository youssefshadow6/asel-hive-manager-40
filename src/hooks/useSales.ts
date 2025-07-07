
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SaleRecord {
  id: string;
  product_id: string;
  quantity: number;
  customer_name: string;
  customer_id?: string;
  sale_price: number;
  total_amount: number;
  amount_paid?: number;
  sale_date: string;
  payment_method?: string;
  payment_status?: string;
  notes?: string;
  created_at: string;
}

export const useSales = () => {
  const [salesRecords, setSalesRecords] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSalesRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_records')
        .select('*')
        .order('sale_date', { ascending: false });

      if (error) throw error;
      setSalesRecords(data || []);
    } catch (error) {
      console.error('Error fetching sales records:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sales records',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const recordSale = async (
    productId: string,
    quantity: number,
    customerName: string,
    salePrice: number,
    saleDate?: string,
    customerId?: string,
    amountPaid?: number,
    paymentMethod?: string,
    notes?: string,
    shippingCost?: number
  ) => {
    try {
      const totalAmount = (quantity * salePrice) + (shippingCost || 0);
      const actualAmountPaid = amountPaid !== undefined ? amountPaid : totalAmount;
      
      // Determine payment status and method
      let finalPaymentStatus: string;
      let finalPaymentMethod: string;
      
      if (actualAmountPaid === 0) {
        finalPaymentStatus = 'unpaid';
        finalPaymentMethod = 'credit';
      } else if (actualAmountPaid >= totalAmount) {
        finalPaymentStatus = 'paid';
        finalPaymentMethod = paymentMethod || 'cash';
      } else {
        finalPaymentStatus = 'partial';
        finalPaymentMethod = paymentMethod || 'mixed';
      }

      // Check product stock first
      const { data: currentProduct, error: productFetchError } = await supabase
        .from('products')
        .select('current_stock, name')
        .eq('id', productId)
        .single();

      if (productFetchError) throw productFetchError;

      if (currentProduct.current_stock < quantity) {
        toast({
          title: 'Insufficient Stock',
          description: `Cannot record sale. Only ${currentProduct.current_stock} units of ${currentProduct.name} are available, but you're trying to sell ${quantity} units.`,
          variant: 'destructive'
        });
        throw new Error('Insufficient stock');
      }

      // Insert sale record
      const { data: saleRecord, error: saleError } = await supabase
        .from('sales_records')
        .insert({
          product_id: productId,
          quantity,
          customer_name: customerName,
          customer_id: customerId,
          sale_price: salePrice,
          total_amount: totalAmount,
          amount_paid: actualAmountPaid,
          payment_status: finalPaymentStatus,
          payment_method: finalPaymentMethod,
          sale_date: saleDate || new Date().toISOString(),
          notes,
          shipping_cost: shippingCost || 0
        } as any)
        .select()
        .single();

      if (saleError) throw saleError;

      // Update product stock
      const { error: productUpdateError } = await supabase
        .from('products')
        .update({
          current_stock: currentProduct.current_stock - quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (productUpdateError) throw productUpdateError;

      // Create customer transaction for unpaid amounts
      if (customerId && actualAmountPaid < totalAmount) {
        const unpaidAmount = totalAmount - actualAmountPaid;
        const { error: transactionError } = await supabase
          .from('customer_transactions')
          .insert({
            customer_id: customerId,
            transaction_type: 'sale',
            amount: unpaidAmount,
            description: `Credit Sale - ${customerName} (${quantity} x ${salePrice}) - Unpaid: ${unpaidAmount}`,
            reference_id: saleRecord.id,
            transaction_date: saleDate || new Date().toISOString()
          } as any);

        if (transactionError) {
          console.error('Error creating customer transaction:', transactionError);
          toast({
            title: 'Warning',
            description: `Sale recorded successfully, but failed to update customer balance. Please manually adjust customer ${customerName}'s balance.`,
            variant: 'destructive'
          });
        }
      }

      setSalesRecords(prev => [saleRecord, ...prev]);
      
      toast({
        title: 'Success',
        description: `Sale recorded successfully. Payment: ${finalPaymentMethod} (${finalPaymentStatus})`
      });
      
      return saleRecord;

    } catch (error) {
      console.error('Error recording sale:', error);
      if (error.message !== 'Insufficient stock') {
        toast({
          title: 'Error',
          description: 'Failed to record sale. Please check all fields and try again.',
          variant: 'destructive'
        });
      }
      throw error;
    }
  };

  const deleteSaleRecord = async (id: string) => {
    try {
      // Get the sale record details first
      const saleRecord = salesRecords.find(r => r.id === id);
      if (!saleRecord) {
        toast({
          title: 'Error',
          description: 'Sale record not found',
          variant: 'destructive'
        });
        return;
      }

      // Get current product stock
      const { data: currentProduct, error: productError } = await supabase
        .from('products')
        .select('current_stock, name')
        .eq('id', saleRecord.product_id)
        .single();

      if (productError) throw productError;

      // Delete customer transaction if exists
      if (saleRecord.customer_id) {
        const { error: transactionDeleteError } = await supabase
          .from('customer_transactions')
          .delete()
          .eq('reference_id', id);

        if (transactionDeleteError) {
          console.error('Error deleting customer transaction:', transactionDeleteError);
        }
      }

      // Delete the sale record
      const { error: deleteError } = await supabase
        .from('sales_records')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Restore product stock (add back the sold quantity)
      const { error: productUpdateError } = await supabase
        .from('products')
        .update({
          current_stock: currentProduct.current_stock + saleRecord.quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', saleRecord.product_id);

      if (productUpdateError) throw productUpdateError;

      setSalesRecords(prev => prev.filter(r => r.id !== id));
      
      toast({
        title: 'Success',
        description: 'Sale record deleted successfully and stock levels restored'
      });

    } catch (error) {
      console.error('Error deleting sale record:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete sale record. Please try again.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchSalesRecords();
  }, []);

  return {
    salesRecords,
    loading,
    recordSale,
    deleteSaleRecord,
    refetch: fetchSalesRecords
  };
};
