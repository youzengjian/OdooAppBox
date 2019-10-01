// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Injectable } from '@angular/core';
import { App } from 'ionic-angular';
import { OdooProvider } from '../odoo/odoo';
import { AppViewProvider } from '../app-view/app-view';
import { CommonProvider, ExceptionActionDefinition } from '../common/common';
import { DomainProvider } from '../odoo/domain';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class AppActionProvider {

  constructor(
    private app: App,
    private odooProvider: OdooProvider,
    private appViewProvider: AppViewProvider,
    private commonProvider: CommonProvider,
    private domainProvider: DomainProvider,
    private translate: TranslateService,
  ) {
  }

  private get_view_id(view_data) {
    if (view_data instanceof Array) {
      return view_data[0];
    } else {
      return view_data;
    }
  }

  openKanbanView(action, set_root) {
    this.commonProvider.displayLoading();
    let params = {
      'src_page': null,
      'src_component': null,
      'action_name': action.name,
      'action_res_model': action.res_model,
      'action_view_kanban': this.get_view_id(action.view_kanban), 
      'action_view_form': this.get_view_id(action.view_form), 
      'action_view_search': this.get_view_id(action.view_search), 
      'action_context': action.context,
      'action_domain': action.domain,
      'action_options': action.options,
      'target': action.target,
      };
    if (set_root) {
      this.app.getActiveNavs()[0].setRoot('KanbanPage', params);
    } else {
      this.app.getActiveNavs()[0].push('KanbanPage', params);
    }
  }

  openFormView(action, set_root, src_page) {
    let res_id = action.res_id || null;
    let context = action.context || {};
    context = this.odooProvider.mergeContext([this.odooProvider.user_context, context]);
    let res_model = action.res_model;
    let view_form_ref = this.get_view_id(action.view_form_ref);

    let view_search_domain = [['res_model', '=', res_model], ['type', '=', 'form']];
    if (view_form_ref) {
      view_search_domain.push(['id', '=', view_form_ref]);
    } else {
      view_search_domain.push(['inherit_id', '=', null]);
    }
    this.commonProvider.displayLoading();
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
              'src_page': src_page,
              'src_component': null,
              'res_model': res_model, 
              'res_id': res_id, 
              'context': context, 
              'target': action.target,
              'action_name': action.name,
              'action_options': action.options,
            }, res_template);
          if (set_root) {
            this.app.getActiveNavs()[0].setRoot('FormPage', params);
          } else {
            this.app.getActiveNavs()[0].push('FormPage', params);
          }
        }, (error) => {
          this.commonProvider.displayErrorMessage(error.message, true);
        })
      } else {
        this.commonProvider.displayErrorMessage(`${msg_open_form_failed}(${res_model}):${msg_view_not_found}`, true);
      }
      }, (error) => {
        this.commonProvider.displayErrorMessage(error.message, true);
    })
  }

  do_action(action, set_root, src_page, additonal_context) {
    if (!action) {
      return;
    }

    let action_copy = this.commonProvider.deepClone(action);
    if (action_copy) {
      let exception_action = new ExceptionActionDefinition(false, true, {});
      let active_id = src_page && src_page.record.id;
      if (this.commonProvider.isNewRecordId(active_id)) {
        active_id = false;
      }
      action_copy.context = this.odooProvider.parseContext(action_copy.context, active_id, exception_action);
      action_copy.domain = this.domainProvider.preprocessSearchDomainTemplate(action_copy.domain, this.odooProvider.uid, this.odooProvider.time_offset_str);
      action_copy.options = this.commonProvider.get_options(action.options, exception_action);
    }
    if (typeof(additonal_context) === 'object' && Object.keys(additonal_context).length) {
      action_copy.context = this.odooProvider.mergeContext([action_copy.context, additonal_context]);
    }

    let view_mode_list = ['kanban', 'form'];
    if (action.view_mode) {
      view_mode_list = action.view_mode.split(',');
    }

    let mode = view_mode_list[0];
    if (mode === 'form' || (view_mode_list.indexOf('form') && action.res_id)) {
      this.openFormView(action_copy, false, src_page);
    } else {
      this.openKanbanView(action_copy, set_root);
    }
  }
}
