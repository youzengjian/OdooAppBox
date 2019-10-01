// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Directive, Input, ElementRef, Renderer, OnInit } from '@angular/core';
import { OdooProvider } from '../../providers/odoo/odoo';
import { CommonProvider } from '../../providers/common/common';

@Directive({
  selector: '[groups-directive]' // Attribute selector
})
export class GroupsDirective implements OnInit {

  @Input('groups-directive') groups;
  constructor(
    protected odooProvider: OdooProvider,
    protected elementRef: ElementRef,
    protected renderer: Renderer,
    protected commonProvider: CommonProvider,
  ) {
  }

  ngOnInit() {
    let invisible = true;
    if (this.groups) {
      let groups = this.commonProvider.strReplaceAll(this.groups, '\'', '');
      let group_list = groups.split(',');
      this.odooProvider.groups.forEach(group => {
        if (group_list.indexOf(group) !== -1) {
          invisible = false;
        }
      });
    } else {
      invisible = false;
    }

    if (invisible) {
      this.renderer.setElementStyle(this.elementRef.nativeElement, 'display', 'none');
    }
  }
}


