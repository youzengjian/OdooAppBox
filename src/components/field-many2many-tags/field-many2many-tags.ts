// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Component, Input, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonProvider, ExceptionActionDefinition } from '../../providers/common/common';
import { OdooProvider } from '../../providers/odoo/odoo';
import { DomainProvider } from '../../providers/odoo/domain';
import { NavController } from 'ionic-angular';
import { RelationalFieldComponent } from '../relational-field/relational-field';
import { TranslateService } from '@ngx-translate/core';

const FIELD_MANY2MANY_TAGS_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => FieldMany2manyTagsComponent),
  multi: true
};

@Component({
  selector: 'field-many2many-tags',
  host: {
    '[class.required]': 'required', 
    '[class.readonly]': 'readonly', 
    '[class.invisible]': 'invisible',
    '[class.editmode]': 'is_edit_mode',
    '[class.readmode]': '!is_edit_mode',
    '[class.nolabel]': 'nolabel',
    '(click)': 'onClick($event)',
  },
  templateUrl: 'field-many2many-tags.html',
  providers: [FIELD_MANY2MANY_TAGS_VALUE_ACCESSOR],
})
export class FieldMany2manyTagsComponent extends RelationalFieldComponent {
  @Input() placeholder;
  private init_value = [];
  public loadingState;
  public records = [];
  public errorMessage;
  constructor(
    protected odooProvider: OdooProvider,
    protected commonProvider: CommonProvider,
    protected domainProvider: DomainProvider,
    protected translate: TranslateService,
    private navCtrl: NavController,
  ) {
    super(odooProvider, commonProvider, domainProvider, translate);
  }

  ngOnInit() {
    super.ngOnInit();
    this.init_value = this.commonProvider.deepClone(this.record[this.name]) || [];
  }

  get relation_res_model() {
    return this.field_definition['relation'];
  }

  get this_component() {
    return this;
  }

  get has_right_read() {
    if (this.relation_res_model && this.model_access_rights.hasOwnProperty(this.relation_res_model)) {
      return this.model_access_rights[this.relation_res_model].read;
    } else {
      return false;
    }
  }

  get has_right_write() {
    if (this.relation_res_model && this.model_access_rights.hasOwnProperty(this.relation_res_model)) {
      return this.model_access_rights[this.relation_res_model].write;
    } else {
      return false;
    }
  }

  get has_right_create() {
    if (this.relation_res_model && this.model_access_rights.hasOwnProperty(this.relation_res_model)) {
      return this.model_access_rights[this.relation_res_model].create;
    } else {
      return false;
    }
  }

  get has_right_unlink() {
    if (this.relation_res_model && this.model_access_rights.hasOwnProperty(this.relation_res_model)) {
      return this.model_access_rights[this.relation_res_model].unlink;
    } else {
      return false;
    }
  }

  loadRecords(res_ids) {
    this.loadingState = 'loading';
    let context = this.odooProvider.mergeContext([this.odooProvider.user_context, this.context]);
    let res_model = this.field_definition.relation;
    let domain = [];
    try {
      // 这边如果domain合并错误需要设置一些变量，同时这边的错误会直接作为组件的一部分在界面上显示
      // 所以让combineDomain函数直接抛出异常，且不显示错误消息
      // 如果发生了异常，则终止后续的记录加载操作
      let exception_action = new ExceptionActionDefinition(true, false, []);

      // 重新计算ids，解决form表单中点击明细行打开form视图修改many2many字段后回到原form视图
      // 出现该明细行看板视图中many2many字段显示错误的问题
      let ids = [];
      for (let res_id_item of res_ids) {
        if (typeof(res_id_item) === 'number') {
          ids.push(res_id_item);
        } else if (res_id_item instanceof Array && res_id_item.length == 2) {
          ids.push(res_id_item[1]);
        } else {
          this.loadingState = 'failed';
          this.errorMessage = this.translate.instant("Error data:") + JSON.stringify(res_ids);
          return;
        }
      }
      domain = this.domainProvider.combineDomain(this.domain, [['id', 'in', ids]], '&', exception_action);
    } catch(error) {
      this.loadingState = 'failed';
      this.errorMessage = error.message;
      return;
    }

    this.odooProvider.call(res_model, 'search_read', [domain, ['id', 'display_name'], 0, null, null], {context: context}).subscribe(
      res => {

        if (res.error) {
          this.loadingState = 'failed';
          this.errorMessage = (res.error.data && res.error.data.message) || res.error.message;
        } else {
          this.loadingState = 'success';
          res.forEach(res_item => {
            res_item.res_model = res_model,
            res_item.component_type = 'kanban';
            res_item.parent = this.record;
          });
          this.records = this.commonProvider.deepClone(res);
        }
      }, error => {
        this.loadingState = 'failed';
        this.errorMessage = error.message;
      }
    )
  }

  get_record_ids(value) {
    let record_ids = [];
    if (!value) {
      return record_ids;
    }
    for( let item of value) {
      if (typeof(item) === 'number') {
        record_ids.push(item);
      } else if (item instanceof Array && item.length === 2 && item[0] === 4 && typeof(item[1] === 'number')) {
        record_ids.push(item[1]);
      } else if (typeof(item) === 'object' && item.hasOwnProperty('id') && !this.commonProvider.isNewRecordId(item.id)) {
        record_ids.push(item.id);
      }
    }
    return record_ids;
  }

  get init_record_ids() {
    return this.get_record_ids(this.init_value);
  }

  writeValue(value: any) {
    if(!value || !value.length) {
      this.records = [];
      this.loadingState = 'success';
      this.propagateChange([]);
      return;
    } else {
      this.propagateChange(value);
      this.loadRecords(this.get_record_ids(value));
    }
  }

  _propagateChange() {
    let records_ids = [];
    this.records.forEach((item) => {
      records_ids.push(item.id);
    });

    // 从初始值复制一份后处理得到新的值
    let new_value = this.commonProvider.deepClone(this.init_record_ids);

    // 标记被删除的记录
    for (let init_record_id of this.init_record_ids) {
      if (records_ids.indexOf(init_record_id) === -1) {
        let index = new_value.indexOf(init_record_id)
        // 不删除对应的记录，仅切断主从关系
        new_value[index] = [3, init_record_id];
      }
    }

    // 标记新增的记录
    this.records.forEach(item => {
      if (this.init_record_ids.indexOf(item.id) === -1) {
        new_value.push([4, item.id]);
      }
    });
    this.propagateChange(new_value);
  }

  delete_record(event, record) {
    event.stopPropagation();
    this.records.forEach((item, index, arr) => {
      if(record == item) {
        arr.splice(index, 1);
      }
    })
    this._propagateChange();
  }

  onClick(event) {
    this.validate_error_message = '';
    if (!this.is_edit_mode) {
      return;
    }
    event.stopPropagation();
    let res_ids = [];
    this.records.forEach(record => {
      res_ids.push(record.id);
    })

    // 这边如果domain合并错误直接抛出异常，由默认错误处理钩子捕获处理
    let exception_action = new ExceptionActionDefinition(true, true, []);
    let domain = this.domainProvider.combineDomain(this.domain, [['id', 'not in', res_ids]], '&', exception_action);
    let params = {
      'src_page': this.current_page,
      'src_component': this,
      'action_name': this.label,
      'action_res_model': this.relation_res_model, 
      'action_view_search': this.view_search_ref,
      'action_context': this.context,
      'action_domain': domain,
      'action_options': this.options,
    };
    this.navCtrl.push('KanbanPage', params);
  }

  updateRecord(record, record_origin) {
    let records_ids = [];
    this.records.forEach((item) => {
      records_ids.push(item.id);
    });

    let index = records_ids.indexOf(record.id);
    if (index >= 0) {
      // 记录已存在则更新
      for(let key in record) {
        // 排除component_type和parent字段，避免数据错误
        if (['component_type', 'parent'].indexOf(key) === -1) {
          this.records[index][key] = record[key];
        }
      }
    } else {
      // 记录不存在则添加
      this.records.push(record);
    }
    this._propagateChange();
  }

  validateData() {
    if (this.is_edit_mode && this.required && !this.records.length) {
      this.validate_error_message = this.translate.instant("This field is required");
      return false;
    } else {
      return true;
    }
  }

  clear(event) {
    event.stopPropagation();
    this.validate_error_message = '';
    this.writeValue([]);
  }
}
