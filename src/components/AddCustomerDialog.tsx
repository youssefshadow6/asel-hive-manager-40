import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCustomers } from "@/hooks/useCustomers";
import { toast } from "@/hooks/use-toast";

interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  language: 'en' | 'ar';
  onCustomerAdded?: (customer: any) => void;
}

export const AddCustomerDialog = ({ 
  open, 
  onOpenChange, 
  initialName = '', 
  language,
  onCustomerAdded 
}: AddCustomerDialogProps) => {
  const { addCustomer } = useCustomers();
  const [customerData, setCustomerData] = useState({
    name: initialName,
    contact_info: ''
  });

  const translations = {
    en: {
      addCustomer: "Add New Customer",
      customerName: "Customer Name",
      contactInfo: "Contact Info (Phone/Email)",
      save: "Save",
      cancel: "Cancel"
    },
    ar: {
      addCustomer: "إضافة عميل جديد",
      customerName: "اسم العميل",
      contactInfo: "معلومات الاتصال (هاتف/إيميل)",
      save: "حفظ",
      cancel: "إلغاء"
    }
  };

  const t = translations[language];

  const handleSave = async () => {
    if (!customerData.name.trim()) {
      toast({
        title: language === 'en' ? 'Error' : 'خطأ',
        description: language === 'en' ? 'Customer name is required' : 'اسم العميل مطلوب',
        variant: 'destructive'
      });
      return;
    }

    try {
      const newCustomer = await addCustomer({
        name: customerData.name.trim(),
        contact_info: customerData.contact_info.trim() || null
      });
      
      if (onCustomerAdded) {
        onCustomerAdded(newCustomer);
      }
      
      setCustomerData({ name: '', contact_info: '' });
      onOpenChange(false);
      
      toast({
        title: language === 'en' ? 'Success' : 'نجح',
        description: language === 'en' ? 'Customer added successfully' : 'تم إضافة العميل بنجاح'
      });
    } catch (error) {
      console.error('Error adding customer:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.addCustomer}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="customerName">{t.customerName}</Label>
            <Input
              id="customerName"
              value={customerData.name}
              onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t.customerName}
            />
          </div>
          <div>
            <Label htmlFor="contactInfo">{t.contactInfo}</Label>
            <Input
              id="contactInfo"
              value={customerData.contact_info}
              onChange={(e) => setCustomerData(prev => ({ ...prev, contact_info: e.target.value }))}
              placeholder={t.contactInfo}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleSave}>
              {t.save}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};