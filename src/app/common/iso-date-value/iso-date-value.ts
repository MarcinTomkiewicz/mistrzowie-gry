import { Pipe, PipeTransform } from '@angular/core';

import { isValidDate, parseIsoDate } from '../../core/utils/date';

@Pipe({ name: 'isoDateValue' })
export class IsoDateValue implements PipeTransform {
  transform(value: string): Date | null;
  transform(value: readonly string[]): Date[];
  transform(value: string | readonly string[]): Date | Date[] | null {
    return typeof value === 'string' ? parseIsoDate(value)
      : [...value].sort().map(parseIsoDate).filter(isValidDate);
  }
}
