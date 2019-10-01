// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Component, forwardRef } from '@angular/core';
import { OdooProvider } from '../../providers/odoo/odoo';
import { AppViewProvider } from '../../providers/app-view/app-view';
import { NavController, AlertController } from 'ionic-angular';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonProvider } from '../../providers/common/common';
import { DomainProvider } from '../../providers/odoo/domain';
import { RelationalFieldComponent } from '../relational-field/relational-field';
import { TranslateService } from '@ngx-translate/core';

const FIELD_REFERENCE_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => FieldReferenceComponent),
  multi: true
};

@Component({
  selector: 'field-reference',
  host: {
    '[class.required]': 'required', 
    '[class.readonly]': 'readonly', 
    '[class.invisible]': 'invisible',
    '[class.editmode]': 'is_edit_mode',
    '[class.readmode]': '!is_edit_mode',
    '[class.nolabel]': 'nolabel',
    '(click)': 'onClick($event)',
  },
  templateUrl: 'field-reference.html',
  providers: [FIELD_REFERENCE_VALUE_ACCESSOR],
})
export class FieldReferenceComponent extends RelationalFieldComponent {
  private reference_res_model;
  private reference_res_id;
  public reference_res_name = "";
  constructor(
    protected odooProvider: OdooProvider,
    protected commonProvider: CommonProvider,
    protected domainProvider: DomainProvider,
    protected translate: TranslateService,
    private appViewProvider: AppViewProvider,
    private navCtrl: NavController,
    private alertController: AlertController,
  ) {
    super(odooProvider, commonProvider, domainProvider, translate);
  }

  get enable_edit_button() {
    return !this.no_open && this.is_edit_mode && this.reference_res_id;
  }

  get display_angle_right() {
    return (!this.no_open && !this.is_edit_mode && this.record_component_type === 'form') || (this.is_edit_mode && !this.reference_res_id);
  }

  get has_right_read() {
    if (this.reference_res_model && this.model_access_rights.hasOwnProperty(this.reference_res_model)) {
      return this.model_access_rights[this.reference_res_model].read;
    } else {
      return false;
    }
  }

  get has_right_write() {
    if (this.reference_res_model && this.model_access_rights.hasOwnProperty(this.reference_res_model)) {
      return this.model_access_rights[this.reference_res_model].write;
    } else {
      return false;
    }
  }

  get has_right_create() {
    if (this.reference_res_model && this.model_access_rights.hasOwnProperty(this.reference_res_model)) {
      return this.model_access_rights[this.reference_res_model].create;
    } else {
      return false;
    }
  }

  get has_right_unlink() {
    if (this.reference_res_model && this.model_access_rights.hasOwnProperty(this.reference_res_model)) {
      return this.model_access_rights[this.reference_res_model].unlink;
    } else {
      return false;
    }
  }

  setReferenceRecordName(res_model, res_id, name) {
    if (this.reference_res_model == res_model && this.reference_res_id == res_id) {
      this.reference_res_name = name;
    }
  }

  updateReferenceRecordName() {
    let res_model = this.reference_res_model;
    let res_id = this.reference_res_id;
    this.reference_res_name = '';
    let context = this.odooProvider.mergeContext([this.odooProvider.user_context, this.context]);
    this.odooProvider.call(res_model, 'read', [[res_id], ['name']], {context: context}).subscribe( res => {
      if (res.length == 1) {
        this.setReferenceRecordName(res_model, res_id, res[0].name);
      } else {
        this.setReferenceRecordName(res_model, res_id, res_model + ',' + res_id);
      }
    }, error => {
      this.setReferenceRecordName(res_model, res_id, res_model + ',' + res_id);
    })
  }

  writeValue(value: any) {
    if (value instanceof(Array) && value.length == 3) {
      this.reference_res_model = value[0];
      this.reference_res_id = value[1];
      this.reference_res_name = value[2];
    } else if(typeof(value) == "string" && value.length) {
      let temp = value.split(',');
      this.reference_res_model = temp[0];
      this.reference_res_id = parseInt(temp[1]);
      this.updateReferenceRecordName();
    } else {
      this.reference_res_model = false;
      this.reference_res_id = false;
      this.reference_res_name = '';
    }

    if (this.reference_res_model && this.reference_res_id) {
      this.propagateChange(this.reference_res_model + ',' + this.reference_res_id);
    } else {
      this.propagateChange(false);
    }
  }

  updateRecord(record, record_origin) {
    this.writeValue([record.res_model, record.id, record.name]);
  }

  get res_model_inputs() {
    let inputs = [];
    let selection = this.field_definition['selection'] || [];
    selection.forEach(selectItem => {
      inputs.push({
        type: 'radio',
        value: selectItem[0],
        label: selectItem[1],
        checked: this.reference_res_model == selectItem[0]
      })
    });
    let has_checked = false;
    inputs.forEach((inputItem) => {
      if (inputItem.checked) {
        has_checked = true;
      }
    })
    if (!has_checked && inputs.length > 0) {
      inputs[0].checked = true;
    }
    return inputs;
  }

  beginSelectRecord(event) {
    if (this.record_component_type !== 'form' || !this.is_edit_mode) {
      return;
    }
    event.stopPropagation();

    // 如果可选模型只有一个，直接设置该模型为当前模型
    if (this.res_model_inputs.length == 1) {
      this.selectRecord(this.res_model_inputs[0].value);
      return;
    }

    this.alertController.create({
      title: this.label,
      inputs: this.res_model_inputs,
      buttons: [
        {
          text: this.translate.instant("Cancel"),
          role: 'cancel',
          handler: data => {}
        },
        {
          text: this.translate.instant("Confirm"),
          handler: res_model => {
            this.selectRecord(res_model);
          }
        }
      ]
    }).present();
  }

  inputChangeListner(event) {
    this.writeValue(event.target.value);
  }

  selectRecord(res_model) {
    let params = {'src_page': this.current_page,
                  'src_component': this,
                  'action_name': this.label,
                  'action_res_model': res_model, 
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
    let res_id = this.reference_res_id;
    if (this.record_component_type !== 'form' || this.no_open || !res_id) {
      return;
    }
    event.stopPropagation();
    this.commonProvider.displayLoading();
    let res_model = this.reference_res_model;
    let context = this.odooProvider.mergeContext([this.odooProvider.user_context, this.context]);
    let view_search_domain = [['res_model', '=', res_model], ['type', '=', 'form']];
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
          this.commonProvider.displayErrorMessage(`${msg_open_form_failed}${res_model}):${err_msg}`, true);
        } else if (res.length > 0) {
          this.appViewProvider.parseViewTemplate(res_model, res[0].arch).subscribe( res_template => {
            let params = Object.assign({
              'src_page': this.current_page,
              'src_component': this,
              'res_model': res_model, 
              'res_id': res_id, 
              'context': context, 
              'action_options': this.options,
            }, res_template);
            this.navCtrl.push('FormPage', params);
          }, (error) => {
            this.commonProvider.displayErrorMessage(error.message, true);
          });
        } else {
          this.commonProvider.displayErrorMessage(`${msg_open_form_failed}(${res_model}):${msg_view_not_found}`, true);
        }
      }, (error) => {
        this.commonProvider.displayErrorMessage(error.message, true);
    })
  }

  onClick(event) {
    this.validate_error_message = '';
    if (this.is_edit_mode) {
      this.beginSelectRecord(event);
    } else {
      this.openFormView(event);
    }
  }

  onEditClick(event) {
    this.validate_error_message = '';
    this.openFormView(event);
  }

  clear(event) {
    event.stopPropagation();
    this.validate_error_message = '';
    this.writeValue(false);
  }

  validateData() {
    if (this.is_edit_mode && this.required && !this.reference_res_id) {
      this.validate_error_message = this.translate.instant("This field is required");
      return false;
    } else {
      return true;
    }
  }
}
