/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

/* global Controller */

/* exported UI */

/*
 * This code is in charge of the UI & User actions in our app.
 * This is the 'View' part of our MVC.
 */

(function (exports) {
  var UI = {
    init: function ui_init() {
      // Retrieve the various page elements
      var signUpButton = document.getElementById('signup');
      var signInButton = document.getElementById('signin');
      var logoutButton = document.getElementById('logout');
      var shareUrlButton = document.getElementById('share');

      signUpButton.addEventListener('click', this.onSignUp);
      signInButton.addEventListener('click', this.onSignIn);
      logoutButton.addEventListener('click', this.onLogout);
      shareUrlButton.addEventListener('click', this.onShareUrl);

      Controller.getAccount(
        function onSuccess(account) {
          if (!account) {
           signUpButton.hidden = false;
           return;
          }
          signInButton.hidden = false;
        },
        function onError(error) {
          alert(e.message);
          window.close();
        });
    },

    onSignUp: function ui_onSignUp() {
      var id = '+34667447797';
      Controller.signUp(id,
        function onSuccess() {
          var signUpButton = document.getElementById('signup');
          var logoutButton = document.getElementById('logout');
          var shareUrlButton = document.getElementById('share');

          signUpButton.hidden = true;
          logoutButton.hidden = false;
          shareUrlButton.hidden = false;
        },
        function onError(error) {
          alert(e.message);
        });
    },

    onSignIn: function ui_onSignIn() {
      Controller.signIn(
        function onSuccess() {
          var signInButton = document.getElementById('signin');
          var logoutButton = document.getElementById('logout');
          var shareUrlButton = document.getElementById('share');

          signInButton.hidden = true;
          logoutButton.hidden = false;
          shareUrlButton.hidden = false;
        },
        function onError(error) {
          alert(e.message);
        });
    },

    onLogout: function ui_onLogout() {
      Controller.logOut();
      window.close();
    },

    onShareUrl: function ui_onShareUrl() {
      Controller.shareUrl('DummyId',
        function onSuccess() {
          window.close();
        },
        function onError(e) {
          alert(e.msg)
          window.close();
        });
    }
  };

  exports.UI = UI;
}(this));
