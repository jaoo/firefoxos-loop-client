/* -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

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
     * @param {String} id Peer id.
     * @param {Function} onsuccess Function to be called once the call URL is
     *                             generated correctly.
     * @param {Function} onerror Function to be called when an error occurs.
     */
    generateCallUrl: function ch_generateCallUrl(id, onsuccess, onerror) {
      if (!id) {
        _callback(onerror, [{msg: 'Invalid peer id'}]);
        return;
      }

      ClientRequestHelper.generateCallUrl(id,
        function onGenerateCallUrl(result) {
          _callback(onsuccess, [result]);
        },
        onerror);
    },

    /**
     * Join the call party to the ongoing call.
     *
     * @param {String} apiKey TB API key.
     * @param {String} sessionId TB session id.
     * @param {String} target Container element name for video/audio elements.
     * @param {Function} onconnected Function to be called once the peer
     *                               connects the session.
     * @param {Function} onstream Function to be called once the session object
     *                            receives 'streamCreated' events.
     * @param {Function} onerror Function to be called if any error happens.
     */
    join: function ch_join(
      apiKey, sessionId, sessionToken, target, onconnected, onstream, onerror) {

      var videoStyles = { width: "100%", height: "auto" };

      var session = TB.initSession(apiKey, sessionId);
      session.on({
        streamCreated: function(event) {
          session.subscribe(event.stream/*, "incoming", videoStyles*/);
          _callback(onstream, [event]);
        }
      });
      session.connect(sessionToken, function(e) {
        if (e) {
          Utils.log('Session connect error ' + e.message);
          _callback(onerror, [e]);
          return;
        }
        _callback(onconnected);
        session.publish(/*target, videoStyles,*/ function onPublish(ee) {
          if (ee) {
            Utils.log('Session publish error ' + ee.message);
            _callback(onerror, [ee]);
          }
        });
      });
    }
  };

  exports.CallHelper = CallHelper;
}(this));
