// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Pipe, PipeTransform } from '@angular/core';
import {DomSanitizer} from "@angular/platform-browser";

@Pipe({
  name: 'html',
})
export class HtmlPipe implements PipeTransform {
  constructor (private sanitizer: DomSanitizer) {
  }
  /**
   * Takes a value and makes it lowercase.
   */
  transform(value: string, ...args) {
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
}
