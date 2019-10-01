// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Headers } from '@angular/http';
import { OdooError } from './odoo.error';
import 'rxjs/add/operator/map';
import { CommonProvider, ExceptionActionDefinition } from '../common/common';
import { DomainProvider } from './domain';
import { TranslateService } from '@ngx-translate/core';
import { AlertController } from 'ionic-angular';
import { HttpProvider } from '../http/http';
export interface AccessRights {
  read: boolean,
  write: boolean,
  create: boolean,
  unlink: boolean,
}

const LANG_CODE_MAPPING = {
  'ar_SY': ['ar', 'Arabic'],
  'id_ID': ['id', 'Indonesian'],
  'nl_NL': ['nl', 'Dutch'],
  'fr_CA': ['fr-ca', 'French (Canada)'],
  'pl_PL': ['pl', 'Polish'],
  'zh_TW': ['zh-tw', 'Chinese (Traditional)'],
  'sv_SE': ['sv', 'Swedish'],
  'ko_KR': ['ko', 'Korean'],
  'pt_PT': ['pt', 'Portuguese (Europe)'],
  'en_US': ['en', 'English'],
  'ja_JP': ['ja', 'Japanese'],
  'es_ES': ['es', 'Spanish (Spain)'],
  'zh_CN': ['zh', 'Chinese (Simplified)'],
  'de_DE': ['de', 'German'],
  'fr_FR': ['fr', 'French'],
  'fr_BE': ['fr', 'French'],
  'ru_RU': ['ru', 'Russian'],
  'it_IT': ['it', 'Italian'],
  'pt_BR': ['pt-br', 'Portuguese (Brazil)'],
  'th_TH': ['th', 'Thai'],
  'nb_NO': ['no', 'Norwegian'],
  'ro_RO': ['ro', 'Romanian'],
  'tr_TR': ['tr', 'Turkish'],
  'bg_BG': ['bg', 'Bulgarian'],
  'da_DK': ['da', 'Danish'],
  'en_GB': ['en-gb', 'English (British)'],
  'el_GR': ['el', 'Greek'],
  'vi_VN': ['vi', 'Vietnamese'],
  'he_IL': ['he', 'Hebrew'],
  'hu_HU': ['hu', 'Hungarian'],
  'fi_FI': ['fi', 'Finnish']
}

@Injectable()
export class OdooProvider {
  private _host: string;
  private _db: string;
  private _session_id: string;
  private _session_info;
  private _has_login: boolean;
  private _lang: string;
  private _menu_list = [];
  private _active_root_menu = null;
  private _active_sub_menu = null;
  private _observer_list_update_menu = [];
  private _currencies = {};
  private _currencies_caching = {};
  constructor(
    private http: HttpProvider,
    private commonProvider: CommonProvider,
    private domainProvider: DomainProvider,
    private translate: TranslateService,
    private alertController: AlertController,
  ) {
    this._host = window.localStorage.getItem('host');
    this._db = window.localStorage.getItem('db');
    this._session_id = window.localStorage.getItem('session_id');
    this._has_login = window.localStorage.getItem('has_login')=='true';
    this._lang = window.localStorage.getItem('language') || this.translate.getBrowserLang();
    this.translate.setDefaultLang(this.lang);
  }

  private postJsonRequest(path: string, params?: Object): Observable<any> {
    let body = JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: params,
    });
    let headers = new Headers({
      'Content-Type': 'application/json',
      "X-Openerp-Session-Id": this.session_id,
    });
    return this.http.post(this.host + path, body, {headers: headers});
  }

  public logout() {
    return this.postJsonRequest('/web/session/destroy/');
  }

  public change_password(old_pwd, new_password, confirm_pwd) {
    let params = {'fields': [{'name': 'old_pwd', 'value': old_pwd}, 
      {'name': 'new_password', 'value': new_password},
      {'name': 'confirm_pwd', 'value': confirm_pwd},]}
    return this.postJsonRequest('/web/session/change_password', params);
  }


  getItemValue(key) {
    return window.localStorage.getItem(key);
  }

  get session_init_ok() {
    return this.uid && this._session_info.appbox_addon_version;
  }

  set host(host: string){
    this._host = host;
    let reg=new RegExp('(/+$)',"ig");
    this._host = host.replace(reg, '');
    window.localStorage.setItem('host', this._host);
  }

  get host() {
    return this._host;
  }

  set db(db: string){
    this._db = db;
    window.localStorage.setItem('db', db);
  }

  get db() {
    return this._db;
  }
  
  set session_id(session_id: string){
    this._session_id = session_id;
    window.localStorage.setItem('session_id', session_id || '');
  }

  get session_id() {
    return this._session_id || '';
  }

  set has_login(has_login: boolean){
    if (has_login) {
      this.update_menu_list();
    }
    this._has_login = has_login;
    window.localStorage.setItem('has_login', has_login?'true':'false');
  }

  get has_login() {
    return this._has_login;
  }

  // 根据传入的lang判断，lang对应的语言是否支持，如果支持则返回原值，不支持则返回'en'表示采用英文
  get_real_lang(lang) {
    if (['en', 'zh'].indexOf(lang) !== -1) {
      return lang;
    } else {
      return 'en';
    }
  }

  set lang(val) {
    window.localStorage.setItem('language', val);
    if (this.get_real_lang(this._lang) === this.get_real_lang(val)) {
      return;
    }

    let confirm = this.alertController.create({
      title: this.translate.instant("Prompt"),
      message: this.translate.instant("Your language Settings have changed. Do you want to restart immediately to switch languages?"),
      enableBackdropDismiss: false,
      buttons: [{
          text: this.translate.instant("Cancel"),
          handler: () => {}
        },{
          text: this.translate.instant("Confirm"),
          handler: () => {
            window.location.reload();
          }
        }]
    });
    confirm.present();
  }

  get lang() {
    return this.get_real_lang(this._lang);
  }

  set session_info(session_info) {
    this._session_info = session_info;
    this.db = session_info.db;
    this.session_id = session_info.session_id;
    let lang = session_info.user_context && session_info.user_context.lang;
    if (LANG_CODE_MAPPING[lang]) {
      lang = LANG_CODE_MAPPING[lang][0];
    } else {
      lang = this.translate.getBrowserLang();
    }
    this.lang = lang;
  }

  get session_info() {
    return this._session_info;
  }

  get user_context() {
    if(this._session_info) {
      return this._session_info.user_context;
    } else {
      return {};
    }
  }

  get uid():number {
    if(this._session_info) {
      if (this.commonProvider.isString(this._session_info.uid)) {
        return parseInt(this._session_info.uid);
      } else {
        return this._session_info.uid;
      }
    } else {
      return 0;
    }
  }

  get username() {
    if(this._session_info) {
      return this._session_info.username;
    } else {
      return "";
    }
  }

  get user_displayname() {
    if(this._session_info) {
      return this._session_info.user_displayname;
    } else {
      return "";
    }
  }

  get company_displayname() {
    if(this._session_info) {
      return this._session_info.company_displayname;
    } else {
      return "";
    }
  }

  get groups() {
    if (this._session_info) {
      return this._session_info.groups;
    } else {
      return []
    }
  }

  get time_offset_hours() {
    let regex = /^([+-])(\d\d)(\d\d)$/;
    let res = regex.exec(this._session_info.tz_offset);
    if (!res) {
      return 0;
    }
    return parseInt(res[1] + res[2]);
  }

  get time_offset_minutes() {
    let regex = /^([+-])(\d\d)(\d\d)$/;
    let res = regex.exec(this._session_info.tz_offset);
    if (!res) {
      return 0;
    }
    return parseInt(res[1] + res[3]);
  }

  get time_offset_str() {
    let regex = /^([+-])(\d\d)(\d\d)$/;
    let res = regex.exec(this._session_info.tz_offset);
    if (!res) {
      return 0;
    }
    return res[1] + res[2] + ':' + res[3];
  }

  get_menu_list(forceUpdate=false): Observable<any[]>{
    // 增加判断user_context，避免用户未登陆的情况就获取用户菜单和不必要的重复执行菜单获取
    if (this.user_context && (forceUpdate || !this._menu_list.length)) {
      this._menu_list = [];
      this.update_menu_list();
    }
    return new Observable((observer) => {
      if (this._menu_list.length) {
        observer.next(this._menu_list);
      } else {
        this._observer_list_update_menu.push(observer);
      }
    })
  }

  get menu_list() {
    return this._menu_list;
  }

  get_menus(parent_id): any[] {
    let menus = [];
    for(let menu_item of this._menu_list) {
      if(menu_item.parent_id == parent_id) {
        menus.push(menu_item);
      }
    }
    return menus.sort((a, b) => a.sequence - b.sequence );
  }

  get_default_menu() {
    return {root_menu: null, sub_menu: null};
  }

  set active_root_menu(active_root_menu) {
    this._active_root_menu = active_root_menu;
  }

  get active_root_menu() {
    if (!this._active_root_menu) {
      // 如果没有选中任何根菜单，设置第一个根菜单为默认选中的菜单，避免用户登陆后菜单未选中导致二级、三级菜单列表为空，提高用户体验
      let root_menus = this.get_menus(false);
      if (root_menus.length) {
        this._active_root_menu = root_menus[0];
      }
    }
    return this._active_root_menu;
  }

  set active_sub_menu(active_sub_menu) {
    this._active_sub_menu = active_sub_menu;
  }

  get active_sub_menu() {
    return this._active_sub_menu;
  }

  private notify_menu_list() {
    this._observer_list_update_menu.forEach((observer, index) => {
      observer.next(this._menu_list);
    });
  }

  private update_menu_list() {
    let context = this.user_context;

    let menu_about = {
      action: 'about',
      icon: "fa-info",
      id: -1,
      name: this.translate.instant("About"),
      parent_id: false,
      sequence: 10000,
    };

    this.call('app.menu', 'get_user_menu_list', [], {context: context}).subscribe(
      res => {
        this._menu_list = res;
        // You must keep this menu("About").
        this._menu_list.push(menu_about);
        this.notify_menu_list();
      }, error => {
        this._menu_list = [];
        // You must keep this menu("About").
        this._menu_list.push(menu_about);
        this.notify_menu_list();
      }
    )
  }

  arrayBufferToBase64(buffer) {
    let binary = '';
    let bytes = new Uint8Array( buffer );
    let len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return window.btoa( binary );
  }

  private appbox_get_session_info(observer) {
    this.postJsonRequest('/appbox/get_session_info').subscribe(
      (res) => {
        for(let key in res) {
          this.session_info[key] = res[key];
        }
        this.has_login = true;
        return observer.next(res);
      },
      error => {
        return observer.error(new OdooError(this.translate, this.translate.instant("Unknown error")));
      }
    );
  }

  public getSessionInfo() {
    return new Observable((observer) => {
      this.postJsonRequest('/web/session/get_session_info').subscribe(
        (res) => {
          if (res && res.uid) {
            this.session_info = res;
            return this.appbox_get_session_info(observer);
          } else {
            return observer.error(new OdooError(this.translate, this.translate.instant("Unknown error")));
          }
        },
        () => {
          return observer.error(new OdooError(this.translate, this.translate.instant("Unknown error")));
        }
      );
    });
  }

  public login(username: string, password: string): Observable<any> {
    let params: object;
    params = {
      db: this.db,
      login : username,
      password : password
    };

    return new Observable((observer) => {
      this.postJsonRequest('/web/session/authenticate', params).subscribe(
        (res) => {
          if (res && res.uid) {
            this.session_info = res;
            return this.appbox_get_session_info(observer);
          } else {
            return observer.error(new OdooError(this.translate, this.translate.instant("Unknown error")));
          }
        },
        error => {
          return observer.error(new OdooError(this.translate, this.translate.instant("Unknown error")));
        }
      );
    });
  }

  public call(model: string, method: string, args: any, kwargs) {
    let params = {
        model: model,
        method: method,
        args: args,
        kwargs: kwargs,
    };
    return this.postJsonRequest("/web/dataset/call_kw/" + model + '/' + method, params);
  }

  public exec_workflow(model: string, id: string, signal: string) {
    let params = {
        model: model,
        id: id,
        signal: signal,
    };
    return this.postJsonRequest("/web/dataset/exec_workflow", params);
  }

  public jsonrpc(service: string, method: string, args: any) {
    let params = {
        service: service,
        method: method,
        args: args,
    };
    return this.postJsonRequest("/jsonrpc", params);
  }

  public get_access_rights(model_list: Array<string>) {
    let params = {
      model_list: model_list,
    };
    return this.postJsonRequest("/appbox/get_access_rights", params);
  }

  public send_signup_token(db, mobile) {
    let params = {
      db: db,
      mobile: mobile,
    };
    return this.postJsonRequest("/appbox/send_signup_token", params);
  }

  public appbox_signup(db, mobile, name, token, password) {
    let params = {
      db: db,
      mobile: mobile,
      name: name,
      token: token,
      password: password
    };
    return this.postJsonRequest("/appbox/signup", params);
  }

  // 合并context_list中的context，如果context出现相同的上下文key，则后面的覆盖前面的
  public mergeContext(context_list) {
    let merged_context = {}
    context_list.forEach(context_item => {
      for(let key in context_item) {
        merged_context[key] = context_item[key];
      }
    });
    return merged_context;
  }

  public parseContext(str_context, active_id, exception_action: ExceptionActionDefinition) {
    if (typeof(str_context) === "string") {
      try {
        str_context = this.commonProvider.strReplaceAll(str_context, "'", '"');
        // 以下两行保证各种形式的true和false都会被转换为全小写的格式
        str_context = this.commonProvider.strReplaceAll(str_context, "true", "true");
        str_context = this.commonProvider.strReplaceAll(str_context, "false", "false");
        let reg=new RegExp('([ ,:\[])(uid)',"ig");
        str_context = str_context.replace(reg, `$1 ${this.uid}`);
        reg=new RegExp('([ ,:\[])(active_id)',"ig");
        str_context = str_context.replace(reg, `$1 ${active_id}`);
        return this.commonProvider.parseJsonStr_throw(str_context);        
      } catch(error) {
        this.commonProvider.do_exception_action(error, exception_action);
      }
    } else if(str_context instanceof Object) {
      // 兼容后台直接返回的dict格式的数据，而不是字符串
      return str_context;
    } else {
      return {};
    }
  }

  get_currency_from_chche(currency_id, observer) {
    if (this._currencies_caching[currency_id]) {
      setTimeout(() => {
        this.get_currency_from_chche(currency_id, observer);
      }, 50);
    } else {
      if (this._currencies[currency_id]) {
        observer.next(this._currencies[currency_id]);
      } else {
        
        observer.error(new OdooError(this.translate, this.translate.instant("Get currency config failed!")));
      }      
    }
  }

  get_currency(currency_id): Observable<any>{
    return new Observable((observer) => {
      if (this._currencies[currency_id]) {
        observer.next(this._currencies[currency_id]);
      }
      else if (this._currencies_caching[currency_id]) {
        this.get_currency_from_chche(currency_id, observer);
      } else {
        // 8.0版本小数精度字段：accuracy
        // 11.0版本小数精度字段：decimal_places
        this._currencies_caching[currency_id] = true;
        this.call('res.currency', 'read', [[currency_id], ['accuracy', 'decimal_places', 'symbol', 'position']], {context: this.user_context}).subscribe((res) => {
          this._currencies[currency_id] = res[0];
          this._currencies_caching[currency_id] = false;
          observer.next(this._currencies[currency_id]);
        }, error => {
          this._currencies_caching[currency_id] = false;
          observer.error(error);
        })
      }
    })
  }

  get_img_url(model, id, field, width, height) {
    let url = this.host + '/web/binary/image?model=' + model + '&id=' + id + '&field=' + field;
    if (width && height) {
      url += "&resize=" + width + ',' + height;
    }
    return url;
  }


  getFieldDisplayOption(field_component, option_name, exception_action: ExceptionActionDefinition) {
    let attrs = field_component.attrs;
    if (Object.keys(attrs).indexOf(option_name) !== -1) {
      return this.domainProvider.compute(attrs[option_name], field_component.record, exception_action);
    }

    let field_definition = field_component.field_definition;
    let states = field_component.field_definition.states;
    let record_state = field_component.record.state;
    let result = field_definition[option_name] || false;
    if (!states || !Object.keys(states).length) {
      return result;
    }

    if (this.commonProvider.isUndefined(record_state)) {
      if (exception_action.display_error_message) {
        this.commonProvider.displayErrorMessage(field_component.record.res_model + '.state' + this.translate.instant(" field is not define."), false);
      }
      return result;
    }

    if(states[record_state]) {
      states[record_state].forEach(item => {
        if(item[0] == option_name) {
          result = item[1];
        }
      });
    }
    return result;
  }

  isFieldRequired(field_component, exception_action: ExceptionActionDefinition) {
    return this.getFieldDisplayOption(field_component, 'required', exception_action);
  }

  isFieldReadonly(field_component, exception_action: ExceptionActionDefinition) {
    return this.getFieldDisplayOption(field_component, 'readonly', exception_action);
  }

  isFieldInvisible(field_component, exception_action: ExceptionActionDefinition) {
    return this.getFieldDisplayOption(field_component, 'invisible', exception_action);
  }

  isFieldNoLabel(field_component, exception_action: ExceptionActionDefinition) {
    let attrs = field_component.attrs;
    let attr_name = 'nolabel';
    if (Object.keys(attrs).indexOf(attr_name) !== -1) {
      return this.domainProvider.compute(attrs[attr_name], field_component.record, exception_action);
    } else if (field_component.record_component_type === 'kanban') {
      return true;
    }
    return false;
  }
}
