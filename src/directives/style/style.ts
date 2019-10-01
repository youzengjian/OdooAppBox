// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Directive, Input, ElementRef, Renderer, OnInit } from '@angular/core';
const ALLOWED_STYLE_LIST = [
  'display',
  'flex-direction',
  'flex-wrap',
  'flex-flow',
  'justify-content',
  'align-items',
  'align-content',
  'order',
  'flex-grow',
  'flex-shrink',
  'flex-basis',
  'flex',
  'align-self',

  'width',
  'min-width',
  'height',
  'min-height',

  'font-weight',
  'font-size',

  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',

  'border',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',

  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
];

@Directive({
  selector: '[style-directive]'
})
export class StyleDirective implements OnInit {

  @Input('style-directive') style = '';
  constructor(
    protected elementRef: ElementRef,
    protected renderer: Renderer,
  ) {
  }

  ngOnInit() {
    this.updateElementStyles();
  }

  protected updateElementStyles(additional_style_list = []) {
    let style_list = this.style.split(';');
    for (let i = 0; i < style_list.length; i++) {
      let style = style_list[i].split(':');
      if (style.length == 2) {
        let style_name = style[0].trim();
        let style_value = style[1].trim();
        if (ALLOWED_STYLE_LIST.indexOf(style_name) !== -1 || additional_style_list.indexOf(style_name) !== -1) {
          this.renderer.setElementStyle(this.elementRef.nativeElement, style_name, style_value);
        }
      }
    }
  }
}
