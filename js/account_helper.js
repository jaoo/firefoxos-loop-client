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

  var ACCOUNT_KEY = 'loop';

  var AccountStorage = {
    /**
     * Load the account object.
     *
     * @param {Function} success A callback invoked when the transaction
     *                           completes successfully.
     * @param {Function} error A callback invoked if an operation fails.
     */
    load: function a_load(onsuccess, onerror) {
      asyncStorage.getItem(
        ACCOUNT_KEY,
        function onAccount(account) {
          if (!account) {
            _callback(onsuccess, [null]);
            return;
          }
          _callback(
            onsuccess, [new Account(account.id.value, account.assertion)]
          );
      });
    },

    /**
     * Store the account id object.
     *
     * @param {Account} account Account object to store.
     */
    store: function a_store(account) {
      asyncStorage.setItem(
        ACCOUNT_KEY, {id: account.id, assertion: account.assertion}
      );
    },

    /**
     * Clear the account storage.
     *
     */
    clear: function a_clear() {
      asyncStorage.setItem(ACCOUNT_KEY, null);
    }
  };

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
      AccountStorage.load(onsuccess, onerror);
    },

    /**
     * Sign up the user.
     *
     * @param {String} credentials Assertion to sign up the user with. It could
     *                             be either a MSISDN or a Fx Account assertion.
     * @param {Function} onsuccess Function to be called once the user gets
     *                             signed up.
     * @param {Function} onerror Function to be called in case of any error. An
     *                           error object is passed as parameter.
     * @param {Function} onnotification Function to be called once the device
     *                                  receives a simple push notification.
     */
    signUp: function signUp(assertion, onsuccess, onerror, onnotification) {
      /**
       * Helper function. Return the identifier in the assertion.
       *
       * @param {Object} assertion Assertion object.
       *
       * @return {String} The indetifier in the assertion.
       */
      function _getIdentifier(assertion) {
        if (assertion && assertion.type === 'BrowserID') {
          var unpacked = Utils.unpackAssertion(assertion.assertion);
          return JSON.parse(unpacked.claim)['fxa-verifiedEmail'];
        }
        // TODO: Get MSISDN in case of MSISDN assertion.

        return null;
      }

      SimplePush.createChannel(
       'loop',
       onnotification,
       function onRegistered(error, endpoint) {
         if (error) {
           _callback(onerror, [error]);
         }
         if (!endpoint) {
           _callback(onerror, [new Error('Invalid endpoint')]);
         }
         // Register the peer.
         ClientRequestHelper.register(
           assertion,
           endpoint,
           function onRegisterSuccess(token) {
             // Create an account locally.
             try {
               AccountStorage.store(
                 new Account(_getIdentifier(assertion), assertion)
               );
               SimplePush.start();
               _callback(onsuccess);
             } catch(e) {
               _callback(onerror, [e]);
               return;
             }
           },
           onerror
         );
       });
    },

    /**
     * Sign in the user.
     *
     * @param {Function} onsuccess Function to be called once the user gets
     *                             signed in.
     * @param {Function} onerror Function to be called in case of any error. An
     *                           error object is passed as parameter.
     * @param {Function} onnotification Function to be called once the device
     *                                  receives a simple push notification.
     */
    signIn: function signIn(onsuccess, onerror, onnotification) {
      AccountStorage.load(function(account) {
        if (!account) {
          _callback(onerror, [new Error('Unable to sign in. Sing up first')])
        }
        SimplePush.createChannel(
         'loop',
         onnotification,
         function onRegistered(error, endpoint) {
           if (error) {
             _callback(onerror, [error]);
           }
           if (!endpoint) {
             _callback(onerror, [new Error('Invalid endpoint')]);
           }
           ClientRequestHelper.register(
             account.assertion,
             endpoint,
             function onRegisterSuccess() {
               SimplePush.start();
               _callback(onsuccess);
             },
             onerror
           );
         });
      }, onerror);
    },

    /**
     * Log the user out. It clears the app account.
     */
    logOut: function logOut(onlogout) {
      AccountStorage.load(function(account) {
        if (!account) {
          return;
        }
        var msisdnSignUp = true;
        if (account.assertion.type === 'BrowserID') {
          msisdnSignUp = false;
        }
        AccountStorage.clear();
        // TODO We should remove the endpoint from the server as well.
        _callback(onlogout, [msisdnSignUp]);
      });
    }
  };

  exports.AccountHelper = AccountHelper;
})(this);
