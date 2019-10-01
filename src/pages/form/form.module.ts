// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { FormPage } from './form';
import { ComponentsModule } from '../../components/components.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    FormPage,
  ],
  imports: [
    IonicPageModule.forChild(FormPage),
    ComponentsModule,
    TranslateModule,
  ],
})
export class FormPageModule {}
