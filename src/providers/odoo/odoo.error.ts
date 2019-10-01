// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { TranslateService } from "@ngx-translate/core";

export class OdooError extends Error {
  constructor(
    translate: TranslateService,
    message, 
    public error_code='odoo_error_unknown',) {
    super(message);
  }
}

export class OdooVersionTooLow extends OdooError {
  constructor(
    translate: TranslateService) {
    super(translate, translate.instant("The version of odoo must be greater than 8.0"), 'odoo_error_version_too_low');
  }
}

export class OdooErrorOperation extends OdooError {
  constructor(
    translate: TranslateService,
    message) {
    super(translate, message, 'odoo_error_operation');
  }
}

export class OdooErrorRouteNotFound extends OdooError {
  constructor(
    translate: TranslateService,
    message) {
    super(translate, message, 'odoo_error_route_not_found');
  }
}

// 服务器返回200 OK，会话无效
export class OdooErrorSessionInvalid extends OdooError {
  constructor(
    translate: TranslateService) {
    super(translate, translate.instant("Invalid session, please relogin"), 'odoo_error_session_invalid');
  }
}

// 服务器返回200 OK，会话已过期
export class OdooErrorSessionExpired extends OdooError {
  constructor(
    translate: TranslateService) {
    super(translate, translate.instant("Session expired, please relogin"), 'odoo_error_session_expired');
  }
}

export class OdooErrorConnectFailed extends OdooError{
  constructor(
    translate: TranslateService) {
    super(translate, translate.instant("Connect server failed:"), 'odoo_error_connect_failed');
  }
}

// HTTP 400 错误
export class OdooErrorBadRequest extends OdooError {
  constructor(
    translate: TranslateService) {
    super(translate, translate.instant("Bad request(400)"), 'odoo_error_bad_request');
  }
}

// HTTP 404 错误
export class OdooErrorNotFound extends OdooError {
  constructor(
    translate: TranslateService) {
    super(translate, translate.instant("Bad request(404)"), 'odoo_error_not_found');
  }
}

// HTTP 500 错误
export class OdooErrorInternal extends OdooError {
  constructor(
    translate: TranslateService) {
    super(translate, translate.instant("Internal server error(500)"), 'odoo_error_internal');
  }
}
