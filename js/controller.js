/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

/* global CallHelper, AccountHelper */

/* exported Controller */

'use strict';

/*
 * This code is in charge of 'Controlling' all actions from the Loop
 * Library and link with UI operations. Controller is, as it name
 * indicates, the Controller part of MVC
 */

(function (exports) {
  function _callback(cb, args) {
    if (cb && typeof cb === 'function') {
      cb.apply(null, args);
    }
  }

  var Controller = {
    /**
     * Get the app account.
     *
     * @param {Function} onsuccess Function to be called once it gets the
     *                             account. The account object is passed as
     *                             parameter.
     * @param {Function} onerror Function to be called in case of any error. An
     *                           error object is passed as parameter.
     */
    getAccount: function c_getAccount(onsuccess, onerror) {
      AccountHelper.getAccount(onsuccess, onerror);
    },

    /**
     * Sign up the user.
     *
     * @param {Function} onsuccess Function to be called once the user gets
     *                             signed up.
     * @param {Function} onerror Function to be called in case of any error. An
     *                           error object is passed as parameter.
     */
    signUp: function signUp(id, onsuccess, onerror) {
      AccountHelper.signUp(id, onsuccess, onerror);
    },

    /**
     * Sign in the user.
     *
     * @param {Function} onsuccess Function to be called once the user gets
     *                             signed in.
     * @param {Function} onerror Function to be called in case of any error. An
     *                           error object is passed as parameter.
     */
    signIn: function signIn(onsuccess, onerror) {
      AccountHelper.signIn(onsuccess, onerror);
    },

    /**
     * Share the call url with called party.
     *
     * @param {String} id Peer's id.
     * @param {Function} onsuccess Function to be called once the call URL is
     *                             shared correctly.
     * @param {Function} onerror Function to be called when an error occurs.
     */
    shareUrl: function c_shareUrl(id, onsuccess, onerror) {
      CallHelper.generateCallUrl(id,
        function(result) {
          Utils.log('Loop web URL ' + JSON.stringify(result.call_url));
          var activity = new MozActivity({
            name: 'share',
            data: {
              type: 'url',
              url: result.call_url
            }
          });
          activity.onsuccess = function() {
            _callback(onsuccess);
          };
          activity.onerror = function() {
            _callback(onerror, [{msg: 'Activity error'}]);
          };
       },
       onerror);
    },

    /**
     * Log the user out. It clears the app account.
     */
    logOut: function logOut() {
      AccountHelper.logOut();
    }
  };

  exports.Controller = Controller;
  
}(this));
