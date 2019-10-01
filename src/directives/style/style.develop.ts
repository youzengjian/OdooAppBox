// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Directive, Input, OnInit } from '@angular/core';
import { StyleDirective } from './style';
const ALLOWED_STYLE_LIST_DEVELOP = [
  'background-color',
  'height',
  'min-height',
  'font-size',
  'color',
];

@Directive({
  selector: '[style-directive-develop]'
})
export class StyleDirectiveDevelop extends StyleDirective implements OnInit {
  @Input('style-directive-develop') style = '';

  ngOnInit() {
    this.updateElementStyles(ALLOWED_STYLE_LIST_DEVELOP);
  }
}
