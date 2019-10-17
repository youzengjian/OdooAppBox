## Build Android APP
If you want to build iPhone APP, Please click [here](https://github.com/youzengjian/OdooAppBox/blob/master/BUILD-IPHONE-en.md)

## Build Environment
* OS: Windows 10 X64
* IDE: Visual Stuido Code
* nodejs: 8.15.0
* npm: 6.4.1
* ionic: 3.20.0
* cordova: 8.1.2

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
`ionic cordova build android --release --optimizejs --minifycss --minifyjs`
    > Notice: Do not update ionic
3. Signed Apk
    Just google it