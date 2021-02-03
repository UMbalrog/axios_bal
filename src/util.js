// 数据检测
const _toString = Object.prototype.toString

export function noop() {}

export function warn(msg) {
  console.error(`[Ajax warn]: ${msg}`)
}

export function isUndef(v) {
  return v === undefined || v === null
}

export function isDef(v) {
  return v !== undefined && v !== null
}

export function isTrue(v) {
  return v === true
}

export function isFalse(v) {
  return v === false
}

export function isString(v) {
  return (
    typeof v === 'string'
  )
}

export function isPlainObject(obj) {
  return _toString.call(obj) === '[object Object]'
}

export function ArrayToConfig(item) {
  const url = item[0] || undefined;
  let key = '';
  if(isUndef(url)) return {};
  const urllist = url.split("/");
  try {
    var str = urllist.pop();
    key = str.split("?").shift();
  } catch (err) {
    console.error("url is error" + item);
  };
  let data = {
    url: url,
    method: item[1] || "post",
    key: item[2] || key,
    timeout: item[3] || 10000
  }
  data.method = data.method.toLowerCase();
  (data.method == 'jsonp') && (data.CallbackName = item[4] || "");
  return data;
}

export function extend (to, _from) {
  for (const key in _from) {
    to[key] = _from[key]
  }
  return to
}