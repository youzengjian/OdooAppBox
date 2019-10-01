// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Injectable } from '@angular/core';
import { CommonProvider, ExceptionActionDefinition } from '../common/common';
import { OdooError } from './odoo.error';
import { DatePipe } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';


@Injectable()
export class DomainProvider {
  constructor(
    private commonProvider: CommonProvider,
    private datePipe: DatePipe,
    private translate: TranslateService,
  ) {
  }

  //将domain中省略的'&'符号补充完整，避免多个domain组合时出现非预期的结果
	//如：有domain A=[('test1', '=', '1'),('test2', '=', '2')]和domain B[('test3', '=', '3')]
  //未补充'&'的情况下:
  //    直接计算 A | B 展开得到错误结果  ['|', ('test1', '=', '1'),('test2', '=', '2'), ('test3', '=', '3')]
  // 补充'&'后:
  //    A = ['&', ('test1', '=', '1'),('test2', '=', '2')]
  //    计算 A | B 展开得到正确结果['|', '&', ('test1', '=', '1'),('test2', '=', '2'), ('test3', '=', '3')]
  private getCompleteDomain_throw(domain) {
    let expected = -1;
    domain.forEach((domain_item) => {
      if (domain_item === "&" || domain_item === "|") {
        expected--;
      } else if (domain_item !== "!") {
        expected++;
      }
    });
    for (let i = 0; i < expected; i++) {
      domain.unshift('&');
    }
    if (expected < 0 && domain.length > 0) {
      throw new OdooError(this.translate, this.translate.instant("Parse domain expression failed:") + JSON.stringify(domain));
    }
    return domain;
  }

  // operator：'&','|'
  public combineDomain(domain1, domain2, operator: string, exception_action: ExceptionActionDefinition) {
    try {
      let domain = this.getCompleteDomain_throw(domain1);
      domain = domain.concat(this.getCompleteDomain_throw(domain2));
      if (domain1.length > 0 && domain2.length > 0) {
        domain.unshift(operator);
      }
      return domain;      
    } catch(error) {
      return this.commonProvider.do_exception_action(error, exception_action);
    }
  }

  // 将domain中的变量名称使用具体的值代替
  public parseSearchDomainTemplate(domain_template, key, value) {
    let domain = [];
    domain_template.forEach(domain_template_item => {
      let domain_item = domain_template_item.slice(0);
      if(Array.isArray(domain_item) && domain_item.length == 3 && domain_item[2] == key) {
        domain_item[2] = value;
      }
      domain.push(domain_item);
    });
    return domain;
  }

  preprocess_str_format(str_format) {
    str_format = str_format.replace(new RegExp('%Y',"g"), 'y');
    str_format = str_format.replace(new RegExp('%m',"g"), 'MM');
    str_format = str_format.replace(new RegExp('%d',"g"), 'dd');
    str_format = str_format.replace(new RegExp('%H',"g"), 'HH');
    str_format = str_format.replace(new RegExp('%M',"g"), 'mm');
    str_format = str_format.replace(new RegExp('%S',"g"), 'ss');
    return str_format;
  }

  // UTC时间格式
  time_strftime(str_format) {
    str_format = this.preprocess_str_format(str_format);
    return this.datePipe.transform(new Date(), str_format);
  }

  // 用户时区时间格式化
  context_today_strftime(str_format, time_offset_str) {
    str_format = this.preprocess_str_format(str_format);
    return this.datePipe.transform(new Date(), str_format, time_offset_str);
  }

  // time_offset_str参数不能删除，该参数在调用eval方法时可能会用到
  public preprocessSearchDomainTemplate(str_domain, uid, time_offset_str) {
    if (typeof(str_domain) === 'string') {
      str_domain = this.commonProvider.strReplaceAll(str_domain, "'", '"');
      str_domain = this.commonProvider.strReplaceAll(str_domain, "self", '"self"');
      str_domain = this.commonProvider.strReplaceAll(str_domain, "uid", '"uid"');
      str_domain = this.commonProvider.strReplaceAll(str_domain, "\\(", "\[");
      str_domain = this.commonProvider.strReplaceAll(str_domain, "\\)", "\]");
      str_domain = this.commonProvider.strReplaceAll(str_domain, "none", "null");
      // 以下两行保证各种形式的true和false都会被转换为全小写的格式
      str_domain = this.commonProvider.strReplaceAll(str_domain, "true", "true");
      str_domain = this.commonProvider.strReplaceAll(str_domain, "false", "false");
      // context_today().strftime()和time.strftime()处理，注意这边小括号已经被替换成了中括号
      let reg=new RegExp(`context_today\\[\\]\\.strftime\\[(['"].*?['"])\\]`,"g");
      str_domain = str_domain.replace(reg, 'this.context_today_strftime($1, time_offset_str)');
      reg=new RegExp(`time\\.strftime\\[(['"].*?['"])\\]`,"g");
      str_domain = str_domain.replace(reg, 'this.time_strftime($1)');
      try {
        let domain = eval(str_domain);
        domain = this.parseSearchDomainTemplate(domain, 'uid', uid);
        return domain;
      }
      catch(exception) {
        return [];
      }
    } else if(str_domain instanceof Object) {
      // 兼容后台直接返回的dict格式的数据，而不是字符串
      return str_domain;
    } else {
      return [];
    }
  }

  private computeSingleDomain_throw(domain, record) {
    let field_value = domain[0];
    if (typeof(field_value) === 'string') {
      try {
        field_value = this.commonProvider.getFieldValue_throw(field_value, record);
      } catch {
        let str_tmp = this.commonProvider.strReplaceAll(JSON.stringify(domain), 'record.', '');
        throw new OdooError(this.translate, this.translate.instant("Parse domain expression failed:") + str_tmp);
      }
    }
    let operator = domain[1];
    let value = domain[2];
    
    switch (operator) {
      case "=":
      case "==":
          return this.commonProvider.equals(field_value, value);
      case "!=":
      case "<>":
          return !this.commonProvider.equals(field_value, value);
      case "<":
          return (field_value < value);
      case ">":
          return (field_value > value);
      case "<=":
          return (field_value <= value);
      case ">=":
          return (field_value >= value);
      case "in":
          value = (value instanceof Array)?value:[value];
          return value.indexOf(field_value) !== -1;
      case "not in":
          value = (value instanceof Array)?value:[value];
          return value.indexOf(field_value) === -1;
      case "like":
          return (field_value.indexOf(value) !== -1);
      case "ilike":
          return (field_value.toLowerCase().indexOf(value.toLowerCase()) !== -1);
      default:
          let str_tmp = this.commonProvider.strReplaceAll(JSON.stringify(domain), 'record.', '');
          throw new OdooError(this.translate, this.translate.instant("Parse domain expression failed:") + str_tmp);
      }
  }

  private computeDomain_throw(need_computed_domain, record) {
    let len = need_computed_domain.length;
    if (len === 1) {
      return need_computed_domain[0];
    }
    for (let i = 0; i < len; i++) {
      let domain_operation = ["&", "|", "|"];
      if (need_computed_domain[i] === '&' 
          && domain_operation.indexOf(need_computed_domain[i+1]) === -1 
          && domain_operation.indexOf(need_computed_domain[i+2]) === -1) {
            need_computed_domain[i] = need_computed_domain[i+1] && need_computed_domain[i+2];
            need_computed_domain.splice(i+1, 2);
        return this.computeDomain_throw(need_computed_domain, record);
      } else if (need_computed_domain[i] === '|' 
                 && domain_operation.indexOf(need_computed_domain[i+1]) === -1 
                 && domain_operation.indexOf(need_computed_domain[i+2]) === -1) {
                  need_computed_domain[i] = need_computed_domain[i+1] || need_computed_domain[i+2];
                  need_computed_domain.splice(i+1, 2);
        return this.computeDomain_throw(need_computed_domain, record);
      } else if (need_computed_domain[i] === '!'
                 && domain_operation.indexOf(need_computed_domain[i+1]) === -1) {
                  need_computed_domain[i] = !need_computed_domain[i+1];
                  need_computed_domain.splice(i+1, 1);
        return this.computeDomain_throw(need_computed_domain, record);
      }
    }
    throw new OdooError(this.translate, this.translate.instant("Parse domain expression failed!"));
  }

  compute(domain, record, exception_action: ExceptionActionDefinition) {
    if (domain === true || (typeof(domain) === "number" && domain === 1)) {
      return true;
    }

    if (domain === false || (typeof(domain) === "number" && domain === 0)) {
      return false;
    }

    // 后面需要对domain进行修改，复制一份使用
    let domain_temp = this.commonProvider.deepClone(domain);
    try {
      let need_computed_domain = this.getCompleteDomain_throw(domain_temp);
      for (let i = 0; i < need_computed_domain.length; i++) {
        let data = need_computed_domain[i];
        if(data instanceof Array && data.length == 3) {
          need_computed_domain[i] = this.computeSingleDomain_throw(data, record)
        }
      }
      return this.computeDomain_throw(need_computed_domain, record);      
    } catch(error) {
      return this.commonProvider.do_exception_action(error, exception_action);
    }
  }

  compute_attrs(str_attrs, record, exception_action: ExceptionActionDefinition) {
    if (str_attrs) {
      try {
        let attrs = {};
        // 让内部调用的两个可能抛出异常的函数如果遇到异常，只是单纯的抛出即可，这样才可以在这边进行统一处理
        let exception_action_inner = new ExceptionActionDefinition(true, false, null);
        let origin_attrs = this.commonProvider.parseJsonStr_throw(str_attrs, exception_action_inner);
        for (let key in origin_attrs) {
          attrs[key] = this.compute(origin_attrs[key], record, exception_action_inner);
        }
        return attrs;
      } catch(error) {
        let str_tmp = this.commonProvider.strReplaceAll(str_attrs, 'record.', '')
        error.message = this.translate.instant("Parse attrs expression failed:") + str_tmp;
        return this.commonProvider.do_exception_action(error, exception_action);
      }
    } else {
      return {};
    }
  }

  get_domain_expression(str_domain, record, context, exception_action: ExceptionActionDefinition) {
    if (str_domain) {
      try {
        let reg = new RegExp('(,\\s*)context\\.get\\[[\'|\"]([a-zA-Z0-9_-]+)[\'|\"]\\]',"g");
        const CONTEXT_GET_STR = '_context_get_';
        str_domain = str_domain.replace(reg, '$1\"' + CONTEXT_GET_STR + '$2\"');
        let domain = this.commonProvider.parseJsonStr_throw(str_domain);
        domain.forEach(domain_item => {
          if (domain_item instanceof Array && domain_item.length === 3 && typeof(domain_item[2]) === 'string') {
            if (domain_item[2].startsWith('record.')) {
              domain_item[2] = this.commonProvider.getFieldValue_throw(domain_item[2], record);
            } else if (domain_item[2].startsWith(CONTEXT_GET_STR)) {
              let key = domain_item[2].substring(CONTEXT_GET_STR.length);
              domain_item[2] = context[key] || false;
            }
          }
        })
        return domain;           
      } catch(error) {
        let str_tmp = this.commonProvider.strReplaceAll(str_domain, 'record.', '')
        error.message = this.translate.instant("Parse domain expression failed:") + str_tmp;
        return this.commonProvider.do_exception_action(error, exception_action);
      }
    } else {
      return [];
    }
  }
}
