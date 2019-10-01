// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { Platform, App, ToastController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { OdooProvider } from '../providers/odoo/odoo';
import { CommonProvider } from '../providers/common/common';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { CodePush, InstallMode } from '@ionic-native/code-push';
import { TranslateService } from '@ngx-translate/core';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage:any = 'HomePage';
  constructor(
    private platform: Platform,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen,
    private odooProvider: OdooProvider,
    private app: App,
    private toastController: ToastController,
    private commonProvider: CommonProvider,
    private screenOrientation: ScreenOrientation,
    private codePush: CodePush,
    private translate: TranslateService,
  ) {
    this.platform.ready().then(() => {     
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      if (this.commonProvider.isAndroid || this.commonProvider.isIos) {
        this.updateByCodePush();
        this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT);
      }
      this.statusBar.styleDefault();
      setTimeout(() => {this.splashScreen.hide();}, 500);      
      this.commonProvider.displayLoading();
      this.odooProvider.get_menu_list().subscribe(res => {
        this.commonProvider.dismissLoading(1000);
      });

      if (this.odooProvider.has_login) {
        this.get_session_info();
      } else {
        this.app.getActiveNavs()[0].setRoot('LoginPage');
      }
    });
  }

  updateByCodePush() {
    this.codePush.sync({
      updateDialog: {
       appendReleaseDescription: true,
       descriptionPrefix: `\n\n${this.translate.instant("Update Log:")}\n`
      },
      installMode: InstallMode.IMMEDIATE
    }).subscribe(
      (data) => { console.log('CODE PUSH SUCCESSFUL: ' + data); },
      (err) => { console.log('CODE PUSH ERROR: ' + err); }
    );
  }

  get_session_info() {
    this.odooProvider.getSessionInfo().subscribe(res => {
      // do nothing
    }, () => {
      // Get session info failed! Go back to the login page.
      this.toastController.create({
        message: this.translate.instant("Get user information failed, please relogin!"),
        duration: 3000,
        position: 'bottom',
      }).present();
      this.odooProvider.has_login = false;
      this.app.getActiveNavs()[0].setRoot('LoginPage');
    })
  }

  get show_menu() {
    return this.odooProvider.session_init_ok;
  }
  
  get menu_type() {
    return 2;
  }

}

