// 生命周期

// import axios from "axios";
import request from "./request.js";
import {
  warn,
  isDef,
  isUndef,
  isString,
  extend,
  isPlainObject,
  ArrayToConfig
} from './util.js';

const AJAX = function(list) {
  const obj = {};
  // 接口列表处理
  if(isUndef(list) || !Array.isArray(list)) {
    warn('ajax参数需为数组');
    return;
  }
  list.forEach((item, index) => {
    let config = {};
    if(Array.isArray(item)){
      config = ArrayToConfig(item);
    }else if(isPlainObject(item)){
      config = item;
    }else{
      warn('配置二级目录需为数组或纯对象');
    };
    if(isUndef(config.url) || !isString(config.url)){
      warn('请求地址不合法');
      return;
    }
    obj[config.key] = function(query = {}, userconfig) {
      if(isDef(userconfig)){
        config = Object.assign ? Object.assign(config, userconfig) : extend(config, userconfig);
      };
      config.data = query
      // console.log('请求配置', config);
      return request(config);
    };
  })

  return obj;
}

AJAX.install = (Vue) => { 
  // Vue.prototype.$axios = axios;
  // console.log('wl-axios')
};

export default AJAX
