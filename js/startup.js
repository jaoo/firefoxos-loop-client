/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';


/*
 * The structure should be the following:
 * - User actions must be *only* managed in 'ui.js'.
 * - Startup is the first code executed, so optimization as
 * lazy loading could be there.
 * - Controller is, as it name indicates, the Controller part of MVC
 * - We will include handlers/helpers to manage the calls and talk with
 * Loop & Opentok
 */

/*
 * This is the first code executed when loading the 'locales' file.
 * We could add Lazy loading and the initialization of the rest of
 * the modules needed
 */

window.addEventListener('localized', function onLocalized() {
  window.removeEventListener('localized', onLocalized);

  // Temporary start up. This piece of code will be removed eventually.
  SimplePush.createChannel(
   'loop',
   function onNotification(version) {
     navigator.mozApps.getSelf().onsuccess = function (evt) {
       var app = evt.target.result;
       app.launch();
     };
     ClientRequestHelper.getCalls(
       version,
       function onGetCallsSuccess(calls) {
         var call = calls.calls[0];
         if (!call) {
           window.close();
         }
         UIManager.incoming(
           null,
           'Incoming call',
           function onAnswer() {
             CallHelper.join(call.apiKey, call.sessionId, call.sessionToken);
           },
           function onHangup() {
             window.close();
           }
         );
       },
       function onGetCallsError() {
         window.close();
       }
     );
   },
   function onRegistered(error, endpoint) {
     if (error) {
       window.close();
     }
     SimplePush.start();
     ClientRequestHelper.register(endpoint,
       function onRegisterSuccess() {
         UIManager.outgoing(function onCallAction(number, callback) {
           CallHelper.generateCallUrl(number, function(result) {
             Utils.log('Loop web URL ' + JSON.stringify(result.call_url));
             alert('Cannot dial yet, share a call URL with the called party.');
             var activity = new MozActivity({
               name: 'share',
               data: {
                 type: 'url',
                 url: result.call_url,
                 phoneNumber: number
               }
             });
             window.close();
             // activity.onsuccess = activity.onerror = function() {
             //   window.close();
             // };
           });
         });
       },
       function onRegisterError() {
         window.close();
       });
   });
});
