import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatTime',
  standalone: true,
})
export class FormatTimePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    return value.substring(0, 5);
  }
}
