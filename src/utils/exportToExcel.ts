
import * as XLSX from 'xlsx';

export interface ExportRecord {
  date: string;
  productName: string;
  productNameAr: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
  customerName?: string;
  notes?: string;
  type: 'Sale' | 'Production' | 'Material Receipt';
}

export const exportToExcel = (data: ExportRecord[], language: 'en' | 'ar' = 'en') => {
  const headers = language === 'en' 
    ? ['Date', 'Product Name', 'Quantity', 'Price per Unit', 'Total', 'Customer/Notes', 'Type']
    : ['التاريخ', 'اسم المنتج', 'الكمية', 'السعر للوحدة', 'الإجمالي', 'العميل/ملاحظات', 'النوع'];

  const rows = data.map(record => [
    new Date(record.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US'),
    language === 'en' ? record.productName : record.productNameAr,
    record.quantity,
    record.pricePerUnit,
    record.total,
    record.customerName || record.notes || '',
    language === 'en' ? record.type : 
      record.type === 'Sale' ? 'بيع' : 
      record.type === 'Production' ? 'إنتاج' : 'استلام مواد'
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, language === 'en' ? 'Business Report' : 'تقرير الأعمال');

  const fileName = `مدرار_Business_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
