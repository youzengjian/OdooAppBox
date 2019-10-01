// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Component, Input, forwardRef, ChangeDetectorRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { AppViewProvider } from '../../providers/app-view/app-view';
import { OdooProvider } from '../../providers/odoo/odoo';
import { Observable } from 'rxjs/Observable';
import { CommonProvider, ExceptionActionDefinition } from '../../providers/common/common';
import { NavController, AlertController } from 'ionic-angular';
import { DomainProvider } from '../../providers/odoo/domain';
import { RelationalFieldComponent } from '../relational-field/relational-field';
import { OdooError } from '../../providers/odoo/odoo.error';
import { TranslateService } from '@ngx-translate/core';
const FIELD_ONE2MANY_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => FieldOne2manyComponent),
  multi: true
};
export const FIELD_ONE2MANY_COMPONENT_HOST = {
  '[class.required]': 'required', 
  '[class.readonly]': 'readonly', 
  '[class.invisible]': 'invisible',
  '[class.editmode]': 'is_edit_mode',
  '[class.readmode]': '!is_edit_mode',
  '[class.nolabel]': 'nolabel',
  '(click)': 'onClick($event)',
}
export const FIELD_ONE2MANY_COMPONENT_TEMPLATE = `
<div>
  <ion-spinner *ngIf="loadingState === 'loading'"></ion-spinner>
  <div class="items" *ngIf="loadingState === 'success'">
    <ng-container *ngIf="grouped_records.length">
      <div class="grouped_header">
        <div *ngIf="grouped_records.length > 1" style="width: 100%; display: flex; justify-content: space-between; align-items: center; height: 4.0rem;">
            <a (click)="previous_group()">{{'Previous' | translate}}</a>
            <div class="page_index_str">{{page_index_str}}</div>
            <a (click)="next_group()">{{'Next' | translate}}</a>
        </div>
        <div *ngIf="grouped_records.length >= 1" class="grouped_label" style="width: 100%;  padding: 0.5rem 0; border-bottom: 1px solid #eee; font-weight: bold;">{{grouped_label}}</div>
      </div>
      <div class="item record" [class.isSelected]="isSelectedRecord(record)" *ngFor="let record of grouped_records[grouped_index]">
        <button *ngIf="enable_unlink_record" ion-button icon-only (click)="delete_record(record)">
          <i class="fa fa-fw fa-minus-circle" aria-hidden="true"></i>
        </button>
        <kanban [current_page]='current_page'
                [parent_component]='this_component'
                [context]="context"
                [record]="record" 
                [res_model]="relation_res_model" 
                [view_form_ref]="view_form_ref" 
                [template]="template" 
                [model_access_rights]="model_access_rights"
                [options]="options"
                (click)="onRecordClick($event, record)"
                ></kanban>
      </div>
    </ng-container>
    <div *ngIf="!grouped_records.length" class="no_data">
      <div>{{message_no_data}}</div>
    </div>
    <div class="item add_record" *ngIf="enable_create_record" (click)="action_add_record($event)">
      <button ion-button icon-only>
        <i class="fa fa-fw fa-plus-circle" aria-hidden="true"></i>
      </button>
      <div>{{'Add Item' | translate}}</div>
    </div>
  </div>
  <div *ngIf="loadingState === 'failed'" class="error">
    {{'Load failed:' | translate}}{{errorMessage}}
  </div>
</div>
<div class="error" 
     [style.display]="validate_error_message?'block':'none'">
  {{validate_error_message}}
</div>
`

@Component({
  selector: 'field-one2many',
  host: FIELD_ONE2MANY_COMPONENT_HOST,
  template: FIELD_ONE2MANY_COMPONENT_TEMPLATE,
  providers: [FIELD_ONE2MANY_VALUE_ACCESSOR],
})
export class FieldOne2manyComponent extends RelationalFieldComponent {

  protected init_value = [];
  public records_old = [];
  public records_new = [];
  protected _init_state = '';
  public template;
  public fieldListBinary;
  public fieldListExceptBinary;
  public fieldsDefinition = {};
  public loadingState;
  public errorMessage;
  public grouped_index = 0;
  public grouped_label = '';
  public page_index_str = '';
  public grouped_records = [];
  // child_templates是子节点视图模板列表
  @Input() child_templates; 
  @Input() placeholder;
  @Input() group_fields;
  protected _form_view_template;
  protected _timer_load_records = null;
  protected _group_fields = [];
  protected _grouped_keys_info = {};
  protected _default_value:any = {};
  protected _product_records = [];
  protected _active_product:any = false;
  protected _selected_record_id:any = false;
  constructor(
    protected odooProvider: OdooProvider,
    protected commonProvider: CommonProvider,
    protected domainProvider: DomainProvider,
    protected appViewProvider: AppViewProvider,
    protected translate: TranslateService,
    protected navCtrl: NavController,
    protected alertController: AlertController,
    protected changeDetectorRef: ChangeDetectorRef,
  ) {
    super(odooProvider, commonProvider, domainProvider, translate);
  }

  ngOnInit() {
    super.ngOnInit();
    if (this.group_fields) {
      this._group_fields = this.group_fields.split(',');
    }
    this.init_value = this.commonProvider.deepClone(this.record[this.name]) || [];
    this.initTemplate().subscribe(() => {
      this.send_onchange_info_to_formpage();
    }, () => {});
  }

  private send_onchange_info_to_formpage() {
    if (!this.commonProvider.isPageForm(this.current_page)) {
      return;
    }

    let fields_onchange = {}
    let fields_all = Object.keys(this.fieldsDefinition);
    for (let i = 0; i < fields_all.length; i++) {
      let fieldName = fields_all[i];
      fields_onchange[`${this.name}.${fieldName}`] = this.fieldsDefinition[fieldName] && this.fieldsDefinition[fieldName]['appbox_onchange'] || '0';
    }
    if (Object.keys(fields_onchange).length) {
      this.current_page.set_child_o2m_onchange(fields_onchange);
    }
  }
  
  public isSelectedRecord(record) {
    return this._selected_record_id === record.id;
  }

  private addAssistValue(record) {
    record.res_model = this.relation_res_model;
    record.component_type = 'kanban';
    record.fieldsDefinition = this.fieldsDefinition;
    record.parent = this.record;
  }

  ngOnDestroy() {
    super.ngOnDestroy();
  }

  protected _onChange(record, fields_changed) {
    if (record.tracking === 'serial' && record.qty_scanned > 1) {
      record.qty_scanned = 1;
      this._selected_record_id = record.id;
      let msg_sn_unique = this.translate.instant("You cannot use the same serial number twice.");
      this.commonProvider.displayErrorMessage(`${msg_sn_unique}`, false);
    }
    this.changeDetectorRef.detectChanges();
    let vals = this.commonProvider.convertRecordForWrite(record, false);
    let res_id = record.id;
    if (this.commonProvider.isNewRecordId(res_id)) {
      res_id = false;
    }
    vals['id'] = res_id;
    let parent_record = this.commonProvider.deepClone(this.record);
    vals[this.field_definition.relation_field] = this.commonProvider.convertRecordForWrite(parent_record, false);
    delete vals[this.field_definition.relation_field][this.name];
    let res_ids = res_id && [res_id] || [];

    let changedFieldNames = [];
    let fields_onchange = {}
    let fields_all = fields_changed || Object.keys(record.fieldsDefinition);
    for (let i = 0; i < fields_all.length; i++) {
      let fieldName = fields_all[i];
      fields_onchange[fieldName] = record.fieldsDefinition[fieldName] && record.fieldsDefinition[fieldName]['appbox_onchange'] || '0';
      if (fields_onchange[fieldName] !== '0' && fields_onchange[fieldName] !== false) {
        changedFieldNames.push(fieldName);
      }
    }
    if (changedFieldNames.length === 0) {
      this.updateRecord(record, {});
      return;
    }
    let context = this.odooProvider.mergeContext([this.odooProvider.user_context, this.context]);
    // this.commonProvider.displayLoading();
    this.odooProvider.call(this.relation_res_model, 'onchange', [res_ids, vals, changedFieldNames, fields_onchange], {context: context}).subscribe(
      res => {
        // this.commonProvider.dismissLoading();
        // one2many这边的onchange不处理warning信息
        for(let key in res['value']) {
          record[key] = res['value'][key];
        }
        let warning = res['warning'];
        if(warning) {
          this.alertController.create({
            title: warning['title'],
            message: warning['message'],
            enableBackdropDismiss: false,
            buttons: [{
                text: this.translate.instant("Confirm"),
                handler: () => {}
              }]
          }).present();
        }
        this.updateRecord(record, {});
      }, error => {
        // 即使onchange调用失败了，也更新记录
        this.updateRecord(record, {});
        this.commonProvider.displayErrorMessage(error.message, true);
      }
    )
  }

  private get_active_grouped_keys_info() {
    for (var key in this._grouped_keys_info) {
      let keys_info = this._grouped_keys_info[key];
      if (keys_info['index'] === this.grouped_index) {
        return keys_info;
      }
    }
    return {};
  }

  private update_grouped_header() {
    let keys_info = this.get_active_grouped_keys_info();
    this.grouped_label = keys_info['label'];
    this.page_index_str = `${this.grouped_index + 1}/${this.grouped_records.length}`;
  }

  private update_grouped_records() {
    if (this._group_fields.length === 0) {
      this.grouped_records = [this.records_new];
      return;
    }
    let records = [];
    this._grouped_keys_info = {};
    this.records_new.forEach(record => {
      let key = [];
      let grouped_field_labels = [];
      let grouped_fields_value = {};
      this._group_fields.forEach(field => {
        key.push(record[field]);
        let field_definition = this.fieldsDefinition[field];
        let field_text = '';
        if (field_definition.type === 'many2one' && record[field]) {
          field_text = record[field][1];
          grouped_fields_value[field] = record[field];
        }
        grouped_field_labels.push(`${field_definition.string}:${field_text}`)
      })
      let key_str = JSON.stringify(key);
      if (Object.keys(this._grouped_keys_info).length === 0 || !this._grouped_keys_info[key_str]) {
        this._grouped_keys_info[key_str] = grouped_fields_value;
        this._grouped_keys_info[key_str]['index'] = Object.keys(this._grouped_keys_info).length - 1;
        this._grouped_keys_info[key_str]['label'] = grouped_field_labels.join(' ');
      }
      let key_index = this._grouped_keys_info[key_str]['index'];
      if (records.length <= key_index) {
        records[key_index] = [];
      }
      records[key_index].push(record);
    })
    this.grouped_records = records;

    this.update_grouped_header();
  }

  public previous_group() {
    this.grouped_index -= 1;
    if (this.grouped_index === -1) {
      this.grouped_index = this.grouped_records.length - 1;
    }
    this._active_product = false;
    this.update_grouped_header();
  }

  public next_group() {
    this.grouped_index += 1;
    if (this.grouped_index === this.grouped_records.length) {
      this.grouped_index = 0;
    }
    this._active_product = false;
    this.update_grouped_header();
  }

  get relation_res_model() {
    return this.field_definition['relation'];
  }

  get this_component() {
    return this;
  }

  get child_kanban_template() {
    let templates = JSON.parse(this.child_templates);
    return templates['kanban'];
  }

  get child_form_template() {
    let templates = JSON.parse(this.child_templates);
    return templates['form'];
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

  get enable_create_record() {
    return this.has_right_create && this.is_edit_mode;
  }

  get enable_unlink_record() {
    return this.has_right_unlink && this.is_edit_mode;
  }

  get init_record_ids() {
    let init_record_ids = [];
    for( let item of this.init_value) {
      if (typeof(item) === 'number') {
        init_record_ids.push(item);
      } else if (item instanceof Array && item.length === 2 && item[0] === 4 && typeof(item[1] === 'number')) {
        init_record_ids.push(item[1]);
      } else if (typeof(item) === 'object' && item.hasOwnProperty('id')) {
        init_record_ids.push(item.id);
      }
    }
    return init_record_ids;
  }

  get message_no_data() {
    if (typeof(this.placeholder) === 'string') {
      return this.placeholder;
    } else {
      return this.label + this.translate.instant("No data");
    }
  }

  loadRecords(res_ids, additional_records = []) {
    if (this._init_state === 'ok') {
      if (!res_ids || !res_ids.length) {
        this.loadingState = 'success';
        this.records_new = this.commonProvider.deepClone(additional_records);
        this.update_grouped_records();
        return;
      }
    } else if (this._init_state === 'failed') {
      this.loadingState = 'failed';
      return;
    } else {
      // 设置新的timer时必须先停止之前的timer，否则会导致概率性出现组件初始化时由于writevalue被多次调用而对结果产生错误的修改
      if (this._timer_load_records) {
        clearTimeout(this._timer_load_records);
        this._timer_load_records = null;
      }
      this._timer_load_records = setTimeout(() => this.loadRecords(res_ids, additional_records), 5);
      return;
    }

    this.loadingState = 'loading';
    let domain = [];
    try {
      // 这边如果domain合并错误需要设置一些变量，同时这边的错误会直接作为组件的一部分在界面上显示
      // 所以让combineDomain函数直接抛出异常，且不显示错误消息
      // 如果发生了异常，则终止后续的记录加载操作
      let exception_action = new ExceptionActionDefinition(true, false, []);
      domain = this.domainProvider.combineDomain(this.domain, [['id', 'in', res_ids]], '&', exception_action);
    } catch(error) {
      this.loadingState = 'failed';
      this.errorMessage = error.message;
      return;
    }

    let fieldList = this.fieldListBinary.concat(this.fieldListExceptBinary);
    let context = this.odooProvider.mergeContext([this.odooProvider.user_context, 
                                                  this.context, 
                                                  {'bin_size': true}]);
    this.odooProvider.call(this.relation_res_model, 'search_read', [domain, fieldList, 0, null, null], {context: context}).subscribe(
      res => {
        this.loadingState = 'success';
        let record_ids_no_update = this.commonProvider.deepClone(this.init_record_ids);
        let records_tmp = [];
        res.forEach(res_item => {
          res_item.res_model = this.relation_res_model,
          res_item.component_type = 'kanban';
          res_item.fieldsDefinition = this.fieldsDefinition;
          res_item.parent = this.record;
          let find_index = record_ids_no_update.indexOf(res_item.id);
          if (find_index !== -1) {
            record_ids_no_update.splice(find_index, 1);
            records_tmp.push(this.commonProvider.deepClone(res_item));
          }
        });
        for (let i = 0; i < record_ids_no_update.length; i++) {
          for (let record_old_item of this.records_old) {
            if (record_old_item.id === record_ids_no_update[i]) {
              records_tmp.push(this.commonProvider.deepClone(record_old_item));
              record_ids_no_update.splice(i, 1);
              i--;
            }
          }
        }
        this.records_old = records_tmp;
        this.records_new = this.commonProvider.deepClone(res);
        for (let additonal_record of additional_records) {
          this.records_new.push(additonal_record);
        }
        this.update_grouped_records();
      }, error => {
        this.loadingState = 'failed';
        this.errorMessage = error.message;
      }
    )
  }

  initTemplate() {
    return new Observable((observer) => {
      if (!this.child_kanban_template) {
        this.loadingState = 'failed';
        this.errorMessage = this.translate.instant("You need to define a child kanban view for one2many field.");
        this._init_state = 'failed';
        observer.error();
        return;
      }
      this.appViewProvider.parseViewTemplate(this.relation_res_model, this.child_kanban_template).subscribe(
        res => {
          // 将其中嵌套的one2many字段移除，避免复杂的嵌套
          let field_one2many_list = [];
          let template = res['template'];
          for (let field_name in res['fieldsDefinition']) {
            let field_definition = res['fieldsDefinition'][field_name];
            if (!field_definition) {
              let msg_field_not_define = this.translate.instant("This field is not define:");
              this.commonProvider.displayErrorMessage(`${msg_field_not_define}${field_name}`, false);
            }
            else if (field_definition && field_definition.type.toLowerCase() === "one2many") {
              field_one2many_list.push(field_name);
              res['fieldListExceptBinary'].pop(field_name);
              var reg=new RegExp('<field.*name=[\'\"]' + field_name + '[\'\"].*/.*>',"ig");
              template = template.replace(reg, '');
            }
          }
          // if (field_one2many_list.length > 0) {
          //   this.commonProvider.displayErrorMessage('发现one2many字段内嵌套one2many字段，已将其从视图中移除（' + field_one2many_list.join(',') + '）', false);
          // }
          this.template = template;
          this.fieldListBinary = res['fieldListBinary'];
          this.fieldListExceptBinary = res['fieldListExceptBinary'];
          this.fieldsDefinition = res['fieldsDefinition'];
          // 更新模块权限
          for (let model in res['model_access_rights']) {
            this.model_access_rights[model] = res['model_access_rights'][model];
          }
          this.model_access_rights = res['model_access_rights'];
          this._init_state = 'ok';
          observer.next();
        }, error => {
          this.loadingState = 'failed';
          this.errorMessage = error.message;
          this._init_state = 'failed';
          observer.error();
        }
      )
    })
  }

  get_record_ids(value) {
    let record_ids = [];
    if (!value) {
      return record_ids;
    }
    for( let item of value) {
      if (typeof(item) === 'number') {
        record_ids.push(item);
      } else if (item instanceof Array && item.length === 2 && item[0] === 1 && typeof(item[1] === 'number')) {
        record_ids.push(item[1]);
      } else if (typeof(item) === 'object' && item.hasOwnProperty('id') && !this.commonProvider.isNewRecordId(item.id)) {
        record_ids.push(item.id);
      }
    }
    return record_ids;
  }

  writeValue(value: any) {
    let ids = value;
    let records_not_saved = [];
    if(!value || !value.length) {
      ids = [];
      this.propagateChange([]);
    } else {
      this.propagateChange(value);
      ids = this.get_record_ids(value);
      // 得到用户新添加还没保存到数据库的记录，用于已存在数据库中的记录加载完成后添加进记录列表中，以便正确显示
      for(let item of value) {
        if (item instanceof Array && item.length === 3 && item[0] === 0 && item[1] === 0 && typeof(item[2]) === 'object') {
          let record = this.commonProvider.deepClone(item[2]);
          // 补充一些辅助信息
          record.res_model = this.relation_res_model,
          record.component_type = 'kanban';
          record.fieldsDefinition = this.fieldsDefinition;
          record.parent = this.record;
          records_not_saved.push(record);
        }
      }
    }
    this.loadRecords(ids, records_not_saved);
  }

  _propagateChange() {
    let records_old_ids = [];
    this.records_old.forEach((item) => {
      records_old_ids.push(item.id);
    });
    let records_new_ids = [];
    this.records_new.forEach((item) => {
      records_new_ids.push(item.id);
    });

    // old_ids只要数据库中已有记录的部分，没有记录的部分会作为新增记录在后面加上
    let old_ids = this.commonProvider.deepClone(this.get_record_ids(this.init_value));
    let new_value = this.commonProvider.deepClone(this.init_value);

    // 标记被删除的记录
    old_ids.forEach((record_id, index) => {
      if (records_new_ids.indexOf(record_id) == -1) {
        // one2many类型直接删除对应的记录
        new_value[index] = [2, record_id];
      }
    });

    // 标记更新的记录
    this.records_old.forEach((item_old) => {
      let index_new = records_new_ids.indexOf(item_old.id);
      if (index_new !== -1) {
        let record_diff_for_wirte = this.commonProvider.getRecordDiffForWrite(item_old, this.records_new[index_new], true);
        if (Object.keys(record_diff_for_wirte).length) {
          old_ids.forEach((record_id, index) => {
            if (record_id == item_old.id) {
              new_value[index] = [1, record_id, record_diff_for_wirte];
            }
          })
        }
      }
    });

    // 标记新增的记录
    this.records_new.forEach(item_new => {
      if (this.commonProvider.isNewRecordId(item_new.id)) {
        let vals = this.commonProvider.convertRecordForWrite(item_new, false);
        new_value.push([0, 0, vals]);
      }
    });

    this.propagateChange(new_value);
  }

  delete_record(record) {
    this.records_new.forEach((item, index, arr) => {
      if(record == item) {
        if(record.id === this._selected_record_id) {
          this._active_product = false;
        }
        arr.splice(index, 1);
      }
    })
    this.update_grouped_records();
    this._propagateChange();
  }

  private getFormViewTemplate() {
    return new Observable((observer) => {
      if (this.child_form_template) {
        observer.next(this.child_form_template);
        return;
      }      
      if (this._form_view_template) {
        observer.next(this._form_view_template);
        return;
      }  
      let view_search_domain = [['res_model', '=', this.relation_res_model], ['type', '=', 'form']];
      if (this.view_form_ref) {
        view_search_domain.push(['id', '=', this.view_form_ref]);
      } else {
        view_search_domain.push(['inherit_id', '=', null]);
      }
      let context = this.odooProvider.mergeContext([this.odooProvider.user_context, this.context]);
      this.odooProvider.call('app.view', 'search_read', [view_search_domain, ['arch'], 0, 1, null], {context: context}).subscribe( res => {
        let msg_open_form_failed = this.translate.instant('Open form page failed');
        let msg_view_not_found = this.translate.instant("The specified view could not be found!");
        if (res.error) {
          let err_msg = (res.error.data && res.error.data.message) || res.error.message;
          observer.error(new OdooError(this.translate, `${msg_open_form_failed}(${this.relation_res_model}):${err_msg}`));
        } else if (res.length) {
          this._form_view_template = res[0].arch;
          observer.next(this._form_view_template);
        } else {
          observer.error(new OdooError(this.translate, `${msg_open_form_failed}(${this.relation_res_model}):${msg_view_not_found}`));
        }
      }, error => {
        observer.error(error);
      });
    })
  }

  openFormView(event, record) {
    if (this.record_component_type !== 'form') {
      return;
    }
    if (event) {
      event.stopPropagation();
    }
    this.commonProvider.displayLoading();
    this.getFormViewTemplate().subscribe(
      formViewTemplate => {
        this.appViewProvider.parseViewTemplate(this.relation_res_model, formViewTemplate).subscribe( res_template => {
        let params = Object.assign({
          'src_page': this.current_page,
          'src_component': this,
          'res_model': this.relation_res_model,
          'res_id': (record && record.id) || null,
          'context': this.context,
          'record_vals': (record && this.commonProvider.deepClone(record)) || null,
          'action_options': this.options,
        }, res_template);
        this.navCtrl.push('FormPage', params);
        }, (error) => {
          this.commonProvider.displayErrorMessage(error.message, true);
        })
      }, (error) => {
        this.commonProvider.displayErrorMessage(error.message, true);
    })
  }

  onRecordClick(event, record) {
    this.validate_error_message = '';
    this.openFormView(event, record);
  }

  action_add_record(event) {
    this.validate_error_message = '';
    this.openFormView(event, null);
  }

  onClick(event) {
    this.validate_error_message = '';
  }

  updateRecords(records) {
    let need_delete = [];
    for (let i = 0; i < records.length; i++) {
      let res = records[i];
      if (!Array.isArray(res) || res.length === 0) {
        continue;
      }

      let len = res.length;
      let command = res[0];
      if (len === 1 && command === 5) {
        // command===5表示清空记录，这边不马上清空，只是记录需要清空的记录id
        need_delete = [];
        this.records_new.forEach(record_new => {
          need_delete.push(record_new.id);
        })
      } else if (len === 2 && command === 4) {
        // command===4表示指定记录为发生变化，所以从need_delete中移除（即保持该记录不变）
        let index = need_delete.indexOf(res[1]);
        if (index !== -1) {
          need_delete.splice(index, 1);
        }
      } else if (len === 3 && command === 0) {
        let record = this.commonProvider.deepClone(res[2]);
        record.id = res[1];
        this.addAssistValue(record)
        this.updateRecord(record, []);
      } else if (len === 3 && command === 1) {
        // command===1表示指定记录更新，所以先从need_delete中移除
        let index = need_delete.indexOf(res[1]);
        if (index !== -1) {
          need_delete.splice(index, 1);
        }

        // 移除后，找到原始记录，更新之
        let record_origin = {};
        this.records_new.forEach(record_new => {
          if (record_new.id === res[1]) {
            record_origin = this.commonProvider.deepClone(record_new);
          }
        })
        let record = this.commonProvider.deepClone(res[2]);
        record.id = res[1];
        this.addAssistValue(record)
        this.updateRecord(record, record_origin);
      }

      // 删除其余记录
      for (let i = 0; i < need_delete.length; i++) {
        this.records_new.forEach(record_new => {
          if (record_new.id === res[1]) {
            this.delete_record(record_new)
          }
        })
      }
    }
  }

  updateRecord(record, record_origin) {
    let records_old_ids = [];
    this.records_old.forEach((item) => {
      records_old_ids.push(item.id);
    });
    let records_new_ids = [];
    this.records_new.forEach((item) => {
      records_new_ids.push(item.id);
    });

    // 更新records_old的值（record_origin记录的是新窗口中从后台读取的未被修改的值）
    // 且新窗口中可能会读取一些当前组件未读取的字段，如果未更新会导致这类字段被标记为修改过
    // 所以先对这类字段的值进行更新，以便准确判断用户是否有更改
    let index_old = records_old_ids.indexOf(record_origin.id);
    if (index_old >= 0) {
      for(let key in record_origin) {
        // 排除component_type和parent字段，避免数据错误
        if (['component_type', 'parent'].indexOf(key) === -1) {
          this.records_old[index_old][key] = record_origin[key];
        }
      }
    }

    let index_new = records_new_ids.indexOf(record.id);
    if (index_new >= 0) {
      // 记录已存在则更新
      for(let key in record) {
        // 排除component_type和parent字段，避免数据错误
        if (['component_type', 'parent'].indexOf(key) === -1) {
          this.records_new[index_new][key] = record[key];
        }
      }
    } else {
      // 记录不存在则添加
      record['component_type'] = 'kanban';
      record['parent'] = this.record;
      this.records_new.push(record);
    }
    this.update_grouped_records();
    this._propagateChange();
  }

  validateData() {
    if (this.is_edit_mode && this.required && !this.records_new.length) {
      this.validate_error_message = this.translate.instant("This field is required");
      return false;
    } else {
      return true;
    }
  }
}
