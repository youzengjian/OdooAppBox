// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Directive, Input, OnInit } from '@angular/core';
import { ClassDirective } from './class';
const ALLOWED_CLASS_LIST_DEVELOP = [
];

@Directive({
  selector: '[class-directive-develop]'
})
export class ClassDirectiveDevelop extends ClassDirective implements OnInit {
  @Input('class-directive-develop') class = '';

  ngOnInit() {
    this.updateElementClasses(ALLOWED_CLASS_LIST_DEVELOP);
  }
}
