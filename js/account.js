/* -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

/* exported Account */

(function(exports) {
  'use strict';

   var ALIAS_KEY = 'loop';

  /**
   * Represents a parsed Account object. Ids could be either a phone number or a
   * email address.
   */
  function Account(alias) {
    this._alias = alias || [];
  }

  Account.prototype = {
    /**
     * Parse the given id and store the resulting alias into the array of alias
     * objects.
     * 
     * @param {String} id Peer's id.
     * 
     * @return {Object} Alias object.
     */
    parse: function a_parse(id) {
      /**
       * Helper function. Check whether the id parameter is a phone number.
       *
       * @param {String} id The id to check.
       *
       * @return {Boolean} Result.
       */
      function _isPhoneNumberValid(id) {
        if (id) {
          var re = /^([\+]*[0-9])+$/;
          if (re.test(id)) {
            return true;
          }
        }
        return false;
      }

      /**
       * Helper function. Check whether the id parameter is a email address.
       *
       * @param {String} id The id to check.
       *
       * @return {Boolean} Result.
       */
      function _isEmailValid(id) {
        // TODO.
        return false;
      }

      var alias = {};

      if (_isPhoneNumberValid(id)) {
        alias.type = 'msisdn';
      } else if (_isEmailValid(id)) {
        alias.type = 'fxac';
      } else {
        throw new Error('Invalid id');
      }

      alias.value = id;
      this._alias.push(alias);
    },

    /**
     * Link the given id with the current account object.
     *
     * @param {String} id Peer's id.
     */
    link: function a_link(id) {
      this.parse(id);
    },

    /**
     * Return the value for the id given its type.
     * 
     * @param {String} type Alias type.
     * 
     * @return {String} Peer's id.
     */
    getId: function a_getId(type) {
      var alias = null;

      alias = this._alias.find(function(element) {
        if (element.type === type) {
          return true;
        }
        return false;
      });

      return (alias ? alias.value : null);
    },

    /**
     * Store the account object.
     */
    store: function a_store() {
      console.log('Should store ' + JSON.stringify(this._alias));
      asyncStorage.setItem(ALIAS_KEY, this._alias);
    },

    /**
     * Clear the current account object.
     */
    clear: function a_clear() {
      this._alias = [];
      asyncStorage.setItem(ALIAS_KEY, null);
    }
  };

  /**
   * Create a new account object given the peer's id.
   * 
   * @param {String} id Peer's id.
   * 
   * @return {Account} New account object.
   */
  Account.create = function a_create(id) {
    var obj = new Account();
    obj.parse(id);

    return obj;
  };

  /**
   * Load the account object.
   * 
   * @param {Function} success A callback invoked when the transaction
   *                           completes successfully.
   * @param {Function} error A callback invoked if an operation fails.
   */
  Account.load = function a_load(onsuccess, onerror) {
    asyncStorage.getItem(
      ALIAS_KEY,
      function onAlias(alias) {
        if (!alias) {
          onsuccess(null);
          return;
        }
        console.log('Loaded ' + JSON.stringify(alias));
        onsuccess(new Account(alias));
    });
  };

  exports.Account = Account;
})(window);
