## Build iPhone APP
If you want to build Android APP, Please click [here](https://github.com/youzengjian/OdooAppBox/blob/master/BUILD-ANDROID-en.md)

## Build Environment
* OS: macOS Mojave(Version 10.14.3)
* IDE: Visual Stuido Code
* Xcode: 10.2.1
* nodejs: 10.16.0
* npm: 6.9.0
* ionic: 3.20.1
* cordova: 9.0.0

## Customize and Build
1. Customize
    Customize App Info: Open [config.xml](https://github.com/youzengjian/OdooAppBox/blob/master/config.xml), modify id and version
    ```
    <widget id="com.odooappbox" version="1.0.3" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
    ...
    ```
    Customize Odoo Server Info: Open [login.ts](https://github.com/youzengjian/OdooAppBox/blob/master/src/pages/login/login.ts), modify host and db
    ```
    export class LoginPage{
    public host = 'http://demo.appbox.atknit.com';
    public db = 'odoo12-demo';
    ...
    ```
2. Build cmd:
`ionic cordova build ios --release --optimizejs --minifycss --minifyjs`

3. Build with Xcode and release it
    Just Google it
    > Xcode project file: platforms/ios/OdooAppBox.xcodeproj