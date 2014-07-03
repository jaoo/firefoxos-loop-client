(function(exports) {
  'use strict';

  var debug = true;
  
  function _onauthentication(event) {
    Wizard.init(event.detail.firstRun);
    SplashScreen.hide();
    window.removeEventListener('onauthentication', _onauthentication);
  }

  function _onlogin(event) {
    if (!event.detail || !event.detail.identity) {
      log.error('Unexpected malformed onlogin event');
      return;
    }
    CallLog.init(event.detail.identity);
    SplashScreen.hide();
    // TODO Add LoadingOverlay.hide() when implemented
  }

  function _onlogout() {
    Wizard.init(false);
    SplashScreen.hide();
  }

  function _onloginerror(event) {
    Wizard.init(false /* isFirstUse */);
    SplashScreen.hide();
    // TODO Add error message
    // TODO Add LoadingOverlay.hide() when implemented
  }

  /**
   * Handle the simple push notifications the device receives as an incoming
   * call.
   *
   * @param {Numeric} notificationId Simple push notification id (version).
   */
  function _onnotification(version) {
    navigator.mozApps.getSelf().onsuccess = function (event) {
      var app = event.target.result;
      app.launch();
      ClientRequestHelper.getCalls(
        version,
        function onsuccess(callsArray) {
          var call = callsArray.calls[0];
          CallScreenManager.launch('incoming', call);
          // _launchAttention(call);
        },
        function onerror(e) {
          debug && console.log('Error: ClientRequestHelper.getCalls ' + e);
        }
      )
    }
  }


  var Controller = {
    init: function () {
      window.addEventListener('onauthentication', _onauthentication);
      window.addEventListener('onlogin', _onlogin);
      window.addEventListener('onlogout', _onlogout);
      window.addEventListener('onloginerror', _onloginerror);

      // Start listening activities
      Activities.init();

      AccountHelper.init(_onnotification);
    },

    authenticate: function(id) {
      AccountHelper.authenticate(id);
    },

    pickAndCall: function() {
      // TODO Add handling of several emails & phone numbers. Currently
      // this is blocked due to https://bugzilla.mozilla.org/show_bug.cgi?id=1032871
      // which does not allow us to retrieve a full Contact without specifying any
      // filter
      var activity = new MozActivity({
            name: 'pick',
            data: {
              type: 'webcontacts/email'
            }
          });
      
      activity.onsuccess = function() {
        Controller.call(activity.result);
      };

      activity.onerror = function() {
        // TODO Check if needed to show any prompt to the user
      };
    },

    call: function(contact, isVideoOn) {
      if (!AccountHelper.logged) {
        alert('You need to be logged in before making a call with Loop');
        return;
      }
      console.log('============================');
      console.log(JSON.stringify(contact));
      console.log('============================');

      if (!contact ||
          !contact.email) {
        console.error('The pick activity result is invalid.');
        return;
      }

      // TODO When doing the direct call, use 'isVideoOn' or
      // the param retrieved from Loop Settings. By default
      // this param will be true.

      // TODO Update this array when https://bugzilla.mozilla.org/show_bug.cgi?id=1032871
      // will be ready.
      var identities = [contact.email];
      CallHelper.callUser(
        contact.email,
        function onLoopIdentity(call) {
          console.log(JSON.stringify(call));
          CallScreenManager.launch('outgoing', call);
          // _launchAttention(call);
        },
        function onFallback() {
          // TODO Update this when an array of identities will be ready
          CallHelper.generateCallUrl(identities[0],
            function onCallUrlSuccess(result) {
              Share.show(contact, result.callUrl);
            },
            function() {
              alert('Unable to retrieve link to share');
            }
          );
        }
      );
    },

    shareUrl: function (url, onsuccess, onerror) {
      debug && console.log('Loop web URL ' + url);
      var activity = new MozActivity({
        name: 'share',
        data: {
          type: 'url',
          url: url
        }
      });
      activity.onsuccess = onsuccess;
      activity.onerror = onerror;
    },

    sendUrlBySMS: function (id, url, onsuccess, onerror) {
      debug && console.log('Loop web URL for SMS ' + url + ' to ' + id);
      var activity = new MozActivity({
        name: 'new',
        data: {
          type: 'websms/sms',
          number: id,
          body: 'Lets join the call with Loop! ' + url
        }
      });
      activity.onsuccess = onsuccess;
      activity.onerror = onerror;
    },

    logout: function() {
      AccountHelper.logout();
    }

  };

  exports.Controller = Controller;
}(this));
