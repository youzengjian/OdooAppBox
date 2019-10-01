// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Injectable } from '@angular/core';
import { ToastController, LoadingController, Platform } from 'ionic-angular';
import { OdooError } from '../odoo/odoo.error';
import { TranslateService } from '@ngx-translate/core';

export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
export const PLACE_HOLDER_IMG_SRC = 'assets/imgs/placeholder.png';
export const NEWID_BEGIN_STR = 'newid_';
export const KANBAN_PAGE_NAME = 'kanban_page';
export const FORM_PAGE_NAME = 'form_page';
const TOAST_DURATION = 10000
// 网络超时20秒
export const ODOO_NETWORK_TIME_OUT = 20000;
// 超时强制关闭加载中窗口25秒
const FORCE_DISMISS_LOADING_TIME = 25000;

export class ExceptionActionDefinition {
  constructor(
    public throw_exception: boolean,
    public display_error_message: boolean,
    public value_when_exception: any,
  ) {
  }
}

@Injectable()
export class CommonProvider {
  private _toastError = null;
  private _errorMessages = [];
  private _timer_delay_dismiss_loading = null;
  private _timer_delay_display_loading = null;
  private _timerDismissToast = null;
  private _loading = null;
  private _errorMessagesTemp = [];
  private _timer_force_dismiss_loading = null;
  private t_last_err_msg = 0;
  public app_is_active = true;
  public kanban_component_cache = {};
  public form_component_cache = {};
  public form_footer_component_cache = {};
  constructor(
    private toastController: ToastController,
    private loadingController: LoadingController,
    private platform: Platform,
    private translate: TranslateService,
  ) {
    platform.pause.subscribe(() => {
      this.app_is_active = false;
    });
    platform.resume.subscribe(() => {
      this.app_is_active = true;
    });
  }

  public strReplaceAll(str, old_str, new_str){
    if (typeof(str) === "string") {
      var reg=new RegExp(old_str,"ig");
      return str.replace(reg, new_str);
    } else {
      return str;
    }
  }

  public isUndefined(value) {
    return (typeof(value) == "undefined");
  }

  public isNull(value) {
    return (!value && typeof(value)!="undefined" && value!=0)
  }

  public isString(value) {
    return (typeof(value) == "string");
  }

  public isNumber(value) {
    return (typeof(value) == "number");
  }

  public getFloat(val) {
    if (this.isNumber(val)) {
      return val;
    }

    if (this.isString(val)) {
      return parseFloat(val);
    }

    return 0;
  }

  public isPageKanban(page) {
    if (page && page.viewController) {
      return page.page_tyep_name == KANBAN_PAGE_NAME;
    } else {
      return false;
    }
  }

  //安卓APP
  get isAndroid() {
    return this.platform.is('cordova') && this.platform.is('android');
  }

  // 安卓手机
  get isSimulatedAndroidPhone() {
    return !this.platform.is('cordova') && this.platform.is('android') && !this.platform.is('tablet');
  }

  // chrome模拟安卓手机
  get isAndroidPhone() {
    return this.platform.is('cordova') && this.platform.is('android') && !this.platform.is('tablet');
  }

  // 安卓平板
  get isAndroidPad() {
    return this.platform.is('cordova') && this.platform.is('android') && this.platform.is('tablet');
  }

  //IOS APP
  get isIos() {
    return this.platform.is('cordova') && this.platform.is('ios');
  }

  // IPhone
  get isIPhone() {
    return this.platform.is('cordova') && this.platform.is('iphone');
  }

  // chrome模拟IPhone
  get isSimulatedIPhone() {
    return !this.platform.is('cordova') && this.platform.is('iphone');
  }

  // IPad
  get isIPad() {
    return this.platform.is('cordova') && this.platform.is('ipad');
  }

  public isPageForm(page) {
    if (page && page.viewController) {
      return page.page_tyep_name == FORM_PAGE_NAME;
    } else {
      return false;
    }
  }

  public equals(x, y) {
    if(!(x instanceof Object) || !(y instanceof Object)){
      return x===y;
    }
    if(Object.keys(x).length!==Object.keys(y).length){
      return false;
    }
    for(let key in x){
      if(x[key] instanceof Object && y[key] instanceof Object){
        if (!this.equals(x[key], y[key])) {
          return false;
        }
      }
      else if(x[key]!==y[key]){
        return false;
      }
    }
    return true;
  }

  deepClone(obj): any {
    let objClone = Array.isArray(obj)?[]:{};
    if(obj && typeof(obj)==="object"){
      for(let key in obj){
        if(obj.hasOwnProperty(key)){
          //判断ojb子元素是否为对象，如果是，递归复制
          if(obj[key]&&typeof(obj[key]) ==="object"){
            objClone[key] = this.deepClone(obj[key]);
          }else{
            //如果不是，简单复制
            objClone[key] = obj[key];
          }
        }
      }
    }
    return objClone;
  }

  public parseMany2oneId(val) {
    let val_id = val;
    if (val instanceof Array) {
      if (val.length) {
        val_id = val[0];
      } else {
        val_id = false;
      }
    } else if (typeof(val) == 'number'){
      val_id = val;
    } else {
      val_id = false;
    }
    return val_id;
  }

  public parseMany2oneName(val) {
    if (val instanceof Array && val.length === 2) {
      return val[1];
    }
    return '';
  }

  public convertX2manyToWrite(val) {
    let x2many_val = [];
    if (!val) {
      return x2many_val;
    }
    let val_temp = this.deepClone(val);
    val_temp.forEach(val_item => {
      if (val_item instanceof Array) {
        if (val_item.length === 3 && typeof(val_item[2]) === 'object') {
          delete val_item[2]['fieldsDefinition'];
        }
        x2many_val.push(val_item);
      } else if(typeof(val_item) === 'number'){
        x2many_val.push([4, val_item, false]);
      } else {
        console.log('warning: convert x2many value error!')
      }
    });
    return x2many_val;
  }

  public convertRecordForWrite(record, exculde_readonly) {
    let record_new = this.deepClone(record);
    let fieldsDefinition = record_new.fieldsDefinition;
    let field_list = [];
    for (let field_name in fieldsDefinition) {
      let field_definition = fieldsDefinition[field_name];
      if (exculde_readonly && field_definition && field_definition.real_readonly) {
        continue;
      }
      field_list.push(field_name);
      let field_type = field_definition && field_definition.type.toLowerCase() || 'unknown';
      if ('many2one' === field_type) {
        record_new[field_name] = this.parseMany2oneId(record_new[field_name]);
      } else if ('one2many' === field_type || 'many2many' === field_type) {
        record_new[field_name] = this.convertX2manyToWrite(record_new[field_name]);
      } else {
        // 其他类型字段不用处理
      }
    }

    // 删除所有不在字段定义列表中的字段值
    for (let field_name in record_new) {
      if (field_list.indexOf(field_name) === -1) {
        delete record_new[field_name];
      }
    }
    return record_new;
  }

  public getRecordDiffForWrite(record_old, record_new, exculde_readonly) {
    let record_diff_for_write = {};
    let fieldsDefinition = record_new.fieldsDefinition;
    let record_old_copy = this.deepClone(record_old);
    let record_new_copy = this.deepClone(record_new);
    for (let field_name in record_new_copy) {
      let val_new = record_new_copy[field_name];
      let val_old = record_old_copy[field_name];
      let field_definition = fieldsDefinition[field_name];
      if (exculde_readonly && field_definition && field_definition.real_readonly) {
        continue;
      }
      let field_type = field_definition && field_definition.type.toLowerCase() || 'unknown';
      if ('many2one' === field_type) {
        let val_new_id = this.parseMany2oneId(val_new);
        let val_old_id = this.parseMany2oneId(val_old);
        if (val_new_id != val_old_id) {
          record_diff_for_write[field_name] = val_new_id;
        }
      } else if ('one2many' === field_type || 'many2many' === field_type) {
        let x2many_for_write_old = this.convertX2manyToWrite(val_old);
        let x2many_for_write_new = this.convertX2manyToWrite(val_new);
        if (!this.equals(x2many_for_write_old, x2many_for_write_new)) {
          record_diff_for_write[field_name] = x2many_for_write_new;
        }
      } else if (!this.equals(val_new, val_old)) {
        record_diff_for_write[field_name] = val_new;
      }
    }
    // 删除字段定义信息
    delete record_diff_for_write['fieldsDefinition'];
    return record_diff_for_write;
  }

  generateNewRecordId() {
    return NEWID_BEGIN_STR + new Date().getTime();
  }

  isNewRecordId(record_id) {
    return (typeof(record_id) == 'string' && record_id.indexOf(NEWID_BEGIN_STR) == 0)
  }

  private clearErrorMessage() {
    this._errorMessages = [];
    if (this._toastError) {
      try {
        this._toastError.dismissAll();
      } catch {
        // do nothing;
      }
      this._toastError = null;
    }
  }

  addErrorMessage(errorMessage, enable_repetition=false) {
    let timeNow = new Date().getTime();
    for(let i=0; i < this._errorMessages.length; i++) {
      let item = this._errorMessages[i];
      if (timeNow - item.timeBegin > TOAST_DURATION) {
        this._errorMessages.splice(i, 1);
        i--;
      }
    }

    let exist = false;
    this._errorMessages.forEach((item) => {
      if (item.message == errorMessage) {
        exist = true;
      }
    })

    if (!enable_repetition && exist) {
      return false;
    } else {
      this._errorMessages.push({'message': errorMessage, 'timeBegin': timeNow});
      return true;
    }
  }

  getErrorMessage() {
    let timeNow = new Date().getTime();
    let messageList = [];
    let errorMessages = this.deepClone(this._errorMessages);
    errorMessages.forEach((item) => {
      if (timeNow - item.timeBegin < TOAST_DURATION) {
        messageList.push(item.message);
      }
    })
    return messageList.join('\n');
  }

  displayErrorMessage(errorMessage, dismisLoading: boolean, enable_repetition=false) {
    if (this._loading) {
      this._errorMessagesTemp.push(errorMessage);
      if (dismisLoading) {
        this.dismissLoading();
      }
      return;
    }

    if (!this.addErrorMessage(errorMessage, enable_repetition)) {
      return;
    }

    let message = this.getErrorMessage();
    if (!message) {
      return;
    }

    if (this._toastError) {
      this._toastError.setMessage(message);
    } else {
      this._toastError = this.toastController.create({
        message: message,
        position: 'bottom',
        showCloseButton: true,
        closeButtonText: 'x',
        // 禁用页面变更时关闭，避免从一个页面切换到另一个页面的过程中的信息在页面切换完成后马上被关闭的情况
        // 后续在页面切换过程中根据需要调用hideErrorMessage方法，手动进行处理
        // dismissOnPageChange: true,
      });
      this._toastError.present();
      this._toastError.onWillDismiss(() => {
        this._errorMessages = [];
        this._toastError = null;
      })
    }
    
    if (this._timerDismissToast) {
      clearTimeout(this._timerDismissToast);
      this._timerDismissToast = null;
    }
    this._timerDismissToast = setTimeout(() => {
      this.clearErrorMessage();
    }, TOAST_DURATION);
  }

  displayLoading(content=this.translate.instant("Loading..."), delay=100) {
    if (!this._loading) {
      this._loading = this.loadingController.create({
        spinner: 'crescent',
        cssClass: 'global-loading',
        content: content,
        showBackdrop: true,
        enableBackdropDismiss: false,
        dismissOnPageChange: false,
      });
      this._loading.present();
      
      this._timer_delay_display_loading = setTimeout(() => {
        var x = document.getElementsByClassName("global-loading");
        for (let i = 0; i < x.length; i++) {
          x[i].classList.add('display');
        }
      }, delay);
    } else {
      this._loading.setContent(content);
    }
    this.setupForceDismissLoading();
  }

  setupForceDismissLoading() {
    if (this._timer_force_dismiss_loading) {
      clearTimeout(this._timer_force_dismiss_loading);
    }
    this._timer_force_dismiss_loading = setTimeout( () => this.dismissLoading(), FORCE_DISMISS_LOADING_TIME);
  }

  dismissLoading(delay=10) {
    if (this._timer_delay_dismiss_loading) {
      clearTimeout(this._timer_delay_dismiss_loading);
      this._timer_delay_dismiss_loading = null;
    }
    this.setupForceDismissLoading();
    this._timer_delay_dismiss_loading = setTimeout(() => {
      if (this._loading) {
        if (this._timer_delay_display_loading) {
          clearTimeout(this._timer_delay_display_loading);
          this._timer_delay_display_loading = null;
        }
        try {
          this._loading.dismissAll();
        } catch {
          // do nothing;
        }
        this._loading = null;
        let errorMessagesTemp = this._errorMessagesTemp;
        this._errorMessagesTemp = [];
        for (let i = 0; i < errorMessagesTemp.length; i++) {
          this.displayErrorMessage(errorMessagesTemp[i], false);
        }
      }
    }, delay);
  }

  private getCompatibleValue(field_value, field_type) {
    if (field_type == 'many2one') {
      return this.parseMany2oneId(field_value);
    }
    return field_value;
  }

  public getFieldValue_throw(field_name, record) {
    if (field_name === 'active_id') {
      return this.isNewRecordId(record.id)?false:record.id;
    }
    let field_path = field_name.split('.');
    let success = false;
    let fieldName = field_path[0];
    let record_temp = record;
    for (let i = 0, len = field_path.length; i < len; i++) {
      fieldName = field_path[i];
      if (fieldName === 'parent' && record_temp.parent) {
        record_temp = record_temp.parent;
      } else if (fieldName !== 'parent' && i === (len - 1) 
                && Object.keys(record_temp).indexOf(fieldName) != -1
                && Object.keys(record_temp.fieldsDefinition).indexOf(fieldName) != -1){
        success = true;
      }
    }
    if (success) {
      let field_type = record_temp.fieldsDefinition[fieldName].type.toLowerCase();
      return this.getCompatibleValue(record_temp[fieldName], field_type);
    } else {
      let msg_field_not_define = this.translate.instant("This field is not define:");
      throw new OdooError(this.translate, `${msg_field_not_define}${field_name}`);;
    }
  }

  public do_exception_action(error: any, exception_action: ExceptionActionDefinition) {
    if (exception_action.display_error_message) {
      this.displayErrorMessage(error.message, false);
    }
    if (exception_action.throw_exception) {
      throw error;
    }
    return exception_action.value_when_exception;
  }

  compute_context(str_context, record, exception_action: ExceptionActionDefinition) {
    if (str_context) {
      let context = {};
      try{
        this.parseJsonStr_throw(str_context, (k, v) => {
          if (!k) {
            // do nothing，避免解析结果出现key为空字符串的值
          } else if(typeof(v) === 'string' && v.startsWith('record.')) {
            context[k] = this.getFieldValue_throw(v.slice('record.'.length), record);
          } else {
            context[k] = v;
          }
        });
      } catch(error) {
        let str_tmp = this.strReplaceAll(str_context, 'record.', '')
        error.message = this.translate.instant("Parse context expression failed:") + str_tmp;
        return this.do_exception_action(error, exception_action);
      }
      return context;
    } else {
      return {};
    }
  }

  get_options(str_options, exception_action: ExceptionActionDefinition) {
    if (str_options && typeof(str_options) === 'string') {
      // 先做一个预处理，避免报json格式不正确的错误
      str_options = this.strReplaceAll(str_options, "'", '"');
      str_options = this.strReplaceAll(str_options, "\\(", '\[');
      str_options = this.strReplaceAll(str_options, "\\)", '\]');
      str_options = this.strReplaceAll(str_options, "none", "null");
      str_options = this.strReplaceAll(str_options, 'true', 'true');
      str_options = this.strReplaceAll(str_options, 'false', 'false');
      try {
        return this.parseJsonStr_throw(str_options);
      } catch(error) {
        error.message = this.translate.instant("Parse options expression failed:") + str_options;
        return this.do_exception_action(error, exception_action);
      }      
    } else {
      return {};
    }
  }

  convertToInt(str, default_value) {
    if (typeof(str) === 'number') {
      return str;
    } else if (typeof(str) === 'string') {
      let value = parseInt(str);
      if (isNaN(value)) {
        return default_value;
      } else {
        return value;
      }
    } else {
      return default_value;
    }
  }

  parseJsonStr_throw(text, reviver=null) {
    try {
      if (typeof(text) === "string") {
        return JSON.parse(text, reviver);
      } else {
        return text;
      }
    } catch {
      throw new OdooError(this.translate, this.translate.instant("Parse json expression failed:") + text);
    }
  }
}
