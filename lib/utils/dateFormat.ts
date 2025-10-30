import { format } from 'date-fns';

export function formatDate(isoDate: string): string {
  try {
    return format(new Date(isoDate), 'PPP');
  } catch {
    return isoDate;
  }
}


