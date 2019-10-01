// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Component } from '@angular/core';
import { OdooProvider } from '../../providers/odoo/odoo';
import { MenuController, App } from 'ionic-angular';
import { AppActionProvider } from '../../providers/app-action/app-action';
import { AdvanceOptions, AppViewProvider } from '../../providers/app-view/app-view';
import { CommonProvider } from '../../providers/common/common';
import { TranslateService } from '@ngx-translate/core';

const INIT_STATE = {
  NOT_INIT: 'NOT_INIT',
  INITING: 'INITING',
  INIT_OK: 'INIT_OK',
  INIT_FAILED: 'INIT_FAILED',
}
@Component({
  selector: 'app-menu-base',
  templateUrl: 'app-menu-base.html'
})
export abstract class AppMenuBaseComponent {
  private intervalOpenUserInfoPage;
  private user_info_page_params_init_state = INIT_STATE.NOT_INIT;
  private user_info_page_params;
  constructor(
    protected app: App,
    protected odooProvider: OdooProvider,
    protected menuController: MenuController,
    protected appActionProvider: AppActionProvider,
    protected commonProvider: CommonProvider,
    protected appViewProvider: AppViewProvider,
    protected translate: TranslateService,
  ) {
    this.init_user_info();
  }

  menu_has_action(menu) {
    return (typeof(menu.action) === 'object' && Object.keys(menu.action).length);
  }

  get active_root_menu() {
    return this.odooProvider.active_root_menu;
  }

  get active_sub_menu() {
    return this.odooProvider.active_sub_menu;
  }

  get_menus(parent_id): any[] {
    return this.odooProvider.get_menus(parent_id);
  }

  root_menu_click(root_menu) {
    // You must keep "About" menu links to the "Home" Page.
    if (root_menu.action == 'about') {
      this.about_menu_click();
    } else {
      this.odooProvider.active_root_menu = root_menu;
    }
  }

  about_menu_click() {
    this.app.getActiveNavs()[0].setRoot('HomePage');
    this.menuController.close();
  }

  sub_menu_click(menu) {
    if (this.menu_has_action(menu)) {
      this.odooProvider.active_sub_menu = menu;
      this.appActionProvider.do_action(menu.action, true, null, {});
      this.menuController.close();
    }
  }

  get user_image() {
    return this.odooProvider.get_img_url('res.users', this.odooProvider.uid, 'image', 60, 60);
  }

  get user_displayname() {
    return this.odooProvider.user_displayname;
  }

  get username() {
    return this.odooProvider.username;
  }

  get company_displayname() {
    return this.odooProvider.company_displayname;
  }

  init_user_info() {
    this.user_info_page_params_init_state = INIT_STATE.INITING;
    let template = `
      <form style="height:100%;background-color: #e1b7d5;">
        <div style="display: flex; align-items: center; background-color:#c392b6; padding:1.6rem">
          <field name="image" widget="avatar"
                class="value-center" attrs="{'nolabel': True}" width="80" 
                height="80" style="border:none;padding-right:1.6rem;"/>
          <div style="flex: 1 1 auto;">
            <div style="font-size: 2.0rem; color: #fff;">${this.user_displayname}</div>
            <div style="color: #eee;">${this.username}</div>
            <div style="color: #eee;">${this.company_displayname}</div>
          </div>
        </div>
        <div style="padding:0 3.2rem;">
          <button icon="fa-key" bgcolor="#e1b7d5" font_size="24" type="change_password" string="{{'Change Password' | translate}}" style="justify-content: flex-start; min-height: 5.5rem; border-bottom: 0.1rem solid #eee;"/>
          <button icon="fa-sign-out" bgcolor="#e1b7d5" font_size="24" type="logout" string="{{'Logout' | translate}}" confirm="{{'Are you sure you want to log out?' | translate}}" style="justify-content: flex-start; min-height: 5.5rem; border-bottom: 0.1rem solid #eee;"/>
          <button icon="fa-refresh" bgcolor="#e1b7d5" font_size="24" type="reload" string="{{'Reload' | translate}}" style="justify-content: flex-start; min-height: 5.5rem; border-bottom: 0.1rem solid #eee;"/>
        </div>
      </form>
    `
    let res_model = 'res.users';
    let res_id = this.odooProvider.uid;
    let context = {};

    let advance_options:AdvanceOptions = {
      disable_no_more_data: true,
      replace_directives_version: 'develop',
    }
    this.appViewProvider.parseViewTemplate(res_model, template, advance_options).subscribe( res_template => {
      this.user_info_page_params = Object.assign({
        'src_page': null,
        'src_component': null,
        'res_model': res_model, 
        'res_id': res_id, 
        'context': context, 
        'target': 'new',
        'action_name': ' ',
        'action_options': {'no_edit': true},
        'record_vals': {'id': res_id, 'image': 'image_size'}, 
      }, res_template);
      this.user_info_page_params_init_state = INIT_STATE.INIT_OK;
    }, error => {
      this.user_info_page_params_init_state = INIT_STATE.INIT_FAILED;
    })
  }

  onHeaderClick(event) {
    event.stopPropagation();
    this.menuController.close();
    let interval = 0;
    if ([INIT_STATE.NOT_INIT, INIT_STATE.INIT_FAILED].indexOf(this.user_info_page_params_init_state) !== -1) {
      this.commonProvider.displayLoading();
      this.init_user_info();
      interval = 100;
    }
    this.intervalOpenUserInfoPage = setInterval(() => {
      if (this.user_info_page_params_init_state === INIT_STATE.INIT_FAILED) {
        let err_msg = this.translate.instant("Load failed, please try again!");
        this.commonProvider.displayErrorMessage(err_msg, true);
        clearInterval(this.intervalOpenUserInfoPage);
      } else if (this.user_info_page_params_init_state === INIT_STATE.INIT_OK) {
        this.app.getActiveNavs()[0].setRoot('FormPage', this.user_info_page_params);
        clearInterval(this.intervalOpenUserInfoPage);
      }
    }, interval)
    
  }
}
