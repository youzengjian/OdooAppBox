// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { CookieModule } from 'ngx-cookie';
import { HttpModule } from '@angular/http';
import { HttpClientModule } from '@angular/common/http';

import { MyApp } from './app.component';
import { OdooProvider } from '../providers/odoo/odoo';
import { AppViewProvider } from '../providers/app-view/app-view';
import { CommonProvider } from '../providers/common/common';
import { Camera } from '@ionic-native/camera';
import { IonicImageViewerModule } from 'ionic-img-viewer';
import { DomainProvider } from '../providers/odoo/domain';
import { AppActionProvider } from '../providers/app-action/app-action';
import { GlobalErrorProvider } from '../providers/global-error/global-error';
import { FileOpener } from '@ionic-native/file-opener';
import { FileTransfer, FileTransferObject } from '@ionic-native/file-transfer';
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { File } from '@ionic-native/file';
import { AppVersion } from '@ionic-native/app-version';
import { ComponentsModule } from '../components/components.module';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { DatePipe } from '@angular/common';
import { CodePush } from '@ionic-native/code-push';
import { QRCodeModule } from 'angular2-qrcode';
import { HideKeyboardModule } from 'hide-keyboard';
import { KeyboardKeyProvider } from '../providers/keyboard-key/keyboard-key';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpProvider } from '../providers/http/http';
import { HTTP } from '@ionic-native/http';
import { TranslateLoaderHttpProvider } from '../providers/translate-loader-http/translate-loader-http';

export function HttpLoaderFactory(http: TranslateLoaderHttpProvider) {
  let httpNew:any = http;
  return new TranslateHttpLoader(httpNew, '', '');
  // return new TranslateHttpLoader(httpNew, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    MyApp,
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    HttpModule,
    CookieModule.forRoot(),
    IonicImageViewerModule,
    ComponentsModule,
    QRCodeModule,
    HideKeyboardModule,
    HttpClientModule,
    TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [TranslateLoaderHttpProvider]
        }
     }
    )
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: GlobalErrorProvider},
    OdooProvider,
    AppViewProvider,
    CommonProvider,
    Camera,
    DomainProvider,
    AppActionProvider,
    FileOpener,
    FileTransfer,
    FileTransferObject,
    File,
    AndroidPermissions,
    AppVersion,
    ScreenOrientation,
    DatePipe,
    CodePush,
    KeyboardKeyProvider,
    TranslateService,
    HttpProvider,
    HTTP,
    TranslateLoaderHttpProvider,
  ]
})
export class AppModule {}
