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
 * Check if a date string represents a placeholder date (Jan 1) for year-only events
 * Returns true if the date is likely a placeholder, false if it's a real date
 */
export function isPlaceholderDate(dateStr: string): boolean {
  // If date ends with -01-01, it's likely a placeholder for year-only dates
  // Real Jan 1 events are rare, so this heuristic works for most cases
  return dateStr.endsWith('-01-01');
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
 * Format a date from ISO string, detecting placeholder dates
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
    
    // If date is Jan 1, treat as placeholder (year-only)
    // Exception: don't treat as placeholder if it's clearly a New Year's event
    // For now, we'll treat all Jan 1 as placeholder - real Jan 1 events are rare
    const isPlaceholder = month === 1 && day === 1;
    
    return formatEventDate(
      year,
      isPlaceholder ? undefined : month,
      isPlaceholder ? undefined : day,
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


