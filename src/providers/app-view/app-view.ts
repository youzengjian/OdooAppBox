// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { OdooProvider } from '../odoo/odoo';
import { CommonProvider, ExceptionActionDefinition } from '../common/common';
import { DomainProvider } from '../odoo/domain';
import { OdooError } from '../odoo/odoo.error';
import { TranslateService } from '@ngx-translate/core';

const ATTR_XPATH_KEY = 'path_key';
const TEMPORARY_FIELD_ATTRIBUTES = [
  ATTR_XPATH_KEY,
  'options',
  'attrs',
  'context',
  'domain',
]
const LIST_TYPE_ALL = 'all';
const LIST_TYPE_BINARY = 'binary';
const LIST_TYPE_EXCEPT_BINARY = 'except_binary';
const USER_INPUT_JSON_ATTRS = [
  'options',
  'attrs',
  'context',
  'domain',
];
const VIEW_TYPE_LIST = ['kanban', 'form'];
export const DEFAULT_KANBAN_TEMPLATE = `<kanban><field name="display_name" string="{{'Name' | translate}}" attrs="{'nolabel': false}"></field></kanban>`;
const DIRECTIVE_SUFFIX = '-directive';
const DIRECTIVES = {
  'groups': ['field'], //表示对groups指令处理时，排除field节点
  'style': [], //style指令支持所有节点 
  'class': [],
  'attrs': ['kanban', 'form', 'search', 'field', 'footer', 'button'],
};
const VALID_ELEMENT_LIST = [
  'kanban',
  'form',
  'search',
  'field',
  'div',
  'footer',
  'button',
  'badge',
]

export interface AdvanceOptions {
  disable_no_more_data?: boolean;
  replace_directives_version?: string;
}

@Injectable()
export class AppViewProvider {
  private caching = {};
  private cache = {};
  private access_rights_model_list = [];
  private access_rights_cache = {};
  private access_rights_cache_time = 0;
  private access_rights_caching = false;
  constructor(
    private odooProvider: OdooProvider,
    private commonProvider: CommonProvider,
    private domainProvider: DomainProvider,
    private translate: TranslateService,
  ) {
  }

  public clearCache() {
    this.cache = {};
    this.caching = {};
    this.access_rights_model_list = [];
    this.access_rights_cache = {};
    this.access_rights_cache_time = 0;
    this.access_rights_caching = false;
  }

  private parseFields(element) {
    let fields = {};
    let x=element.children;
    for (let i=0; i < x.length; i++)
    {
      let nodeName = x[i].nodeName;
      let attrName = x[i].getAttribute('name');
      let widget = x[i].getAttribute('widget');
      let on_change = x[i].getAttribute('on_change');
      if (nodeName == 'field' && attrName) {
        if (attrName.indexOf(' ') !== -1) {
          // 字段名称中包含空格，直接跳过，避免后续引发各种异常
          continue;
        };
        let xpath_key = attrName + '_' + new Date().getTime() + '_' + Math.round(1000000 * Math.random());
        x[i].setAttribute(ATTR_XPATH_KEY, xpath_key);
        fields[attrName] = {name: attrName, widget: widget, on_change: on_change, xpath: '//field[@' + ATTR_XPATH_KEY + '=\'' + xpath_key + '\']'};
      } else {
        if (x[i].children.length) {
          fields = Object.assign(fields, this.parseFields(x[i]));
        }
      }
    }
    return fields;
  }

  private getFieldList(fieldsData, list_type) {
    let fieldList = [];
    for(let fieldName in fieldsData) {
      // 返回全部字段
      if (list_type === LIST_TYPE_ALL) {
        fieldList.push(fieldName);
        continue;
      }

      // definition未定义，字段类型未知，跳过
      if (!fieldsData[fieldName].definition) {
        continue;
      }

      let fieldType = fieldsData[fieldName].definition.type.toLowerCase();
      // 只返回二进制数据类型的字段
      if(list_type == LIST_TYPE_BINARY && fieldType == 'binary') {
        fieldList.push(fieldName);
        continue;
      }

      // 只返回非二进制数据类型的字段
      if(list_type == LIST_TYPE_EXCEPT_BINARY && fieldType != 'binary') {
        fieldList.push(fieldName);
        // monetary类型的字段需要额外获取相关currency_field字段的值
        // 对于低版本odoo使用integer或float字段设置widget=monetary实现monetary字段的功能
        // 对于这类字段在rebuildFieldElements方法中会将currency_field信息补充到definition中
        let currency_field = fieldsData[fieldName].definition.currency_field
        if (['monetary', 'integer', 'float'].indexOf(fieldType) !== -1 && currency_field) {
          fieldList.push(currency_field);
        }
      }
    }
    return fieldList;
  }

  // 获取fieldsDataNeedGetDefinition中所有字段的定义，并返回
  private parseFieldsDefinition(res_model, fieldsData) {
    return new Observable((observer) => {
      let fieldListAll = this.getFieldList(fieldsData, LIST_TYPE_ALL);
      if (!fieldListAll.length) {
        return observer.error(new OdooError(this.translate, this.translate.instant("A view must include at least one field!")));
      }
      let context = this.odooProvider.mergeContext([this.odooProvider.user_context, {'add_onchange': true}]);
      this.odooProvider.call(res_model, 'fields_get', [fieldListAll], {context: context}).subscribe(
        res => {
          for(let fieldName in fieldsData) {
            fieldsData[fieldName].definition = res[fieldName];
            if (fieldsData[fieldName].on_change && fieldsData[fieldName].definition) {
              fieldsData[fieldName].definition.appbox_onchange = fieldsData[fieldName].on_change;
            }
          }
          return observer.next();
        },
        (error) => {
          return observer.error(error);
        }
      );
    })
  }

  private removeSelfCloseTag(str) {
    let regCloseTag = /<[^>]+\/>/,
        regTagName = /[^<][^\s]+/,
        tmp,
        tagName;
    while((tmp = str.match(regCloseTag)) && tmp.length > 0){
        tagName = tmp[0].match(regTagName);
        str = str.replace(/\/>/, '></'+tagName+'>');
    }
    return str;
  }

  private replaceAttribute(str) {
    str = this.commonProvider.strReplaceAll(str, 'input_attr_record', '[record]');
    str = this.commonProvider.strReplaceAll(str, 'input_attr_model_access_rights', '[model_access_rights]');
    str = this.commonProvider.strReplaceAll(str, 'input_attr_child_templates', '[child_templates]');
    str = this.commonProvider.strReplaceAll(str, 'input_attr_current_page', '[current_page]');
    str = this.commonProvider.strReplaceAll(str, 'input_attr_monetary', '[monetary]');
    str = this.commonProvider.strReplaceAll(str, 'input_attr_image_avatar', '[image_avatar]');
    str = this.commonProvider.strReplaceAll(str, 'attr_ngModel', '[(ngModel)]');
    str = this.commonProvider.strReplaceAll(str, 'json_attrs', '[json_attrs]');
    str = this.commonProvider.strReplaceAll(str, 'attr_appfield_query_str', '#appfield');
    str = this.commonProvider.strReplaceAll(str, 'attr_tabbtnitemid_', '#');
    str = this.commonProvider.strReplaceAll(str, 'attr_tabitemid_', '#');
    str = this.commonProvider.strReplaceAll(str, 'event_click', '(click)');
    return str;
  }

  private replaceElement(element, newElementName) {
    let newElement = document.createElement(newElementName);
    for(let attribute_item of element.attributes) {
      newElement.setAttribute(attribute_item.name, attribute_item.value);
    }
    newElement.innerHTML = element.innerHTML;
    element.parentNode.replaceChild(newElement, element);
    return newElement;
  }

  // 对用户设置的值为JSON类型的属性进行预处理，以便正确解析
  private getStrJsonAttrs(element, attr_name) {
    let str_attr = element.getAttribute(attr_name);
    if (!str_attr) {
      return;
    }
    str_attr = this.commonProvider.strReplaceAll(str_attr, "'", '"');
    str_attr = this.commonProvider.strReplaceAll(str_attr, "\\(", '\[');
    str_attr = this.commonProvider.strReplaceAll(str_attr, "\\)", '\]');
    str_attr = this.commonProvider.strReplaceAll(str_attr, "\"none\"", "\"_real_n_o_n_e_\"");
    str_attr = this.commonProvider.strReplaceAll(str_attr, "none", "null");
    str_attr = this.commonProvider.strReplaceAll(str_attr, "\"_real_n_o_n_e_\"", "\"none\"");
    // 以下两行保证各种形式的true和false都会被转换为全小写的格式
    str_attr = this.commonProvider.strReplaceAll(str_attr, 'true', 'true');
    str_attr = this.commonProvider.strReplaceAll(str_attr, 'false', 'false');
    if ('context' === attr_name) {
      // 使用正则表达式对context进行预处理,对于引用当前视图其他字段值得参数加上record.的前缀
      // 对于true、false、null和非字母开头的参数不做处理
      let reg=new RegExp('(:\\s*)((?!true[\\s},])(?!false[\\s},])(?!null[\\s},])[a-z][a-z0-9\\._]*)',"ig");
      str_attr = str_attr.replace(reg, '$1"record.$2"');
    }
    if ('domain' === attr_name) {
      // 使用正则表达式对context进行预处理,对于引用当前视图其他字段值得参数加上record.的前缀
      // 对于true、false、null、context.get('xxx')和非字母开头的参数不做处理
      let reg=new RegExp('(,\\s*)((?!true[\\s\\]])(?!false[\\s\\]])(?!null[\\s\\]])(?!context\\.get\\[[\'|\"][a-zA-Z0-9_-]*[\'|\"]\\])[a-z][a-z0-9\\._]*)',"ig");
      str_attr = str_attr.replace(reg, '$1"record.$2"');
    }
    return str_attr;
  }
  
  private preprocessUserInputAttrs(element) {
    let json_attrs = {};
    USER_INPUT_JSON_ATTRS.forEach(attr_name => {
      json_attrs[attr_name] = this.getStrJsonAttrs(element, attr_name);
    });
    element.setAttribute('json_attrs', JSON.stringify(json_attrs));
  }

  private getChildViewTemplate(element, fieldName, view_type) {
    let evaluator = new XPathEvaluator(); 
    let result = evaluator.evaluate('//field[@name="' + fieldName + '"]/' + view_type, element, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    
    if (result) {
      let view_element = <Element>result.singleNodeValue;
      return (view_element && view_element.outerHTML) || '';
    } else {
      return '';
    }
  }

  private getChildViewTemplates(view_arch, fieldName) {
    let parser = new DOMParser();
    let xmlDoc = parser.parseFromString(view_arch, 'text/xml');
    let templates = {};
    for (let i = 0; i < VIEW_TYPE_LIST.length; i++) {
      let view_type = VIEW_TYPE_LIST[i];
      templates[view_type] = this.getChildViewTemplate(xmlDoc.documentElement, fieldName, view_type);
    }
    return templates;
  }

  private rebuildFieldElements(fieldsData, xmlDoc, res_model, origin_view_arch) {
    let evaluator = new XPathEvaluator(); 
    let unknown_fields = [];
    for(let fieldName in fieldsData){
      let fieldNode = evaluator.evaluate(fieldsData[fieldName].xpath, xmlDoc.documentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      let element = <Element>fieldNode.singleNodeValue;
      if (!fieldsData[fieldName].definition) {
        // 无法识别的字段，从视图中移除
        unknown_fields.push(res_model + '.' + fieldName);
        element.remove();
        continue;
      }
      let fieldType = fieldsData[fieldName].definition.type.toLowerCase();
      let widget = fieldsData[fieldName].widget;
      element.setAttribute('input_attr_record', 'record');
      element.setAttribute('input_attr_model_access_rights', 'model_access_rights')
      element.setAttribute('input_attr_current_page', 'current_page');
      element.setAttribute('attr_ngModel', 'record.' + fieldName);
      element.setAttribute('attr_appfield_query_str', '');
      element.classList.add('field-item');
      this.preprocessUserInputAttrs(element);
      element.innerHTML = ""; // 统一清理所有field元素内部的元素，减少出错的可能
      if (fieldType === "one2many") {
        element.setAttribute('child_templates', JSON.stringify(this.getChildViewTemplates(origin_view_arch, fieldName)));
        this.replaceElement(element, 'field-one2many');
      } else if ( fieldType === "many2many") {
        this.replaceElement(element, 'field-many2many-tags');
      } else if (fieldType === 'integer' || fieldType === 'float' || fieldType === 'monetary') {
        if (widget === 'monetary') {
          element.setAttribute('input_attr_monetary', 'true');
          let str_options = element.getAttribute('options') || '{}';
          let options = this.commonProvider.get_options(str_options, {throw_exception: false, display_error_message: false, value_when_exception: {}});
          if (options.hasOwnProperty('currency_field')) {
            fieldsData[fieldName].definition.currency_field = options['currency_field'];
          }
          if (!fieldsData[fieldName].definition.currency_field) {
            fieldsData[fieldName].definition.currency_field = 'currency_id';
          }
        }
        this.replaceElement(element, 'field-number');
      } else if (fieldType === 'text') {
        this.replaceElement(element, 'field-char');
      } else if (fieldType === 'html') {
        this.replaceElement(element, 'field-html');
      } else if (fieldType === 'date') {
        this.replaceElement(element, 'field-datetime');
      } else if (fieldType === 'binary' && widget === 'image') {
        this.replaceElement(element, 'field-image');
      } else if (fieldType === 'binary' && widget === 'avatar') {
        element.setAttribute('input_attr_image_avatar', 'true');
        this.replaceElement(element, 'field-image');
      } else {
        this.replaceElement(element, 'field-' + fieldType);
      }
    }
    return unknown_fields;
  }

  preprocessAllButtonElement(element) {
    let children=element.children;
    for (let i=0; i < children.length; i++)
    {
      this.preprocessAllButtonElement(children[i]);
    }
    if (element.nodeName === 'button') {
      element.setAttribute('input_attr_current_page', 'current_page');
      element.setAttribute('input_attr_record', 'record');
      this.preprocessUserInputAttrs(element);
      this.replaceElement(element, 'page-button');
    }
  }

  parseTemplateFooterButtons(element) {
    let evaluator = new XPathEvaluator(); 
    let result = evaluator.evaluate(`footer`, element, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    let footerElement = <Element>result.singleNodeValue;

    if (!footerElement) {
      return '';
    }
    let templateFooterButtons = footerElement.innerHTML;
    footerElement.remove();
    return templateFooterButtons;
  }
 
  private removeTemporaryAttrbuitesFromXml(element) {
    let children=element.children;
    for (let i=0; i < children.length; i++)
    {
      this.removeTemporaryAttrbuitesFromXml(children[i]);
    }
    for (let j=0; j < TEMPORARY_FIELD_ATTRIBUTES.length; j++) {
      element.removeAttribute(TEMPORARY_FIELD_ATTRIBUTES[j]);
    }
  }

  private removeFieldElement(element) {
    let children=element.children;
    for (let i=0; i < children.length; i++)
    {
      this.removeFieldElement(children[i]);
    }
    if (element.nodeName === 'field') {
      element.remove();
    }
  }

  private show_unknown_fields(unknown_fields) {
    // 字段无法识别可能是由于没有权限，也可能是由于字段不存在
    // 如果要区分出没有权限且已经设置了groups限制显示的字段技术上比较麻烦
    // 因此统一不再显示未知字段的提示
    // if (unknown_fields.length == 0) {
    //   return;
    // }
    // let msg = '无法识别的字段：\r\n' + unknown_fields.join('\r\n');
    // this.commonProvider.displayErrorMessage(msg, false);
  }

  private getFirstElement(element, xpath) {
    let evaluator = new XPathEvaluator(); 
    let resultTabs = evaluator.evaluate(xpath, element, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return <Element>resultTabs.singleNodeValue;
  }

  private preprocessAllTabs(element) {
    let tabsIndex = 0;
    while(true) {
      let tabsElement = this.getFirstElement(element, '//div[@widget="tabs"]')
      if (!tabsElement) {
        break;
      }
      let tabIndex = 0;
      let tabBtnsElement = document.createElement('div');
      tabBtnsElement.classList.add('tab_btns')
      tabsElement.insertBefore(tabBtnsElement, tabsElement.firstElementChild);
      while(true) {
        let tabElement = this.getFirstElement(tabsElement, 'div[@widget="tab"]')
        if (!tabElement) {
          break;
        }
        let tabBtnItemId = `tabs${tabsIndex}tab_btn${tabIndex}`
        let tabItemId = `tabs${tabsIndex}tab${tabIndex}`
        let tabBtnElement = document.createElement('div');
        for (let i = 0; i < tabElement.attributes.length; i++) {
          tabBtnElement.setAttribute(tabElement.attributes[i].name, tabElement.attributes[i].value);
        }
        
        tabBtnElement.setAttribute(`attr_tabbtnitemid_${tabBtnItemId}`, '');
        tabBtnElement.setAttribute('event_click', `switchToTab(${tabBtnItemId}, ${tabItemId})`);
        tabBtnElement.innerHTML = tabElement.getAttribute('string');
        tabBtnElement.classList.add('tab_btn');
        tabBtnsElement.appendChild(tabBtnElement);
        tabElement.setAttribute(`attr_tabitemid_${tabItemId}`, '');
        tabElement.removeAttribute('widget');
        tabElement.classList.add('tab');
        // 默认设置第一个tab为active
        if(tabIndex === 0) {
          tabBtnElement.classList.add('active');
          tabElement.classList.add('active');
        } else {
          tabBtnElement.classList.remove('active');
          tabElement.classList.remove('active');
        }
        tabIndex++;
      }
      tabsElement.classList.add('tabs');
      tabsElement.removeAttribute('widget');
      tabsIndex++;
    }
    
  }

  // 将除field、button以外的所有节点的groups属性名称都修改为groups-directive
  // 以便和field、button组件的输入属性groups区分开来
  private preprocessElementDirective(element, directive_version) {
    let children=element.children;
    for (let i=0; i < children.length; i++)
    {
      this.preprocessElementDirective(children[i], directive_version);
    }

    for (let origin_name in DIRECTIVES) {
      let except_node_names = DIRECTIVES[origin_name];
      let new_directive_name = origin_name + DIRECTIVE_SUFFIX;
      if (directive_version) {
        new_directive_name += ('-' + directive_version);
      }
      if (except_node_names.indexOf(element.nodeName) === -1 && element.hasAttribute(origin_name)) {
        if (origin_name === 'attrs') {
          let str_attr = this.getStrJsonAttrs(element, origin_name);
          element.setAttribute(new_directive_name, str_attr);
          element.setAttribute('input_attr_record', 'record');
          element.setAttribute('input_attr_current_page', 'current_page');
        } else {
          let str_attr = element.getAttribute(origin_name);
          element.setAttribute(new_directive_name, '\'' + str_attr + '\'');
        }
        element.removeAttribute(origin_name);
      }
    }
  }

  private replaceAttrDirectives(str, directive_version) {
    for (let origin_name in DIRECTIVES) {
      let new_directive_name = origin_name + DIRECTIVE_SUFFIX;
      if (directive_version) {
        new_directive_name += ('-' + directive_version);
      }
      str = this.commonProvider.strReplaceAll(str, new_directive_name , '[' + new_directive_name + ']');
    }
    return str;
  }

  private removeAllInvalidElement(element) {
    let children=element.children;
    for (let i=0; i < children.length; i++)
    {
      this.removeAllInvalidElement(children[i]);
    }
    if (VALID_ELEMENT_LIST.indexOf(element.nodeName) === -1) {
      element.remove();
    }
  }

  update_model_access_rights(model_list, template_info, observer) {
    this.access_rights_cache_time = new Date().getTime();
    this.access_rights_caching = true;
    for(let model_name of model_list) {
      if (this.access_rights_model_list.indexOf(model_name) === -1) {
        this.access_rights_model_list.push(model_name);
      }
    }

    this.odooProvider.get_access_rights(this.access_rights_model_list).subscribe(res => {
      this.access_rights_cache = res;
      template_info['model_access_rights'] = this.access_rights_cache;
      this.access_rights_caching = false;
      observer.next(template_info);
    }, error => {
      this.access_rights_caching = false;
      observer.error(error);
    })
  }

  addAccessRightsAndReturn(res_model, template_info, observer) {
    let fieldListExceptBinary = template_info['fieldListExceptBinary'];
    let fieldsDefinition = template_info['fieldsDefinition'];
    let model_list = [res_model];
    for (let field_name of fieldListExceptBinary) {
      // 排除可能没有定义的字段但合法的字段，如用于格式化货币的currency_id字段
      if (!fieldsDefinition[field_name]) {
        continue;
      }
      let field_type = fieldsDefinition[field_name].type.toLowerCase();
      if (['many2one', 'one2many', 'many2many'].indexOf(field_type) !== -1) {
        let model = fieldsDefinition[field_name].relation;
        if (model_list.indexOf(model) === -1) {
          model_list.push(model);
        }
      } else if (field_type === 'reference') {
        for(let item of fieldsDefinition[field_name].selection) {
          if (item instanceof Array && item.length ===2 && model_list.indexOf(item[0]) === -1) {
            model_list.push(item[0]);
          }
        }
      }
    }

    // 离上次缓存超过5分钟，重新更新
    let t = new Date().getTime();
    if (t - this.access_rights_cache_time > 300 * 1000) {
      return this.update_model_access_rights(model_list, template_info, observer);
    }

    for (let model_name of model_list) {
      // 只要有任意一个需要更新，就更新全部
      if (this.access_rights_model_list.indexOf(model_name) === -1) {
        return this.update_model_access_rights(model_list, template_info, observer);
      }
    }

    // 正在缓存，则一段时间后重试
    if (this.access_rights_caching) {
      setTimeout(() => this.addAccessRightsAndReturn(res_model, template_info, observer), 50);
    } else {
      template_info['model_access_rights'] = this.access_rights_cache;
      observer.next(template_info);
    }
  }

  getFieldsDefinition(fieldsData) {
    let fieldsDefinition = {}
    for (let field_name in fieldsData) {
      fieldsDefinition[field_name] = fieldsData[field_name].definition;
    }
    return fieldsDefinition;
  }

  parseViewTemplate(res_model, view_arch, advance_options: AdvanceOptions = null) {
    return new Observable((observer) => {
        let key = res_model + view_arch;
        if (this.cache[key]) {
          this.show_unknown_fields(this.cache[key]['unknown_fields']);
          this.addAccessRightsAndReturn(res_model, this.cache[key], observer);
          return;
        } else if (this.caching[key]) {
          let interval = setInterval(() => {
            if (this.cache[key]) {
              this.show_unknown_fields(this.cache[key]['unknown_fields']);
              this.addAccessRightsAndReturn(res_model, this.cache[key], observer);
              clearInterval(interval);
              return;
            }
          }, 30);
          return;
        } else {
          this.caching[key] = true;
        }

        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(view_arch, 'text/xml');
        this.removeAllInvalidElement(xmlDoc.documentElement);
        let view_type = xmlDoc.documentElement.nodeName;
        if (VIEW_TYPE_LIST.indexOf(view_type) === -1) {
          let errorMessage = this.translate.instant("Unsupported view type:") + view_type;
          observer.error(new OdooError(this.translate, errorMessage));
          observer.complete();
          this.caching[key] = false;
          return;
        }
        let directive_version = advance_options && advance_options.replace_directives_version || '';
        this.preprocessElementDirective(xmlDoc.documentElement, directive_version);
        this.preprocessAllTabs(xmlDoc.documentElement);
        let fieldsData = this.parseFields(xmlDoc.documentElement);
        this.parseFieldsDefinition(res_model, fieldsData).subscribe( () => {
          let unknown_fields = this.rebuildFieldElements(fieldsData, xmlDoc, res_model, view_arch);
          let disable_no_more_data = advance_options && advance_options.disable_no_more_data || false;
          if (view_type === 'form' && !disable_no_more_data) {
            let element_no_more_data = document.createElement('div');
            element_no_more_data.innerText = this.translate.instant("No More Data");
            element_no_more_data.setAttribute("class", "no_more_data");
            xmlDoc.documentElement.appendChild(element_no_more_data);
          }

          if (view_type === 'form') {
            // Add "Powered by OdooAppBox", you must keep this information.
            let element_powered_by = document.createElement('div');
            element_powered_by.innerText = "Powered by OdooAppBox";
            element_powered_by.setAttribute("class", "powered_by");
            xmlDoc.documentElement.appendChild(element_powered_by);
          }

          // 通过前面的处理，正常情况下不应该还有field节点
          // 目前已知同一字段出现两次，会导致遗留一个field节点未解析
          // 针对这种情况，直接移除第二个出现的field即可
          this.removeFieldElement(xmlDoc.documentElement);
          this.preprocessAllButtonElement(xmlDoc.documentElement);
          let template_footer_buttons = this.parseTemplateFooterButtons(xmlDoc.documentElement);
          template_footer_buttons = this.removeSelfCloseTag(template_footer_buttons);
          template_footer_buttons = this.replaceAttribute(template_footer_buttons);
          // 必须放在最后，否则会导致用户输入的属性被清楚，导致无法生效
          this.removeTemporaryAttrbuitesFromXml(xmlDoc.documentElement);
          // 得到修改后的xml
          this.replaceElement(xmlDoc.documentElement, 'div');
          let template = xmlDoc.documentElement.outerHTML;
          template = this.removeSelfCloseTag(template);
          template = this.replaceAttribute(template);
          template = this.replaceAttrDirectives(template, directive_version);
          this.cache[key] = {
            'template': template, 
            'template_footer_buttons': template_footer_buttons,
            'unknown_fields': unknown_fields,
            'fieldListBinary': this.commonProvider.deepClone(this.getFieldList(fieldsData, LIST_TYPE_BINARY)), 
            'fieldListExceptBinary': this.commonProvider.deepClone(this.getFieldList(fieldsData, LIST_TYPE_EXCEPT_BINARY)), 
            'fieldsDefinition': this.commonProvider.deepClone(this.getFieldsDefinition(fieldsData))
          };
          this.caching[key] = false;
          this.show_unknown_fields(this.cache[key]['unknown_fields']);
          this.addAccessRightsAndReturn(res_model, this.cache[key], observer);
        }, (error) => {
          this.caching[key] = false;
          observer.error(error);
          observer.complete();
        }
      )
    })
  }

  // name、string、domain为必填项，如果为null则忽略该项
  // context语法错误则设置为null
  // domain语法错误则设置为null
  private parseSearchList(element) {
    let search_list = [];
    let evaluator = new XPathEvaluator(); 
    let result = evaluator.evaluate('/search/field', element, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    let searchElement = <Element>result.iterateNext();
    while(searchElement) {
      let name = searchElement.getAttribute('name');
      let string = searchElement.getAttribute('string');
      let domain = this.domainProvider.preprocessSearchDomainTemplate(searchElement.getAttribute('domain'), this.odooProvider.uid, this.odooProvider.time_offset_str);
      let exception_action = new ExceptionActionDefinition(false, true, {});
      let context = this.odooProvider.parseContext(searchElement.getAttribute('context'), false, exception_action);
      searchElement = <Element>result.iterateNext();
      if (!name || !string || !domain.length) {
        continue;
      }
      search_list.push({'name':name, 'string': string, 'context': context, 'domain': domain});
    }
    return search_list;
  }

  // filter_group的string为必填项，如果没有填写则忽略该项
  // filter的name、string、domain为必填项，如果为null则忽略该filter
  // context语法错误则设置为null
  // domain语法错误则设置为null
  private parseFilterGroupList(element) {
    let filter_group_list = [];
    let evaluator = new XPathEvaluator(); 
    let result = evaluator.evaluate('/search/filter_group', element, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    let filterGroupElement = <Element>result.iterateNext();
    let filter_group_index = 0;
    while(filterGroupElement) {
      let children=filterGroupElement.children;
      let filter_group_string = filterGroupElement.getAttribute('string');
      filterGroupElement = <Element>result.iterateNext();
      let filter_group = {'index': filter_group_index, 'string': filter_group_string, 'filter_list': []};
      filter_group_index++;
      for (let i=0; i < children.length; i++)
      {
        if (children[i].nodeName != 'filter') {
          continue;
        }
        let name = children[i].getAttribute('name');
        let string = children[i].getAttribute('string');
        let domain = this.domainProvider.preprocessSearchDomainTemplate(children[i].getAttribute('domain'), this.odooProvider.uid, this.odooProvider.time_offset_str);
        if (!name || !string || !domain.length) {
          continue;
        }
        let exception_action = new ExceptionActionDefinition(false, true, {});
        let context = this.odooProvider.parseContext(children[i].getAttribute('context'), false, exception_action);
        filter_group.filter_list.push({'name': name, 'string': string, 'context': context, 'domain': domain});
      }
      if (filter_group.filter_list.length) {
        filter_group_list.push(filter_group);
      }
    }
    return filter_group_list;
  }

  parseSearchView(view_arch, default_search_list) {
    return new Observable((observer) => {
      let parser = new DOMParser();
      let xmlDoc = parser.parseFromString(view_arch, 'text/xml');
      let search_list = this.parseSearchList(xmlDoc.documentElement);
      let filter_group_list = this.parseFilterGroupList(xmlDoc.documentElement);
      if (search_list.length == 0) {
        search_list = default_search_list;
      }
      observer.next({'search_list': search_list, 'filter_group_list': filter_group_list});
    })
  }
}
