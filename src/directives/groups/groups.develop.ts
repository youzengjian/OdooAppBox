// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Directive, Input } from '@angular/core';
import { GroupsDirective } from './groups';

@Directive({
  selector: '[groups-directive-develop]' // Attribute selector
})
export class GroupsDirectiveDevelop extends GroupsDirective {
  @Input('groups-directive-develop') groups;
}


