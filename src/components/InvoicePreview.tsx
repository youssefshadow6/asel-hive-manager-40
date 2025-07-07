
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { SaleRecord } from "@/hooks/useSales";
import { Product } from "@/hooks/useProducts";
import { formatCurrency } from "@/utils/currency";
import { formatGregorianDate } from "@/utils/dateUtils";

interface InvoicePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  saleRecord: SaleRecord | null;
  product: Product | null;
  language: 'en' | 'ar';
}

export const InvoicePreview = ({ isOpen, onClose, saleRecord, product, language }: InvoicePreviewProps) => {
  const translations = {
    en: {
      invoice: "Invoice",
      invoiceNumber: "Invoice #",
      date: "Date",
      customerName: "Customer Name",
      product: "Product",
      quantity: "Quantity",
      unitPrice: "Unit Price",
      total: "Total",
      print: "Print",
      download: "Download",
      close: "Close",
      companyName: "Madrar Business",
      thankYou: "Thank you for your business!"
    },
    ar: {
      invoice: "فاتورة",
      invoiceNumber: "رقم الفاتورة #",
      date: "التاريخ",
      customerName: "اسم العميل",
      product: "المنتج",
      quantity: "الكمية",
      unitPrice: "سعر الوحدة",
      total: "الإجمالي",
      print: "طباعة",
      download: "تحميل",
      close: "إغلاق",
      companyName: "أعمال مدرار",
      thankYou: "شكراً لتعاملكم معنا!"
    }
  };

  const t = translations[language];

  if (!saleRecord || !product) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a simple text-based invoice for download
    const invoiceContent = `
${t.companyName}
${t.invoice}
${t.invoiceNumber}: ${saleRecord.id.slice(-8)}
${t.date}: ${formatGregorianDate(saleRecord.sale_date, language)}
${t.customerName}: ${saleRecord.customer_name}

${t.product}: ${language === 'en' ? product.name : product.name_ar}
${t.quantity}: ${saleRecord.quantity}
${t.unitPrice}: ${formatCurrency(saleRecord.sale_price, language)}
${t.total}: ${formatCurrency(saleRecord.total_amount, language)}

${t.thankYou}
    `;

    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${saleRecord.id.slice(-8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white">{t.invoice}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 p-6 bg-white dark:bg-gray-800 print:bg-white print:text-black" id="invoice-content">
          {/* Header */}
          <div className="text-center border-b pb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-bold text-lg">🍯</span>
            </div>
            <h1 className="text-2xl font-bold text-amber-900 dark:text-amber-100">{t.companyName}</h1>
            <h2 className="text-xl text-gray-700 dark:text-gray-300">{t.invoice}</h2>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t.invoiceNumber}</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">#{saleRecord.id.slice(-8)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t.date}</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {formatGregorianDate(saleRecord.sale_date, language)}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t.customerName}</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{saleRecord.customer_name}</p>
          </div>

          {/* Items Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-amber-50 dark:bg-amber-900/20">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">{t.product}</th>
                  <th className="text-center p-3 text-sm font-medium text-gray-700 dark:text-gray-300">{t.quantity}</th>
                  <th className="text-right p-3 text-sm font-medium text-gray-700 dark:text-gray-300">{t.unitPrice}</th>
                  <th className="text-right p-3 text-sm font-medium text-gray-700 dark:text-gray-300">{t.total}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3 text-gray-900 dark:text-gray-100">
                    {language === 'en' ? product.name : product.name_ar}
                    <br />
                    <span className="text-sm text-gray-500 dark:text-gray-400">({product.size})</span>
                  </td>
                  <td className="p-3 text-center text-gray-900 dark:text-gray-100">{saleRecord.quantity}</td>
                  <td className="p-3 text-right text-gray-900 dark:text-gray-100">
                    {formatCurrency(saleRecord.sale_price, language)}
                  </td>
                  <td className="p-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(saleRecord.total_amount, language)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t.total}:</span>
              <span className="text-xl font-bold text-amber-700 dark:text-amber-300">
                {formatCurrency(saleRecord.total_amount, language)}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-600 dark:text-gray-400 border-t pt-4">
            <p>{t.thankYou}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 print:hidden">
          <Button onClick={handlePrint} className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700">
            <Printer className="w-4 h-4" />
            <span>{t.print}</span>
          </Button>
          <Button onClick={handleDownload} variant="outline" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>{t.download}</span>
          </Button>
          <Button onClick={onClose} variant="outline" className="flex-1">
            {t.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
