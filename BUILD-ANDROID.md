## 安卓APP打包说明
本文档为安卓手机APP打包说明，如需iPhone APP打包，请[点击这里](https://github.com/youzengjian/OdooAppBox/blob/master/BUILD-IPHONE.md)查看

## 基础环境
* 操作系统：Windows 10 64位
* IDE：Visual Stuido Code
* nodejs：8.15.0
* npm 6.4.1
* ionic：3.20.0
* cordova：8.1.2

## APP编译
1. APP定制
    修改APP信息：打开[config.xml](https://github.com/youzengjian/OdooAppBox/blob/master/config.xml)文件，找到如下代码，修改包名(id属性)和版本号(version属性)
    ```
    <widget id="com.odooappbox" version="1.0.3" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
    ...
    ```
    修改Odoo服务器信息：打开[login.ts](https://github.com/youzengjian/OdooAppBox/blob/master/src/pages/login/login.ts)文件，找到如下代码，修改服务器地址和数据库名称
    ```
    export class LoginPage{
    public host = 'http://demo.appbox.atknit.com';
    public db = 'odoo12-demo';
    ...
    ```
2. 命令行进入代码根目录后，执行如下命令：
`ionic cordova build android --release --optimizejs --minifycss --minifyjs`
    > 注意：如果命令行中提示升级ionic版本，请不要升级，否则将导致后续编译失败
3. 使用数字证书对apk签名
    如何对apk进行签名，请自行查找相关资料
