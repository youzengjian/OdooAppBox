// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Directive, Input, ElementRef, Renderer, OnInit } from '@angular/core';
const ALLOWED_CLASS_LIST = [
  'separator',
  'separator-text',
  'field-text',
  'section',

  'value-left',
  'value-center',
  'value-right',
];

@Directive({
  selector: '[class-directive]'
})
export class ClassDirective implements OnInit {

  @Input('class-directive') class = '';
  constructor(
    protected elementRef: ElementRef,
    protected renderer: Renderer,
  ) {
  }

  ngOnInit() {
    this.updateElementClasses();
  }

  protected updateElementClasses(additional_class_list = []) {
    let class_list = this.class.split(' ');
    for (let i = 0; i < class_list.length; i++) {
      let class_name = class_list[i];
      if (ALLOWED_CLASS_LIST.indexOf(class_name) !== -1 || additional_class_list.indexOf(class_name) !== -1) {
        this.renderer.setElementClass(this.elementRef.nativeElement, class_name, true);
      }
    }
  }
}
