/* -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

/* global UI, CallHelper, PushNotification */

/* exported Callscreen */

'use strict';

(function (exports) {

  var Callscreen = {
    init: function c_init() {
      var notificationId = null;
      var calleeId = null;

      var rawParams = window.location.search.slice(1);
      var params = rawParams.split('&');
      for (var i = 0; i < params.length; i++) {
        if (params[i].indexOf('notificationid=') !== -1) {
          notificationId = params[i].replace('notificationid=', '');
        }
        if (params[i].indexOf('calleeId=') !== -1) {
          calleeId = params[i].replace('calleeId=', '');
        }
      }

      if (!notificationId && !calleeId) {
        window.close();
      }

      var _onSuccess = function() {
        UI.init();

        if (notificationId) {
          UI.incomingCall(
            function onAnswer() {
              UI.callScreen(
                function onSwitchSpeaker() {
                  CallHelper.switchSpeaker();
                },
                function onHangup() {
                  CallHelper.hangUp();
                  window.close();
                }
              );
              // TODO: the constraints object should be definded based on user's
              // preferences such as the ones exposed in the UI or the ones selected
              // in the hipothetical settings panel we should have.
              var constraints = {audio: true, video: true};
              CallHelper.handleIncomingCall(notificationId,
                                            'audio-video-container',
                                            constraints,
                                            null,
                                            function onDisconnected() {
                                              CallHelper.hangUp();
                                              window.close();
                                            },
                                            null,
                                            null);
            },
            function onReject() {
              window.close();
            }
          );
        }
        if (calleeId) {
          UI.callScreen(
            function onSwitchSpeaker() {
              CallHelper.switchSpeaker();
            },
            function onHangup() {
              CallHelper.hangUp();
              window.close();
            }
          );
          var constraints = {audio: true, video: true};
          CallHelper.callUser(calleeId,
            function onCallUserSuccess(call) {
              Utils.log('Call user result ' + JSON.stringify(call));
              var constraints = {audio: true, video: true};
              CallHelper.joinCall(call,
                                  'audio-video-container',
                                  constraints,
                                  null,
                                  function onDisconnected() {
                                    CallHelper.hangUp();
                                    window.close();
                                  },
                                  null,
                                  null,
                                  true /* outgoing call*/);
            },
            null
          );
        }
      };

      var _onError = function () {
        alert('Oh no!, something bad happened!');
        window.close();
      };

      AccountHelper.signIn(
        _onSuccess.bind(Callscreen),
        _onError.bind(Callscreen),
        PushNotification.onNotification
      );
    }
  };

  exports.Callscreen = Callscreen;
}(this));
