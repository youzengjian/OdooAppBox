// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Component, Input, OnChanges, ChangeDetectorRef } from '@angular/core';
import { OdooProvider } from '../../providers/odoo/odoo';
import { Headers, ResponseContentType } from '@angular/http';
import { DomSanitizer } from '@angular/platform-browser';
import { PLACE_HOLDER_IMG_SRC } from '../../providers/common/common';
import { HttpProvider } from '../../providers/http/http';

@Component({
  selector: 'app-img',
  templateUrl: 'app-img.html'
})
export class AppImgComponent implements OnChanges{
  @Input() src = "";
  public safe_src;
  constructor(
    private odooProvider: OdooProvider,
    private http: HttpProvider,
    private domSanitizer: DomSanitizer,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
    this.safe_src = PLACE_HOLDER_IMG_SRC;
  }

  ngOnChanges() {
    if (!this.src.startsWith(this.odooProvider.host)) {
      this.safe_src = this.src;
      return;
    }
    let headers = new Headers({
      "X-Openerp-Session-Id": this.odooProvider.session_id,
    });
    this.http.get_image(this.src, {headers: headers, responseType: ResponseContentType.Blob}).subscribe(
      res => {
        this.safe_src = this.domSanitizer.bypassSecurityTrustUrl(res);
        this.changeDetectorRef.detectChanges();
      }, () => {
        this.safe_src = PLACE_HOLDER_IMG_SRC;
      }
    )
  }
}

