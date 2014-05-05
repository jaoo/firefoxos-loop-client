/* -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

/* exported AccountHelper */

/* globals Account, SimplePush, ClientRequestHelper */

(function(exports) {
  'use strict';

  function _callback(cb, args) {
    if (cb && typeof cb === 'function') {
      cb.apply(null, args);
    }
  }

  var AccountHelper = {
    /**
     * Get the app account.
     *
     * @param {Function} onsuccess Function to be called once it gets the
     *                             account. The account object is passed as
     *                             parameter.
     * @param {Function} onerror Function to be called in case of any error. An
     *                           error object is passed as parameter.
     */
    getAccount: function getAccount(onsuccess, onerror) {
      Account.load(onsuccess, onerror);
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
      var account = null;
      // Create an account locally.
      try {
        account = Account.create(id);
      } catch(e) {
        _callback(onerror, [e]);
      }
      SimplePush.createChannel(
       'loop',
       null,
       function onRegistered(error, endpoint) {
         if (error) {
           _callback(onerror, [error]);
         }
         // Register the peer.
         ClientRequestHelper.register(endpoint,
           function onRegisterSuccess() {
             // Store the account locally as it was successfully created and the
             // peer gets registered.
             account.store();
             _callback(onsuccess);
           },
           onerror);
       });
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
      Account.load(function(account) {
        if (!account) {
          _callback(onerror, [new Error('Unable to sign in. Sing up first')])
        }
        SimplePush.createChannel(
         'loop',
         null,
         function onRegistered(error, endpoint) {
           if (error) {
             _callback(onerror, [error]);
           }
           ClientRequestHelper.register(endpoint, onsuccess, onerror);
         });
      }, onerror);
    },

    /**
     * Log the user out. It clears the app account.
     */
    logOut: function logOut() {
      Account.load(function(account) {
        if (!account) {
          return;
        }
        account.clear();
      });
    }
  };

  exports.AccountHelper = AccountHelper;
})(this);
