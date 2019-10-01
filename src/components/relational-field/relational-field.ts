// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Component, Input } from '@angular/core';
import { BaseFieldComponent } from '../base-field/base-field';
import { ExceptionActionDefinition } from '../../providers/common/common';

@Component({
  selector: 'relational-field',
  templateUrl: 'relational-field.html'
})
export abstract class RelationalFieldComponent extends BaseFieldComponent {
  // 以下属性是用户通过视图xml配置的
  @Input() view_kanban_ref;
  @Input() view_form_ref;
  @Input() view_search_ref;

  private _domain;

  get context() {
    let exception_action = new ExceptionActionDefinition(false, true, {});
    return this.commonProvider.compute_context(this.json_attrs['context'], this.record, exception_action);
  }

  get domain() {
    // 如果发生异常，则设置domain为id=0，进行严格的限制（id=0，则所有记录都会被过滤）
    let exception_action = new ExceptionActionDefinition(false, true, [['id', '=', 0]]);
    let context = this.odooProvider.mergeContext([this.current_page.context, this.context]);
    return this._domain || this.domainProvider.get_domain_expression(this.json_attrs['domain'], this.record, context, exception_action);
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

  updateDomain(domain) {
    this._domain = domain;
  }
}
