// Part of OdooAppBox(https://github.com/youzengjian/OdooAppBox). 
// See README.md and LICENSE files for full copyright and licensing details.

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class TranslateLoaderHttpProvider {

  constructor(public http: HttpClient) {
  }

  get en() {
    return {};
  }

  get zh() {
    return {
      "Confirm": "确认",
      "Cancel": "取消", 
      "Submit": "提交",
      "Warning": "警告",
      "Discard": "放弃",
      "Save": "保存",
      "Edit": "编辑",
      "Error": "错误",
      "Update Log:": "更新日志:",
      "Get user information failed, please relogin!": "用户信息获取失败，请重新登陆！",
      "Change Password": "修改密码",
      "Old Password": "请输入旧密码",
      "New Password": "请输入新密码",
      "Confirm New Password": "请再输入一次新密码",
      "Change Password Success": "密码修改成功",
      "Change Password Failed": "密码修改失败",
      "Error: Unknown button type!": "错误：button类型未定义！",
      "Logout": "注销登录",
      "Are you sure you want to log out?": "您确定要注销吗！",
      "Reload": "重新加载",
      "Load failed, please try again!": "加载失败，请重试！",
      "Unknown filesize": "文件大小未知",
      "Enabled": "已启用",
      "Disabled": "已禁用",
      "This field is required": "数据不能为空",
      "Preview image failed!": "查看大图发生错误！",
      "Take a photo failed!": "拍照失败！",
      "Delete image": "删除图片",
      "Preview image": "查看大图",
      "Choose From Album": "从相册选择",
      "Take a photo": "拍照",
      "Load failed:": "加载失败：",
      "Error data:": "数据错误：",
      "Open form page failed": "打开详情页面失败",
      "Load search view failed": "搜索视图加载失败",
      "Load kanban view failed": "看板视图加载失败",
      "The specified view could not be found!": "找不到指定视图！",
      "Previous": "上一分组",
      "Next": "下一分组",
      "Add Item": "添加项目",
      "Barcode scanner feature initialization failed": "扫码功能初始化异常",
      "Search product SN/LOT failed": "批次/序列号信息获取失败",
      "Please scan product SN/LOT": "请扫描批次/序列号",
      "Could not find any product by this barcode:": "找不到指定产品，条码：",
      "Unsupported tracking property, product:": "不支持的tracking属性，产品：",
      "You cannot use the same serial number twice.": "相同序列号的产品数量最多只能有1个！",
      "No data": "数据为空",
      "You need to define a child kanban view for one2many field.": "看板视图未配置",
      "This field is not define:": "字段未定义：",
      "You must define group_fields when you enable barcode feature for stock picking.": "启用扫码出入库功能必须配置group_fields参数",
      "You should enable barcode feature on stock.move.line model for stock picking.": "您只能在stock.move.line模型启用扫码出入库功能",
      "You should enable barcode feature on stock.move.line model for work order.": "您只能在stock.move.line模型启用扫码报工功能",
      "There is no need to record the product which tracking type is 'none'!": "扫码报工不需要记录无追踪信息的物料！",
      "This product is not in the material list:": "您所扫描的产品不在物料列表中：",
      "Button's barcode parameter must start with 'BTN_'. Only capital letters, numbers and underscores are allowed.": "按钮的barcode必须是以BTN_开头的由大写字母、数字、下划线组成的字符串",
      "The specific action is not found": "找不到指定动作",
      "Invalid form view!":"无效的From视图！",
      "The record has been modified, your changes will be discarded. Do you want to proceed?": "记录已被修改，您确认放弃所有修改吗？",
      "Read data from server failed!": "数据获取失败!",
      "The following fields are invalid:": "下列字段无效：",
      "Create new record failed:": "新增记录失败：",
      "Modify record failed:": "修改记录失败：",
      "Delete record failed:": "删除记录失败：",
      "Duplicate record failed:": "复制记录失败：",
      "About": "关于",
      "Could not find any product with specific barcode. Slide down to get all records": "找不到指定记录，下拉获取所有记录",
      "Search": "搜索",
      "Discard search input": "取消输入",
      "Unknown error!": "未知错误！",
      "Sorry, you are not allowed to delete this record！": "对不起，你没有删除这个记录的权限！",
      "Sorry, you are not allowed to create a record！": "对不起，你没有新建记录的权限！",
      "Are you sure you want to delete this record?": "您确认要删除选中记录吗？",
      "Name": "名称",
      "A view must include at least one field!": "视图中的字段列表不能为空！",
      "Unsupported view type:": "不支持的视图类型：",
      "No More Data": "以上是全部数据",
      "Loading...": "请稍后...",
      "Parse context expression failed:": "contex表达式解析失败：",
      "Parse options expression failed:": "options表达式解析失败：",
      "Parse json expression failed:": "json表达式解析失败：",
      "Parse domain expression failed:": "domain表达式解析失败：",
      "Parse domain expression failed!": "domain表达式解析失败！",
      "Parse attrs expression failed:": "attrs表达式解析失败：",
      "The version of odoo must be greater than 8.0": "odoo版本号必须大于8.0",
      "Invalid session, please relogin": "会话无效，请重新登录",
      "Session expired, please relogin": "会话过期，请重新登录",
      "Connect server failed:": "无法连接服务器",
      "Bad request(400)": "服务器无法处理该请求(400)",
      "Bad request(404)": "服务器无法处理该请求(404)",
      "Internal server error(500)": "服务器内部错误(500)",
      "Get currency config failed!": "获取货币设置失败！",
      "Prompt": "提示",
      "Your language Settings have changed. Do you want to restart immediately to switch languages?": "您的语言设置发生了变化，是否立即重启以切换语言？",
      " field is not define.": "字段未定义",
      "Server Url": "服务器地址",
      "Database": "数据库",
      "Username": "用户名",
      "Password": "密码",
      "Login": "登录",
      "Sign Up": "注册账号",
      "Mobile": "手机号",
      "Your Name": "姓名",
      "SMS Code": "验证码",
      "Send Code": "获取验证码",
      "Sign up success": "用户注册成功",
      "Sign up failed": "用户注册失败",
      "Server url and Database are required": "服务器地址和数据库不能为空",
      "Confirm Password": "确认密码",
      "Password and confrim password do not match": "两次输入的密码不一致",
      "Back to Login": "返回登录页面",
      "Duplicate": "复制",
      "Delete": "删除",
      "Or": "或",
      "Search...": "搜索...",
      "Dropdown to update": "下拉更新",
      "Server url is required": "服务器地址不能为空",
      "Database is required": "数据库不能为空",
      "Username is required": "用户名不能为空",
      "Name is required": "姓名不能为空",
      "SMS code is required": "验证码不能为空",
      "Password is required": "密码不能为空",
      "Mobile is required": "手机号不能为空",
      "SMS Code Send Failed": "验证码发送失败",
      "Please try again later.": "请稍后重试",
      "Server url must start with 'http://' or 'https://'": "服务器地址必须以http://或https://开头",
      "Login...": "正在登录...",
      "Username or password incorrect": "用户名或密码错误",
      "This server is not install 'appbox' addon, please install and try again": "服务器未安装appbox模块，请安装后重试",
      "Login failed, please check server url and database name": "登录失败，请检查服务器地址和数据库名称",
    }
  }

  get(path:any) {
    return new Observable(observer => {
      if (path === 'zh') {
        observer.next(this.zh)
      } else {
        observer.next(this.en);
      }
    })
  } 
}
