import { format } from 'date-fns';

/**
 * Safely formats a date that could be a string, a Date object, or a Firestore Timestamp.
 * @param date The date to format
 * @param formatStr The format string (date-fns style)
 * @returns Formatted date string or 'Invalid Date'
 */
export const safeFormat = (date: any, formatStr: string): string => {
  if (!date) return 'N/A';
  
  try {
    let d: Date;
    
    // Handle Firestore Timestamp
    if (date && typeof date.toDate === 'function') {
      d = date.toDate();
    } else {
      // Handle ISO string, number, or Date object
      d = new Date(date);
    }
    
    if (isNaN(d.getTime())) {
      return 'Invalid Date';
    }
    
    return format(d, formatStr);
  } catch (e) {
    console.error('Error formatting date:', e, date);
    return 'Invalid Date';
  }
};
