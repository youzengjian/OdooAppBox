// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { KanbanPage } from './kanban';
import { ComponentsModule } from '../../components/components.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    KanbanPage,
  ],
  imports: [
    IonicPageModule.forChild(KanbanPage),
    ComponentsModule,
    TranslateModule,
  ],
})
export class KanbanPageModule {}
