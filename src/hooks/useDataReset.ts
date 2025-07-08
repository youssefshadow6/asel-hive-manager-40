
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DataResetResponse {
  success: boolean;
  message: string;
}

export const useDataReset = () => {
  const [loading, setLoading] = useState(false);

  const resetAllData = async (password: string) => {
    setLoading(true);
    try {
      // Trim the password to remove any extra spaces
      const trimmedPassword = password.trim();
      
      console.log('Attempting data reset with password length:', trimmedPassword.length);
      console.log('Password starts with:', trimmedPassword.substring(0, 3));
      
      const { data, error } = await supabase.rpc('reset_user_data', {
        admin_password: trimmedPassword
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        toast({
          title: 'Database Error',
          description: `Database error: ${error.message}`,
          variant: 'destructive'
        });
        return { success: false, message: `Database error: ${error.message}` };
      }

      // Type-cast the Json response to our expected interface
      const response = data as unknown as DataResetResponse;
      
      console.log('Reset response:', response);

      if (response?.success) {
        toast({
          title: 'Success',
          description: response.message
        });
        return { success: true, message: response.message };
      } else {
        const errorMessage = response?.message || 'Failed to reset data';
        console.error('Reset failed:', errorMessage);
        toast({
          title: 'Reset Failed',
          description: errorMessage,
          variant: 'destructive'
        });
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      console.error('Error resetting data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Error',
        description: `Failed to reset data: ${errorMessage}`,
        variant: 'destructive'
      });
      return { success: false, message: `Failed to reset data: ${errorMessage}` };
    } finally {
      setLoading(false);
    }
  };

  return {
    resetAllData,
    loading
  };
};
