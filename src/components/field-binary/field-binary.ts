// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseFieldComponent } from '../base-field/base-field';

const FIELD_BINARY_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => FieldBinaryComponent),
  multi: true
};

@Component({
  selector: 'field-binary',
  host: {
    '[class.required]': 'required', 
    '[class.readonly]': 'readonly', 
    '[class.invisible]': 'invisible',
    '[class.editmode]': 'is_edit_mode',
    '[class.readmode]': '!is_edit_mode',
    '[class.nolabel]': 'nolabel',
  },
  templateUrl: 'field-binary.html',
  providers: [FIELD_BINARY_VALUE_ACCESSOR],
})

export class FieldBinaryComponent extends BaseFieldComponent {
  private value;

  writeValue(value: any) {
    this.value = value;
    this.propagateChange(this.value);
  }

  get file_size() {
    if ('string' === typeof(this.value) && this.value.length < 64) {
      return this.value;
    } else if (!this.value) {
      return '';
    } else {
      return this.translate.instant('Unknown filesize');
    }
  }
}
