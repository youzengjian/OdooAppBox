// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Injectable, ErrorHandler } from '@angular/core';
import { CommonProvider } from '../common/common';
import { App } from 'ionic-angular/components/app/app';
import { OdooProvider } from '../odoo/odoo';

@Injectable()
export class GlobalErrorProvider implements ErrorHandler {

  constructor(
    private commonProvider: CommonProvider,
    private odooProvider: OdooProvider,
    private app: App,
  ){
  }

  handleError(error: any) {
    if(error.error_code === 'odoo_error_session_invalid' || error.error_code === 'odoo_error_session_expired') {
      this.odooProvider.has_login = false;
      this.app.getActiveNavs()[0].setRoot('LoginPage');
    }
    if (error.rejection && error.rejection === 'no views in the stack to be removed') {
      return;
    }
    this.commonProvider.displayErrorMessage(error.message, false);
  }
}
