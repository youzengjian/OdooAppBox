// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Component, ElementRef, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';
import { OdooProvider } from '../../providers/odoo/odoo';
import { CommonProvider } from '../../providers/common/common';
import { HttpProvider } from '../../providers/http/http';

@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage implements AfterViewInit{
  private _title = "";
  private _context = "";
  private _res_en = `
  <div>
    <div class="title">About OdooAppBox</div>
    <div class="content" style="padding:0 1.5rem;">
      <h1>What is OdooAppBox</h1>
      <p>OdooAppBox is a mobile application for Odoo(https://www.odoo.com/), It can be used on Android and iPhone.</p>
      <h1>Community Edition</h1>
      <p>OdooAppBox Community is open source edition, compatible with Odoo8~Odoo12. OdooAppBox Community git repository is https://github.com/youzengjian/OdooAppBox/.</p>
      <h1>Enterprise Edition</h1>
      <p>OdooAppBox Enterprise is an enhanced edition of OdooAppBox Community. This edition is not open source.</p>
      <h1>Customization</h1>
      <p>We provide OEM services to our customers. Please contact us for specific customization</p>
      <h1>Contact us</h1>
      <p>Email: youzengjian@gmail.com</p>
      <p>QQ: 1294739135</p>
      <div style="display: flex; justify-content: center;">
        <img src="assets/imgs/logo.png" width='128' height='128' style="background-color: #c392b6;"/>
      </div>
    </div>
  </div>
  `;

  private _res_zh = `
  <div>
    <div class="title">关于OdooAppBox</div>
    <div class="content" style="padding:0 1.5rem;">
      <h1>什么是OdooAppBox</h1>
      <p>OdooAppBox是用于Odoo(https://www.odoo.com/)的手机APP，支持Android手机和iPhone手机</p>
      <h1>社区版</h1>
      <p>OdooAppBox社区版为开源版本，支持Odoo8~Odoo12社区版和企业版。源码托管地址https://github.com/youzengjian/OdooAppBox/</p>
      <h1>企业版</h1>
      <p>OdooAppBox企业版是社区版的增强版本，支持Odoo8~Odoo12，额外提供扫码出入库、扫码报工等功能以及更少的限制</p>
      <h1>版本定制</h1>
      <p>如您有UI修改、功能定制等需求，可联系作者定制</p>
      <h1>联系我们</h1>
      <p>作者邮箱：youzengjian@gmail.com</p>
      <p>作者QQ：1294739135</p>
      <div style="display: flex; justify-content: center;">
        <img src="assets/imgs/logo.png" width='128' height='128' style="background-color: #c392b6;"/>
      </div>
    </div>
  </div>
  `;
  constructor(
    private navController: NavController,
    private odooProvider: OdooProvider,
    private commonProvider: CommonProvider,
    protected elementRef: ElementRef,
    private http: HttpProvider,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
    if (!this.odooProvider.has_login) {
      this.navController.setRoot('LoginPage');
    } else if (this.odooProvider.menu_list.length){
      this.commonProvider.dismissLoading(1000);
    }
  }

  get title() {
    return this._title;
  }

  get context() {
    return this._context;
  }

  private update_page_content(res) {
    let parser = new DOMParser();
    let xmlDoc = parser.parseFromString(res, 'text/xml');
    let evaluator = new XPathEvaluator(); 
    let result = evaluator.evaluate(`//div[@class='title']`, xmlDoc.documentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    let titleElement = <Element>result.singleNodeValue;
    if (titleElement) {
      this._title = titleElement.textContent;
    }

    result = evaluator.evaluate(`//div[@class='content']`, xmlDoc.documentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    let contentElement = <Element>result.singleNodeValue;
    if (contentElement) {
      this._context = contentElement.outerHTML;
    }
    this.changeDetectorRef.detectChanges();
  }

  ngAfterViewInit() {
    if (this.odooProvider.lang === 'zh') {
      this.update_page_content(this._res_zh);
    } else {
      this.update_page_content(this._res_en);
    }
    let t =Math.floor(new Date().getTime()/3600000);
    this.http.get(`http://appbox.atknit.com/release/home_${this.odooProvider.lang}.html?t=${t}`).subscribe(res => {
      this.update_page_content(res);
    }, error => {
    })
  }
}
