

export const parseRentalPeriodToDays = (rentalPeriod: string): number => {
  if (!rentalPeriod) return 7;
  const lower = rentalPeriod.toLowerCase().trim();
  const daysMatch = lower.match(/(\d+)\s*(dan|dneva|dni|d)/i);
  if (daysMatch) return parseInt(daysMatch[1]);
  const weeksMatch = lower.match(/(\d+)\s*(teden|tedna|tednov|t)/i);
  if (weeksMatch) return parseInt(weeksMatch[1]) * 7;
  const monthsMatch = lower.match(/(\d+)\s*(mesec|meseca|mesecev|mes)/i);
  if (monthsMatch) return parseInt(monthsMatch[1]) * 30;
  if (lower.includes('teden') || lower.includes('week')) return 7;
  if (lower.includes('dan') || lower.includes('day')) return 1;
  return 7;
};


export const calculateRemainingDays = (endDate: string): string => {
  if (!endDate) return 'Ni podatka';
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  
  if (end.getTime() <= now.getTime()) {
    return '⏰ Izposoja je potekla!';
  }

  const diffMs = end.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  return formatDuration(diffDays);
};


export const formatDuration = (days: number): string => {
  if (days === 1) return '1 dan';
  if (days < 7) return `${days} dni`;
  if (days === 7) return '1 teden';
  if (days === 14) return '2 tedna';
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    const remainder = days % 7;
    if (remainder === 0) return `${weeks} tednov`;
    return `${weeks} tednov in ${remainder} dni`;
  }
  const months = Math.floor(days / 30);
  const remainder = days % 30;
  if (remainder === 0) return `${months} mesec${months > 1 ? 'ev' : ''}`;
  return `${months} mesec${months > 1 ? 'ev' : ''} in ${remainder} dni`;
};


export const isExpired = (endDate: string): boolean => {
  if (!endDate) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return end.getTime() < now.getTime();
};
