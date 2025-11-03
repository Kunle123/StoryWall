import { format } from 'date-fns';

export function formatDate(isoDate: string): string {
  try {
    return format(new Date(isoDate), 'PPP');
  } catch {
    return isoDate;
  }
}

/**
 * Format a year with AD notation
 * AD (Anno Domini) is used for years in the Common Era (CE)
 * Years 1-999 are typically written with AD
 * Years 1000+ can optionally include AD or just show the year
 */
export function formatYearWithAD(year: number, alwaysShowAD: boolean = false): string {
  // Handle BC dates (negative years)
  if (year < 0) {
    return `${Math.abs(year)} BC`;
  }
  
  // Year 0 doesn't exist in the Gregorian calendar
  if (year === 0) {
    return '1 AD';
  }
  
  // For years 1-999, always show AD
  if (year <= 999 || alwaysShowAD) {
    return `${year} AD`;
  }
  
  // For years 1000+, show without AD by default
  // (Common practice: AD is often omitted for years >= 1000)
  return year.toString();
}

/**
 * Format a complete date with AD notation
 */
export function formatEventDate(
  year: number, 
  month?: number, 
  day?: number, 
  alwaysShowAD: boolean = false
): string {
  const yearStr = formatYearWithAD(year, alwaysShowAD);
  
  if (day && month) {
    const date = new Date(year, month - 1, day);
    const monthName = date.toLocaleDateString("en-US", { month: "short" });
    return `${monthName} ${day}, ${yearStr}`;
  }
  
  if (month) {
    const date = new Date(year, month - 1);
    const monthName = date.toLocaleDateString("en-US", { month: "short" });
    return `${monthName} ${yearStr}`;
  }
  
  return yearStr;
}

/**
 * Format date range with AD notation
 */
export function formatDateRange(
  startYear: number,
  endYear: number,
  startMonth?: number,
  startDay?: number,
  endMonth?: number,
  endDay?: number,
  alwaysShowAD: boolean = false
): string {
  const start = formatEventDate(startYear, startMonth, startDay, alwaysShowAD);
  const end = formatEventDate(endYear, endMonth, endDay, alwaysShowAD);
  return `${start} - ${end}`;
}


