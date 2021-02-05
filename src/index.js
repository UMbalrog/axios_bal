import { request, setConfig } from "./request.js";
import {
  warn,
  isDef,
  isUndef,
  isString,
  extend,
  isPlainObject,
  ArrayToConfig
} from './util.js';

const AJAX = function(list, config) {
  if(config){
    setConfig(config);
  }
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
      return request(config);
    };
  })

  return obj;
}

AJAX.install = (Vue) => { 
  // Vue.prototype.$axios = axios;
};
AJAX.version = '1.0.2';

export default AJAX
