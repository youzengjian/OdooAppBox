// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseFieldComponent } from '../base-field/base-field';

const FIELD_SELECTION_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => FieldSelectionComponent),
  multi: true
};
@Component({
  selector: 'field-selection',
  host: {
    '[class.required]': 'required', 
    '[class.readonly]': 'readonly', 
    '[class.invisible]': 'invisible',
    '[class.editmode]': 'is_edit_mode',
    '[class.readmode]': '!is_edit_mode',
    '[class.nolabel]': 'nolabel',
    '(click)': 'onClick($event)',
  },
  templateUrl: 'field-selection.html',
  providers: [FIELD_SELECTION_VALUE_ACCESSOR],
})
export class FieldSelectionComponent extends BaseFieldComponent{
  public value = false;

  get display_angle_right() {
    return this.is_edit_mode && !this.value;
  }

  writeValue(value) {
    this.value = value || false;
    this.propagateChange(this.value);
  }

  changeListner() {
    // value字段使用ngModel与ion-select完成双向绑定，所以直接使用value即可
    this.propagateChange(this.value);
  }

  onClick(event) {
    this.validate_error_message = '';
    if (this.is_edit_mode) {
      event.stopPropagation();
    }
  }

  clear(event) {
    event.stopPropagation();
    this.validate_error_message = '';
    this.writeValue(false);
  }

  validateData() {
    if (this.is_edit_mode && this.required && !this.value) {
      this.validate_error_message = this.translate.instant("This field is required");
      return false;
    } else {
      return true;
    }
  }
}
