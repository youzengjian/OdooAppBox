// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Directive, ElementRef, Renderer, OnInit, Input } from '@angular/core';
import { DomainProvider } from '../../providers/odoo/domain';
import { ExceptionActionDefinition, CommonProvider } from '../../providers/common/common';

@Directive({
  selector: '[attrs-directive]', // Attribute selector
  host: {
    '[class.invisible]': 'invisible',
  },
})
export class AttrsDirective implements OnInit {

  @Input('attrs-directive') attrs = '';
  @Input('record') record = {};
  @Input('current_page') current_page = null;
  public invisible = true;
  constructor(
    protected elementRef: ElementRef,
    protected renderer: Renderer,
    protected domainProvider: DomainProvider,
    private commonProvider: CommonProvider,
  ) {
  }

  updateDisplayOptions(display_error: boolean) {
    if (this.attrs['invisible']) {
      let exception_action = new ExceptionActionDefinition(false, display_error, {});
      this.invisible = this.domainProvider.compute(this.attrs['invisible'], this.record, exception_action);
    }
  }

  ngOnInit() {
    this.updateDisplayOptions(true);
    if (this.commonProvider.isPageForm(this.current_page)) {
      this.current_page.onRecordChange().subscribe(() => {
        this.updateDisplayOptions(false);
      })
    }
  }
}
