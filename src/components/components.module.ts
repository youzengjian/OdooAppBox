// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { NgModule } from '@angular/core';
import { FieldCharComponent } from './field-char/field-char';
import { FieldHtmlComponent } from './field-html/field-html';
import { FieldOne2manyComponent } from './field-one2many/field-one2many';
import { KanbanComponent } from './kanban/kanban';
import { CommonModule } from '@angular/common';
import { IonicModule } from 'ionic-angular';
import { FieldBooleanComponent } from './field-boolean/field-boolean';
import { FieldNumberComponent } from './field-number/field-number';
import { FieldMany2oneComponent } from './field-many2one/field-many2one';
import { FieldSelectionComponent } from './field-selection/field-selection';
import { FieldDatetimeComponent } from './field-datetime/field-datetime';
import { FieldImageComponent } from './field-image/field-image';
import { FieldReferenceComponent } from './field-reference/field-reference';
import { PageButtonComponent } from './page-button/page-button';
import { FieldMany2manyTagsComponent } from './field-many2many-tags/field-many2many-tags';
import { FieldBinaryComponent } from './field-binary/field-binary';
import { AppImgComponent } from './app-img/app-img';
import { AppMenuTypeOneComponent } from './app-menu-type-one/app-menu-type-one';
import { AppMenuTypeTwoComponent } from './app-menu-type-two/app-menu-type-two';
import { BadgeComponent } from './badge/badge';
import { TranslateModule } from '@ngx-translate/core';
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
	declarations: [
		FieldCharComponent,
		FieldHtmlComponent,
		FieldOne2manyComponent,
		KanbanComponent,
    	FieldBooleanComponent,
    	FieldNumberComponent,
    	FieldMany2oneComponent,
    	FieldSelectionComponent,
    	FieldDatetimeComponent,
    	FieldImageComponent,
    	FieldReferenceComponent,
    	PageButtonComponent,
    	FieldMany2manyTagsComponent,
    	FieldBinaryComponent,
		AppImgComponent,
    	AppMenuTypeOneComponent,
    	AppMenuTypeTwoComponent,
		BadgeComponent,
	],
	imports: [
		CommonModule,
		IonicModule,
		TranslateModule,
		PipesModule,
	],
	exports: [
		FieldCharComponent,
		FieldHtmlComponent,
		FieldOne2manyComponent,
		KanbanComponent,
    	FieldBooleanComponent,
    	FieldNumberComponent,
    	FieldMany2oneComponent,
    	FieldSelectionComponent,
    	FieldDatetimeComponent,
    	FieldImageComponent,
    	FieldReferenceComponent,
    	PageButtonComponent,
    	FieldMany2manyTagsComponent,
    	FieldBinaryComponent,
		AppImgComponent,
    	AppMenuTypeOneComponent,
    	AppMenuTypeTwoComponent,
    	BadgeComponent,
	]
})
export class ComponentsModule {}
