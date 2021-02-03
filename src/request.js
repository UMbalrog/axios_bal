import axios from "axios";
import Qs from "qs";
import JSONP from "./jsonp.js";
import {
  warn,
  isFalse,
  noop
} from './util.js';

var instance = axios.create({
  baseURL: "/",
  timeout: 10000,
  responseType: "json",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
  },
  withCredentials: true
});

// 请求拦截器
instance.interceptors.request.use(
  config => {
    try {
      config.requestHook && config.requestHook(config);
    } catch (error) {
      warn(error)
    }
    return config;
  },
  error => {
    return Promise.error(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  response => {
    // console.log(response)
    try {
      response.config && response.config.responseHook && response.config.responseHook(response);
    } catch (error) {
      warn(error)
    }
    if (response.status === 200) { //响应成功拦截
      // console.log(process.env.NODE_ENV === 'production');
      return Promise.resolve(response.data);
    } else {
      return Promise.reject(response.data);
    }
  },
  // 服务器状态码不是200的情况
  error => {
    // console.log('response', error)
    if (error.response && error.response.status) {
      // switch (error.response.status) {
      //   // 404请求不存在
      //   case 404:
      //     // console.log(error.response);
      //     break;
      //   // 500服务器错误
      //   case 500:
      //     break;
      //   // 其他错误，直接抛出错误提示
      //   default:
      // }
      return Promise.reject(error.response);
    }else{
      return Promise.reject(error);
    }
  }
);

/**
 * jsonp方法，对应jsonp请求
 * @param {String} url [请求的url地址]
 * @param {Object} params [请求时携带的参数]
 * @param {String} cbName [callback字段名，默认callback]
 params[请求时携带的参数]
*/
function jsonp(config) {
  // url, params, timeout, cbName
  return new Promise((resolve, reject) => {
    JSONP({
      url: config.url,
      data: config.data || {},
      callback: config.callback || 'callback',
      timeout: config.timeout || 10000,
      cache: isFalse(config.cache) ? false : true, //默认不添加随机数
      requestHook: config.requestHook || noop,
      responseHook: config.responseHook || noop,
      success: function(res) {
        resolve(res);
      },
      error: function(res) {
        reject(res);
      }
    });
  });
}

export default function request(config){
  
  config.method = config.method.toLowerCase();
  // 请求方式处理
  if(config.method == 'jsonp'){
    return jsonp(config);
  }
  if(config.method == 'get'){
    config.params = config.data;
  }
  if(config.method == 'post'){ //这里判断可能不全
    if(!config.headers || (config.headers && config.headers['Content-Type'] &&config.headers['Content-Type'] == "application/x-www-form-urlencoded;charset=utf-8")){
      config.data = Qs.stringify(config.data);
    };
  }
  return instance.request(config)
}
