// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Directive, Input } from '@angular/core';
import { AttrsDirective } from './attrs';

@Directive({
  selector: '[attrs-directive-develop]' // Attribute selector
})
export class AttrsDirectiveDevelop extends AttrsDirective {

  @Input('attrs-directive-develop') attrs = '';

}
