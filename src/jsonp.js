/*
 * jsonp 封装
 * 主要封装了错误回调
 */

function noop() {}

function genericCallback(data) {
  lastValue = [data];
}

// Call if defined 定义后调用
function callIfDefined(method, object, parameters) {
  return method && method.apply(object.context || object, parameters);
}

// Give joining character given url 给定连接字符的URL
function qMarkOrAmp(url) {
  return /\?/.test(url) ? "&" : "?";
}

var nextStr;

function STRPARAM(obj) {
  let str = "";
  if (typeof obj == "object") {
    for (let i in obj) {
      if (typeof obj[i] != "function" && typeof obj[i] != "object") {
        str += i + "=" + obj[i] + "&";
      } else if (typeof obj[i] == "object") {
        nextStr = "";
        str += changeSonType(i, obj[i]);
      }
    }
  }
  return str.replace(/&$/g, "");
}

function changeSonType(objName, objValue) {
  if (typeof objValue == "object") {
    for (let i in objValue) {
      if (typeof objValue[i] != "object") {
        let value = objName + "[" + i + "]=" + objValue[i];
        nextStr += encodeURI(value) + "&";
      } else {
        changeSonType(objName + "[" + i + "]", objValue[i]);
      }
    }
  }
  return nextStr;
}

var // String constants (for better minification)
  STR_ASYNC = "async",
  STR_CHARSET = "charset",
  STR_EMPTY = "",
  STR_ERROR = "error",
  STR_INSERT_BEFORE = "insertBefore",
  STR_JQUERY_JSONP = "_jqjsp",
  STR_ON = "on",
  STR_ON_CLICK = STR_ON + "click",
  STR_ON_ERROR = STR_ON + STR_ERROR,
  STR_ON_LOAD = STR_ON + "load",
  STR_ON_READY_STATE_CHANGE = STR_ON + "readystatechange",
  STR_READY_STATE = "readyState",
  STR_REMOVE_CHILD = "removeChild",
  STR_SCRIPT_TAG = "script",
  STR_SUCCESS = "success",
  STR_TIMEOUT = "timeout",
  // Window
  win = window,
  // Deferred
  // Deferred = $.Deferred,
  // Head element
  head = document.getElementsByTagName("head")[0] || document.documentElement,
  // Page cache
  pageCache = {},
  // Counter
  count = 0,
  // Last returned value
  lastValue,
  Call = "jsonCallBack" + Math.floor(Math.random() * 10000000000),
  // opera demands sniffing :/
  opera = win.opera;

// IE < 10
// oldIE = !!$( "<div>" ).html( "<!--[if IE]><i><![endif]-->" ).find("i").length;

// ###################### MAIN FUNCTION ##
function JSONP(xOptions) {
  
  try {
    xOptions.requestHook && xOptions.requestHook(xOptions);
  } catch (error) {
    console.error(error)
  }

  // References to xOptions members (for better minification) 对XOptions成员的引用（为了更好地缩小）
  var successCallback = xOptions.success,
    errorCallback = xOptions.error,
    completeCallback = xOptions.complete,
    dataFilter = xOptions.dataFilter,
    callbackParameter = xOptions.callbackParameter || "callback",
    successCallbackName = xOptions.callback || Call,
    cacheFlag = xOptions.cache,
    pageCacheFlag = xOptions.pageCache,
    charset = xOptions.charset,
    url = xOptions.url || location.href,
    data = xOptions.data,
    timeout = xOptions.timeout,
    pageCached,
    // Abort/done flag 中止/完成标志
    done = 0,
    // Life-cycle functions 生命周期功能
    cleanUp = noop,
    // Request execution vars 请求执行
    firstChild,
    script,
    scriptAfter,
    timeoutTimer;

  // If we have Deferreds: 如果我们推迟：
  // - substitute callbacks -替代回拨
  // - promote xOptions to a promise -将X选项提升为promise
  // Deferred && Deferred(function( defer ) {
  // 	defer.done( successCallback ).fail( errorCallback );
  // 	successCallback = defer.resolve;
  // 	errorCallback = defer.reject;
  // }).promise( xOptions );

  // Create the abort method 创建中止方法
  xOptions.abort = function() {
    !done++ && cleanUp(); //此方法只执行一次
  };

  // Call beforeSend if provided (early abort if false returned) 如果提供，则调用promotsend（如果返回false，则提前中止）
  if (callIfDefined(xOptions.beforeSend, xOptions, [xOptions]) === !1 || done) {
    return xOptions;
  }

  // Control entries 控制项
  url = url || STR_EMPTY;
  data = data ? (typeof data == "string" ? data : STRPARAM(data)) : STR_EMPTY;

  // Build final url 生成最终URL
  url += data ? qMarkOrAmp(url) + data : STR_EMPTY;

  // Add callback parameter if provided as option 如果作为选项提供，则添加回调参数
  callbackParameter &&
    (url += qMarkOrAmp(url) + encodeURIComponent(callbackParameter) + "=?");

  // Add anticache parameter if needed 如果需要，添加反缓存参数
  !cacheFlag &&
    !pageCacheFlag &&
    (url += qMarkOrAmp(url) + "_" + new Date().getTime() + "=");

  // Replace last ? by callback parameter 替换最后一个？按回调参数
  url = url.replace(/=\?(&|$)/, "=" + successCallbackName + "$1");

  // Success notifier 成功通知程序
  function notifySuccess(json) {
    if (!done++) {
      cleanUp();
      // Pagecache if needed 如果需要，可以使用页面缓存
      pageCacheFlag &&
        (pageCache[url] = {
          s: [json]
        });
      // Apply the data filter if provided
      dataFilter && (json = dataFilter.apply(xOptions, [json]));
      try {
        xOptions.responseHook && xOptions.responseHook(json, xOptions);
      } catch (error) {
        console.error(error)
      }
      // Call success then complete 呼叫成功，然后完成
      callIfDefined(successCallback, xOptions, [json, STR_SUCCESS, xOptions]);
      callIfDefined(completeCallback, xOptions, [xOptions, STR_SUCCESS]);
    }
  }

  // Error notifier
  function notifyError(type) {
    if (!done++) {
      // Clean up
      cleanUp();
      // If pure error (not timeout), cache if needed 如果纯错误（不是超时），需要时缓存
      pageCacheFlag && type != STR_TIMEOUT && (pageCache[url] = type);
      // Call error then complete
      callIfDefined(errorCallback, xOptions, [xOptions, type]);
      callIfDefined(completeCallback, xOptions, [xOptions, type]);
    }
  }

  // Check page cache 检查页面缓存
  if (pageCacheFlag && (pageCached = pageCache[url])) {
    pageCached.s ? notifySuccess(pageCached.s[0]) : notifyError(pageCached);
  } else {
    // Install the generic callback
    // (BEWARE: global namespace pollution ahoy)
    win[successCallbackName] = genericCallback;

    // Create the script tag
    script = document.createElement(STR_SCRIPT_TAG);
    script.id = STR_JQUERY_JSONP + count++;

    // Set charset if provided 设置字符集（如果提供）
    if (charset) {
      script[STR_CHARSET] = charset;
    }

    opera && opera.version() < 11.6
      ? // onerror is not supported: do not set as async and assume in-order execution.
        // Add a trailing script to emulate the event
        //不支持OnError:不要设置为Async并假定为按顺序执行。
        //添加尾随脚本以模拟事件
        ((scriptAfter = document.createElement(STR_SCRIPT_TAG)).text =
          "document.getElementById('" + script.id + "')." + STR_ON_ERROR + "()")
      : // onerror is supported: set the script as async to avoid requests blocking each others
        //支持OnError:将脚本设置为Async以避免请求相互阻塞
        (script[STR_ASYNC] = STR_ASYNC);

    // Internet Explorer: event/htmlFor trick
    // if ( oldIE ) {
    // 	script.htmlFor = script.id;
    // 	script.event = STR_ON_CLICK;
    // }

    // Attached event handlers 附加的事件处理程序
    script[STR_ON_LOAD] = script[STR_ON_ERROR] = script[
      STR_ON_READY_STATE_CHANGE
    ] = function(result) {
      // Test readyState if it exists 测试就绪状态（如果存在）
      if (!script[STR_READY_STATE] || !/i/.test(script[STR_READY_STATE])) {
        try {
          script[STR_ON_CLICK] && script[STR_ON_CLICK]();
        } catch (_) {
          console.log(STR_ON_LOAD);
        }
        result = lastValue;
        lastValue = 0;
        result ? notifySuccess(result[0]) : notifyError(STR_ERROR);
      }
    };

    // Set source
    script.src = url;

    // Re-declare cleanUp function 重新声明清除函数
    cleanUp = function() {
      timeoutTimer && clearTimeout(timeoutTimer);
      script[STR_ON_READY_STATE_CHANGE] = script[STR_ON_LOAD] = script[
        STR_ON_ERROR
      ] = null;
      head[STR_REMOVE_CHILD](script);
      scriptAfter && head[STR_REMOVE_CHILD](scriptAfter);
    };

    // Append main script
    head[STR_INSERT_BEFORE](script, (firstChild = head.firstChild));

    // Append trailing script if needed 如果需要，附加尾随脚本
    scriptAfter && head[STR_INSERT_BEFORE](scriptAfter, firstChild);

    // If a timeout is needed, install it 如果需要超时，请安装它
    timeoutTimer =
      timeout > 0 &&
      setTimeout(function() {
        notifyError(STR_TIMEOUT);
      }, timeout);
  }

  return xOptions;
}

export default JSONP;
