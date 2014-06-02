/* -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

/* global Utils */

/* exported FxacHelper */

'use strict';

(function(exports) {
  var FxacHelper = {
    /**
     * 
     */
    init: function fxach_init(onLogin) {
      var that = this;
      navigator.mozId.watch({
        wantIssuer: 'firefox-accounts',
        // audience: 'https://loop.services.mozilla.com',
        onready: that.onReady.bind(that),
        onlogin: onLogin,
        onlogout: that.onLogout.bind(that)
      });
    },

    /**
     * 
     */
    register: function fxach_register() {
      navigator.mozId.request();
    },

    /**
     * 
     */
    onReady: function fxach_onReady() {
    },

    /**
     * 
     */
    onLogin: function fxach_onLogin(assertion) {
    },

    /**
     * 
     */
    onLogout: function fxach_onLogout() {
    },

    /**
     * 
     */
    logout: function fxach_logout() {
      navigator.mozId.logout();
    }
  };

  exports.FxacHelper = FxacHelper;
})(this);
