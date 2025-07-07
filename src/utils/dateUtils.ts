
export const formatGregorianDate = (date: string | Date, language: 'en' | 'ar' = 'en') => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Always use Gregorian calendar regardless of language
  if (language === 'ar') {
    return dateObj.toLocaleDateString('ar-SA-u-ca-gregory', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
  
  return dateObj.toLocaleDateString('en-CA'); // YYYY-MM-DD format
};

export const formatGregorianDateTime = (date: string | Date, language: 'en' | 'ar' = 'en') => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (language === 'ar') {
    return dateObj.toLocaleDateString('ar-SA-u-ca-gregory', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return dateObj.toLocaleString('en-CA');
};
