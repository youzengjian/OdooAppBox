// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Component, forwardRef, ViewChild, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseFieldComponent } from '../base-field/base-field';

const FIELD_CHAR_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => FieldCharComponent),
  multi: true
};

@Component({
  selector: 'field-char',
  host: {
    '[class.required]': 'required', 
    '[class.readonly]': 'readonly', 
    '[class.invisible]': 'invisible',
    '[class.editmode]': 'is_edit_mode',
    '[class.readmode]': '!is_edit_mode',
    '[class.nolabel]': 'nolabel',
    '(click)': 'onClick($event)',
  },
  templateUrl: 'field-char.html',
  providers: [FIELD_CHAR_VALUE_ACCESSOR],
})
export class FieldCharComponent extends BaseFieldComponent {
  value: string = '';
  @ViewChild('input') input;
  @Input() placeholder;
  writeValue(value: any) {
    this.value = value;
    this.propagateChange(this.value);
  }

  changeListner(event) {
    this.writeValue(event.target.value);
  }

  onClick(event) {
    if (this.is_edit_mode) {
      event.stopPropagation();
      this.input.nativeElement.focus();
    }
    this.validate_error_message = '';
  }

  clear(event) {
    event.stopPropagation();
    this.validate_error_message = '';
    this.writeValue('');
  }
  
  validateData() {
    if (this.is_edit_mode && this.required && !this.value) {
      this.validate_error_message = this.translate.instant('This field is required');
      return false;
    } else {
      return true;
    }
  }
}
