import { Pipe, PipeTransform } from '@angular/core';
import { formatRut } from '../utils/rut';

@Pipe({
  name: 'rutFormat',
  standalone: true
})
export class RutFormatPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return value ? formatRut(value) : '';
  }
}
