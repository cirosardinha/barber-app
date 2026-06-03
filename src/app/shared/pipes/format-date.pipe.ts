import { Pipe, PipeTransform } from '@angular/core';
import { formatDate } from '../utils/date.utils';

@Pipe({
  name: 'formatDate',
  standalone: true,
})
export class FormatDatePipe implements PipeTransform {
  transform(date: string): string {
    return formatDate(date);
  }
}
