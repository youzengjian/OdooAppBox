// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { OdooProvider } from '../../providers/odoo/odoo';
import { CommonProvider, ExceptionActionDefinition } from '../../providers/common/common';
import { DomainProvider } from '../../providers/odoo/domain';
import { ControlValueAccessor } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'base-field',
  templateUrl: 'base-field.html'
})
export abstract class BaseFieldComponent implements ControlValueAccessor, OnInit, OnDestroy{
  // 以下属性是用户通过视图xml配置的
  @Input() string = '';
  @Input() help = '';
  @Input() name = '';
  @Input() groups = '';
  @Input() widget;
  // json_attrs是用户输入的json类型的参数的集合
  @Input() json_attrs = {};
  // 以下Input属性是前台代码根据需要自动增加的
  @Input() current_page = null;
  @Input() record:any = {};
  @Input() model_access_rights = {};
  private _required = true;
  private _readonly = true;
  private _invisible = true;
  private _nolabel = false;
  private _need_to_edit_mode = false;
  public validate_error_message = '';
  private _display_get_options_error = true;
  private _display_get_attrs_error = true;
  constructor(
    protected odooProvider: OdooProvider,
    protected commonProvider: CommonProvider,
    protected domainProvider: DomainProvider,
    protected translate: TranslateService,
  ) {
  }

  updateDisplayOptions(display_error: boolean) {
    // 任何一个显示选项获取异常都会直接向上抛出异常，由全局异常钩子处理
    let exception_action = new ExceptionActionDefinition(true, display_error, true);
    this._required = this.odooProvider.isFieldRequired(this, exception_action);
    this._readonly = this.odooProvider.isFieldReadonly(this, exception_action);
    this.record['fieldsDefinition'][this.name]['real_readonly'] = this._readonly;
    let invisible_by_attrs = this.odooProvider.isFieldInvisible(this, exception_action);
    let groups = this.groups || this.field_definition['groups'] || '';
    if (groups) {
      let group_list = groups.split(',');
      let invisible_by_groups = true;
      this.odooProvider.groups.forEach(group => {
        if (group_list.indexOf(group) !== -1) {
          invisible_by_groups = false;
        }
      });
      this._invisible = invisible_by_groups || invisible_by_attrs;
    } else {
      this._invisible = invisible_by_attrs;
    }
    this._nolabel = this.odooProvider.isFieldNoLabel(this, exception_action);
  }

  ngOnInit() {
    this.updateDisplayOptions(true);
    if (this.commonProvider.isPageForm(this.current_page)) {
      this.current_page.onRecordChange().subscribe(() => {
        this.updateDisplayOptions(false);
      })
    }
  }

  ngOnDestroy() {
    // do nothing
  }

  writeValue(value) {
  }

  get res_model() {
    if (this.record && this.record['res_model']) {
      return this.record['res_model'];
    } else {
      return '';
    }
  }

  get res_id() {
    if (this.record && this.record['id']) {
      return this.record['id'];
    } else {
      return null;
    }
  }

  get required() {
    return this._required;
  }

  get readonly() {
    return this._readonly;
  }

  get invisible() {
    return this._invisible;
  }

  get options() {
    let exception_action = new ExceptionActionDefinition(false, this._display_get_options_error, {});
    this._display_get_options_error = false;
    return this.commonProvider.get_options(this.json_attrs['options'], exception_action);
  }

  get attrs() {
    let exception_action = new ExceptionActionDefinition(false, this._display_get_attrs_error, {});
    this._display_get_attrs_error = false;
    return this.domainProvider.compute_attrs(this.json_attrs['attrs'], this.record, exception_action);
  }

  get field_definition() {
    if (this.record && this.record['fieldsDefinition'] && this.record['fieldsDefinition'][this.name]) {
      return this.record['fieldsDefinition'][this.name];
    } else {
      return {};
    }
  }

  get field_type() {
    return this.field_definition['type'].toLowerCase();
  }
  
  get label() {
    return this.string || this.field_definition['string'] || this.name;
  }

  get nolabel() {
    return this._nolabel;
  }

  get record_component_type() {
    return this.record['component_type'];
  }

  get is_edit_mode() {
    if (this._need_to_edit_mode && this.record_component_type === 'form' && !this.readonly) {
      return true;
    }
    return false;
  }

  public toEditMode() {
    this._need_to_edit_mode = true;
  }

  public exitEditMode() {
    this._need_to_edit_mode = false;
    this.validate_error_message = '';
  }

  propagateChange = (_: any) => { };

  registerOnChange(fn: any) {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any) {}
}
