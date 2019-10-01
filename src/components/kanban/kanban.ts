// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Component, Input, OnChanges, ViewContainerRef, ViewChild, Compiler, NgModule } from '@angular/core';
import { ComponentsModule } from '../components.module';
import { FormsModule } from '@angular/forms';
import { DirectivesModule } from '../../directives/directives.module';
import { CommonModule } from '@angular/common';
import { CommonProvider } from '../../providers/common/common';
import { TranslateModule } from '@ngx-translate/core';

const INPUT_PROPERTY_LIST = [
  'current_page',
  'res_model',
  'view_form',
  'view_form_ref',
  'context',
  'template',
  'model_access_rights',
  'record',
]

@Component({
  selector: 'kanban',
  templateUrl: 'kanban.html'
})
export class KanbanComponent implements OnChanges{
  private dynamicComponent;
  @Input() current_page;
  @Input() parent_component;
  @Input() res_model;
  @Input() view_form;
  @Input() view_form_ref;
  @Input() context;
  @Input() template;
  @Input() model_access_rights;
  @Input() record;
  @Input() options;
  @ViewChild("container", { read: ViewContainerRef }) container: ViewContainerRef;
  constructor(
    private compiler: Compiler,
    private commonProvider: CommonProvider,
  ) {
  }

  createComponent() {
    let template = this.template;
    @Component({
      template: template,
    })
    class DynamicComponent {
      public current_page;
      public res_model;
      public view_form;
      public view_form_ref;
      public context;
      public record;
      constructor(
      ) {
      }
      init_params(parent) {
        // 参数值传递
        INPUT_PROPERTY_LIST.forEach((key) => {
          this[key] = parent[key];
        })
      }
    }

    @NgModule({
      declarations: [
        DynamicComponent
      ],
      imports: [
        ComponentsModule,
        FormsModule,
        CommonModule,
        DirectivesModule,
        TranslateModule,
      ]
    })
    class DynamicModule {}
    let factory = this.commonProvider.kanban_component_cache[this.template];
    if (!factory) {
      factory = this.compiler.compileModuleAndAllComponentsSync(DynamicModule)
      .componentFactories.find(comFac=>comFac.componentType===DynamicComponent);
      this.commonProvider.kanban_component_cache[this.template] = factory;
    }
    this.container.clear();
    this.dynamicComponent = this.container.createComponent(factory);
    this.dynamicComponent.instance.init_params(this);
  }

  ngOnChanges(changes) {
    // 只要模板变化，则重新创建组件
    if ('template' in changes) {
      this.createComponent();
      return;
    }

    // 其他输入参数变化时直接将新的值传递给组件即可
    
    for(let key in changes) {
      if (INPUT_PROPERTY_LIST.indexOf(key) != -1) {
        this.dynamicComponent.instance[key] = changes[key].currentValue;
      }
    }
  }

  updateRecord(record, record_origin) {
    this.record = this.commonProvider.deepClone(record);
    this.createComponent();
  }

  get no_open() {
    return this.options['no_open'] || false;
  }

  get no_edit() {
    return this.options['no_edit'] || false;
  }

  get no_create() {
    return this.options['no_create'] || false;
  }

  get no_delete() {
    return this.options['no_delete'] || false;
  }
}
