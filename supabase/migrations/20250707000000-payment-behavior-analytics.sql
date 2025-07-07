
-- Enhanced customer analytics function with payment behavior tracking
CREATE OR REPLACE FUNCTION public.get_customer_analytics(customer_uuid UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid UUID;
  analytics_data json;
  most_active_days text[];
  most_purchased_products json[];
  next_order_prediction json;
  payment_behavior json;
  total_purchases numeric;
  avg_days_between_orders numeric;
  last_order_date date;
  cash_sales_count numeric;
  credit_sales_count numeric;
  total_sales_count numeric;
  on_time_payments numeric;
  late_payments numeric;
  avg_payment_delay numeric;
BEGIN
  -- Get current user ID
  user_uuid := auth.uid();
  
  IF user_uuid IS NULL THEN
    RETURN json_build_object('error', 'User not authenticated.');
  END IF;
  
  -- Verify customer belongs to user
  IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = customer_uuid AND user_id = user_uuid) THEN
    RETURN json_build_object('error', 'Customer not found or access denied.');
  END IF;
  
  -- Get payment behavior statistics
  SELECT 
    COUNT(CASE WHEN payment_method = 'cash' THEN 1 END) as cash_count,
    COUNT(CASE WHEN payment_method IN ('credit', 'mixed') THEN 1 END) as credit_count,
    COUNT(*) as total_count
  INTO cash_sales_count, credit_sales_count, total_sales_count
  FROM public.sales_records 
  WHERE customer_id = customer_uuid AND user_id = user_uuid;
  
  -- Calculate on-time vs late payments
  SELECT 
    COUNT(CASE WHEN ct.transaction_type = 'payment' AND 
      EXTRACT(EPOCH FROM (ct.transaction_date - sr.sale_date)) / 86400 <= 30 THEN 1 END) as on_time,
    COUNT(CASE WHEN ct.transaction_type = 'payment' AND 
      EXTRACT(EPOCH FROM (ct.transaction_date - sr.sale_date)) / 86400 > 30 THEN 1 END) as late,
    AVG(CASE WHEN ct.transaction_type = 'payment' THEN 
      EXTRACT(EPOCH FROM (ct.transaction_date - sr.sale_date)) / 86400 END) as avg_delay
  INTO on_time_payments, late_payments, avg_payment_delay
  FROM public.customer_transactions ct
  JOIN public.sales_records sr ON sr.id = ct.reference_id
  WHERE ct.customer_id = customer_uuid AND ct.user_id = user_uuid;
  
  -- Build payment behavior object
  payment_behavior := json_build_object(
    'cash_sales_percentage', CASE WHEN total_sales_count > 0 THEN 
      ROUND((cash_sales_count / total_sales_count) * 100, 1) ELSE 0 END,
    'credit_sales_percentage', CASE WHEN total_sales_count > 0 THEN 
      ROUND((credit_sales_count / total_sales_count) * 100, 1) ELSE 0 END,
    'on_time_payment_percentage', CASE WHEN (on_time_payments + late_payments) > 0 THEN 
      ROUND((on_time_payments / (on_time_payments + late_payments)) * 100, 1) ELSE 0 END,
    'average_payment_delay_days', ROUND(COALESCE(avg_payment_delay, 0), 1),
    'payment_reliability', CASE 
      WHEN (on_time_payments + late_payments) = 0 THEN 'No payment history'
      WHEN on_time_payments / (on_time_payments + late_payments) >= 0.8 THEN 'Excellent'
      WHEN on_time_payments / (on_time_payments + late_payments) >= 0.6 THEN 'Good'
      WHEN on_time_payments / (on_time_payments + late_payments) >= 0.4 THEN 'Fair'
      ELSE 'Poor'
    END,
    'preferred_payment_method', CASE 
      WHEN cash_sales_count > credit_sales_count THEN 'Cash'
      WHEN credit_sales_count > cash_sales_count THEN 'Credit'
      ELSE 'Mixed'
    END
  );
  
  -- Get most active purchase days (day of week)
  SELECT array_agg(day_name ORDER BY purchase_count DESC)
  INTO most_active_days
  FROM (
    SELECT 
      to_char(sale_date, 'Day') as day_name,
      COUNT(*) as purchase_count
    FROM public.sales_records 
    WHERE customer_id = customer_uuid AND user_id = user_uuid
    GROUP BY to_char(sale_date, 'Day'), EXTRACT(DOW FROM sale_date)
    ORDER BY purchase_count DESC
    LIMIT 3
  ) days;
  
  -- Get most frequently purchased products
  SELECT array_agg(
    json_build_object(
      'product_name', p.name,
      'product_name_ar', p.name_ar,
      'total_quantity', prod_stats.total_qty,
      'total_amount', prod_stats.total_amount,
      'purchase_count', prod_stats.purchase_count
    ) ORDER BY prod_stats.total_qty DESC
  )
  INTO most_purchased_products
  FROM (
    SELECT 
      sr.product_id,
      SUM(sr.quantity) as total_qty,
      SUM(sr.total_amount) as total_amount,
      COUNT(*) as purchase_count
    FROM public.sales_records sr
    WHERE sr.customer_id = customer_uuid AND sr.user_id = user_uuid
    GROUP BY sr.product_id
    ORDER BY total_qty DESC
    LIMIT 5
  ) prod_stats
  JOIN public.products p ON p.id = prod_stats.product_id;
  
  -- Calculate prediction for next order
  SELECT 
    COUNT(*) as total_orders,
    AVG(EXTRACT(EPOCH FROM (sale_date - LAG(sale_date) OVER (ORDER BY sale_date))) / 86400) as avg_days,
    MAX(sale_date) as last_order
  INTO total_purchases, avg_days_between_orders, last_order_date
  FROM public.sales_records
  WHERE customer_id = customer_uuid AND user_id = user_uuid;
  
  -- Build next order prediction
  IF avg_days_between_orders IS NOT NULL AND last_order_date IS NOT NULL THEN
    next_order_prediction := json_build_object(
      'predicted_date', last_order_date + INTERVAL '1 day' * COALESCE(avg_days_between_orders, 30),
      'confidence', CASE 
        WHEN total_purchases >= 5 THEN 'High'
        WHEN total_purchases >= 3 THEN 'Medium' 
        ELSE 'Low'
      END,
      'avg_days_between_orders', ROUND(avg_days_between_orders, 1)
    );
  ELSE
    next_order_prediction := json_build_object(
      'predicted_date', null,
      'confidence', 'Insufficient data',
      'avg_days_between_orders', null
    );
  END IF;
  
  -- Build final analytics
  analytics_data := json_build_object(
    'most_active_days', COALESCE(most_active_days, ARRAY[]::text[]),
    'most_purchased_products', COALESCE(most_purchased_products, ARRAY[]::json[]),
    'next_order_prediction', next_order_prediction,
    'payment_behavior', payment_behavior,
    'total_purchases', COALESCE(total_purchases, 0),
    'total_spent', (
      SELECT COALESCE(SUM(total_amount), 0) 
      FROM public.sales_records 
      WHERE customer_id = customer_uuid AND user_id = user_uuid
    )
  );
  
  RETURN analytics_data;
END;
$$;
