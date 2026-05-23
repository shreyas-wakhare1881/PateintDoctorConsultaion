export const formatConsultationFee = (fee: number, currency = 'INR'): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(fee);
