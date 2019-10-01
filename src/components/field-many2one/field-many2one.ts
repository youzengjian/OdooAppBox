// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { OdooProvider } from '../../providers/odoo/odoo';
import { AppViewProvider } from '../../providers/app-view/app-view';
import { NavController } from 'ionic-angular';
import { CommonProvider } from '../../providers/common/common';
import { DomainProvider } from '../../providers/odoo/domain';
import { RelationalFieldComponent } from '../relational-field/relational-field';
import { TranslateService } from '@ngx-translate/core';

const FIELD_CHAR_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => FieldMany2oneComponent),
  multi: true
};

@Component({
  selector: 'field-many2one',
  host: {
    '[class.required]': 'required', 
    '[class.readonly]': 'readonly', 
    '[class.invisible]': 'invisible',
    '[class.editmode]': 'is_edit_mode',
    '[class.readmode]': '!is_edit_mode',
    '[class.nolabel]': 'nolabel',
    '(click)': 'onClick($event)',
  },
  templateUrl: 'field-many2one.html',
  providers: [FIELD_CHAR_VALUE_ACCESSOR],
})
export class FieldMany2oneComponent extends RelationalFieldComponent {
  // 以下属性是用户通过视图xml配置的
  private relation_res_id:any = false;
  private relation_res_name = '';
  constructor(
    protected odooProvider: OdooProvider,
    protected commonProvider: CommonProvider,
    protected domainProvider: DomainProvider,
    protected translate: TranslateService,
    private appViewProvider: AppViewProvider,
    private navCtrl: NavController,
  ) {
    super(odooProvider, commonProvider, domainProvider, translate)
  }

  get enable_edit_button() {
    return !this.no_open && this.is_edit_mode && this.relation_res_id;
  }

  get relation_res_model() {
    return this.field_definition['relation'];
  }

  get display_angle_right() {
    return (!this.no_open && !this.is_edit_mode && this.record_component_type === 'form') || (this.is_edit_mode && !this.relation_res_id);
  }

  get has_right_read() {
    if (this.relation_res_model && this.model_access_rights.hasOwnProperty(this.relation_res_model)) {
      return this.model_access_rights[this.relation_res_model].read;
    } else {
      return false;
    }
  }

  get has_right_write() {
    if (this.relation_res_model && this.model_access_rights.hasOwnProperty(this.relation_res_model)) {
      return this.model_access_rights[this.relation_res_model].write;
    } else {
      return false;
    }
  }

  get has_right_create() {
    if (this.relation_res_model && this.model_access_rights.hasOwnProperty(this.relation_res_model)) {
      return this.model_access_rights[this.relation_res_model].create;
    } else {
      return false;
    }
  }

  get has_right_unlink() {
    if (this.relation_res_model && this.model_access_rights.hasOwnProperty(this.relation_res_model)) {
      return this.model_access_rights[this.relation_res_model].unlink;
    } else {
      return false;
    }
  }

  writeValue(value: any) {
    if (value instanceof(Array) && value.length == 2) {
      this.relation_res_id = value[0];
      this.relation_res_name = value[1];
    } else if (typeof(value) === 'number'){
      this.relation_res_id = value;
      this.relation_res_name = '';
    } else {
      this.relation_res_id = false;
      this.relation_res_name = '';
    }
    if (this.relation_res_id) {
      if (this.relation_res_name) {
        this.propagateChange([this.relation_res_id, this.relation_res_name]);
      } else {
        this.odooProvider.call(this.relation_res_model, 'read', [[this.relation_res_id], ['name']], {context: this.context}).subscribe( res => {
          if (res.length == 1) {
            this.relation_res_name = res[0].name;
          } else {
            this.relation_res_name = this.relation_res_model + ',' + this.relation_res_id;
          }
          this.propagateChange([this.relation_res_id, this.relation_res_name]);
        }, error => {
          this.relation_res_name = this.relation_res_model + ',' + this.relation_res_id;
          this.propagateChange([this.relation_res_id, this.relation_res_name]);
        })
      }
    } else {
      this.propagateChange(false);
    }
  }

  updateRecord(record, record_origin) {
    this.writeValue([record.id, record.name]);
  }

  selectRecord(event) {
    if (this.record_component_type !== 'form') {
      return;
    }
    event.stopPropagation();
    this.commonProvider.displayLoading();
    let params = {'src_page': this.current_page,
                  'src_component': this,
                  'action_name': this.label,
                  'action_res_model': this.relation_res_model, 
                  'action_view_kanban': this.view_kanban_ref,
                  'action_view_form': this.view_form_ref,
                  'action_view_search': this.view_search_ref,
                  'action_context': this.context,
                  'action_domain': this.domain,
                  'action_options': this.options,
                };
    this.navCtrl.push('KanbanPage', params);
  }

  openFormView(event) {
    let res_id = this.relation_res_id;
    if (this.no_open || !res_id || this.record_component_type !== 'form') {
      return;
    }
    event.stopPropagation();
    this.commonProvider.displayLoading();
    let context = this.odooProvider.mergeContext([this.odooProvider.user_context, this.context]);
    let view_search_domain = [['res_model', '=', this.relation_res_model], ['type', '=', 'form']];
    if (this.view_form_ref) {
      view_search_domain.push(['id', '=', this.view_form_ref]);
    } else {
      view_search_domain.push(['inherit_id', '=', null]);
    }
    
    this.odooProvider.call('app.view', 'search_read', [view_search_domain, ['arch'], 0, 1, null], {context: context}).subscribe(
      res => {
        let msg_open_form_failed = this.translate.instant('Open form page failed');
        let msg_view_not_found = this.translate.instant("The specified view could not be found!");
        if (res.error) {
          let err_msg = (res.error.data && res.error.data.message) || res.error.message;
          this.commonProvider.displayErrorMessage(`${msg_open_form_failed}(${this.relation_res_model}):${err_msg}`, true);
        } else if (res.length > 0) {
          this.appViewProvider.parseViewTemplate(this.relation_res_model, res[0].arch).subscribe( res_template => {
            let params = Object.assign({
              'src_page': this.current_page,
              'src_component': this,
              'res_model': this.relation_res_model, 
              'res_id': res_id, 
              'context': context, 
              'action_options': this.options,
            }, res_template);
            this.navCtrl.push('FormPage', params);
          }, (error) => {
            this.commonProvider.displayErrorMessage(error.message, true);
          })
        } else {
          this.commonProvider.displayErrorMessage(`${msg_open_form_failed}(${this.relation_res_model}):${msg_view_not_found}`, true);
        }
      }, (error) => {
        this.commonProvider.displayErrorMessage(error.message, true);
    })
  }

  onClick(event) {
    this.validate_error_message = '';
    if (this.is_edit_mode) {
      this.selectRecord(event);
    } else {
      this.openFormView(event);
    }
  }

  onEditClick(event) {
    this.openFormView(event);
  }

  clear(event) {
    event.stopPropagation();
    this.validate_error_message = '';
    this.writeValue(false);
  }

  validateData() {
    if (this.is_edit_mode && this.required && !this.relation_res_id) {
      this.validate_error_message = this.translate.instant("This field is required");
      return false;
    } else {
      return true;
    }
  }
}
