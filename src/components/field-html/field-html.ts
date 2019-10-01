// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseFieldComponent } from '../base-field/base-field';

const FIELD_HTML_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => FieldHtmlComponent),
  multi: true
};

@Component({
  selector: 'field-html',
  host: {
    '[class.readonly]': 'true', 
    '[class.nolabel]': 'nolabel',
  },
  template: `
  <div [innerHTML]="value | html">
  </div>
  `,
  providers: [FIELD_HTML_VALUE_ACCESSOR],
})
export class FieldHtmlComponent extends BaseFieldComponent {
  value: string = '';
  writeValue(value: any) {
    this.value = value || '';
    this.propagateChange(this.value);
  }
  
  validateData() {
    return true;
  }
}
