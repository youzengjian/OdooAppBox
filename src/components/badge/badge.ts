// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Component, Input } from '@angular/core';

@Component({
  selector: 'badge',
  templateUrl: 'badge.html'
})
export class BadgeComponent {
  @Input() icon;
  constructor() {
  }

}
