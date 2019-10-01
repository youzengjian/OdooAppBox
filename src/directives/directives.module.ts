// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { NgModule } from '@angular/core';
import { GroupsDirective } from './groups/groups';
import { StyleDirective } from './style/style';
import { ClassDirective } from './class/class';
import { StyleDirectiveDevelop } from './style/style.develop';
import { ClassDirectiveDevelop } from './class/class.develop';
import { GroupsDirectiveDevelop } from './groups/groups.develop';
import { AttrsDirective } from './attrs/attrs';
import { AttrsDirectiveDevelop } from './attrs/attrs.develop';
@NgModule({
	declarations: [
		GroupsDirective,
		GroupsDirectiveDevelop,
		StyleDirective,
		StyleDirectiveDevelop,
		ClassDirective,
		ClassDirectiveDevelop,
		AttrsDirective,
		AttrsDirectiveDevelop,
	],
	imports: [],
	exports: [
		GroupsDirective,
		GroupsDirectiveDevelop,
		StyleDirective,
		StyleDirectiveDevelop,
		ClassDirective,
		ClassDirectiveDevelop,
		AttrsDirective,
		AttrsDirectiveDevelop,
	]
})
export class DirectivesModule {}
