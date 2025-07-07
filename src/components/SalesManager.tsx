import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Plus, Minus, DollarSign, Calendar, Trash2, FileText, CreditCard, Banknote } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useProducts } from "@/hooks/useProducts";
import { useSales } from "@/hooks/useSales";
import { useCustomers } from "@/hooks/useCustomers";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/currency";
import { formatGregorianDate } from "@/utils/dateUtils";
import { InvoicePreview } from "@/components/InvoicePreview";
import { AddCustomerDialog } from "@/components/AddCustomerDialog";
import { supabase } from "@/integrations/supabase/client";

interface SalesManagerProps {
  language: 'en' | 'ar';
}

export const SalesManager = ({ language }: SalesManagerProps) => {
  const { products, refetch: refetchProducts } = useProducts();
  const { salesRecords, recordSale, deleteSaleRecord, refetch: refetchSales } = useSales();
  const { customers, addCustomer } = useCustomers();
  
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  const [isAddCustomerDialogOpen, setIsAddCustomerDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [saleQuantity, setSaleQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [salePrice, setSalePrice] = useState(0);
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit' | 'partial'>('cash');
  const [amountPaid, setAmountPaid] = useState<number | ''>('');
  
  // Invoice state
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [currentInvoiceData, setCurrentInvoiceData] = useState<{
    saleRecord: any;
    product: any;
  } | null>(null);

  

  const showInvoice = (saleRecord: any) => {
    const product = products.find(p => p.id === saleRecord.product_id);
    setCurrentInvoiceData({ saleRecord, product });
    setIsInvoiceOpen(true);
  };

  const translations = {
    en: {
      sales: "Sales Management",
      recordSale: "Record Sale",
      selectProduct: "Select Product",
      quantity: "Quantity Sold",
      customerName: "Customer Name",
      selectCustomer: "Select Customer",
      newCustomer: "New Customer",
      price: "Price per Unit",
      saleDate: "Sale Date",
      totalPrice: "Total Price",
      currentStock: "Current Stock",
      availableStock: "Available Stock",
      insufficient: "Insufficient Stock",
      sell: "Record Sale",
      cancel: "Cancel",
      saleRecorded: "Sale recorded successfully",
      insufficientStock: "Insufficient stock for this sale",
      recentSales: "Recent Sales",
      salesByDate: "Sales by Date",
      filterByDate: "Filter by Date",
      noSales: "No sales records yet",
      sold: "Sold",
      units: "units",
      to: "to",
      totalSales: "Total Sales",
      todaySales: "Today's Sales",
      bestSelling: "Best Selling Product",
      currency: "EGP",
      salesSummary: "Sales Summary (Past Year)",
      totalUnits: "Total Units",
      totalRevenue: "Total Revenue",
      manualPrice: "Custom Price per Unit",
      suggestedPrice: "Suggested Price",
      delete: "Delete",
      confirmDelete: "Are you sure you want to delete this sale record?",
      showInvoice: "Show Invoice",
      actions: "Actions",
      paymentMethod: "Payment Method",
      cash: "Cash (Full Payment)",
      credit: "Credit (Pay Later)",
      partial: "Partial Payment",
      amountPaid: "Amount Paid",
      unpaidAmount: "Unpaid Amount"
    },
    ar: {
      sales: "إدارة المبيعات",
      recordSale: "تسجيل بيع",
      selectProduct: "اختر المنتج",
      quantity: "الكمية المباعة",
      customerName: "اسم العميل",
      selectCustomer: "اختر العميل",
      newCustomer: "عميل جديد",
      price: "السعر للوحدة",
      saleDate: "تاريخ البيع",
      totalPrice: "إجمالي السعر",
      currentStock: "المخزون الحالي",
      availableStock: "المخزون المتاح",
      insufficient: "مخزون غير كاف",
      sell: "تسجيل البيع",
      cancel: "إلغاء",
      saleRecorded: "تم تسجيل البيع بنجاح",
      insufficientStock: "مخزون غير كاف لهذا البيع",
      recentSales: "المبيعات الأخيرة",
      salesByDate: "المبيعات حسب التاريخ",
      filterByDate: "فلترة حسب التاريخ",
      noSales: "لا توجد سجلات مبيعات بعد",
      sold: "تم بيع",
      units: "وحدة",
      to: "إلى",
      totalSales: "إجمالي المبيعات",
      todaySales: "مبيعات اليوم",
      bestSelling: "المنتج الأكثر مبيعاً",
      currency: "ج.م",
      salesSummary: "ملخص المبيعات (العام الماضي)",
      totalUnits: "إجمالي الوحدات",
      totalRevenue: "إجمالي الإيرادات",
      manualPrice: "سعر مخصص لكل وحدة",
      suggestedPrice: "السعر المقترح",
      delete: "حذف",
      confirmDelete: "هل أنت متأكد من حذف سجل البيع هذا؟",
      showInvoice: "عرض الفاتورة",
      actions: "الإجراءات",
      paymentMethod: "طريقة الدفع",
      cash: "نقدي (دفع كامل)",
      credit: "آجل (دفع لاحق)",
      partial: "دفع جزئي",
      amountPaid: "المبلغ المدفوع",
      unpaidAmount: "المبلغ غير المدفوع"
    }
  };

  const t = translations[language];

  const selectedProduct = products.find(p => p.id === selectedProductId);
  
  const canSell = () => {
    return selectedProduct && selectedProduct.current_stock >= saleQuantity;
  };

  const getTotalPrice = () => salePrice * saleQuantity;
  const getUnpaidAmount = () => {
    const total = getTotalPrice();
    const paid = typeof amountPaid === 'number' ? amountPaid : 0;
    return Math.max(0, total - paid);
  };

  const getFilteredSales = () => {
    return salesRecords.filter(sale => 
      formatGregorianDate(sale.sale_date, 'en') === filterDate
    );
  };

  const getTodaySales = () => {
    const today = new Date();
    return salesRecords
      .filter(sale => new Date(sale.sale_date).toDateString() === today.toDateString())
      .reduce((total, sale) => total + sale.total_amount, 0);
  };

  const getTotalSalesValue = () => {
    return salesRecords.reduce((total, sale) => total + sale.total_amount, 0);
  };

  const getBestSellingProduct = () => {
    const productSales = salesRecords.reduce((acc, sale) => {
      acc[sale.product_id] = (acc[sale.product_id] || 0) + sale.quantity;
      return acc;
    }, {} as Record<string, number>);
    
    const bestProductId = Object.entries(productSales)
      .sort(([,a], [,b]) => b - a)[0]?.[0];
    
    const bestProduct = products.find(p => p.id === bestProductId);
    return bestProduct ? {
      product: bestProduct,
      totalSold: productSales[bestProductId]
    } : null;
  };

  const getYearlySalesSummary = () => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const yearSales = salesRecords.filter(sale => 
      new Date(sale.sale_date) >= oneYearAgo
    );

    const summary = yearSales.reduce((acc, sale) => {
      const productId = sale.product_id;
      if (!acc[productId]) {
        const product = products.find(p => p.id === productId);
        acc[productId] = {
          product,
          totalUnits: 0,
          totalRevenue: 0
        };
      }
      acc[productId].totalUnits += sale.quantity;
      acc[productId].totalRevenue += sale.total_amount;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(summary);
  };

  const handleRecordSale = async () => {
    if (!selectedProductId || !canSell() || !customerName.trim() || salePrice <= 0) {
      toast({
        title: language === 'en' ? "Error" : "خطأ",
        description: !customerName.trim() 
          ? (language === 'en' ? "Please enter customer name" : "يرجى إدخال اسم العميل")
          : salePrice <= 0
          ? (language === 'en' ? "Please enter a valid price" : "يرجى إدخال سعر صحيح")
          : t.insufficientStock,
        variant: "destructive"
      });
      return;
    }

    try {
      let finalCustomerId = selectedCustomerId && selectedCustomerId !== 'new' ? selectedCustomerId : undefined;
      
      // If new customer, create them first
      if (selectedCustomerId === 'new' && customerName.trim()) {
        try {
          const newCustomer = await addCustomer({
            name: customerName.trim(),
            contact_info: null
          });
          finalCustomerId = newCustomer.id;
        } catch (error) {
          console.error('Error creating customer:', error);
          // Continue without customer ID if creation fails
        }
      }

      // Determine amount paid based on payment method
      let finalAmountPaid: number;
      let finalPaymentMethod: string;

      if (paymentMethod === 'cash') {
        finalAmountPaid = getTotalPrice();
        finalPaymentMethod = 'cash';
      } else if (paymentMethod === 'credit') {
        finalAmountPaid = 0;
        finalPaymentMethod = 'credit';
      } else {
        finalAmountPaid = typeof amountPaid === 'number' ? amountPaid : 0;
        finalPaymentMethod = 'mixed';
      }

      const saleRecord = await recordSale(
        selectedProductId, 
        saleQuantity, 
        customerName.trim(), 
        salePrice, 
        saleDate,
        finalCustomerId,
        finalAmountPaid,
        finalPaymentMethod
      );
      
      // Refresh products data
      refetchProducts();
      
      // Show invoice after successful sale
      const product = products.find(p => p.id === selectedProductId);
      if (saleRecord && product) {
        setCurrentInvoiceData({ saleRecord, product });
        setIsInvoiceOpen(true);
      }
      
      // Reset form
      setSelectedProductId('');
      setSelectedCustomerId('');
      setSaleQuantity(1);
      setCustomerName('');
      setSalePrice(0);
      setSaleDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('cash');
      setAmountPaid('');
      setIsSaleDialogOpen(false);

      toast({
        title: language === 'en' ? "Success" : "نجح",
        description: t.saleRecorded
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const bestSelling = getBestSellingProduct();
  const filteredSales = getFilteredSales();
  const yearlySummary = getYearlySalesSummary();

  return (
    <div className="space-y-6 dark:text-white">
      {/* Header with Sales Stats */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100">{t.sales}</h2>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400">{t.todaySales}</div>
            <div className="font-bold text-amber-700 dark:text-amber-300">
              {formatCurrency(getTodaySales(), language)}
            </div>
          </div>
          
          <Dialog open={isSaleDialogOpen} onOpenChange={setIsSaleDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-700 dark:hover:bg-amber-800">
                <ShoppingCart className="w-4 h-4 mr-2" />
                {t.recordSale}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl dark:bg-gray-800">
              <DialogHeader>
                <DialogTitle className="dark:text-white">{t.recordSale}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Product and Customer Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="dark:text-gray-200">{t.selectProduct}</Label>
                    <Select value={selectedProductId} onValueChange={(value) => {
                      setSelectedProductId(value);
                      const product = products.find(p => p.id === value);
                      if (product?.selling_price) {
                        setSalePrice(product.selling_price);
                      }
                    }}>
                      <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <SelectValue placeholder={t.selectProduct} />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id} className="dark:text-white dark:hover:bg-gray-600">
                            {language === 'en' ? product.name : product.name_ar} 
                            <span className="text-gray-500 dark:text-gray-400 ml-2">
                              ({product.current_stock} {language === 'en' ? 'available' : 'متوفر'})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="customerSelect">{t.selectCustomer}</Label>
                    <Select 
                      value={selectedCustomerId} 
                      onValueChange={(value) => {
                        setSelectedCustomerId(value);
                        if (value === 'new') {
                          setCustomerName('');
                        } else if (value) {
                          const customer = customers.find(c => c.id === value);
                          setCustomerName(customer?.name || '');
                        }
                      }}
                    >
                      <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <SelectValue placeholder={t.selectCustomer} />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                        <SelectItem value="new" className="dark:text-white dark:hover:bg-gray-600">
                          {t.newCustomer}
                        </SelectItem>
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id} className="dark:text-white dark:hover:bg-gray-600">
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="dark:text-gray-200">{t.customerName}</Label>
                    <div className="flex space-x-2">
                      <Input
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder={language === 'en' ? "Enter customer name" : "أدخل اسم العميل"}
                        className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        disabled={selectedCustomerId && selectedCustomerId !== 'new'}
                      />
                      {selectedCustomerId === 'new' && customerName.trim() && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddCustomerDialogOpen(true)}
                          className="dark:border-gray-600 dark:text-gray-200"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div>
                  <Label className="dark:text-gray-200">{t.paymentMethod}</Label>
                  <Select value={paymentMethod} onValueChange={(value: 'cash' | 'credit' | 'partial') => {
                    setPaymentMethod(value);
                    if (value === 'cash') {
                      setAmountPaid(getTotalPrice());
                    } else if (value === 'credit') {
                      setAmountPaid(0);
                    } else {
                      setAmountPaid('');
                    }
                  }}>
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      <SelectValue placeholder={t.paymentMethod} />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                      <SelectItem value="cash" className="dark:text-white dark:hover:bg-gray-600">
                        <div className="flex items-center">
                          <Banknote className="w-4 h-4 mr-2" />
                          {t.cash}
                        </div>
                      </SelectItem>
                      <SelectItem value="credit" className="dark:text-white dark:hover:bg-gray-600">
                        <div className="flex items-center">
                          <CreditCard className="w-4 h-4 mr-2" />
                          {t.credit}
                        </div>
                      </SelectItem>
                      <SelectItem value="partial" className="dark:text-white dark:hover:bg-gray-600">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-2" />
                          {t.partial}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity, Price, Date, and Amount Paid */}
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label className="dark:text-gray-200">{t.quantity}</Label>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSaleQuantity(Math.max(1, saleQuantity - 1))}
                        className="dark:border-gray-600 dark:text-gray-200"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <Input
                        type="number"
                        value={saleQuantity}
                        onChange={(e) => setSaleQuantity(Math.max(1, Number(e.target.value)))}
                        className="text-center dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        min="1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSaleQuantity(saleQuantity + 1)}
                        className="dark:border-gray-600 dark:text-gray-200"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="dark:text-gray-200">{t.manualPrice}</Label>
                    <Input
                      type="number"
                      value={salePrice}
                      onChange={(e) => setSalePrice(Number(e.target.value))}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    {selectedProduct?.selling_price && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t.suggestedPrice}: {formatCurrency(selectedProduct.selling_price, language)}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="dark:text-gray-200">{t.saleDate}</Label>
                    <Input
                      type="date"
                      value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  {paymentMethod === 'partial' && (
                    <div>
                      <Label className="dark:text-gray-200">{t.amountPaid}</Label>
                      <Input
                        type="number"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value ? Number(e.target.value) : '')}
                        placeholder="0.00"
                        min="0"
                        max={getTotalPrice()}
                        step="0.01"
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  )}
                </div>

                {/* Payment Summary */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">{t.totalPrice}:</span>
                      <div className="font-semibold">{formatCurrency(getTotalPrice(), language)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">{t.amountPaid}:</span>
                      <div className="font-semibold text-green-600">
                        {formatCurrency(
                          paymentMethod === 'cash' ? getTotalPrice() : 
                          paymentMethod === 'credit' ? 0 : 
                          (typeof amountPaid === 'number' ? amountPaid : 0), 
                          language
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">{t.unpaidAmount}:</span>
                      <div className="font-semibold text-red-600">
                        {formatCurrency(getUnpaidAmount(), language)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stock Validation */}
                {selectedProductId && (
                  <div className={`p-3 rounded-lg border ${
                    canSell() ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium dark:text-white">
                        {language === 'en' ? selectedProduct?.name : selectedProduct?.name_ar}
                      </span>
                      <div className="text-right">
                        <div className="text-sm">
                          <span className="text-gray-600 dark:text-gray-400">{t.availableStock}: </span>
                          <span className={canSell() ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {selectedProduct?.current_stock}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!canSell() && (
                      <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                        {t.insufficient}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button 
                    onClick={handleRecordSale} 
                    disabled={!canSell() || !selectedProductId || !customerName.trim() || salePrice <= 0}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 dark:bg-amber-700 dark:hover:bg-amber-800"
                  >
                    {t.sell}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsSaleDialogOpen(false)} 
                    className="flex-1 dark:border-gray-600 dark:text-gray-200"
                  >
                    {t.cancel}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Sales Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-amber-200 dark:border-amber-700 dark:bg-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100">{t.todaySales}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              {formatCurrency(getTodaySales(), language)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {salesRecords.filter(sale => {
                const today = new Date();
                return new Date(sale.sale_date).toDateString() === today.toDateString();
              }).length} {language === 'en' ? 'transactions' : 'معاملة'}
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-700 dark:bg-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100">{t.totalSales}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              {formatCurrency(getTotalSalesValue(), language)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {salesRecords.length} {language === 'en' ? 'total transactions' : 'إجمالي المعاملات'}
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-700 dark:bg-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100">{t.bestSelling}</CardTitle>
          </CardHeader>
          <CardContent>
            {bestSelling ? (
              <>
                <div className="text-lg font-bold text-amber-700 dark:text-amber-300">
                  {language === 'en' ? bestSelling.product.name : bestSelling.product.name_ar}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {bestSelling.totalSold} {t.units} {t.sold}
                </div>
              </>
            ) : (
              <div className="text-gray-500 dark:text-gray-400">-</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales by Date Filter */}
      <Card className="border-amber-200 dark:border-amber-700 dark:bg-gray-800">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-amber-900 dark:text-amber-100">{t.salesByDate}</CardTitle>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-40 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSales.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              {language === 'en' ? 'No sales for this date' : 'لا توجد مبيعات في هذا التاريخ'}
            </p>
          ) : (
            <div className="space-y-3">
              <div className="font-medium text-amber-900 dark:text-amber-100">
                {language === 'en' ? 'Total for' : 'الإجمالي لـ'} {formatGregorianDate(filterDate, language)}: 
                <span className="ml-2 text-amber-700 dark:text-amber-300">
                  {formatCurrency(filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0), language)}
                </span>
              </div>
              {filteredSales.map((record) => {
                const product = products.find(p => p.id === record.product_id);
                 return (
                  <div key={record.id} className="flex flex-col sm:flex-row justify-between items-start p-4 bg-amber-50 dark:bg-gray-700 rounded-lg space-y-2 sm:space-y-0">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-amber-900 dark:text-amber-100 truncate">
                        {language === 'en' ? product?.name : product?.name_ar}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t.sold} {record.quantity} {t.units} {t.to} {record.customer_name}
                      </div>
                      <div className="text-sm font-bold text-amber-700 dark:text-amber-300 sm:hidden">
                        {formatCurrency(record.total_amount, language)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end space-x-2">
                      <div className="font-bold text-amber-700 dark:text-amber-300 hidden sm:block">
                        {formatCurrency(record.total_amount, language)}
                      </div>
                      <div className="flex space-x-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showInvoice(record)}
                          className="flex-shrink-0"
                        >
                          <FileText className="w-4 h-4 sm:mr-1" />
                          <span className="hidden sm:inline">{t.showInvoice}</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" className="flex-shrink-0">
                              <Trash2 className="w-4 h-4 sm:mr-1" />
                              <span className="hidden sm:inline">{t.delete}</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t.delete}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t.confirmDelete}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteSaleRecord(record.id)}>
                                {t.delete}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Yearly Sales Summary */}
      <Card className="border-amber-200 dark:border-amber-700 dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-amber-900 dark:text-amber-100">{t.salesSummary}</CardTitle>
        </CardHeader>
        <CardContent>
          {yearlySummary.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t.noSales}</p>
          ) : (
            <div className="space-y-4">
              {yearlySummary.map((summary, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-amber-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium text-amber-900 dark:text-amber-100">
                      {language === 'en' ? summary.product?.name : summary.product?.name_ar}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {t.totalUnits}: {summary.totalUnits}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-amber-700 dark:text-amber-300">
                      {formatCurrency(summary.totalRevenue, language)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {t.totalRevenue}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Preview */}
      <InvoicePreview
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        saleRecord={currentInvoiceData?.saleRecord || null}
        product={currentInvoiceData?.product || null}
        language={language}
      />

      {/* Add Customer Dialog */}
      <AddCustomerDialog
        open={isAddCustomerDialogOpen}
        onOpenChange={setIsAddCustomerDialogOpen}
        onCustomerAdded={(customer) => {
          setSelectedCustomerId(customer.id);
          setCustomerName(customer.name);
        }}
        language={language}
      />
    </div>
  );
};
