import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { CustomerAnalyticsDialog } from "@/components/CustomerAnalyticsDialog";
import { DataResetButton } from "@/components/DataResetButton";
import { Plus, DollarSign, Trash2, Download, BarChart3 } from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
import { formatCurrency } from "@/utils/currency";
import { formatGregorianDate } from "@/utils/dateUtils";
import * as XLSX from 'xlsx';

interface CustomersManagerProps {
  language: 'en' | 'ar';
}

export const CustomersManager = ({ language }: CustomersManagerProps) => {
  const { customers, loading, addCustomer, deleteCustomer, recordPayment } = useCustomers();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; customer: any }>({ open: false, customer: null });
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newCustomer, setNewCustomer] = useState({ name: '', contact_info: '' });
  const [paymentAmount, setPaymentAmount] = useState('');

  const translations = {
    en: {
      customers: "Customers",
      addCustomer: "Add Customer",
      customerName: "Customer Name",
      contactInfo: "Contact Info",
      currentBalance: "Current Balance",
      actions: "Actions",
      recordPayment: "Record Payment",
      paymentAmount: "Payment Amount",
      save: "Save",
      cancel: "Cancel",
      pay: "Pay",
      delete: "Delete",
      search: "Search customers...",
      export: "Export",
      analytics: "Analytics",
      confirmDelete: "Are you sure you want to delete this customer?",
      deleteWarning: "This will permanently remove the customer and all related data."
    },
    ar: {
      customers: "العملاء",
      addCustomer: "إضافة عميل",
      customerName: "اسم العميل",
      contactInfo: "معلومات الاتصال",
      currentBalance: "الرصيد الحالي",
      actions: "الإجراءات",
      recordPayment: "تسجيل دفعة",
      paymentAmount: "مبلغ الدفعة",
      save: "حفظ",
      cancel: "إلغاء",
      pay: "دفع",
      delete: "حذف",
      search: "البحث عن العملاء...",
      export: "تصدير",
      analytics: "تحليل",
      confirmDelete: "هل أنت متأكد من حذف هذا العميل؟",
      deleteWarning: "سيؤدي هذا إلى إزالة العميل نهائياً وجميع البيانات المرتبطة به."
    }
  };

  const t = translations[language];

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCustomer = async () => {
    if (!newCustomer.name) return;
    
    try {
      await addCustomer(newCustomer);
      setNewCustomer({ name: '', contact_info: '' });
      setShowAddDialog(false);
    } catch (error) {
      console.error('Error adding customer:', error);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedCustomer || !paymentAmount) return;
    
    try {
      await recordPayment(selectedCustomer.id, parseFloat(paymentAmount));
      setPaymentAmount('');
      setShowPaymentDialog(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Error recording payment:', error);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deleteDialog.customer) return;
    
    try {
      await deleteCustomer(deleteDialog.customer.id);
      setDeleteDialog({ open: false, customer: null });
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  const exportToExcel = () => {
    const data = filteredCustomers.map(customer => ({
      [t.customerName]: customer.name,
      [t.contactInfo]: customer.contact_info || '',
      [t.currentBalance]: customer.current_balance,
      'Created': formatGregorianDate(customer.created_at, language)
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    XLSX.writeFile(wb, `customers_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {t.customers}
            <div className="flex gap-2">
              <DataResetButton language={language} />
              <Button onClick={exportToExcel} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                {t.export}
              </Button>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {t.addCustomer}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t.addCustomer}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">{t.customerName}</Label>
                      <Input
                        id="name"
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact">{t.contactInfo}</Label>
                      <Input
                        id="contact"
                        value={newCustomer.contact_info}
                        onChange={(e) => setNewCustomer(prev => ({ ...prev, contact_info: e.target.value }))}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                        {t.cancel}
                      </Button>
                      <Button onClick={handleAddCustomer}>
                        {t.save}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder={t.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.customerName}</TableHead>
                <TableHead>{t.contactInfo}</TableHead>
                <TableHead>{t.currentBalance}</TableHead>
                <TableHead>{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.contact_info || '-'}</TableCell>
                  <TableCell>
                    <span className={customer.current_balance > 0 ? 'text-red-600' : 'text-green-600'}>
                      {formatCurrency(customer.current_balance)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowAnalyticsDialog(true);
                        }}
                      >
                        <BarChart3 className="h-4 w-4 mr-1" />
                        {t.analytics}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowPaymentDialog(true);
                        }}
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        {t.pay}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteDialog({ open: true, customer })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.recordPayment} - {selectedCustomer?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="payment">{t.paymentAmount}</Label>
              <Input
                id="payment"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                {t.cancel}
              </Button>
              <Button onClick={handleRecordPayment}>
                {t.pay}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <CustomerAnalyticsDialog
        open={showAnalyticsDialog}
        onOpenChange={setShowAnalyticsDialog}
        customer={selectedCustomer}
        language={language}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, customer: null })}
        onConfirm={handleDeleteCustomer}
        title={deleteDialog.customer?.name || ''}
        description={t.deleteWarning}
        language={language}
      />
    </div>
  );
};
