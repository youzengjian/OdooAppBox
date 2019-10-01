// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { DATE_FORMAT, DATETIME_FORMAT } from '../../providers/common/common';
import { BaseFieldComponent } from '../base-field/base-field';

const FIELD_DATETIME_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => FieldDatetimeComponent),
  multi: true
};
@Component({
  selector: 'field-datetime',
  host: {
    '[class.required]': 'required', 
    '[class.readonly]': 'readonly', 
    '[class.invisible]': 'invisible',
    '[class.editmode]': 'is_edit_mode',
    '[class.readmode]': '!is_edit_mode',
    '[class.nolabel]': 'nolabel',
    '(click)': 'onClick($event)',
  },
  templateUrl: 'field-datetime.html',
  providers: [FIELD_DATETIME_VALUE_ACCESSOR],
})
export class FieldDatetimeComponent extends BaseFieldComponent {
  public value;

  getFormat() {
    if (this.widget === 'date') {
      return DATE_FORMAT;
    } else if (this.widget === 'datetime') {
      return DATETIME_FORMAT;
    } else if (this.field_type == 'date') {
      return DATE_FORMAT;
    } else if (this.field_type == 'datetime'){
      return DATETIME_FORMAT;
    } else {
      return DATETIME_FORMAT;
    }
  }

  get displayFormat() {
    return this.getFormat();
  }

  get pickerFormat() {
    return this.getFormat();
  }

  lpad(str, size) {
    str = "" + str;
    return new Array(size - str.length + 1).join('0') + str;
  }

  rpad(str, size) {
    str = "" + str;
    return str + new Array(size - str.length + 1).join('0');
  }

  dateobj_to_iso_date_str(d) {
    return d.getUTCFullYear() + '-'
    + this.lpad(d.getUTCMonth() + 1, 2) + '-'
    + this.lpad(d.getUTCDate(), 2);
  }

  utc_str_to_iso_date_str(str_datetime) {
    if(!str_datetime) {
      return this.dateobj_to_iso_date_str(new Date());
    }

    let regex = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
    let res = regex.exec(str_datetime);
    if ( !res ) {
      return this.dateobj_to_iso_date_str(new Date());
    }
    let tmp = new Date();
    tmp.setUTCFullYear(parseInt(res[1]));
    tmp.setUTCMonth(parseInt(res[2]) - 1);
    tmp.setUTCDate(parseInt(res[3]));
    return this.dateobj_to_iso_date_str(tmp);
  }

  dateobj_to_iso_datetime_str(d) {
    d.setUTCHours(d.getUTCHours() + this.odooProvider.time_offset_hours);
    d.setUTCMinutes(d.getUTCMinutes() + this.odooProvider.time_offset_minutes);
    return d.getUTCFullYear() + '-'
    + this.lpad(d.getUTCMonth() + 1, 2) + '-'
    + this.lpad(d.getUTCDate(), 2) + 'T'
    + this.lpad(d.getUTCHours(), 2) + ':'
    + this.lpad(d.getUTCMinutes(), 2) + ':'
    + this.lpad(d.getUTCSeconds(), 2) + this.odooProvider.time_offset_str;
  }

  utc_str_to_iso_datetime_str(str_datetime) {
    if(!str_datetime) {
      return this.dateobj_to_iso_datetime_str(new Date());
    }

    let regex = /^(\d\d\d\d)-(\d\d)-(\d\d) (\d\d):(\d\d):(\d\d(?:\.(\d+))?)$/;
    let res = regex.exec(str_datetime);
    if ( !res ) {
      return this.dateobj_to_iso_datetime_str(new Date());
    }
    let tmp = new Date();
    tmp.setUTCFullYear(parseInt(res[1]));
    tmp.setUTCMonth(parseInt(res[2]) - 1);
    tmp.setUTCDate(parseInt(res[3]));
    tmp.setUTCHours(parseInt(res[4]));
    tmp.setUTCMinutes(parseInt(res[5]));
    tmp.setUTCSeconds(parseInt(res[6]));
    tmp.setUTCMilliseconds(parseInt(this.rpad((res[7] || "").slice(0, 3), 3)));
    return this.dateobj_to_iso_datetime_str(tmp);
  }

  _propagateChange(value) {
    if (value && this.field_type == 'datetime') {
      let d = new Date(value);
      value = d.getUTCFullYear() + '-'
            + this.lpad(d.getUTCMonth() + 1, 2) + '-'
            + this.lpad(d.getUTCDate(), 2) + ' '
            + this.lpad(d.getUTCHours(), 2) + ':'
            + this.lpad(d.getUTCMinutes(), 2) + ':'
            + this.lpad(d.getUTCSeconds(), 2);
    }
    this.propagateChange(value || false);
  }

  writeValue(value) {
    if (!value) {
      this.value = false;
    } else if (this.field_type == 'date') {
      this.value = this.utc_str_to_iso_date_str(value); 
    } else if (this.field_type == 'datetime') {
      this.value = this.utc_str_to_iso_datetime_str(value); 
    }
    this._propagateChange(this.value);
  }

  changeListner() {
    // value字段使用ngModel与ion-select完成双向绑定，所以直接使用value即可
    this._propagateChange(this.value);
  }

  onClick(event) {
    if (this.is_edit_mode) {
      event.stopPropagation();
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
