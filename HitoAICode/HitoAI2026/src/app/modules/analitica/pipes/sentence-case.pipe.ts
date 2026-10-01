import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sentenceCase',
  standalone: false
})
export class SentenceCasePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    const texto = String(value).trim();
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
  }
}
