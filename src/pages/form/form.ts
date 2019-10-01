// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Component, ViewChild, ViewContainerRef, NgModule, Compiler, AfterViewInit, ViewChildren, OnDestroy } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, AlertController, Content } from 'ionic-angular';
import { OdooProvider } from '../../providers/odoo/odoo';
import { ComponentsModule } from '../../components/components.module';
import { FormsModule } from '@angular/forms';
import { CommonProvider, FORM_PAGE_NAME } from '../../providers/common/common';
import { Observable } from 'rxjs/Observable';
import { AppActionProvider } from '../../providers/app-action/app-action';
import { CommonModule } from '@angular/common';
import { DirectivesModule } from '../../directives/directives.module';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

@IonicPage()
@Component({
  selector: 'page-form',
  host: {
    '[class.editmode]': 'is_edit_mode',
  },
  templateUrl: 'form.html',
})
export class FormPage {
  public src_page;
  public src_component;
  private res_model;
  private context;
  private template;
  private template_footer_buttons;
  public record;
  private record_origin;
  private record_last_change;
  private fieldListBinary;
  private fieldListExceptBinary;
  private fieldsDefinition;
  private prevPageTitle;
  public is_edit_mode = false;
  public target;
  public page_uuid = '';
  public page_tyep_name = FORM_PAGE_NAME;
  private action_name;
  private formComponent;
  private intervalCreateForm;
  private _disable_init_mode = false;
  private _observerRecordChangeList = [];
  private _timer_to_eidt_mode = null;
  private model_access_rights = {};
  private action_options = {};
  public _trigger_onchange_for_all_fields = false;
  private _need_reload = false;
  private _child_o2m_onchange = {};
  @ViewChild("container_content", { read: ViewContainerRef }) container_content: ViewContainerRef;
  @ViewChild("container_footer", { read: ViewContainerRef }) container_footer: ViewContainerRef;
  @ViewChild(Content) content: Content;
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private odooProvider: OdooProvider,
    private compiler: Compiler,
    private viewController: ViewController,
    private commonProvider: CommonProvider,
    private alertController: AlertController,
    private appActionProvider: AppActionProvider,
    private translate: TranslateService,
  ) {
    this.src_page = this.navParams.get('src_page');
    this.src_component = this.navParams.get('src_component');
    this.res_model = this.navParams.get('res_model');
    this.context = this.navParams.get('context');
    this.target = this.navParams.get('target') || 'self';
    this.action_name = this.navParams.get('action_name');
    this.template = this.navParams.get('template');
    this.template_footer_buttons = this.navParams.get('template_footer_buttons');
    let res_id = this.navParams.get('res_id');
    let record_vals = this.navParams.get('record_vals');
    this.fieldListBinary = this.navParams.get('fieldListBinary');
    this.fieldListExceptBinary = this.navParams.get('fieldListExceptBinary');
    this.fieldsDefinition = this.navParams.get('fieldsDefinition');
    this.model_access_rights = this.navParams.get('model_access_rights') || {};
    this.action_options = this.navParams.get('action_options') || {};
    this.page_uuid = 'formpage_' + new Date().getTime() + Math.random();
    if (!this.res_model || !this.template || (this.fieldListExceptBinary.length + this.fieldsDefinition.length) === 0) {
      if (this.src_page) {
        this.commonProvider.displayErrorMessage(this.translate.instant("Invalid form view!"), true);
        this.navCtrl.popTo(this.src_page.viewController);
      } else {
        this.navCtrl.setRoot('HomePage');
      }
      return;
    }
    let prevPage = this.navCtrl.getActive();
    if (prevPage) {
      this.prevPageTitle = prevPage.instance.title;
    }

    // 现有recrod_vals已经包含所有所需字段的值，直接使用record_vals创建该form
    if (this.commonProvider.isNewRecordId(res_id)) {
      this.addMissingFieldDefaultValue(record_vals);
      // 通过扫码方式创建的明细行记录可能字段数据不全，打开form视图后立即触发一次onchange,以便加载更完整的信息
      this._trigger_onchange_for_all_fields = true;
      this.createFromByRecordVals(record_vals);
    } else if (res_id && typeof(res_id) == 'number') {
      if (this.isRecordValsEnough(record_vals)) {
        // 如果record_vals中已经包含足够的信息，则无需重新读取
        this.createFromByRecordVals(record_vals);
      } else {
        // 否则从数据库中重新读取所需字段的值
        this.createFormByExistRecord(res_id, true);
      }
    } else {
      this.createFormByNewRrecord();
    }
  }

  get display_btn_edit() {
    return !(this.is_edit_mode||this.has_one2many_parent);
  }

  get display_btn_discard() {
    return this.is_edit_mode&&this.target!=='new';
  }

  get display_btn_save() {
    return this.is_edit_mode;
  }

  createFromByRecordVals(record_vals) {
    this.addAssistValue(record_vals);
    this.record_origin = this.commonProvider.deepClone(record_vals);
    this.record_last_change = this.commonProvider.deepClone(record_vals);
    this.record = this.commonProvider.deepClone(record_vals);
    this.intervalCreateForm = setInterval(() => {
      if (this.container_content) {
        clearInterval(this.intervalCreateForm);
        this.commonProvider.dismissLoading();
        this.createForm();
      }} ,10);
  }

  setReloadFlag() {
    this._need_reload = true;
    if (this.src_page.setReloadFlag) {
      this.src_page.setReloadFlag();
    }
  }

  get init_mode() {
    if (!this.enable_edit_mode) {
      return 'read_mode';
    }

    if (this.commonProvider.isNewRecordId(this.record.id)){
      return 'edit_mode';
    }

    if (this.src_page && this.src_page.is_edit_mode) {
      return 'edit_mode';
    }
    return 'read_mode';
  }

  get has_one2many_parent() {
    return (this.src_component && this.src_component.field_type === 'one2many') || false;
  }

  get thisPage() {
    return this;
  }

  isRecordValsEnough(record_vals) {
    let fieldList = this.fieldListBinary.concat(this.fieldListExceptBinary);
    let record_vals_keys = (record_vals && Object.keys(record_vals)) || [];
    for(let i = 0, len = fieldList.length; i < len; i++) {
      let fieldName = fieldList[i];
      if (record_vals_keys.indexOf(fieldName) === -1) {
        return false;
      }
    }
    return true;
  }

  onRecordChange() {
    return new Observable((observer) => {
      this._observerRecordChangeList.push(observer);
    });
  }

  private get_field_onchange(fieldName) {
    let field_definition = this.fieldsDefinition[fieldName];
    return field_definition && field_definition['appbox_onchange'] || '0';
  }

  private has_onchange(fieldName) {
    let appbox_onchange = this.get_field_onchange(fieldName);
    let regOnchangeV7 = /^(\w+)\((.*)\)$/ 
    let regOnchangeV8 = /^1$|^true$/  //匹配'1'或'true'
    if (typeof(appbox_onchange) === 'string' 
      && (appbox_onchange.match(regOnchangeV7) || appbox_onchange.match(regOnchangeV8))) {
      return true;
    } else {
      return false;
    }
  }

  public set_child_o2m_onchange(onchange_vals) {
    for (let key in onchange_vals) {
      this._child_o2m_onchange[key] = onchange_vals[key];
    }
  }

  private _update_one2many_field_value_by_onchange(field_name, records) {
    this.children_field.forEach(field_component => {
      if (field_component.name === field_name) {
        field_component.updateRecords(records);
      }
    });
  }

  private _onChange(last_diff) {
    let changedFieldComponents = [];
    for(let fieldName in last_diff) {
      this.children_field.forEach(field_component => {
        if (field_component.name === fieldName && this.has_onchange(fieldName))
        {
          changedFieldComponents.push(field_component);
        }
      });
    }

    if (!changedFieldComponents.length) {
      return;
    }
    
    let res_id = this.record.id;
    if (this.commonProvider.isNewRecordId(res_id)) {
      res_id = false;
    }

    let vals = this.commonProvider.convertRecordForWrite(this.record, false);
    vals['id'] = res_id;

    let fields_onchange = this.commonProvider.deepClone(this._child_o2m_onchange);
    for (let fieldName in this.fieldsDefinition) {
      fields_onchange[fieldName] = this.get_field_onchange(fieldName);
    }

    let res_ids = res_id && [res_id] || [];
    let context = {};
    let changedFieldNames;
    // 单个字段触发onchange时才应用该字段的上下文，多个字段同时触发（创建新记录）时不应用任何字段的上下文
    if (changedFieldComponents.length === 1) {
      context = this.odooProvider.mergeContext([this.odooProvider.user_context, this.context, changedFieldComponents[0].context]);
      changedFieldNames = changedFieldComponents[0].name;
    } else {
      context = this.odooProvider.mergeContext([this.odooProvider.user_context, this.context]);
      changedFieldNames = []
      for (let item of changedFieldComponents) {
        changedFieldNames.push(item.name);
      }
    }
    if (this.has_one2many_parent) {
      let field_parent = this.src_component.field_definition.relation_field;
      context['field_parent'] = field_parent;
      vals[field_parent] = this.commonProvider.convertRecordForWrite(this.record.parent, false);
      // 删除上级记录中当前记录所在one2many字段的信息，与odoo官方处理保持一致
      // 同时规避了打开one2many字段明细行后，其record信息中增加了fieldsDefinition信息
      // 在下次触发onchange方法时未能正常清除导致调用服务器端的onchange方法异常的问题
      delete vals[field_parent][this.src_component.name];
    }

    this.commonProvider.displayLoading();
    this.odooProvider.call(this.res_model, 'onchange', [res_ids, vals, changedFieldNames, fields_onchange], {context: context}).subscribe(
      res => {
        this.commonProvider.dismissLoading();
        if (res.error) {
          let err_msg = (res.error.data && res.error.data.message) || res.error.message;
          this.commonProvider.displayErrorMessage(err_msg, true);
          return;
        }
        for(let key in res['value']) {
          if(this.fieldsDefinition[key].type.toLowerCase() === 'one2many') {
            this._update_one2many_field_value_by_onchange(key, res['value'][key]);
          } else {
            this.record[key] = res['value'][key];
          }
        }
        // onchange触发value变更，触发相关通知，解决因为调用后台onchange方法导致的数据变更未触发界面重新计算显示选项的问题
        if (res['value']) {
          this._observerRecordChangeList.forEach(observer => {
            observer.next();
          });
        }
        this.record_last_change = this.commonProvider.deepClone(this.record);
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

        let domain = res['domain'];
        for(let key in domain){
          this.children_field.forEach(field_component => {
            if (field_component.name === key && field_component.updateDomain) {
              field_component.updateDomain(domain[key]);
            }
          });
        }
      }, error => {
        this.commonProvider.displayErrorMessage(error.message, true);
      }
    )
  }

  onChange() {
    let record_last_diff_for_write = this.commonProvider.getRecordDiffForWrite(this.record_last_change, this.record, false);
    if (Object.keys(record_last_diff_for_write).length) {
      this._observerRecordChangeList.forEach(observer => {
        observer.next();
      });
      this.record_last_change = this.commonProvider.deepClone(this.record);
      this._onChange(record_last_diff_for_write);
    }
  }

  private addAssistValue(record) {
    record.res_model = this.res_model;
    record.component_type = 'form';
    record.fieldsDefinition = this.fieldsDefinition;
    if (this.has_one2many_parent) {
      record.parent = this.src_component.record;
    } else {
      record.parent = null;
    }
  }

  createFormByExistRecord(res_id, keep_old_record_vals = false) {
    let fieldList = this.fieldListBinary.concat(this.fieldListExceptBinary);
    let context = this.odooProvider.mergeContext([this.odooProvider.user_context, 
                                                  this.context, 
                                                  {'bin_size': true}]);
    this.commonProvider.displayLoading();
    this.odooProvider.call(this.res_model, 'read', [[res_id], fieldList], {context: context}).subscribe(
      res => {
        if (res.length == 1) {
          this.commonProvider.dismissLoading();
          this.addAssistValue(res[0]);
          this.record_origin = this.commonProvider.deepClone(res[0]);
          this.record_last_change = this.commonProvider.deepClone(res[0]);
          this.record = this.commonProvider.deepClone(res[0]);
          // 为避免因为通过record_vals传进来的参数不足重新从后台读取数据后，前台修改的数据丢失
          // 因此重新将之前通过record_vals传进来的参数更新到record中
          if (keep_old_record_vals) {
            let fieldList = this.fieldListBinary.concat(this.fieldListExceptBinary);
            let record_vals = this.navParams.get('record_vals');
            let record_vals_keys = (record_vals && Object.keys(record_vals)) || [];
            for(let i = 0, len = fieldList.length; i < len; i++) {
              let fieldName = fieldList[i];
              if (record_vals_keys.indexOf(fieldName) !== -1) {
                this.record[fieldName] = record_vals[fieldName];
              }
            }
          }

          this.createForm();
        } else {
          this.commonProvider.displayErrorMessage(this.translate.instant("Read data from server failed!"), true);
        }
      }, error => {
        this.commonProvider.displayErrorMessage(error.message, true);
      }
    )  
  }

  addMissingFieldDefaultValue(record) {
    let fieldList = this.fieldListBinary.concat(this.fieldListExceptBinary);
    for(let i = 0, len = fieldList.length; i < len; i++) {
      let fieldName = fieldList[i];
      if (!this.commonProvider.isUndefined(record[fieldName]) || !(fieldName in this.fieldsDefinition)) {
        continue;
      }
      let field_type = this.fieldsDefinition[fieldName].type.toLowerCase();
      if (['char', 'text', 'html'].indexOf(field_type) != -1) {
        record[fieldName] = '';
      } else if (['integer', 'float', 'monetary'].indexOf(field_type) != -1) {
        record[fieldName] = 0;
      } else if (['date', 'datetime'].indexOf(field_type) != -1) {
        record[fieldName] = false;
      } else if (['one2many', 'many2many'].indexOf(field_type) != -1) {
        record[fieldName] = [];
      } else if ('many2one' == field_type) {
        record[fieldName] = false;
      } else if ('reference' == field_type) {
        record[fieldName] = false;
      } else if ('boolean' == field_type) {
        record[fieldName] = false;
      } else if ('binary' == field_type) {
        record[fieldName] = 0;
      } else if ('selection' == field_type) {
        record[fieldName] = false;
      }
    }
  }

  createFormByNewRrecord() {
    let fieldList = this.fieldListBinary.concat(this.fieldListExceptBinary);
    let context = this.odooProvider.mergeContext([this.odooProvider.user_context, 
                                                  this.context, 
                                                  {'bin_size': true}]);
    this.commonProvider.displayLoading();
    this.odooProvider.call(this.res_model, 'default_get', [fieldList], {context: context}).subscribe(
      res => {
        this.commonProvider.dismissLoading();
        this.addAssistValue(res);
        res.id = this.commonProvider.generateNewRecordId();
        this.addMissingFieldDefaultValue(res);
        this.record_origin = this.commonProvider.deepClone(res);
        this.record_last_change = this.commonProvider.deepClone(res);
        this.record = this.commonProvider.deepClone(res);
        // 创建新记录，设置标记，在createFrom创建的视图初始化完成以后（_onchange方法需要用到其中的组件），用初始值统一触发一次onchange
        this._trigger_onchange_for_all_fields = true;
        this.createForm();
      }, error => {
        this.commonProvider.displayErrorMessage(error.message, true);
      }
    )
  }

  ionViewWillEnter() {
    if (this._need_reload) {
      this._need_reload = false;
      let res_id = this.record && this.record.id;
      if (res_id && !this.commonProvider.isNewRecordId(res_id)) {
        this.createFormByExistRecord(res_id);
      }
    }
  }

  ionViewDidLoad() {
    this.viewController.setBackButtonText(this.prevPageTitle);
  }

  get title() {
    if (this.action_name) {
      return this.action_name;
    }
    if (this.record && this.record.name) {
      return this.record.name;
    } else {
      return this.res_model;
    }    
  }

  get has_right_read() {
    if (this.model_access_rights.hasOwnProperty(this.res_model)) {
      return this.model_access_rights[this.res_model].read;
    } else {
      return false;
    }
  }

  get has_right_write() {
    if (this.model_access_rights.hasOwnProperty(this.res_model)) {
      return this.model_access_rights[this.res_model].write;
    } else {
      return false;
    }
  }

  get has_right_create() {
    if (this.model_access_rights.hasOwnProperty(this.res_model)) {
      return this.model_access_rights[this.res_model].create;
    } else {
      return false;
    }
  }

  get has_right_unlink() {
    if (this.model_access_rights.hasOwnProperty(this.res_model)) {
      return this.model_access_rights[this.res_model].unlink;
    } else {
      return false;
    }
  }
  
  get enable_edit_mode() {
    if (this.has_right_write) {
      if (this.action_options.hasOwnProperty('no_edit') && this.action_options['no_edit']) {
        return false;
      } else if (this.src_component && (this.src_component.no_edit || this.src_component.readonly)) {
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  }

  get children_field() {
    return this.formComponent && this.formComponent.instance.children_field || [];
  }

  toEditMode(try_cnt=0) {
    if (!this.enable_edit_mode) {
      return;
    }

    if (this.children_field.length) {
      this.is_edit_mode = true;
      this.children_field.forEach(field_component => {
        field_component.toEditMode();
      });
      this.viewController.showBackButton(false);
    } else if (try_cnt < 20){
      // 为了解决各组件可能没有初始化完成导致无法进入编辑模式的问题，增加重试机制
      let try_time = Math.floor(try_cnt / 5) * 100 + 100;
      this._timer_to_eidt_mode = setTimeout(() => {
        this.toEditMode(try_cnt + 1);
      }, try_time);
    } else {
      // do nothing;
    }
  }

  exitEditMode(recreate_form) {
    if (this._timer_to_eidt_mode) {
      clearTimeout(this._timer_to_eidt_mode);
      this._timer_to_eidt_mode = null;
    }
    if (this.init_mode == 'edit_mode' && this.src_page && (this.src_component || (!this.src_component && this.commonProvider.isNewRecordId(this.record.id)))) {
      this.navCtrl.popTo(this.src_page.viewController);
      return;
    }

    if (this.commonProvider.isNewRecordId(this.record.id)) {
      this.navCtrl.pop();
      return;
    }
    
    // 如果是需要直接退出当前页面的情况下，则不会执行后续的切换为read模式和重建form组件操作
    this.is_edit_mode = false;
    this.viewController.showBackButton(true);
    if (recreate_form) {
      this._disable_init_mode = true;
      this.createFormByExistRecord(this.record.id);
    } else {
      this.children_field.forEach(field_component => {
        field_component.exitEditMode();
      });
    }
  }

  cancel(close_page=false) {
    let record_diff_for_write = this.commonProvider.getRecordDiffForWrite(this.record_origin, this.record, true)
    if(Object.keys(record_diff_for_write).length) {
      this.alertController.create({
        title: this.translate.instant("Warning"),
        message: this.translate.instant("The record has been modified, your changes will be discarded. Do you want to proceed?"),
        enableBackdropDismiss: false,
        buttons: [
          {
            text: this.translate.instant("Cancel"),
            role: 'cancel',
            handler: () => {this.record['tax_id'] = [4,1]}
          },
          {
            text: this.translate.instant("Confirm"),
            handler: () => {
              this.record_last_change = this.commonProvider.deepClone(this.record_origin);
              this.record = this.commonProvider.deepClone(this.record_origin);
              if (close_page) {
                this._close_current_page();
              } else {
                this.exitEditMode(true);
              }
            }
          }
        ]
      }).present();
    } else {
      if (close_page) {
        this._close_current_page();
      } else {
        this.exitEditMode(false);
      }
    }
  }

  saveRecordSuccess(callback_success=null, args=null, obj=null) {
    if (callback_success && args && obj) {
      callback_success.apply(obj, args);
    } else {
      if (this.src_component) {
        this.src_component.updateRecord(this.record, this.record_origin);
      }
      if (this.commonProvider.isPageKanban(this.src_page)) {
        this.src_page.setReloadFlag();
      }
      this.exitEditMode(true);
    }
  }

  confirm(callback_success=null, args, obj) {
    let valid = true;
    let err_list = [];
    this.children_field.forEach(field_component => {
      if (field_component.validateData) {
        if (!field_component.validateData()) {
          err_list.push(field_component.name + ':' + field_component.validate_error_message);
          valid = false;
        }        
      }
    });
    if (!valid) {
      let msg_fields_invalid = this.translate.instant("The following fields are invalid:");
      this.commonProvider.displayErrorMessage(msg_fields_invalid + err_list.join('\n'), true);
      return;
    }

    let context = this.odooProvider.mergeContext([this.odooProvider.user_context, this.context]);
    if (this.has_one2many_parent) {
      let record_temp = this.commonProvider.deepClone(this.record);
      this.src_component.updateRecord(record_temp, {});
      this.exitEditMode(false);
    } else if (this.commonProvider.isNewRecordId(this.record.id)) {
      let record_diff_for_write = this.commonProvider.convertRecordForWrite(this.record, true);
      this.commonProvider.displayLoading();
      this.odooProvider.call(this.res_model, 'create', [record_diff_for_write], {context: context}).subscribe((res) => {
        if (res.error) {
          let err_msg = (res.error.data && res.error.data.message) || res.error.message;
          this.commonProvider.displayErrorMessage(
            this.translate.instant("Create new record failed:") + err_msg, true);
        } else {
          this.record_origin.id = res;
          this.record_last_change.id = res;
          this.record.id = res;
          this.saveRecordSuccess(callback_success, args, obj);
        }
        this.commonProvider.dismissLoading();
      }, (error) => {
        this.commonProvider.displayErrorMessage(this.translate.instant("Create new record failed:") + error.message, true);
      })
    } else {
      let record_diff_for_write = this.commonProvider.getRecordDiffForWrite(this.record_origin, this.record, true);
      if (Object.keys(record_diff_for_write).length) {
        this.commonProvider.displayLoading();
        this.odooProvider.call(this.res_model, 'write', [[this.record.id], record_diff_for_write], {context: context}).subscribe((res) => {
          if (res && res.error || !res) {
            let err_msg = (res.error.data && res.error.data.message) || res.error.message;
            this.commonProvider.displayErrorMessage(
              this.translate.instant("Modify record failed:") + err_msg, true);
          } else {
            this.saveRecordSuccess(callback_success, args, obj);
            this.commonProvider.dismissLoading();
          }
        }, (error) => {
          this.commonProvider.displayErrorMessage(
            this.translate.instant("Modify record failed:")  + error.message, true);
        })        
      } else {
        // 没有修改的情况不调用write方法，后续操作会重新加载当前页面
        this.saveRecordSuccess(callback_success, args, obj);
      }
    }
  }

  private _close_current_page() {
    if (this.src_page) {
      this.navCtrl.popTo(this.src_page.viewController);
    } else {
      this.navCtrl.setRoot('HomePage');
    }
  }

  // 调用后台python方法
  private _call_button(name, additional_context) {
    let res_model = this.res_model;
    let res_id = this.record.id;
    let context = this.odooProvider.mergeContext([this.odooProvider.user_context, this.context, additional_context]);
    // odoo封装了call_button方法用于object类型的button调用，这边没有使用call_button，而是直接使用call接口
    this.commonProvider.displayLoading();
    this.odooProvider.call(res_model, name, [[res_id]], {context: context}).subscribe((res) => {
      if (res instanceof Array && res.length === 1) {
        res = res[0];
      }
      if (res instanceof Object && res.error) {
        let err_msg = (res.error.data && res.error.data.message) || res.error.message;
        this.commonProvider.displayErrorMessage(err_msg, true);
      } else if (res instanceof Object && res.type === 'app.act_window') {
        // 避免do_action内部可能出现未调用dismissLoading的情况，所以这边先调用
        this.commonProvider.dismissLoading();
        this.appActionProvider.do_action(res, false, this, additional_context);
      } else if (res instanceof Object && res.type === 'ir.actions.act_window_close') {
        this._close_current_page();
      } else if(this.target === 'new') {
        this.commonProvider.dismissLoading();
        this.setReloadFlag();
        this._close_current_page();
      } else {
        this.commonProvider.dismissLoading();
        this.exitEditMode(true);
      }
    }, error => {
      this.commonProvider.displayErrorMessage(error.message, true);
    })
  }

  // 响应type为object类型的button的单击操作
  call_button(name, additional_context) {
    if(!name) {
      return;
    }

    if (this.is_edit_mode) {
      this.confirm((name, additional_context) => {
        this.exitEditMode(false);
        this._call_button(name, additional_context);
      }, [name, additional_context], this);
    } else {
      this._call_button(name, additional_context);
    }
  }

  // 调用后台python方法
  private _exec_workflow(name) {
    let res_model = this.res_model;
    let res_id = this.record.id;
    this.commonProvider.displayLoading();
    this.odooProvider.exec_workflow(res_model, res_id, name).subscribe((res) => {
      this.commonProvider.dismissLoading();
      this.exitEditMode(true);
    }, error => {
      this.commonProvider.displayErrorMessage(error.message, true);
    })
  }

  exec_workflow(name) {
    if(!name) {
      return;
    }

    if (this.is_edit_mode) {
      this.confirm(this._exec_workflow, [name], this);
    } else {
      this._exec_workflow(name);
    }
  }

  createForm() {
    // 先取消所有订阅，避免当前页面重建form时的资源浪费
    this._observerRecordChangeList.forEach(observer => {
      observer.unsubscribe();
    });
    this._observerRecordChangeList = [];
    let template = '<form #form="ngForm" style="height:100%;">' + this.template + '</form>';

    @Component({
      template: template,
    })
    class DynamicContentComponent implements AfterViewInit{
      @ViewChild('form') form;
      @ViewChildren('appfield') children_field;//子组件实例引用
      public current_page;
      public record;
      public model_access_rights;
      constructor(
      ) {
      }

      init_params(parent) {
        this.current_page = parent;
        this.record = parent.record;
        this.model_access_rights = parent.model_access_rights;
      }

      ngAfterViewInit() {
        if (this.current_page._trigger_onchange_for_all_fields) {
          let record_init_vals_for_write = this.current_page.commonProvider.convertRecordForWrite(this.current_page.record);
          this.current_page._onChange(record_init_vals_for_write);
          this.current_page._trigger_onchange_for_all_fields = false;
        }
        this.form.valueChanges.subscribe(data => {
          this.current_page.onChange();
          this.current_page.content.resize();
        });
      }

      switchToTab(tab_btn, tab) {
        for(let i = 0; i < tab_btn.parentElement.children.length; i++) {
          let element = tab_btn.parentElement.children[i];
          element.classList.remove('active');
        }
        tab_btn.classList.add('active');

        for(let i = 0; i < tab.parentElement.children.length; i++) {
          let element = tab.parentElement.children[i];
          if (!element.classList.contains('tab')) {
            continue;
          }
          element.classList.remove('active');
        }
        tab.classList.add('active');
      }
    }

    @NgModule({
      declarations: [
        DynamicContentComponent,
      ],
      imports: [
        ComponentsModule,
        FormsModule,
        CommonModule,
        DirectivesModule,
        TranslateModule,
      ]
    })
    class DynamicContentModule {}
    

    let factory = this.commonProvider.form_component_cache[template];
    if (!factory) {
      factory = this.compiler.compileModuleAndAllComponentsSync(DynamicContentModule)
      .componentFactories.find(comFac=>comFac.componentType===DynamicContentComponent);
      this.commonProvider.form_component_cache[template] = factory;
    }
    this.container_content.clear();
    this.formComponent = this.container_content.createComponent(factory);
    this.formComponent.instance.init_params(this);
    if (!this._disable_init_mode && this.init_mode == 'edit_mode') {
      this.toEditMode();
    }
    this.createFooter();
  }

  createFooter() {
    let template = this.template_footer_buttons;
    @Component({
      template: template,
    })
    class DynamicFooterComponent {
      public current_page;
      public is_edit_mode;
      public record;
      constructor(
      ) {
      }
      init_params(parent) {
        this.current_page = parent;
        this.is_edit_mode = parent.is_edit_mode;
        this.record = parent.record;
      }
    }

    @NgModule({
      declarations: [
        DynamicFooterComponent,
      ],
      imports: [
        ComponentsModule,
        FormsModule,
        CommonModule,
        DirectivesModule,
      ]
    })
    class DynamicFooterModule {}

    let factory = this.commonProvider.form_footer_component_cache[this.template_footer_buttons];
    if (!factory) {
      factory = this.compiler.compileModuleAndAllComponentsSync(DynamicFooterModule)
      .componentFactories.find(comFac=>comFac.componentType===DynamicFooterComponent);
      this.commonProvider.form_footer_component_cache[this.template_footer_buttons] = factory;
    }
    this.container_footer.clear();
    let footer_component:any = this.container_footer.createComponent(factory);
    footer_component.instance.init_params(this);
    this.content.resize();
  }
}
