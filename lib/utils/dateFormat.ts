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
 * Format a date in short format (11/03/22) for constrained spaces
 * Uses locale-appropriate format (DD/MM/YY for UK, MM/DD/YY for US)
 */
export function formatEventDateShort(
  year: number,
  month?: number,
  day?: number
): string {
  // Year only
  if (!month || !day) {
    return year.toString();
  }
  
  // Full date - use locale-appropriate format
  // Default to DD/MM/YY (UK format)
  const dayStr = String(day).padStart(2, '0');
  const monthStr = String(month).padStart(2, '0');
  const yearStr = String(year).slice(-2); // Last 2 digits of year
  
  return `${dayStr}/${monthStr}/${yearStr}`;
}

/**
 * Format a numbered event (e.g., "Day 1", "Event 2", "Step 3")
 */
export function formatNumberedEvent(
  number: number,
  label: string = "Event"
): string {
  return `${label} ${number}`;
}

/**
 * Format a complete date with AD notation
 * Only shows month/day if they are actually known (not placeholder)
 */
export function formatEventDate(
  year: number, 
  month?: number, 
  day?: number, 
  alwaysShowAD: boolean = false
): string {
  const yearStr = formatYearWithAD(year, alwaysShowAD);
  
  // Only show day if month is also provided (both must be known)
  if (day && month) {
    const date = new Date(year, month - 1, day);
    const monthName = date.toLocaleDateString("en-US", { month: "short" });
    return `${monthName} ${day}, ${yearStr}`;
  }
  
  // Only show month if it's provided (month is known)
  if (month) {
    const date = new Date(year, month - 1);
    const monthName = date.toLocaleDateString("en-US", { month: "short" });
    return `${monthName} ${yearStr}`;
  }
  
  // Year only (month/day not known or are placeholder)
  return yearStr;
}

/**
 * Format a date from ISO string
 * Only shows month/day if they are actually provided (not null/undefined)
 * No placeholder detection - if month/day are in the date, they're real
 */
export function formatEventDateFromISO(
  dateStr: string,
  alwaysShowAD: boolean = false
): string {
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Use the date as-is - no placeholder detection
    // If month/day are present, they're real dates
    return formatEventDate(
      year,
      month,
      day,
      alwaysShowAD
    );
  } catch {
    return dateStr;
  }
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


