// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { Component, forwardRef, ViewChild, OnDestroy, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { OdooProvider } from '../../providers/odoo/odoo';
import { ActionSheetController, ToastController } from 'ionic-angular';
import { PLACE_HOLDER_IMG_SRC, CommonProvider } from '../../providers/common/common';
import { CameraOptions, Camera } from '@ionic-native/camera';
import { ImageViewerController, ImageViewer } from 'ionic-img-viewer';
import { DomainProvider } from '../../providers/odoo/domain';
import { BaseFieldComponent } from '../base-field/base-field';
import { ResponseContentType, Headers } from '@angular/http';
import { TranslateService } from '@ngx-translate/core';
import { HttpProvider } from '../../providers/http/http';

const FIELD_IMAGE_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => FieldImageComponent),
  multi: true
};
@Component({
  selector: 'field-image',
  host: {
    '[class.required]': 'required', 
    '[class.readonly]': 'readonly', 
    '[class.invisible]': 'invisible',
    '[class.editmode]': 'is_edit_mode',
    '[class.readmode]': '!is_edit_mode',
    '[class.nolabel]': 'nolabel',
    '(click)': 'onClick($event)',
  },
  templateUrl: 'field-image.html',
  providers: [FIELD_IMAGE_VALUE_ACCESSOR],
})

export class FieldImageComponent extends BaseFieldComponent implements OnDestroy{
  @ViewChild('img') img;
  @Input('width') width;
  @Input('height') height;
  @Input('image_avatar') image_avatar = false;
  public value;
  private imageViewer: ImageViewer;
  constructor(
    protected odooProvider: OdooProvider,
    protected commonProvider: CommonProvider,
    protected domainProvider: DomainProvider,
    protected translate: TranslateService,
    private actionSheetController: ActionSheetController,
    private camera: Camera,
    private toastController: ToastController,
    private imageViewerController: ImageViewerController,
    private http: HttpProvider,
  ) {
    super(odooProvider, commonProvider, domainProvider, translate);
  }

  ngOnDestroy() {
    if (this.imageViewer) {
      this.imageViewer.dismiss();
    }
  }

  get_img_src(width, height) {
    if (width > 0 && width < 128) {
      width = 128;
    }
    if (height > 0 && height < 128) {
      height = 128;
    }
    if ('string' === typeof(this.value)) {
      // 字符数量小于64字符，说明是二进制数据大小的文本
      if (this.value.length < 64) {
        return this.odooProvider.get_img_url(this.res_model, this.res_id, this.name, width, height);
      } else {
        return 'data:image/jpeg;base64,' + this.value;
      }
    } else {
      return PLACE_HOLDER_IMG_SRC;
    }
  }

  get thumbnail_src() {
    return this.get_img_src(this.int_px_img_width, this.int_px_img_height);
  }

  get int_px_img_width() {
    return this.commonProvider.convertToInt(this.width, 40);
  }

  get int_px_img_height() {
    return this.commonProvider.convertToInt(this.height, 40);
  }

  get str_rem_img_width() {
    return this.int_px_img_width/10 + 'rem';
  }

  get str_rem_img_height() {
    return this.int_px_img_height/10 + 'rem';
  }

  writeValue(value) {
    this.value = value;
    this.propagateChange(this.value);
  }

  getImgFromNativeCamera(sourceType, errMsg) {
    let cameraOptions: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.DATA_URL,
      sourceType: sourceType,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      correctOrientation: true,
    }

    this.camera.getPicture(cameraOptions).then((imageData) => {
     this.writeValue(imageData);
    }, (err) => {
      this.toastController.create({
        message: errMsg,
        duration: 3000,
        position: 'bottom',
      }).present();
    });
  }

  deleteImage() {
    this.writeValue(0);
  }

  previewImage() {
    let url = this.get_img_src(0, 0);
    let headers = new Headers({
      "X-Openerp-Session-Id": this.odooProvider.session_id,
    });
    this.http.get_image(url, {headers: headers, responseType: ResponseContentType.Blob}).subscribe(
      res => {
        let img = new Image();
        img.src = res;
        this.imageViewer = this.imageViewerController.create(img, {enableBackdropDismiss: true});
        this.imageViewer.present();
      }, () => {
        let err_msg = this.translate.instant('Preview image failed!');
        this.commonProvider.displayErrorMessage(err_msg, true);
      }
    )
  }

  chooseImage() {
    let err_msg = this.translate.instant('Choose image failed!');
    this.getImgFromNativeCamera(this.camera.PictureSourceType.PHOTOLIBRARY, err_msg);
  }

  takePhoto() {
    this.getImgFromNativeCamera(this.camera.PictureSourceType.CAMERA, 
      this.translate.instant("Take a photo failed!"));
  }

  get actionSheetButtons() {
    let buttons = [];
    if (this.value) {
      buttons.push({
        text: this.translate.instant("Delete image"),
        role: 'destructive',
        handler: () => {this.deleteImage();},
      });
      
      buttons.push({
        text: this.translate.instant("Preview image"),
        handler: () => {this.previewImage();},
      });
    }

    buttons.push({
      text: this.translate.instant("Choose From Album"),
      handler: () => {this.chooseImage();},
    });
    buttons.push({
      text: this.translate.instant("Take a photo"),
      handler: () => {this.takePhoto();},
    });
    buttons.push({
      text: this.translate.instant("Cancel"),
      role: 'cancel',
      handler: () => {},
    });
    return buttons;
  }

  onClick(event) {
    this.validate_error_message = '';
    if (this.is_edit_mode) {
      let actionSheet = this.actionSheetController.create({
        title: this.label,
        buttons: this.actionSheetButtons,
      })
      actionSheet.present();
      event.stopPropagation();
    } else if(this.record_component_type == 'form' && this.value) {
      this.previewImage();
      event.stopPropagation();
    }
  }

  validateData() {
    if (this.is_edit_mode && this.required && !this.value) {
      this.validate_error_message = this.translate.instant("This field is required");
      return false;
    } else {
      return true;
    }
  }
}
