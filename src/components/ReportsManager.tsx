
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileText, Calendar } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useSales } from "@/hooks/useSales";
import { useProduction } from "@/hooks/useProduction";
import { useRawMaterials } from "@/hooks/useRawMaterials";
import { exportToExcel, ExportRecord } from "@/utils/exportToExcel";
import { formatCurrency } from "@/utils/currency";

interface ReportsManagerProps {
  language: 'en' | 'ar';
}

export const ReportsManager = ({ language }: ReportsManagerProps) => {
  const { products } = useProducts();
  const { salesRecords } = useSales();
  const { productionRecords } = useProduction();
  const { materials } = useRawMaterials();
  
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const translations = {
    en: {
      reports: "Business Reports",
      exportData: "Export Data",
      dateRange: "Date Range",
      from: "From",
      to: "To",
      exportExcel: "Export to Excel",
      salesReport: "Sales Report",
      productionReport: "Production Report",
      totalSales: "Total Sales",
      totalProduction: "Total Production",
      profitAnalysis: "Profit Analysis",
      topProducts: "Top Products",
      recentTransactions: "Recent Transactions",
      noData: "No data available for this period"
    },
    ar: {
      reports: "تقارير الأعمال",
      exportData: "تصدير البيانات",
      dateRange: "نطاق التاريخ",
      from: "من",
      to: "إلى",
      exportExcel: "تصدير إلى Excel",
      salesReport: "تقرير المبيعات",
      productionReport: "تقرير الإنتاج",
      totalSales: "إجمالي المبيعات",
      totalProduction: "إجمالي الإنتاج",
      profitAnalysis: "تحليل الأرباح",
      topProducts: "المنتجات الأكثر مبيعاً",
      recentTransactions: "المعاملات الأخيرة",
      noData: "لا توجد بيانات متاحة لهذه الفترة"
    }
  };

  const t = translations[language];

  // Format date consistently in Gregorian calendar (YYYY-MM-DD)
  const formatGregorianDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA'); // Always returns YYYY-MM-DD format
  };

  // Format date and time for display
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-CA'), // YYYY-MM-DD
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getFilteredSales = () => {
    return salesRecords.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      return saleDate >= fromDate && saleDate <= toDate;
    });
  };

  const getFilteredProduction = () => {
    return productionRecords.filter(record => {
      const prodDate = new Date(record.production_date);
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      return prodDate >= fromDate && prodDate <= toDate;
    });
  };

  const handleExportExcel = () => {
    const filteredSales = getFilteredSales();
    const filteredProduction = getFilteredProduction();
    
    const exportData: ExportRecord[] = [
      ...filteredSales.map(sale => {
        const product = products.find(p => p.id === sale.product_id);
        return {
          date: sale.sale_date,
          productName: product?.name || 'Unknown Product',
          productNameAr: product?.name_ar || 'منتج غير معروف',
          quantity: sale.quantity,
          pricePerUnit: sale.sale_price,
          total: sale.total_amount,
          customerName: sale.customer_name,
          notes: sale.notes,
          type: 'Sale' as const
        };
      }),
      ...filteredProduction.map(prod => {
        const product = products.find(p => p.id === prod.product_id);
        return {
          date: prod.production_date,
          productName: product?.name || 'Unknown Product',
          productNameAr: product?.name_ar || 'منتج غير معروف',
          quantity: prod.quantity,
          pricePerUnit: prod.total_cost || 0,
          total: (prod.total_cost || 0) * prod.quantity,
          notes: prod.notes,
          type: 'Production' as const
        };
      })
    ];

    exportToExcel(exportData, language);
  };

  const filteredSales = getFilteredSales();
  const filteredProduction = getFilteredProduction();
  
  const totalSalesValue = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const totalProductionCost = filteredProduction.reduce((sum, prod) => sum + (prod.total_cost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100">{t.reports}</h2>
      </div>

      {/* Date Range and Export */}
      <Card className="border-amber-200 dark:border-amber-700 dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-amber-900 dark:text-amber-100">{t.exportData}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label htmlFor="dateFrom">{t.from}</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="dateTo">{t.to}</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div className="md:col-span-2">
              <Button 
                onClick={handleExportExcel}
                className="w-full bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800"
              >
                <Download className="w-4 h-4 mr-2" />
                {t.exportExcel}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-amber-200 dark:border-amber-700 dark:bg-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100">{t.totalSales}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              {formatCurrency(totalSalesValue, language)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {filteredSales.length} {language === 'en' ? 'transactions' : 'معاملة'}
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-700 dark:bg-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100">{t.totalProduction}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              {formatCurrency(totalProductionCost, language)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {filteredProduction.length} {language === 'en' ? 'batches' : 'دفعة'}
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-700 dark:bg-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100">{t.profitAnalysis}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalSalesValue - totalProductionCost, language)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {language === 'en' ? 'Estimated Profit' : 'الربح المقدر'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="border-amber-200 dark:border-amber-700 dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-amber-900 dark:text-amber-100">{t.recentTransactions}</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSales.length === 0 && filteredProduction.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t.noData}</p>
          ) : (
            <div className="space-y-3">
              {/* Combine and sort records by date */}
              {[
                ...filteredSales.map(sale => ({ ...sale, recordType: 'sale' as const })),
                ...filteredProduction.map(prod => ({ ...prod, recordType: 'production' as const }))
              ]
                .sort((a, b) => {
                  const dateA = a.recordType === 'sale' ? a.sale_date : a.production_date;
                  const dateB = b.recordType === 'sale' ? b.sale_date : b.production_date;
                  return new Date(dateB).getTime() - new Date(dateA).getTime();
                })
                .slice(0, 10)
                .map((record, index) => {
                  const product = products.find(p => p.id === record.product_id);
                  const date = record.recordType === 'sale' ? record.sale_date : record.production_date;
                  const isSale = record.recordType === 'sale';
                  const dateTime = formatDateTime(date);
                  
                  return (
                    <div key={index} className="flex justify-between items-center p-3 bg-amber-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <div className="font-medium text-amber-900 dark:text-amber-100">
                          {language === 'en' ? product?.name : product?.name_ar} ({product?.size})
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {dateTime.date} {dateTime.time} - 
                          {isSale ? 
                            ` ${language === 'en' ? 'Sale to' : 'بيع إلى'} ${record.customer_name}` : 
                            ` ${language === 'en' ? 'Production' : 'إنتاج'}`
                          }
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-amber-700 dark:text-amber-300">
                          {formatCurrency(isSale ? record.total_amount : (record.total_cost || 0), language)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {record.quantity} {language === 'en' ? 'units' : 'وحدة'}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
