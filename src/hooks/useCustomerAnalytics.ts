import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, addDays, differenceInDays } from 'date-fns';

export interface CustomerAnalytics {
  totalPurchases: number;
  totalAmount: number;
  averageOrderValue: number;
  mostPurchasedProducts: {
    productId: string;
    productName: string;
    quantity: number;
    percentage: number;
  }[];
  weeklyPurchasePattern: {
    day: string;
    count: number;
    percentage: number;
  }[];
  monthlyTrend: {
    month: string;
    amount: number;
    orders: number;
  }[];
  predictedNextPurchase: {
    date: string;
    confidence: number;
    recommendedProducts: string[];
  };
  paymentBehavior: {
    cashPercentage: number;
    creditPercentage: number;
    avgPaymentDelay: number;
  };
}

export const useCustomerAnalytics = (customerId?: string) => {
  const [analytics, setAnalytics] = useState<CustomerAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async () => {
    if (!customerId) return;
    
    setLoading(true);
    try {
      // Fetch customer sales data
      const { data: salesData, error: salesError } = await supabase
        .from('sales_records')
        .select(`
          *,
          products(name, name_ar)
        `)
        .eq('customer_id', customerId)
        .order('sale_date', { ascending: false });

      if (salesError) throw salesError;
      
      // Fetch customer transactions for payment behavior
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('customer_transactions')
        .select('*')
        .eq('customer_id', customerId)
        .order('transaction_date', { ascending: false });

      if (transactionsError) throw transactionsError;

      if (!salesData || salesData.length === 0) {
        setAnalytics({
          totalPurchases: 0,
          totalAmount: 0,
          averageOrderValue: 0,
          mostPurchasedProducts: [],
          weeklyPurchasePattern: [],
          monthlyTrend: [],
          predictedNextPurchase: {
            date: '',
            confidence: 0,
            recommendedProducts: []
          },
          paymentBehavior: {
            cashPercentage: 0,
            creditPercentage: 0,
            avgPaymentDelay: 0
          }
        });
        return;
      }

      // Calculate basic metrics
      const totalPurchases = salesData.length;
      const totalAmount = salesData.reduce((sum, sale) => sum + sale.total_amount, 0);
      const averageOrderValue = totalAmount / totalPurchases;

      // Most purchased products
      const productCounts = salesData.reduce((acc, sale) => {
        const productId = sale.product_id;
        const productName = sale.products?.name || 'Unknown Product';
        acc[productId] = {
          productId,
          productName,
          quantity: (acc[productId]?.quantity || 0) + sale.quantity
        };
        return acc;
      }, {} as Record<string, any>);

      const totalQuantity = Object.values(productCounts).reduce((sum: number, item: any) => sum + item.quantity, 0);
      const mostPurchasedProducts = Object.values(productCounts)
        .map((item: any) => ({
          ...item,
          percentage: (item.quantity / totalQuantity) * 100
        }))
        .sort((a: any, b: any) => b.quantity - a.quantity)
        .slice(0, 5);

      // Weekly purchase pattern
      const weeklyPattern = Array.from({ length: 7 }, (_, i) => ({
        day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i],
        count: 0
      }));

      salesData.forEach(sale => {
        const saleDate = new Date(sale.sale_date);
        const dayOfWeek = saleDate.getDay();
        weeklyPattern[dayOfWeek].count++;
      });

      const weeklyPurchasePattern = weeklyPattern.map(day => ({
        ...day,
        percentage: (day.count / totalPurchases) * 100
      }));

      // Monthly trend (last 12 months)
      const monthlyTrend = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        
        const monthSales = salesData.filter(sale => {
          const saleDate = new Date(sale.sale_date);
          return saleDate >= monthStart && saleDate <= monthEnd;
        });

        monthlyTrend.push({
          month: format(monthDate, 'MMM yyyy'),
          amount: monthSales.reduce((sum, sale) => sum + sale.total_amount, 0),
          orders: monthSales.length
        });
      }

      // Predict next purchase (simple algorithm based on purchase frequency)
      let predictedNextPurchase = {
        date: '',
        confidence: 0,
        recommendedProducts: []
      };

      if (salesData.length >= 2) {
        // Calculate average days between purchases
        const sortedSales = salesData.sort((a, b) => new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime());
        const daysBetweenPurchases = [];
        
        for (let i = 1; i < sortedSales.length; i++) {
          const days = differenceInDays(
            new Date(sortedSales[i].sale_date),
            new Date(sortedSales[i - 1].sale_date)
          );
          daysBetweenPurchases.push(days);
        }

        const avgDaysBetween = daysBetweenPurchases.reduce((sum, days) => sum + days, 0) / daysBetweenPurchases.length;
        const lastPurchase = new Date(sortedSales[sortedSales.length - 1].sale_date);
        const predictedDate = addDays(lastPurchase, Math.round(avgDaysBetween));
        
        // Confidence based on consistency of purchase intervals
        const variance = daysBetweenPurchases.reduce((sum, days) => sum + Math.pow(days - avgDaysBetween, 2), 0) / daysBetweenPurchases.length;
        const confidence = Math.max(0, Math.min(100, 100 - (variance / avgDaysBetween) * 50));

        predictedNextPurchase = {
          date: format(predictedDate, 'yyyy-MM-dd'),
          confidence: Math.round(confidence),
          recommendedProducts: mostPurchasedProducts.slice(0, 3).map(p => p.productName)
        };
      }

      // Payment behavior analysis
      const cashSales = salesData.filter(sale => sale.payment_method === 'cash').length;
      const creditSales = salesData.filter(sale => sale.payment_method === 'credit' || sale.payment_method === 'mixed').length;
      
      const paymentBehavior = {
        cashPercentage: (cashSales / totalPurchases) * 100,
        creditPercentage: (creditSales / totalPurchases) * 100,
        avgPaymentDelay: 0 // This would need more complex calculation with payment dates
      };

      setAnalytics({
        totalPurchases,
        totalAmount,
        averageOrderValue,
        mostPurchasedProducts,
        weeklyPurchasePattern,
        monthlyTrend,
        predictedNextPurchase,
        paymentBehavior
      });

    } catch (error) {
      console.error('Error fetching customer analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [customerId]);

  return {
    analytics,
    loading,
    refetch: fetchAnalytics
  };
};