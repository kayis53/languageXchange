import { Component, OnInit } from '@angular/core';
import { Storage, getDownloadURL, ref, uploadBytes } from '@angular/fire/storage';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth/auth.service';
import { ImageCroppedEvent, LoadedImage } from 'ngx-image-cropper';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.page.html',
  styleUrls: ['./edit.page.scss'],
})
export class EditPage implements OnInit {

  isLoading: boolean = false;
  currentUser: any;

  textAreaValue: string = '';
  textAreaDisabled: boolean = true;

  cUser : Subscription;

  uploadedImageURL: string = '';

  imageChangedEvent: any = '';
  croppedImage: any = '';

  constructor(
    private authService: AuthService,
    private toastController: ToastController,
    private router: Router,
    private storage: Storage,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    this.getProfileInfo();
  }

  getProfileInfo() {
    //showLoader();
    this.isLoading = true;
    this.authService.getUserData();
    
    this.cUser = this.authService._cUser.subscribe(cUser => {
      if(cUser) {
        this.currentUser = cUser;
        this.textAreaValue = cUser.aboutMe;
        this.textAreaDisabled = true;
      }
    });
    //hideLoader();
    this.isLoading = false;
  }

  ngOnDestroy() {
    this.cUser.unsubscribe();
  }

  //
  // Image Cropper Test
  //

  fileChangeEvent(event: any): void {
    this.imageChangedEvent = event;
  }
  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = this.sanitizer.bypassSecurityTrustUrl(event.objectUrl);
    // event.blob can be used to upload the cropped image
  }
  imageLoaded(image?: LoadedImage) {
      // show cropper
  }
  cropperReady() {
      // cropper ready
  }
  loadImageFailed() {
      // show message
  }

  //
  // To Upload Profile and Other Images
  //

  async changePP() {
    this.isLoading = true;
    await this.takePictureOrUploadImage();
    if(this.uploadedImageURL != '') {
      this.currentUser.photo = this.uploadedImageURL;
      this.uploadedImageURL = '';
    }
    await this.authService.updateUserProfilePictureURL(this.currentUser).then(() => {
      this.presentToast('Profile Picture Updated.');
      this.isLoading = false;
    });
  }

  deletePP() {
    this.presentToast('At least one profile picture required.');
  }

  async addOtherPhotos() {
    this.isLoading = true;
    await this.takePictureOrUploadImage();
    if(this.uploadedImageURL != '') {
      this.currentUser.otherPhotos.push(this.uploadedImageURL);
      this.uploadedImageURL = '';
    }
    await this.authService.updateUserOtherPhotos(this.currentUser).then(() => {
      this.presentToast('Other Image Added.');
      this.isLoading = false;
    });
  }

  deleteOtherPhotos(image) {
    this.isLoading = true;
    this.currentUser.otherPhotos = this.currentUser.otherPhotos.filter(item => item !== image);
    this.authService.updateUserOtherPhotos(this.currentUser).then(() => {
      this.presentToast('Other Image Deleted.');
      this.isLoading = false;
    });
  }

  async takePictureOrUploadImage() {
    try {
      if(Capacitor.getPlatform() != 'web') await Camera.requestPermissions();

      const image = await Camera.getPhoto({
        quality: 100,
        allowEditing: true,
        source: CameraSource.Prompt,
        resultType: CameraResultType.DataUrl
      }).then(async (image) => {
        console.log('image:', image);
        const blob = this.dataURLtoBlob(image.dataUrl);
        const url = await this.uploadImage(blob, image);
        console.log('url: ', url);
        this.uploadedImageURL = url;
      }).catch((error) => {
        console.log(error);
      })

    } catch (e) {
      console.log(e); 
    }
  }

  dataURLtoBlob(dataurl: any) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
  }

  async uploadImage(blob: any, imageData: any) {
    try {
      const currentDate = Date.now();
      const filePath = `users/${this.currentUser.uid}/${currentDate}.${imageData.format}`;
      const fileRef = ref(this.storage, filePath);
      const task = await uploadBytes(fileRef, blob);
      console.log('task: ', task);
      const url = getDownloadURL(fileRef);
      return url;
    } catch(e) {
      throw(e);
    }    
  }

  //
  // Edit About Me
  //

  ionInputAboutMe(event) {
    if(event.target.value != this.currentUser.aboutMe) {
      this.textAreaDisabled = false;
    } else { this.textAreaDisabled = true; }
    this.currentUser.aboutMe = event.target.value;
  }

  saveAboutMe() {
    this.isLoading = true;
    this.authService.updateUserAboutData(this.currentUser).then(() => {
      this.presentToast('About me saved.');
      this.isLoading = false;
    })
  }

  //
  // Edit Languages
  //

  editLanguages() {
    this.router.navigate(['/home/profile/edit/languages']);
  }

  deleteLanguage(language) {
    this.isLoading = true;
    this.currentUser.studyLanguages = this.currentUser.studyLanguages.filter(item => item !== language);
    this.currentUser.languagesArray = this.currentUser.languagesArray.filter(item => item !== language.code);
    this.authService.updateUserStudyLanguagesData(this.currentUser).then(() => {
      this.presentToast('Language deleted.');
      this.isLoading = false;
    });
  }

  //
  // Present Toast
  //

  async presentToast(msg: string) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 1500,
      position: 'bottom',
    });

    await toast.present();
  }

}