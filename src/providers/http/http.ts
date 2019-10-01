// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Injectable } from '@angular/core';
import { Subscriber } from 'rxjs/Subscriber';
import { RequestOptionsArgs, Response, Http } from '@angular/http';
import { OdooErrorSessionInvalid, OdooErrorSessionExpired, OdooError, OdooErrorBadRequest, OdooErrorNotFound, OdooErrorInternal, OdooErrorConnectFailed } from '../odoo/odoo.error';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/timeout';
import { ODOO_NETWORK_TIME_OUT } from '../common/common';
import { HTTP, HTTPResponse } from '@ionic-native/http';
import VConsole from 'vconsole';
import { File, FileEntry } from '@ionic-native/file';
import * as forge from 'node-forge';

@Injectable()
export class HttpProvider {

  constructor(
    private translate: TranslateService,
    private http: Http,
    private httpNative: HTTP,
    private file: File,
  ) {
    // new VConsole();
  }

  private postResponseHandle(res: Response, observer: Subscriber<Response>) {
    let res_json: JSON;
    res_json = res.json();
    if (!res_json['error']) {
        return observer.next(res.json().result);
    }

    if (res_json['error']['code'] === 200) {
        return observer.next(res.json());
    }

    if (res_json['error']['code'] === 100 && res_json['error']['message'] === 'Odoo Session Invalid') {
        throw new OdooErrorSessionInvalid(this.translate);
    } else if (res_json['error']['code'] === 100 && res_json['error']['message'] === 'Odoo Session Expired') {
        throw new OdooErrorSessionExpired(this.translate);
    }
    return observer.error(new OdooError(this.translate, this.translate.instant("Unknown error")));
  }

  private errorHandle(error: any, observer: Subscriber<Response>) {
      if (error.status === 400) {
          return observer.error(new OdooErrorBadRequest(this.translate));
      } else if (error.status === 404) {
          return observer.error(new OdooErrorNotFound(this.translate));
      } else if (error.status === 500) {
          return observer.error(new OdooErrorInternal(this.translate));
      } else {
          return observer.error(new OdooErrorConnectFailed(this.translate));
      }
  }

  private _get_by_angular_http(url: string, options?: RequestOptionsArgs): Observable<any> {
    return new Observable((observer) => {
        this.http.get(url, options).subscribe(
        (res: Response) => { 
          try {
            observer.next(res.json());
          } catch {
            observer.next(res.text());
          }
        },
        error => this.errorHandle(error, observer));
    });
  }

  private _get_by_native_http(url: string, options?: RequestOptionsArgs): Observable<any> {
    if (options && options.headers) {
      options.headers.keys().forEach(key => {
        this.httpNative.setHeader('*', key, options.headers.get(key));
      })
    }

    return new Observable((observer) => {
      this.httpNative.get(url, {}, {}).then((res: HTTPResponse) => {
        try {
          observer.next(JSON.parse(res.data));
        } catch {
          observer.next(res.data);
        }
      }).catch((error) => {
        this.errorHandle(error, observer);
      })
    })
  }

  get(url: string, options?: RequestOptionsArgs): Observable<any> {
      return this._get_by_native_http(url, options);
  }
 
  private _post_by_angular_http(url: string, body: string, options?: RequestOptionsArgs): Observable<Response> {
    return new Observable((observer) => {
        this.http.post(url, body, options).timeout(ODOO_NETWORK_TIME_OUT).subscribe(
            res => this.postResponseHandle(res, observer),
            error => this.errorHandle(error, observer));
    });
  }

  private _post_by_native_http(url: string, body:string, options?: RequestOptionsArgs): Observable<any> {
    if (options && options.headers) {
      options.headers.keys().forEach(key => {
        this.httpNative.setHeader(url, key, options.headers.get(key));
      })
    }
    return new Observable((observer) => {
      this.httpNative.setDataSerializer('json');
      this.httpNative.post(url, JSON.parse(body), {}).then((res: HTTPResponse) => {
        observer.next(JSON.parse(res.data).result);
      }).catch((error) => {
        this.errorHandle(error, observer);
      })
    })
  }

  post(url: string, body: string, options?: RequestOptionsArgs): Observable<Response> {
    return this._post_by_native_http(url, body, options);
  }

  private get_image_by_angular_http(url:string, options?: RequestOptionsArgs): Observable<any>{
    return new Observable((observer) => {
      this.http.get(url, options).subscribe(
      (res: Response) => { 
        let dataurl = URL.createObjectURL(res.json());
        observer.next(dataurl);
      },
      error => this.errorHandle(error, observer));
    });
  }

  private get_image_by_native_http(url:string, options?: RequestOptionsArgs): Observable<any>{
    if (options && options.headers) {
      options.headers.keys().forEach(key => {
        this.httpNative.setHeader(url, key, options.headers.get(key));
      })
    }

    return new Observable((observer) => {
      let md5 = forge.md.md5.create();
      md5.update(url);
      let fileName = md5.digest().toHex();
      this.httpNative.downloadFile(url, {}, {}, this.file.cacheDirectory + fileName).then(
        (res:FileEntry) => {
          res.file((fileObj) => {
            let fileRender = new FileReader();
            fileRender.onload = function(e:any) {observer.next(e.target.result);};
            fileRender.readAsDataURL(fileObj);
          }, err => {
            console.log('fileEntry to file failed...' + JSON.stringify(err));
          })
        }
      ).catch((error) => {
        this.errorHandle(error, observer);
      })
    });
  }

  // 由于使用native http的get方法获取到的图像数据没有找到办法显示
  // 需要使用downloadFile方法下载文件到本地后显示，所以单独做了这个接口
  get_image(url, options?: RequestOptionsArgs){
    return this.get_image_by_native_http(url, options);
  }
}
