// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Component, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseFieldComponent } from '../base-field/base-field';

const FIELD_NUMBER_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => FieldNumberComponent),
  multi: true
};
@Component({
  selector: 'field-number',
  host: {
    '[class.required]': 'required', 
    '[class.readonly]': 'readonly', 
    '[class.invisible]': 'invisible',
    '[class.editmode]': 'is_edit_mode',
    '[class.readmode]': '!is_edit_mode',
    '[class.nolabel]': 'nolabel',
  },
  templateUrl: 'field-number.html',
  providers: [FIELD_NUMBER_VALUE_ACCESSOR],
})

export class FieldNumberComponent extends BaseFieldComponent {
  private value:any = 0;
  @Input('monetary') monetary = false;
  private _currency = {
    'accuracy': 2,
    'decimal_places': 2,
    'symbol': '',
    'position': 'after',
  }

  ngOnInit() {
    super.ngOnInit();
    if (this.field_type == 'monetary' || this.monetary) {
      let currency_field_value = this.record[this.field_definition.currency_field]
      if (currency_field_value && currency_field_value instanceof Array) {
        let currency_id = currency_field_value[0];
        this.odooProvider.get_currency(currency_id).subscribe(
          res => {
            this._currency = res;
          }, error => {
            this.commonProvider.displayErrorMessage(error.message, false);
          }
        )        
      }
    }
  }

  get digitsInfo() {
    let decimal = 0;
    if (this.field_type == 'float') {
      // 避免字段定义时未定义digits信息导致报错的问题
      if (this.field_definition.hasOwnProperty('digits') && this.field_definition.digits instanceof Array && this.field_definition.digits.length == 2) {
        decimal = this.field_definition.digits[1];
      } else {
        decimal = 2;
      }      
    } else if (this.field_type == 'monetary' || this.monetary) {
      decimal = this._currency.accuracy || this._currency.decimal_places;
    }
    return '1.' + decimal + '-' + decimal;
  }

  get currency_symbol() {
    return this._currency.symbol;
  }

  get currency_position() {
    return this._currency.position;
  }

  writeValue(value: number) {
    this.value = value;
    this.propagateChange(this.value);
  }

  changeListner(event) {
    this.writeValue(event.target.value);
  }

  clear(event) {
    event.stopPropagation();
    this.validate_error_message = '';
    this.writeValue(0);
  }

  onFocus(event) {
    event.stopPropagation();
    // 当值为0时用户点击输入框，设置值为空，提高用户体验（不用手动删除原有数字0）
    if (this.value === 0 || this.value === "0") {
      this.value = "";
    }
  }

  onBlur(event) {
    event.stopPropagation();
    // 配合onFocus设置value为空字符串的操作，在失去焦点时恢复值为0
    if (this.value === "") {
      this.value = 0;
    }
  }
}
