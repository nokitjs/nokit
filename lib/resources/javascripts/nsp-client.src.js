/* global base64 */
/* base64 begin*/
(function(owner) {

  //下面是64个基本的编码
  var base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var base64DecodeChars = new Array(-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
    52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
    15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1);

  //编码的方法
  function base64encode(str) {
    var out, i, len;
    var c1, c2, c3;
    len = str.length;
    i = 0;
    out = "";
    while (i < len) {
      c1 = str.charCodeAt(i++) & 0xff;
      if (i == len) {
        out += base64EncodeChars.charAt(c1 >> 2);
        out += base64EncodeChars.charAt((c1 & 0x3) << 4);
        out += "==";
        break;
      }
      c2 = str.charCodeAt(i++);
      if (i == len) {
        out += base64EncodeChars.charAt(c1 >> 2);
        out += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
        out += base64EncodeChars.charAt((c2 & 0xF) << 2);
        out += "=";
        break;
      }
      c3 = str.charCodeAt(i++);
      out += base64EncodeChars.charAt(c1 >> 2);
      out += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
      out += base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
      out += base64EncodeChars.charAt(c3 & 0x3F);
    }
    return out;
  }
  //解码的方法

  function base64decode(str) {
    var c1, c2, c3, c4;
    var i, len, out;
    len = str.length;
    i = 0;
    out = "";
    while (i < len) {

      do {
        c1 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
      } while (i < len && c1 == -1);
      if (c1 == -1)
        break;

      do {
        c2 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
      } while (i < len && c2 == -1);
      if (c2 == -1)
        break;
      out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));

      do {
        c3 = str.charCodeAt(i++) & 0xff;
        if (c3 == 61)
          return out;
        c3 = base64DecodeChars[c3];
      } while (i < len && c3 == -1);
      if (c3 == -1)
        break;
      out += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2));

      do {
        c4 = str.charCodeAt(i++) & 0xff;
        if (c4 == 61)
          return out;
        c4 = base64DecodeChars[c4];
      } while (i < len && c4 == -1);
      if (c4 == -1)
        break;
      out += String.fromCharCode(((c3 & 0x03) << 6) | c4);
    }
    return out;
  }

  function utf16to8(str) {
    var out, i, len, c;
    out = "";
    len = str.length;
    for (i = 0; i < len; i++) {
      c = str.charCodeAt(i);
      if ((c >= 0x0001) && (c <= 0x007F)) {
        out += str.charAt(i);
      } else if (c > 0x07FF) {
        out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F));
        out += String.fromCharCode(0x80 | ((c >> 6) & 0x3F));
        out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
      } else {
        out += String.fromCharCode(0xC0 | ((c >> 6) & 0x1F));
        out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
      }
    }
    return out;
  }

  function utf8to16(str) {
    var out, i, len, c;
    var char2, char3;
    out = "";
    len = str.length;
    i = 0;
    while (i < len) {
      c = str.charCodeAt(i++);
      switch (c >> 4) {
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
          // 0xxxxxxx
          out += str.charAt(i - 1);
          break;
        case 12:
        case 13:
          // 110x xxxx   10xx xxxx
          char2 = str.charCodeAt(i++);
          out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
          break;
        case 14:
          // 1110 xxxx  10xx xxxx  10xx xxxx
          char2 = str.charCodeAt(i++);
          char3 = str.charCodeAt(i++);
          out += String.fromCharCode(((c & 0x0F) << 12) |
            ((char2 & 0x3F) << 6) |
            ((char3 & 0x3F) << 0));
          break;
      }
    }
    return out;
  }

  owner.encode = function(str) {
    return base64encode(utf16to8(str));
  };
  owner.decode = function(str) {
    return utf8to16(base64decode(str));
  };

})(window.base64 = window.base64 || {});
/* base64 end */

/* outerHTML begin */
(function() {
  if (navigator.userAgent.indexOf("Gecko/") > -1) {
    HTMLElement.prototype.__defineGetter__("outerHTML", function() {
      var a = this.attributes,
        str = "<" + this.tagName,
        i = 0;
      for (; i < a.length; i++)
        if (a[i].specified)
          str += " " + a[i].name + '="' + a[i].value + '"';
      if (!this.canHaveChildren)
        return str + " />";
      return str + ">" + this.innerHTML + "</" + this.tagName + ">";
    });
    HTMLElement.prototype.__defineSetter__("outerHTML", function(s) {
      var r = this.ownerDocument.createRange();
      r.setStartBefore(this);
      var df = r.createContextualFragment(s);
      this.parentNode.replaceChild(df, this);
      return s;
    });
    HTMLElement.prototype.__defineGetter__("canHaveChildren", function() {
      return !/^(area|base|basefont|col|frame|hr|img|br|input|isindex|link|meta|param)$/.test(this.tagName.toLowerCase());
    });
  }
})();
/* outerHTML end */

/*json begin*/
(function(JSON) {
  //检查是否是数组
  var isArray = function(obj) {
    var v1 = Object.prototype.toString.call(obj) === '[object Array]';
    var v2 = obj instanceof Array;
    return v1 || v2;
  };
  /**
   * 将JSON字符串转换为JavaScript对象
   * @method parse
   * @param {String} str JSON字符串
   * @static
   */
  JSON.parse = JSON.parse || function(str) {
    if (str == null) return null;
    return (new Function("return " + str + ";"))();
  };
  /**
   * 将JavaScript对象转换为JSON字符串表示形式。
   * @method stringify
   * @param {Object} obj 对象
   * @static
   */
  JSON.stringify = JSON.stringify || function(obj) {
    switch (typeof (obj)) {
      case 'string':
        return '"' + obj.replace(/(["\\])/g, '\\$1') + '"';
      case 'array':
        var strArr = [];
        var len = obj.length;
        for (var i = 0; i < len; i++) {
          strArr.push(JSON.stringify(obj[i]));
        }
        return '[' + strArr.join(',') + ']';
      case 'object':
        if (isArray(obj)) {
          var strArr = [];
          var len = obj.length;
          for (var i = 0; i < len; i++) {
            strArr.push(JSON.stringify(obj[i]));
          }
          return '[' + strArr.join(',') + ']';
        } else if (obj == null || obj == undefined) {
          return 'null';
        } else {
          var string = [];
          for (var p in obj) {
            string.push(JSON.stringify(p) + ':' + JSON.stringify(obj[p]));
          }
          return '{' + string.join(',') + '}';
        }
      case 'number':
      case 'boolean':
      default:
        return obj;
    }
  };
})(window.JSON = window.JSON || {});
/*json end*/

/* nsp begin */
(function(nsp, window, document, base64, JSON) {

  var SERVER_ID_NAME = 'nsp-id';

  var each = function(list, fn) {
    var len = list.length;
    for (var i = 0; i < len; i++) {
      var item = list[i];
      fn.call(item, i, item);
    }
  };

  //查找表单
  var findForm = function() {
    var theForm = document.getElementById(nsp.formId) || document.getElementsByTagName('form')[0];
    if (!theForm || theForm.length < 1) {
      theForm = document.createElement('form');
      theForm.style.display = 'none';
      document.body.appendChild(theForm);
    }
    return theForm;

  };

  var isTopNSPElement = function(element) {
    while (element.parentNode || element.parentElement) {
      var parent = element.parentNode || element.parentElement;
      if (parent.getAttribute && parent.getAttribute(SERVER_ID_NAME) != null) {
        return false;
      } else {
        element = parent;
      }
    }
    return true;
  };

  var findNSPElements = function() {
    var nspElements = [];
    if (document.querySelectorAll) {
      var allNspElements = document.querySelectorAll('[' + SERVER_ID_NAME + ']');
      each(allNspElements, function(i, element) {
        if (isTopNSPElement(element)) {
          nspElements.push(element);
        }
      });
    } else {
      var allElements = document.getElementsByTagName('*');
      each(allElements, function(i, element) {
        if (element.getAttribute(SERVER_ID_NAME) != null && isTopNSPElement(element)) {
          nspElements.push(element);
        }
      });
    }
    return nspElements;
  };

  var handleControls = function() {
    //input
    var inputElements = document.getElementsByTagName('input');
    each(inputElements, function(i, item) {
      item.setAttribute('value', item.value);
      if (item.checked) {
        item.setAttribute('checked', true);
      } else {
        item.removeAttribute('checked');
      }

    });
    //textarea
    var textareaElements = document.getElementsByTagName('textarea');
    each(textareaElements, function(i, item) {
      item.innerText = item.value;
    });
    //select
    var selectElements = document.getElementsByTagName('select');
    each(selectElements, function(i, item) {
      var optionsElements = item.getElementsByTagName('option');
      each(optionsElements, function(i, opt) {
        if (opt.selected) {
          opt.setAttribute('selected', true);
        } else {
          opt.removeAttribute('selected');
        }
      });
    });
  };

  //获取状态
  var getState = function() {
    handleControls();
    var state = [];
    var nspElements = findNSPElements();
    each(nspElements, function(i, item) {
      state.push(item.outerHTML);
    });
    var stateText = state.join('');
    return base64.encode(stateText);
  };

  var submitting = false;

  //回调服务端方法
  nsp.call = function() {
    if (submitting) return;
    submitting = true;
    //分解参数
    var args = [].slice.call(arguments);
    var methodName = args[0];
    var methodArgs = args.slice(1);
    //查找 form
    var theForm = findForm();
    theForm.setAttribute('action', location.href);
    theForm.setAttribute('method', 'post');
    //method
    var methodHidden = document.createElement("input");
    methodHidden.type = 'hidden';
    methodHidden.name = '__method';
    methodHidden.value = methodName;
    theForm.appendChild(methodHidden);
    //args
    var argsHidden = document.createElement("input");
    argsHidden.type = 'hidden';
    argsHidden.name = '__args';
    argsHidden.value = JSON.stringify(methodArgs);
    theForm.appendChild(argsHidden);
    //state
    var stateHidden = document.createElement("input");
    stateHidden.type = 'hidden';
    stateHidden.name = '__state';
    stateHidden.value = getState();
    theForm.appendChild(stateHidden);
    //submit
    theForm.submit();
    return false;
  };

})(window.nsp = window.nsp || function(formId) {
  window.nsp.formId = formId;
  return window.nsp;
}, window, document, base64, JSON);
/* nsp end */