// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Component, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseFieldComponent } from '../base-field/base-field';

const FIELD_BOOLEAN_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => FieldBooleanComponent),
  multi: true
};

@Component({
  selector: 'field-boolean',
  host: {
    '[class.required]': 'required', 
    '[class.readonly]': 'readonly', 
    '[class.invisible]': 'invisible',
    '[class.editmode]': 'is_edit_mode',
    '[class.readmode]': '!is_edit_mode',
    '[class.nolabel]': 'nolabel',
  },
  templateUrl: 'field-boolean.html',
  providers: [FIELD_BOOLEAN_VALUE_ACCESSOR],
})
export class FieldBooleanComponent extends BaseFieldComponent {
  value: boolean = false;
  writeValue(value: boolean) {
    this.value = value;
    this.propagateChange(this.value);
  }

  changeListner() {
    // value字段使用ngModel与ion-toggle完成双向绑定，所以直接使用value即可
    this.propagateChange(this.value);
  }

  get text() {
    if (this.widget !== 'boolean_button') {
      return '';
    }

    let terminology = this.string || '';
    if (terminology.indexOf(',') === -1) {
      let enabled = this.translate.instant('Enabled');
      let disabled = this.translate.instant('Disabled');
      return this.value?enabled:disabled;
    } else {
      let terminology_list = terminology.split(',');
      return this.value?terminology_list[0]:terminology_list[1];
    }
  }
}
