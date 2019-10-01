// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonProvider, ExceptionActionDefinition } from '../../providers/common/common';
import { DomainProvider } from '../../providers/odoo/domain';
import { OdooProvider } from '../../providers/odoo/odoo';
import { AppActionProvider } from '../../providers/app-action/app-action';
import { AlertController, NavController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'page-button',
  host: {
    '[class.invisible]': 'invisible',
    '(click)': 'onClick($event)',
    '[style.color]':  'color',
    '[style.background-color]': 'bgcolor',
  },
  templateUrl: 'page-button.html'
})
export class PageButtonComponent implements OnInit {
  @Input() type;
  @Input() name;
  @Input() string;
  @Input('font_size') _font_size;
  @Input('color') _color;
  @Input('bgcolor') _bgcolor;
  @Input() icon = '';
  @Input('icon_size') _icon_size;
  @Input('icon_pos') _icon_pos = 'left';
  @Input('icon_color') _icon_color = '';
  @Input() confirm = "";
  @Input() widget;
  // json_attrs是用户输入的json类型的参数的集合
  @Input() json_attrs = {};
  // 以下Input属性是前台根据需要增加的
  @Input() current_page;
  @Input() record;

  private _invisible = false;
  constructor(
    private commonProvider: CommonProvider,
    private domainProvider: DomainProvider,
    private odooProvider: OdooProvider,
    private appActionProvider: AppActionProvider,
    private alertController: AlertController,
    private navCtrl: NavController,
    private translate: TranslateService,
  ) {
  }

  computeInvisible() {
    if (Object.keys(this.attrs).indexOf('invisible') !== -1) {
      let exception_action = new ExceptionActionDefinition(false, true, true);
      this._invisible = this.domainProvider.compute(this.attrs['invisible'], this.record, exception_action);
    } else {
      this._invisible = false;
    }
  }

  ngOnInit() {
    if (this.commonProvider.isPageForm(this.current_page)) {
      this.computeInvisible();
      this.current_page.onRecordChange().subscribe(() => {
        this.computeInvisible();
      })
    }
  }

  get label() {
    if (this.widget === 'statinfo') {
      return '';
    } else {
      return this.string || this.name;
    }
  }

  get invisible() {
    return this._invisible;
  }

  get context() {
    let exception_action = new ExceptionActionDefinition(false, true, {});
    return this.commonProvider.compute_context(this.json_attrs['context'], this.record, exception_action);
  }

  get attrs() {
    let exception_action = new ExceptionActionDefinition(false, true, {});
    return this.domainProvider.compute_attrs(this.json_attrs['attrs'], this.record, exception_action);
  }

  get font_size() {
    return this.commonProvider.convertToInt(this._font_size, 16)/10 + 'rem';
  }

  get color() {
    if (this._color) {
      return this._color;
    } else {
      return (this.widget === 'statinfo')?'#875a7b':'#ffffff';
    }
  }

  get bgcolor() {
    if (this._bgcolor) {
      return this._bgcolor;
    } else {
      return (this.widget === 'statinfo')?'#ffffff':'#875a7b';
    }
  }

  get icon_size() {
    let icon_size = this.commonProvider.convertToInt(this._icon_size, 0);
    if (icon_size) {
      return icon_size/10 + 'rem';
    } else {
      return this.font_size;
    }
  }

  get icon_pos() {
    if (this._icon_pos === 'top') {
      return 'top';
    } else {
      return 'left';
    }
  }

  get icon_color() {
    if (this._icon_color) {
      return this._icon_color;
    } else {
      return this.color;
    }
  }

  do_action(additional_context) {
    this.commonProvider.displayLoading();
    this.odooProvider.call('app.act_window', 'get_action_data', [this.name], {context: this.odooProvider.user_context}).subscribe((res) => {
      if (Object.keys(res).length) {
        this.appActionProvider.do_action(res, false, this.current_page, additional_context);
      } else {
        let msg_action_not_found = this.translate.instant("The specific action is not found");
        this.commonProvider.displayErrorMessage(`${msg_action_not_found}(${this.name})`, true);
      }      
    }, error => {
      this.commonProvider.displayErrorMessage(error.message, true);
    })
  }

  do_change_password(data) {
    this.commonProvider.displayLoading();
    this.odooProvider.change_password(data.old_pwd, data.new_password, data.confirm_pwd).subscribe((res) => {
      this.commonProvider.dismissLoading();
      let title = this.translate.instant("Change Password");
      let subTitle = this.translate.instant("Change Password Failed");
      if (res.error) {
        title = res.title;
        subTitle = res.error;
      } else if(res.new_password){
          subTitle = this.translate.instant("Change Password Success");
      }
      this.alertController.create({
        title: title,
        subTitle: subTitle,
        buttons: [this.translate.instant("Confirm")]
      }).present();
    }, error => {
      this.commonProvider.dismissLoading();
      this.alertController.create({
        title: this.translate.instant("Change Password Failed"),
        subTitle: error.message,
        buttons: [this.translate.instant("Confirm")]
      }).present();
      this.commonProvider.displayErrorMessage(error.message, true);
    })
  }

  change_password() {
    let alert = this.alertController.create({
      title: this.translate.instant("Change Password"),
      inputs: [{
          name: 'old_pwd',
          placeholder: this.translate.instant("Old Password"),
          type: 'password'
        },
        {
          name: 'new_password',
          placeholder: this.translate.instant("New Password"),
          type: 'password'
        },
        {
          name: 'confirm_pwd',
          placeholder: this.translate.instant("Confirm New Password"),
          type: 'password'
        }
      ],
      buttons: [
        {
          text: this.translate.instant("Cancel"),
          role: 'cancel',
          handler: () => {}
        },
        {
          text: this.translate.instant("Confirm"),
          handler: data => {
            this.do_change_password(data);
          }
        }
      ]
    });
    alert.present();
  }

  logout() {
    this.odooProvider.logout().subscribe(res => {
      this.odooProvider.has_login = false;
      this.navCtrl.setRoot('LoginPage');
    }, error => {
      this.commonProvider.displayErrorMessage(error.message, true);
    })
  }

  setCurrentPageReloadFlag() {
    if (this.current_page.setReloadFlag) {
      this.current_page.setReloadFlag();
    }
  }

  confirm_execute() {
    let res_id = this.record.id;
    if (this.commonProvider.isNewRecordId(res_id)) {
      res_id = false;
    }
    let additional_context = this.odooProvider.mergeContext([{
      'active_id': res_id,
      'active_ids': [res_id],
      'active_model': this.record.res_model,
    }, this.current_page.context, this.context])
    switch(this.type) {
      case 'action':
        this.do_action(additional_context);
        this.setCurrentPageReloadFlag();
        break;
      case 'object':
        this.current_page.call_button(this.name, additional_context);
        this.setCurrentPageReloadFlag();
        break;
      case 'signal':
        this.current_page.exec_workflow(this.name);
        break;
      case 'cancel':
        this.current_page.cancel(this.current_page.target === 'new');
        break;
      case 'save':
        this.current_page.confirm();
        break;
      case 'change_password':
        this.change_password();
        break;
      case 'logout':
        this.logout();
        break;
      case 'reload':
        window.location.reload();
        break;
      default:
        this.commonProvider.displayErrorMessage(this.translate.instant("Error: Unknown button type!"), true);
        break;
    }
  }

  onClick(event) {
    if (event) {
      event.stopPropagation();
    }
    if(this.confirm) {
      this.alertController.create({
        title: this.label,
        message: '' + this.confirm,
        enableBackdropDismiss: false,
        buttons: [
          {
            text: this.translate.instant('Cancel'),
            role: 'cancel',
            handler: () => {}
          },
          {
            text: this.translate.instant('Confirm'),
            handler: () => {
              this.confirm_execute();
            }
          }
        ]
      }).present();
    } else {
      this.confirm_execute();
    }
  }
}
