
-- Update the reset password function to use the new password
CREATE OR REPLACE FUNCTION public.reset_user_data(admin_password TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  correct_password TEXT := 'sarah2013'; -- Updated password
  user_uuid UUID;
BEGIN
  -- Log the received password for debugging (first 3 characters only for security)
  RAISE NOTICE 'Reset attempt - password length: %, starts with: %', LENGTH(admin_password), LEFT(admin_password, 3);
  
  -- Verify password (exact match, case-sensitive)
  IF admin_password != correct_password THEN
    RAISE NOTICE 'Password mismatch - received: "%" vs expected: "%"', admin_password, correct_password;
    RETURN json_build_object('success', false, 'message', 'Invalid password. Data reset aborted. Please ensure you are entering exactly: sarah2013');
  END IF;
  
  -- Get current user ID
  user_uuid := auth.uid();
  
  IF user_uuid IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'User not authenticated.');
  END IF;
  
  -- Delete all user data in correct order (respecting foreign key constraints)
  DELETE FROM public.production_materials WHERE production_record_id IN (
    SELECT id FROM public.production_records WHERE user_id = user_uuid
  );
  
  DELETE FROM public.product_bom WHERE user_id = user_uuid;
  DELETE FROM public.stock_movements WHERE user_id = user_uuid;
  DELETE FROM public.sales_records WHERE user_id = user_uuid;
  DELETE FROM public.production_records WHERE user_id = user_uuid;
  DELETE FROM public.customer_transactions WHERE customer_id IN (
    SELECT id FROM public.customers WHERE user_id = user_uuid
  );
  DELETE FROM public.supplier_transactions WHERE supplier_id IN (
    SELECT id FROM public.suppliers WHERE user_id = user_uuid
  );
  DELETE FROM public.customers WHERE user_id = user_uuid;
  DELETE FROM public.suppliers WHERE user_id = user_uuid;
  DELETE FROM public.products WHERE user_id = user_uuid;
  DELETE FROM public.raw_materials WHERE user_id = user_uuid;
  
  RETURN json_build_object('success', true, 'message', 'All data has been reset successfully.');
END;
$$;
