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
 * Parse a year string that may include BC/BCE/AD/CE notation
 * Returns a number where BC/BCE years are negative
 * Examples:
 *   "3000 BC" -> -3000
 *   "3000 BCE" -> -3000
 *   "2000 AD" -> 2000
 *   "2000" -> 2000 (assumes AD if no notation)
 *   "1 AD" -> 1
 */
export function parseYear(year: string | number, context?: { previousYear?: number; nextYear?: number }): number {
  // If it's already a number, return it (negative = BC)
  if (typeof year === 'number') {
    return year;
  }
  
  const yearStr = String(year).trim();
  
  // Check for BC/BCE notation (case-insensitive)
  const bcMatch = yearStr.match(/^(\d+)\s*(BC|BCE)$/i);
  if (bcMatch) {
    const yearValue = parseInt(bcMatch[1], 10);
    return -yearValue; // BC years are negative
  }
  
  // Check for AD/CE notation (case-insensitive)
  const adMatch = yearStr.match(/^(\d+)\s*(AD|CE)?$/i);
  if (adMatch) {
    return parseInt(adMatch[1], 10); // AD years are positive
  }
  
  // If no notation, try to parse as number
  const numericYear = parseInt(yearStr, 10);
  if (!isNaN(numericYear)) {
    // Use context to infer BC/AD if available
    if (context) {
      // Rule 1: If previous event is BC (negative), this is almost certainly BC too
      if (context.previousYear !== undefined && context.previousYear < 0) {
        const absPrevious = Math.abs(context.previousYear);
        // If this year is in a similar or earlier range, it's definitely BC
        // e.g., 9500 BC -> 3000 BC (both BC, chronological order)
        if (numericYear <= absPrevious && numericYear > 0) {
          return -numericYear; // BC
        }
        // If this year is larger but still ancient (< 1000), it could be BC or AD transition
        // Be more aggressive: if previous is BC and this is < 1000, likely also BC
        if (numericYear > absPrevious && numericYear < 1000) {
          return -numericYear; // BC (more aggressive inference)
        }
        // If previous is BC and this is also a large ancient year (> 1000), likely BC too
        // Ancient years in descending order are typically BC
        if (numericYear > absPrevious && numericYear >= 1000 && numericYear < 10000) {
          return -numericYear; // BC (ancient years in sequence)
        }
      }
      
      // Rule 2: If next event is BC (negative), this is likely BC too if in similar range
      if (context.nextYear !== undefined && context.nextYear < 0) {
        const absNext = Math.abs(context.nextYear);
        // If this year is in a similar range to the next BC year, it's likely BC
        // Events are in chronological order, so if next is BC, this should be earlier BC
        if (numericYear <= absNext && numericYear > 0) {
          return -numericYear; // BC
        }
        // Even if larger, if it's ancient (< 1000) and next is BC, likely BC
        if (numericYear > absNext && numericYear < 1000) {
          return -numericYear; // BC (more aggressive)
        }
        // If next is BC and this is also a large ancient year (> 1000), likely BC too
        // Ancient years in descending order are typically BC
        if (numericYear > absNext && numericYear >= 1000 && numericYear < 10000) {
          return -numericYear; // BC (ancient years in sequence)
        }
      }
      
      // Rule 3: If previous event is AD and this year is larger, it's likely AD
      if (context.previousYear !== undefined && context.previousYear > 0) {
        if (numericYear >= context.previousYear) {
          return numericYear; // AD (chronological progression)
        }
        // If this year is smaller, it could be earlier AD or BC
        // If previous is AD and this is < 2000, likely earlier AD
        if (numericYear < context.previousYear && numericYear < 2000) {
          return numericYear; // AD (earlier AD year)
        }
      }
      
      // Rule 4: If next event is AD and this year is smaller, it's likely AD
      if (context.nextYear !== undefined && context.nextYear > 0) {
        if (numericYear <= context.nextYear) {
          return numericYear; // AD (chronological progression)
        }
      }
      
      // Rule 5: If we have both previous and next, and they're both BC, this is definitely BC
      if (context.previousYear !== undefined && context.previousYear < 0 &&
          context.nextYear !== undefined && context.nextYear < 0 &&
          numericYear > 0 && numericYear < 10000) {
        return -numericYear; // BC (surrounded by BC dates)
      }
      
      // Rule 6: Pattern detection - if previous/next are large ancient years (> 1000) in descending order,
      // and this is also a large ancient year, infer BC (ancient timelines typically start with BC)
      if (context.previousYear !== undefined && context.nextYear !== undefined) {
        const prevAbs = Math.abs(context.previousYear);
        const nextAbs = Math.abs(context.nextYear);
        // If we see a pattern like 9500, 3000, 2000 (descending ancient years), they're likely all BC
        if (prevAbs >= 1000 && nextAbs >= 1000 && numericYear >= 1000 && numericYear < 10000) {
          // Check if they're in descending order (typical BC pattern)
          if (prevAbs >= numericYear && numericYear >= nextAbs) {
            return -numericYear; // BC (descending ancient years pattern)
          }
          // Or if previous is much larger and next is smaller (BC timeline pattern)
          if (prevAbs > numericYear && numericYear > nextAbs && prevAbs > nextAbs) {
            return -numericYear; // BC (descending pattern)
          }
        }
      }
    }
    
    // Default: assume AD if no context or ambiguous
    return numericYear;
  }
  
  // If parsing fails, return current year as fallback
  console.warn(`Failed to parse year: "${yearStr}", using current year as fallback`);
  return new Date().getFullYear();
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

/**
 * Format a date for database storage (ISO string format)
 * Handles BC dates correctly by formatting them as ISO strings with negative years
 * Examples:
 *   year: -3000, month: 1, day: 1 -> "-3000-01-01"
 *   year: 2000, month: 3, day: 15 -> "2000-03-15"
 *   year: -9500 (BC) -> "-9500-01-01"
 */
export function formatDateForDB(
  year: number,
  month?: number,
  day?: number
): string {
  // Use provided month/day, or default to Jan 1 if not provided
  const monthNum = month && month >= 1 && month <= 12 ? month : 1;
  const dayNum = day && day >= 1 && day <= 31 ? day : 1;
  
  // Format as ISO string: YYYY-MM-DD or -YYYY-MM-DD for BC
  const yearStr = year < 0 ? `-${Math.abs(year)}` : String(year);
  const monthStr = String(monthNum).padStart(2, '0');
  const dayStr = String(dayNum).padStart(2, '0');
  
  return `${yearStr}-${monthStr}-${dayStr}`;
}


