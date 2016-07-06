/*!
 * MailChimpSubscribeForm
 *
 * Copyright 2016, Erik Lindebratt
 * Released under the MIT license - http://eriklindebratt.mit-license.org/
 */
(function(window, document) {
  'use strict';

  /**
   * @public
   * @class
   * @param {DOMElement}
   * @param {Object} customOptions (Optional) Pass to override default options
   */
  var MailChimpSubscribeForm = function(formElem, customOptions) {
    this.formElem_ = formElem;
    this.timeoutObj_ = null;
    this.options_ = {
      url: this.formElem_.getAttribute('data-url') || this.formElem_.action,
      jsonpCallbackProperty: 'c',  // change this to whatever MailChimp expects
      successMessageElem: this.formElem_.parentNode.querySelector('.js-success-message'),
      errorMessageElem: this.formElem_.parentNode.querySelector('.js-error-message'),
      translateFunction: function(str) { return str; },  // pass your own translate function if you want translations
      onSuccessCallback: null,  // pass your own success callback to handle successful submits yourself
      onErrorCallback: null,  // pass your own error callback to handle submit errors yourself
      onBeforeSubmitCallback: null,  // for e.g. setting loading state
      onTimeoutCallback: null,  // for JSONP calls we don't get any error handling, so you can use this as "fallback"
      timeout: 5000,
      autoInit: false
    };

    // extend `options` with `customOptions`, if it's passed
    if (customOptions && typeof(customOptions) === 'object') {
      for (var i in customOptions) {
        if (customOptions.hasOwnProperty(i)) {
          this.options_[i] = customOptions[i];
        }
      }
    }

    if (this.options_.successMessageElem) {
      this.options_.generalSuccessMessage = this.options_.successMessageElem.getAttribute(
        'data-general-message'
      );
    } else {
      this.options_.generalSuccessMessage = null;
    }

    if (this.options_.errorMessageElem) {
      this.options_.generalErrorMessage = this.options_.errorMessageElem.getAttribute(
        'data-general-message'
      );
    } else {
      this.options_.generalErrorMessage = null;
    }

    // ensure we use the MailChimp JSON endpoint
    if (this.options_.url.indexOf('/subscribe/post') !== -1 &&
        this.options_.url.indexOf('/subscribe/post-json') === -1) {

      this.options_.url = this.options_.url.replace(
        /\/subscribe\/post/,
        '/subscribe/post-json'
      );
    }

    if (this.options_.autoInit) {
      this.init();
    }
  };

  /**
   * @public
   */
  MailChimpSubscribeForm.prototype.init = function() {
    this.bindEvents_();
  };

  /**
   * @private
   */
  MailChimpSubscribeForm.prototype.bindEvents_ = function() {
    var this_ = this;

    this.formElem_.addEventListener('submit', function() {
      this_.onSubmit_.apply(this_, arguments);
    });
  };

  /**
   * @private
   * @param {Event} e
   */
  MailChimpSubscribeForm.prototype.onSubmit_ = function(e) {
    e.preventDefault();

    var this_ = this;
    var dataObj = MailChimpSubscribeForm.utils.serializeForm(this.formElem_);
    var url = MailChimpSubscribeForm.utils.appendQueryString(this.options_.url, dataObj);

    if (typeof(this.options_.onTimeoutCallback) === 'function') {
      this.timeoutObj_ = setTimeout(function() {
        this_.options_.onTimeoutCallback.call(null, url, this_.options_);
        clearTimeout(this_.timeoutObj_);
        this_.timeoutObj_ = null;
      }, this.options_.timeout);
    }

    if (typeof(this.options_.onBeforeSubmitCallback) === 'function') {
      this.options_.onBeforeSubmitCallback.call(null, url, this.options_);
    }

    MailChimpSubscribeForm.utils.loadJSON(url, {
      jsonpCallbackProperty: this.options_.jsonpCallbackProperty,
      onSuccess: function() {
        if (this_.timeoutObj_) {
          clearTimeout(this_.timeoutObj_);
          this_.timeoutObj_ = null;
        }
        this_.onSuccess_.apply(this_, arguments);
      },
      onError: function() {
        if (this_.timeoutObj_) {
          clearTimeout(this_.timeoutObj_);
          this_.timeoutObj_ = null;
        }
        this_.onError_.apply(this_, arguments);
      }
    });
  };

  /**
   * @private
   * @param {Object} response
   */
  MailChimpSubscribeForm.prototype.onSuccess_ = function(response) {
    var message = null;
    var hasError = false;

    try {
      if (typeof(response) !== 'object') {
        response = JSON.parse(response);
      }

      message = response.msg;
      if (message.indexOf('0 - ') !== -1) {
        message = message.slice(4);
      }

      if (response.result === 'error') {
        hasError = true;
      }

    } catch(e) {
      hasError = true;
      message = null;
    }

    if (hasError) {
      this.onError_(null, message);
    } else {
      if (typeof(this.options_.onSuccessCallback) === 'function') {
        this.options_.onSuccessCallback.call(null, message);
      } else {
        this.setSuccessMessage_(message);
        this.setUI_(false);
      }
    }
  };

  /**
   * @private
   * @param {XMLHttpRequest} request
   * @param {String} errorMessage
   */
  MailChimpSubscribeForm.prototype.onError_ = function(request, errorMessage) {
    if (typeof(this.options_.onErrorCallback) === 'function') {
      this.options_.onErrorCallback.call(null, request, errorMessage);
    } else {
      this.setErrorMessage_(errorMessage);
      this.setUI_(true);
    }
  };

  /**
   * @private
   * @param {Boolean} hasError
   */
  MailChimpSubscribeForm.prototype.setUI_ = function(hasError) {
    if (hasError) {
      this.formElem_.style.display = '';
      this.options_.successMessageElem.style.display = 'none';
      this.options_.errorMessageElem.style.display = '';
    } else {
      this.formElem_.style.display = 'none';
      this.options_.successMessageElem.style.display = '';
      this.options_.errorMessageElem.style.display = 'none';
    }
  };

  /**
   * @private
   * @param {String} message
   */
  MailChimpSubscribeForm.prototype.setSuccessMessage_ = function(message) {
    if (!message) {
      message = this.options_.generalSuccessMessage;
    }

    if (!message || !this.options_.successMessageElem) {
      return;
    }

    if (this.options_.translateFunction) {
      this.options_.successMessageElem.innerHTML = this.options_.translateFunction(message);
    } else {
      this.options_.successMessageElem.innerHTML = message;
    }
  };

  /**
   * @private
   * @param {String} message
   */
  MailChimpSubscribeForm.prototype.setErrorMessage_ = function(message) {
    if (!message) {
      message = this.options_.generalErrorMessage;
    }

    if (!message || !this.options_.errorMessageElem) {
      return;
    }

    if (this.options_.translateFunction) {
      this.options_.errorMessageElem.innerHTML = this.options_.translateFunction(message);
    } else {
      this.options_.errorMessageElem.innerHTML = message;
    }
  };



  /**
   * Utility functions
   * @public
   * @static
   */
  MailChimpSubscribeForm.utils = {
    /**
     * @public
     * @param {DOMElement} formElem
     * @param {Boolean} returnAsString
     * @return {Object} Serialized object with property-value-like structure (or a querystring-like string, if `returnAsString` is set to true)
     */
    serializeForm: function(formElem, returnAsString) {
      var inputElems = formElem.querySelectorAll('input, textarea');
      var data = {};

      for (var i = 0; i < inputElems.length; i++) {
        var inputElem = inputElems[i];
        if (inputElem.type === 'submit' || !('name' in inputElem) || !inputElem.name) {
          continue;
        }

        var value = inputElem.value;
        if (!inputElem.hasAttribute('value') && (inputElem.type === 'checkbox' || inputElem.type === 'radio')) {
          value = !!inputElem.checked;
        }
        data[inputElem.name] = encodeURIComponent(value);
      }

      if (returnAsString === true) {
        var dataArr = [];
        for (var p in data) {
          if (data.hasOwnProperty(p)) {
            dataArr.push(p + '=' + data[p]);
          }
        }
        return dataArr.join('&');
      }

      return data;
    },

    /**
     * @public
     * @static
     * @param {DOMElement} formElem
     * @param {Boolean} returnAsString
     * @return {Object} Serialized object with property-value-like structure (or a querystring-like string, if `returnAsString` is set to true)
     */
    appendQueryString: function(url, qStrObj) {
      if (!qStrObj || typeof(qStrObj) !== 'object') {
        return url;
      }

      // split up url into `scheme//hostname/pathname` / `query string`
      var qStrArr = '';
      var urlParts = [url];
      if (url.indexOf('?') !== -1 || url.indexOf('&') !== -1) {
        if (url.indexOf('?') !== -1) {
          urlParts = url.split('?');
        } else {
          urlParts = url.split('&');
        }
        qStrArr = urlParts[1].split('&');
      }

      // ensure we don't have e.g. 'foo=bar&'
      var cleanedQStrArr = [];
      for (var n = 0; n < qStrArr.length; n++) {
        if (qStrArr[n].length || qStrArr[n] === '=') {
          cleanedQStrArr.push(qStrArr[n]);
        }
      }
      qStrArr = cleanedQStrArr;

      // transform `qStrObj` object into array of format e.g. `['foo=bar', ...]
      for (var i in qStrObj) {
        if (qStrObj.hasOwnProperty(i)) {
          qStrArr.push(i + '=' + qStrObj[i]);
        }
      }

      return [
        urlParts[0],
        qStrArr.join('&')
      ].join('?');
    },

    /**
     * @public
     * @static
     * @param {String} url
     * @param {Object} customOptions Pass to set e.g. success/error callbacks
     */
    loadJSON: function(url, customOptions) {
      var options = {
        onSuccess: null,  // Will get called with the parsed JSON response as argument
        onError: null,  // Will get called with an `XMLHttpRequest` object as argument
        jsonpCallbackProperty: null,
        accept: 'application/json',
        contentType: 'application/json'
      };

      // extend `options` with `customOptions`, if it's passed
      if (customOptions && typeof(customOptions) === 'object') {
        for (var i in customOptions) {
          if (customOptions.hasOwnProperty(i)) {
            options[i] = customOptions[i];
          }
        }
      }

      // if JSONP is preferred
      if (!!options.jsonpCallbackProperty) {
        var jsonpScriptElem = null;

        // set up unique JSONP success callback
        var jsonpCallbackName = '__jsonpCallback' + Math.round(+new Date() * Math.random());
        window[jsonpCallbackName] = function() {
          options.onSuccess.apply(null, arguments);
          //jsonpScriptElem.parentNode.removeChild(jsonpScriptElem);
          delete window[jsonpCallbackName];
        };

        // add JSONP callback to url
        var qStrObj = {};
        qStrObj[options.jsonpCallbackProperty] = jsonpCallbackName;
        url = MailChimpSubscribeForm.utils.appendQueryString(url, qStrObj);

        jsonpScriptElem = document.createElement('script');
        jsonpScriptElem.src = url;
        document.body.appendChild(jsonpScriptElem);


      // Ok, we don't want JSONP
      // - using regular `XMLHttpRequest`
      } else {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);

        if (options.accept) {
          request.setRequestHeader('Accept', options.accept);
        }
        if (options.contentType) {
          request.setRequestHeader('Content-Type', options.contentType);
        }

        request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

        request.onreadystatechange = function() {
          if (this.readyState === 4) {
            if (this.status >= 200 && this.status < 400) {
              var data = JSON.parse(this.responseText);
              if (options.onSuccess) {
                options.onSuccess(data);
              }
            } else {
              if (options.onError) {
                options.onError(this);
              }
            }
          }
        };

        request.send();
        request = null;
      }
    }
  };

  window.MailChimpSubscribeForm = MailChimpSubscribeForm;
})(window, document);
