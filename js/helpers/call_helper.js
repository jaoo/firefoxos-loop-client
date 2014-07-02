/* global ClientRequestHelper, Utils */

/* exported CallHelper */

'use strict';

(function(exports) {
  function _callback(cb, args) {
    if (cb && typeof cb === 'function') {
      cb.apply(null, args);
    }
  }

  var CallHelper = {
    /**
     * Generate a call URL to be shared with the called party.
     *
     * @param {String} id Peer's id.
     * @param {Function} onsuccess Function to be called once the call URL is
     *                             generated correctly.
     * @param {Function} onerror Function to be called when an error occurs.
     */
    generateCallUrl: function ch_generateCallUrl(id, onsuccess, onerror) {
      if (!id) {
        _callback(onerror, [new Error('Invalid peer id')]);
        return;
      }

      ClientRequestHelper.generateCallUrl(id,
        function onGenerateCallUrl(result) {
          _callback(onsuccess, [result]);
        },
        onerror
      );
    },

    callUser: function ch_callUser(calleeId, onsuccess, onerror) {
      if (!calleeId) {
        _callback(onerror, [new Error('Invalid callee id')]);
        return;
      }

      ClientRequestHelper.callUser(calleeId,
        function onCallUser(result) {
          _callback(onsuccess, [result]);
        },
        onerror
      );
    },

    /**
     * Answer/handle the incoming call.
     *
     * @param {Numeric} notificationId Simple push notification version.
     * @param {String} target Container element name for video/audio elements.
     * @param {Object} constraints Constraints object defining call details.
     * @param {Function} onconnected Function to be called once the peer
     *                               connects the session.
     * @param {Function} ondisconnected Function to be called once the peer
     *                                  disconnects from the session.
     * @param {Function} onstream Function to be called once the session object
     *                            receives 'streamCreated' events.
     * @param {Function} onerror Function to be called if any error happens.
     */
    launchIncomingCall: function ch_handleIncomingCall() {

    }
  };

  exports.CallHelper = CallHelper;
}(this));
