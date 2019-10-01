// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Component, ChangeDetectorRef } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';
import { OdooProvider } from '../../providers/odoo/odoo';
import { CommonProvider } from '../../providers/common/common';
import { AppViewProvider } from '../../providers/app-view/app-view';
import { TranslateService } from '@ngx-translate/core';

@IonicPage()
@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage{
  public host = 'http://demo.appbox.atknit.com';
  public db = 'odoo12-demo';
  public username = '';
  public password = '';
  public usernameErrorMessage = '';
  public passwordErrorMessage = '';
  public loginErrorMessage = '';
  public type = 'login';
  public name = ''; //用户注册：姓名
  public token = ''; //用户注册：验证码
  public token_send_time = 0;
  public password2 = '' //用户注册：确认密码
  public mobileErrorMessage = ''; //用户注册：手机号错误信息
  public nameErrorMessage = ''; //用户注册：手机号错误信息
  public tokenErrorMessage = ''; //用户注册：验证码错误信息
  public password2ErrorMessage = ''; //用户注册：重复密码错误信息
  public signupErrorMessage = '';
  constructor(
    private navController: NavController,
    private odooProvider: OdooProvider,
    private commonProvider: CommonProvider,
    private appViewProvider: AppViewProvider,
    private translate: TranslateService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
    if (this.odooProvider.has_login) {
      this.navController.setRoot('HomePage');
    } else {
      this.commonProvider.dismissLoading();
    }
  }

  is_data_valid() {
    let result = true;
    if (this.username) {
      this.usernameErrorMessage = '';
    } else {
      result = false;
      this.usernameErrorMessage = this.translate.instant("Username is required");
    }

    if (this.password) {
      this.passwordErrorMessage = '';
    } else {
      result = false;
      this.passwordErrorMessage = this.translate.instant("Password is required");
    }
    this.changeDetectorRef.detectChanges();
    return result;
  }

  login() {
    this.loginErrorMessage = '';
    if (!this.is_data_valid()) {
      return;
    }
    this.commonProvider.displayLoading(this.translate.instant("Login..."));
    this.odooProvider.host = this.host;
    this.odooProvider.db = this.db;
    this.appViewProvider.clearCache();
    this.odooProvider.login(this.username, this.password).subscribe(
      res => {
        this.navController.setRoot('HomePage');
        this.commonProvider.dismissLoading();
      }, error => {
        this.odooProvider.has_login = false;
        if (error.error_code === 'odoo_error_operation') {
          this.loginErrorMessage = this.translate.instant("Username or password incorrect");
        } else if (error.error_code === 'odoo_appbox_addon_not_install'){
          this.loginErrorMessage = this.translate.instant("This server is not install 'appbox' addon, please install and try again");
        } else if (error.error_code === 'odoo_error_verify_auth_failed') {
          this.loginErrorMessage = error.message;
        } else {
          this.loginErrorMessage = this.translate.instant("Login failed, please check server url and database name");
        }
        this.commonProvider.dismissLoading();
      }
    )
  }

  switch_to_signup() {
    this.type = 'signup';
    this.changeDetectorRef.detectChanges();
  }

  switch_to_login() {
    this.type = 'login';
    this.changeDetectorRef.detectChanges();
  }

  get t_need_wait_to_get_token() {
    let t_now = new Date().getTime();
    let t_need_wait = 60* 1000 - (t_now - this.token_send_time);
    t_need_wait = Math.ceil(t_need_wait / 1000);
    return t_need_wait>0?t_need_wait:0;
  }

  get_token() {
    if (this.t_need_wait_to_get_token > 0) {
      this.tokenErrorMessage = this.translate.instant('Please try again later.');
      return;
    }
    if (this.username.length===0) {
      this.mobileErrorMessage = this.translate.instant('Mobile is required');
      return;
    }
    this.token_send_time = new Date().getTime();
    this.odooProvider.send_signup_token(this.db, this.username).subscribe(res => {
      if (res.error) {
        this.tokenErrorMessage = (res.error.data && res.error.data.message) || res.error.message;
        this.token_send_time = 0;
      }
    }, (err) => {
      this.tokenErrorMessage = this.translate.instant('SMS Code Send Failed');
      this.token_send_time = 0;
    })
  }

  is_data_signup_valid() {
    let result = true;
    if (this.username) {
      this.mobileErrorMessage = '';
    } else {
      result = false;
      this.mobileErrorMessage = this.translate.instant('Mobile is required');
    }

    if (this.name) {
      this.nameErrorMessage = '';
    } else {
      result = false;
      this.nameErrorMessage = this.translate.instant('Name is required');
    }

    if (this.token) {
      this.tokenErrorMessage = '';
    } else {
      result = false;
      this.tokenErrorMessage = this.translate.instant('Token is required');
    }

    if (this.password) {
      this.passwordErrorMessage = '';
    } else {
      result = false;
      this.passwordErrorMessage = this.translate.instant("Password is required");
    }

    if (this.password2) {
      if (this.password === this.password2) {
        this.password2ErrorMessage = '';
      } else {
        this.password2ErrorMessage = this.translate.instant("Password and confrim password do not match");
      }
    } else {
      result = false;
      this.password2ErrorMessage = this.translate.instant("Password is required");
    }

    this.changeDetectorRef.detectChanges();
    return result;
  }

  signup() {
    if(!this.is_data_signup_valid()){
      return;
    }
    this.odooProvider.appbox_signup(this.db, this.username, this.name, this.token, this.password).subscribe(res => {
      if (res.error) {
        this.signupErrorMessage = (res.error.data && res.error.data.message) || res.error.message;
      } else {
        this.type = 'login';
      }
      this.changeDetectorRef.detectChanges();
    }, () => {
      this.signupErrorMessage = this.translate.instant('Sign up failed');
      this.changeDetectorRef.detectChanges();
    })
  }
}
