// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Component, ViewChild, ViewChildren, OnDestroy, Input } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, ViewController } from 'ionic-angular';
import { OdooProvider } from '../../providers/odoo/odoo';
import { Content } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { AppViewProvider, DEFAULT_KANBAN_TEMPLATE } from '../../providers/app-view/app-view';
import { CommonProvider, ExceptionActionDefinition, KANBAN_PAGE_NAME } from '../../providers/common/common';
import { DomainProvider } from '../../providers/odoo/domain';
import { OdooError } from '../../providers/odoo/odoo.error';
import { TranslateService } from '@ngx-translate/core';

const RECORDS_AMOUNT_PER_PAGE = 10
const SEARCH_DEFAULT_FLAG = 'search_default_';
@IonicPage()
@Component({
  selector: 'page-kanban',
  templateUrl: 'kanban.html',
})
export class KanbanPage {
  public src_page;
  public src_component;
  public is_edit_mode = false;
  private action_name;
  private action_res_model;
  private action_view_kanban;
  public action_view_form;
  public action_view_search;
  // action_domain为动作上定义的domain，不可修改
  private action_domain;
  private action_context;
  private action_options = {};
  private fieldListBinary;
  private fieldListExceptBinary;
  public fieldsDefinition;
  private _search_list_old = [];
  private _filter_group_list_old = [];
  public search_list = [];
  public filter_group_list = [];
  public template;
  public records = [];
  public no_more_data = false;
  public display_search = false;
  private prev_search_value = '';
  public search_value = '';
  public page_tyep_name = KANBAN_PAGE_NAME;
  public page_uuid = '';
  private prevPageTitle;
  private search_param_init_ok = false;
  private view_template_init_ok = false;
  private _need_reload = false;
  public model_access_rights = {};
  @ViewChild(Content) content: Content;
  @ViewChild('searchInput') searchInput;
  @ViewChildren('kanbanComponent') children_kanban;//子组件实例引用
  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    private odooProvider: OdooProvider,
    private alertController: AlertController,
    private viewController: ViewController,
    private appViewProvider: AppViewProvider,
    private commonProvider: CommonProvider,
    private domainProvider: DomainProvider,
    private translate: TranslateService,
  ) {
    this.src_page = this.navParams.get('src_page');
    this.src_component = this.navParams.get('src_component');
    this.action_res_model = this.navParams.get('action_res_model');
    this.action_name = this.navParams.get('action_name');
    this.action_view_kanban = this.navParams.get('action_view_kanban');
    this.action_view_form = this.navParams.get('action_view_form');
    this.action_view_search = this.navParams.get('action_view_search');
    this.action_domain = this.navParams.get('action_domain');
    this.action_context = this.navParams.get('action_context');
    this.action_options = this.navParams.get('action_options') || {};
    this.page_uuid = 'kanbanpage_' + new Date().getTime() + Math.random();
    if (!this.action_res_model) {
      this.navCtrl.setRoot('HomePage');
      return;
    }
    this.loadRecords();
    let prevPage = this.navCtrl.getActive();
    if (prevPage) {
      this.prevPageTitle = prevPage.instance.title;
    }
  }

  ionViewWillEnter() {
    if (this._need_reload) {
      this._need_reload = false;
      this.loadRecords(null, true);
    }
  }

  ionViewDidLoad() {
    this.viewController.setBackButtonText(this.prevPageTitle);
  }

  parseSearchDefault() {
    this.search_list.forEach(search_item => {
      search_item.values = [];
    });
    for(let context_key in this.action_context) {
      if(!context_key.startsWith(SEARCH_DEFAULT_FLAG)){
        continue;
      }
      let search_default_key = context_key.substring(SEARCH_DEFAULT_FLAG.length);
      let search_default_value = this.action_context[context_key];
      this.search_list.forEach(search_item => {
        if (search_item.name == search_default_key) {
          search_item.values = [search_default_value];
        }
      });
    }
  }

  parseFilterDefault() {
    this.filter_group_list.forEach(filter_group_item => {
      filter_group_item.filter_list.forEach(filter_item => {
        let active = false;
        for(let context_key in this.action_context) {
          if(!context_key.startsWith(SEARCH_DEFAULT_FLAG) || !this.action_context[context_key]){
            continue;
          }
          let filter_default_key = context_key.substring(SEARCH_DEFAULT_FLAG.length);
          if(filter_item.name != filter_default_key) {
            continue;
          }
          active = true;
        }
        filter_item.active = active;
      });
    });
  }

  get title() {
    let str_search = this.translate.instant("Search");
    return (this.display_search?str_search:'') + (this.action_name || this.action_res_model);
  }

  get current_page() {
    return this;
  }
  
  get has_right_read() {
    if (this.model_access_rights.hasOwnProperty(this.action_res_model)) {
      return this.model_access_rights[this.action_res_model].read;
    } else {
      return false;
    }
  }

  get has_right_write() {
    if (this.model_access_rights.hasOwnProperty(this.action_res_model)) {
      return this.model_access_rights[this.action_res_model].write;
    } else {
      return false;
    }
  }

  get has_right_create() {
    if (this.model_access_rights.hasOwnProperty(this.action_res_model)) {
      return this.model_access_rights[this.action_res_model].create;
    } else {
      return false;
    }
  }

  get has_right_unlink() {
    if (this.model_access_rights.hasOwnProperty(this.action_res_model)) {
      return this.model_access_rights[this.action_res_model].unlink;
    } else {
      return false;
    }
  }

  get enable_create_record() {
    if (this.has_right_create) {
      if (this.action_options.hasOwnProperty('no_create') && this.action_options['no_create']) {
        return false;
      } else if (this.src_component && this.src_component.no_create) {
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  }

  get enable_unlink_record() {
    if (this.has_right_unlink) {
      if (this.action_options.hasOwnProperty('no_delete') && this.action_options['no_delete']) {
        return false;
      } else if (this.src_component && this.src_component.no_delete) {
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  }

  // active_domain_group_list为通过search_default_xxx定义和用户手动选择或输入形成的domain
  get active_domain_group_list() {
    let result = []
    this.filter_group_list.forEach(filter_group_item => {
      let domain_list = [];
      filter_group_item.filter_list.forEach(filter_item => {
        if (filter_item.active) {
          domain_list.push({'string': filter_item.string, 'domain': filter_item.domain});
        }
      });
      if (domain_list.length > 0) {
        result.push({'type': 'filter', 'item': filter_group_item, 'index': filter_group_item.index, 'string': filter_group_item.string, 'context': filter_group_item.context, 'domain_list': domain_list});
      }
    });

    this.search_list.forEach(search_item => {
      let domain_list = [];
      let search_values = search_item.values || []
      search_values.forEach(value => {
        let domain = this.domainProvider.parseSearchDomainTemplate(search_item.domain, 'self', value);
        domain_list.push({'string': value, 'domain': domain});
      });
      if (domain_list.length > 0) {
        result.push({'type': 'search', 'item': search_item, 'string': search_item.string, 'context': search_item.context, 'domain_list': domain_list});
      }
    });
    return result;
  }

  get active_search_list() {
    let result = [];
    this.search_list.forEach(search_item => {
      let search_values = search_item.values || [];
      if(search_values.length > 0){
        result.push(search_item);
      }
    });
    return result;
  }

  removeSearchValue(search_item, search_value) {
    let index = search_item.values.indexOf(search_value);
    if (index != -1) {
      search_item.values.splice(index, 1);
    }

  }

  get search_domain()
  {
    let domain = this.commonProvider.deepClone(this.action_domain);
    let exception_action = new ExceptionActionDefinition(true, true, []);
    try {
      this.active_domain_group_list.forEach((active_domain_group_item) => {
        let domain_by_group = [];
        active_domain_group_item.domain_list.forEach(domain_item => {
          domain_by_group = this.domainProvider.combineDomain(domain_by_group, domain_item.domain, '|', exception_action);
        });
        domain = this.domainProvider.combineDomain(domain, domain_by_group, '&', exception_action);
      });
    } catch {
      // domain计算异常，则用默认的this.action_domain
      domain = this.commonProvider.deepClone(this.action_domain);
    }
    return domain;
  }

  get_search_param() {
    return new Observable((observer) => {
      let domain = [['res_model', '=', this.action_res_model], ['type', '=', 'search']];
      if (this.action_view_search) {
        domain.push(['id', '=', this.action_view_search]);
      } else {
        domain.push(['inherit_id', '=', null]);
      }
      let context = this.odooProvider.mergeContext([this.odooProvider.user_context, this.action_context]);
      this.odooProvider.call('app.view', 'search_read', [domain, ['arch'], 0, 1, null], {context: context}).subscribe(
        res => {
          let default_search_list = [{'name': 'name', 'string': 'name', 'context': null, 'domain': [['name', 'ilike', 'self']]}];
          if (res.error) {
            let err_msg = (res.error.data && res.error.data.message) || res.error.message;
            let msg_search_view_load_failed = this.translate.instant("Load search view failed");
            observer.error(new OdooError(this.translate, `${msg_search_view_load_failed}(${this.action_res_model}):${err_msg}`));
          } else if (res.length > 0) {
            this.appViewProvider.parseSearchView(res[0].arch, default_search_list).subscribe( search_param => {
              observer.next(search_param);
            }, (error) => {
              observer.error(error);
            })
          } else {
            observer.next({'search_list': default_search_list, 'filter_group_list': []});
          }
        }, (error) => {
          observer.error(error);
        })
    });
  }

  get_view_info() {
    return new Observable((observer) => {
      let view_search_domain = [['res_model', '=', this.action_res_model], ['type', '=', 'kanban']];
      if (this.action_view_kanban) {
        view_search_domain.push(['id', '=', this.action_view_kanban]);
      } else {
        view_search_domain.push(['inherit_id', '=', null]);
      }
      let context = this.odooProvider.mergeContext([this.odooProvider.user_context, this.action_context]);
      this.odooProvider.call('app.view', 'search_read', [view_search_domain, ['arch'], 0, 1, null], {context: context}).subscribe(
        res => {
          // 未配置视图的情况下提供默认看板视图
          let arch = DEFAULT_KANBAN_TEMPLATE;
          if (res.error) {
            let err_msg = (res.error.data && res.error.data.message) || res.error.message;
            let msg_kanban_view_load_failed = this.translate.instant("Load kanban view failed");
            observer.error(new OdooError(this.translate, `${msg_kanban_view_load_failed}(${this.action_res_model}):${err_msg}`));
          } else if (res.length > 0) {
            arch = res[0].arch;
          }
          this.appViewProvider.parseViewTemplate(this.action_res_model, arch).subscribe( res => {
            observer.next(res);
          }, (error) => {
            observer.error(error);
          })
        }, (error) => {
          observer.error(error);
        })
    })
  }

  loadRecords(event=null, reset=false) {
    this.actualLoadRecords(event, reset);
    if (!this.search_param_init_ok) {
      this.get_search_param().subscribe((res) => {
        this.search_list = res['search_list'] || [];
        this.filter_group_list = res['filter_group_list'] || [];
        this.search_param_init_ok = true;
        this.parseSearchDefault();
        this.parseFilterDefault();
        this.actualLoadRecords(event, reset);
      }, error => {
        this.commonProvider.displayErrorMessage(error.message, true);
      })
    }

    if (!this.view_template_init_ok) {
      this.get_view_info().subscribe((res) => {
        this.template = res['template'];
        this.fieldListBinary = res['fieldListBinary'];
        this.fieldListExceptBinary = res['fieldListExceptBinary'];
        this.fieldsDefinition = res['fieldsDefinition'];
        this.model_access_rights = res['model_access_rights'];
        this.view_template_init_ok = true;
        this.actualLoadRecords(event, reset);
      }, error => {
        this.commonProvider.displayErrorMessage(error.message, true);
      })
    }
  }

  actualLoadRecords(event=null, reset=false) {
    if (!this.search_param_init_ok || !this.view_template_init_ok) {
      return;
    }
    if(reset) {
      this.records = [];
    }
    this.no_more_data = false;
    let fieldList = this.fieldListBinary.concat(this.fieldListExceptBinary);
    let context = this.commonProvider.deepClone(this.action_context);
    this.active_domain_group_list.forEach((active_domain_group_item) => {
      context = this.odooProvider.mergeContext([context, active_domain_group_item.context]);
    })
    context = this.odooProvider.mergeContext([this.odooProvider.user_context, context, {'bin_size': true}]);
    if (!event) {
      this.commonProvider.displayLoading();
    }
    let domain = this.search_domain;
    this.odooProvider.call(this.action_res_model, 'search_read',[domain, fieldList, this.records.length, RECORDS_AMOUNT_PER_PAGE, null], {context: context}).subscribe(
      res => {
        let res_ids = [];
        this.records.forEach(record => {
          res_ids.push(record.id);
        });

        if (res.error) {
          let err_msg = (res.error.data && res.error.data.message) || res.error.message;
          err_msg = this.translate.instant("Read data from server failed!") + "\n" + err_msg;
          this.commonProvider.displayErrorMessage(err_msg, true);
        } else {
          res.forEach(res_item => {
            if (res_ids.indexOf(res_item.id) == -1) {
              res_item.res_model = this.action_res_model,
              res_item.component_type = 'kanban';
              res_item.fieldsDefinition = this.fieldsDefinition;
              res_item.parent = null;
              this.records.push(res_item);
            }
          });
        }
        if (res.length < RECORDS_AMOUNT_PER_PAGE) {
          this.no_more_data = true;
        }
        if (event) {
          event.complete();
        }
        this.commonProvider.dismissLoading();
      }, error => {
        let err_msg = this.translate.instant("Read data from server failed!") + "\n" + error.message;
        this.commonProvider.displayErrorMessage(err_msg, true);
        if (event) {
          event.complete();
        }
      }
    )
  }

  unlink_record(record) {
    this.commonProvider.displayLoading();
    let context = this.odooProvider.mergeContext([this.odooProvider.user_context, this.action_context]);
    this.odooProvider.call(this.action_res_model, 'unlink', [[record.id]], {context: context}).subscribe(
      res => {
        this.commonProvider.dismissLoading();
        if (res == true) {
          this.records.forEach((item, index, arr) => {
            if(record.id == item.id) {
              arr.splice(index, 1);
              return;
            }
          })
        } else {
          this.commonProvider.displayErrorMessage(
            this.translate.instant("Unknown error!"), true);
        }
      }, error => {
        this.commonProvider.displayErrorMessage(
          this.translate.instant("Delete record failed:") + error.message, true);
      }
    )
  }

  unlink(record) {
    if (!this.enable_unlink_record) {
      this.alertController.create({
        title: this.translate.instant("Error"),
        message: this.translate.instant("Sorry, you are not allowed to delete this record！"),
        enableBackdropDismiss: false,
        buttons: [{text: this.translate.instant("Confirm"), handler: () => {}}]
      }).present();
      return;
    }

    let confirm = this.alertController.create({
      title: this.translate.instant("Warning"),
      message: this.translate.instant("Are you sure you want to delete this record?"),
      enableBackdropDismiss: false,
      buttons: [
        {
          text: this.translate.instant("Cancel"),
          handler: () => {
          }
        },
        {
          text: this.translate.instant("Confirm"),
          handler: () => {this.unlink_record(record);}
        }
      ]
    });
    confirm.present();
  }

  copy(record){
    if (!this.enable_create_record) {
      this.alertController.create({
        title: this.translate.instant("Error"),
        message: this.translate.instant("Sorry, you are not allowed to create a record！"),
        enableBackdropDismiss: false,
        buttons: [{text: this.translate.instant("Confirm"), handler: () => {}}]
      }).present();
      return;
    }
    this.commonProvider.displayLoading();
    let context = this.odooProvider.mergeContext([this.odooProvider.user_context, this.action_context]);
    this.odooProvider.call(this.action_res_model, 'copy', [record.id, null], {context: context}).subscribe(
      res_id => {
        if (typeof(res_id) === "number"){
          this.openFormView({id: res_id}, this, null);
          this.setReloadFlag();
        } else {
          this.commonProvider.displayErrorMessage(
            this.translate.instant("Duplicate record failed:") + this.translate.instant("Unknown error"), true);
        }
      }, error => {
        this.commonProvider.displayErrorMessage(this.translate.instant("Duplicate record failed:") + error.message, true);
      }
    )
  }

  doRefresh(event) {
    this.loadRecords(event, true);
  }

  doInfinite(event) {
    if (this.no_more_data) {
      event.complete();
    } else {
      this.loadRecords(event);
    }
  }

  discard_search() {
    this.clearSearchInput();
    this.filter_group_list = this._filter_group_list_old;
    this.search_list = this._search_list_old;
    this.display_search = false;
  }

  search() {
    if (this.search_value) {
      this.confirmSearchOption(this.search_list[0]);
      return;
    }
    this.display_search = false;
    this.searchInput._native.nativeElement.blur();
    this.loadRecords(null, true);
    setTimeout(() => this.content.resize(), 10);
  }

  get display_search_option(){
    if (this.search_value) {
      return true;
    }
    return false;
  }

  removeLastDomainGroup() {
    let len = this.active_domain_group_list.length;
    if (len > 0)
    {
      let group_item = this.active_domain_group_list[len - 1];
      if (group_item.type == 'search') {
        group_item.item.values = [];
      } else if (group_item.type == 'filter') {
        group_item.item.filter_list.forEach(filter_item => {
          filter_item.active = false;
        });
      }
      setTimeout(() => this.content.resize(), 10);
    }
  }

  onSearchKeyUp(event){
    if(13 == event.keyCode){
      this.search();
    } else if (8 == event.keyCode && this.prev_search_value == '') {
      this.removeLastDomainGroup();
    }

    this.prev_search_value = this.search_value;
  }

  getStyle(obj,attr){
    let num = 0;
    if(obj.currentStyle){
      num = parseFloat(obj.currentStyle[attr]);
    } 
    else{
      num = parseFloat(document.defaultView.getComputedStyle(obj,null)[attr]);
    } 
    return num;
  }

  onSearchFormClick() {
    this.display_search = true;
    this._filter_group_list_old = this.commonProvider.deepClone(this.filter_group_list);
    this._search_list_old = this.commonProvider.deepClone(this.search_list);
    this.searchInput.setFocus();
  }

  toggleFilter(filter_item) {
    filter_item.active=!filter_item.active;
    this.content.resize();
  }

  confirmSearchOption(search_item) {
    let values = search_item.values || [];
    values.push(this.search_value);
    search_item.values = values;
    this.search_value = '';
    this.prev_search_value = '';
    this.search();
  }

  clearSearchInput() {
    this.search_value = '';
    this.prev_search_value = '';
  }

  openFormView(record, src_page, src_component) {
    let view_search_domain = [['res_model', '=', this.action_res_model], ['type', '=', 'form']];
    if (this.action_view_form) {
      view_search_domain.push(['id', '=', this.action_view_form]);
    } else {
      view_search_domain.push(['inherit_id', '=', null]);
    }
    let context = this.odooProvider.mergeContext([this.odooProvider.user_context, this.action_context]);
    this.commonProvider.displayLoading();
    this.odooProvider.call('app.view', 'search_read', [view_search_domain, ['arch'], 0, 1, null], {context: context}).subscribe(
      res => {
        let msg_open_form_failed = this.translate.instant('Open form page failed');
        let msg_view_not_found = this.translate.instant("The specified view could not be found!");
        if (res.error) {
          let err_msg = (res.error.data && res.error.data.message) || res.error.message;
          this.commonProvider.displayErrorMessage(`${msg_open_form_failed}${this.action_res_model}):${err_msg}`, true);
        } else if (res.length > 0) {
          this.appViewProvider.parseViewTemplate(this.action_res_model, res[0].arch).subscribe( res_template => {
            let params = Object.assign({
              'src_page': src_page,
              'src_component': src_component,
              'res_model': this.action_res_model, 
              'res_id': record && record.id, 
              'context': context, 
              'record_vals': (record && this.commonProvider.deepClone(record)) || null,
              'action_options': this.action_options,
            }, res_template);
            this.navCtrl.push('FormPage', params);
          }, (error) => {
            this.commonProvider.displayErrorMessage(error.message, true);
          })
        } else {
         this.commonProvider.displayErrorMessage(`${msg_open_form_failed}(${this.action_res_model}):${msg_view_not_found}`, true);
        }
      }, (error) => {
        this.commonProvider.displayErrorMessage(error.message, true);
    })
  }

  actionCreateRecord(event) {
    event.stopPropagation();
    this.openFormView(null, this.src_page || this, this.src_component);
  }

  setReloadFlag() {
    this._need_reload = true;
  }

  onRecordClick(event, record, src_component) {
    if (event) {
      event.stopPropagation();
    }
    if (!this.src_component) {
      this.openFormView(record, this, src_component);
    } else {
      this.src_component.updateRecord(record, record);
      this.navCtrl.popTo(this.src_page.viewController);
    }
  }
}
