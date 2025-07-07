
export const formatCurrency = (amount: number, language: 'en' | 'ar' = 'en'): string => {
  const formattedAmount = amount.toFixed(2);
  
  if (language === 'ar') {
    // Convert to Arabic numerals and format for Arabic
    const arabicAmount = formattedAmount
      .replace(/0/g, '٠')
      .replace(/1/g, '١')
      .replace(/2/g, '٢')
      .replace(/3/g, '٣')
      .replace(/4/g, '٤')
      .replace(/5/g, '٥')
      .replace(/6/g, '٦')
      .replace(/7/g, '٧')
      .replace(/8/g, '٨')
      .replace(/9/g, '٩')
      .replace(/\./g, '٫');
    
    return `${arabicAmount} ج.م`;
  }
  
  return `EGP ${formattedAmount}`;
};

export const parseCurrency = (currencyString: string): number => {
  // Remove currency symbols and convert Arabic numerals back to English
  const cleanString = currencyString
    .replace(/[ج\.م|EGP]/g, '')
    .replace(/٠/g, '0')
    .replace(/١/g, '1')
    .replace(/٢/g, '2')
    .replace(/٣/g, '3')
    .replace(/٤/g, '4')
    .replace(/٥/g, '5')
    .replace(/٦/g, '6')
    .replace(/٧/g, '7')
    .replace(/٨/g, '8')
    .replace(/٩/g, '9')
    .replace(/٫/g, '.')
    .trim();
  
  return parseFloat(cleanString) || 0;
};
