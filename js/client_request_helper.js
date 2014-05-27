/* -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

(function(exports) {
  // TODO Poing to the right server and retrieve this info
  // from a 'config' file
  var SERVER_URL = 'http://loop.dev.mozaws.net';
  var TIMEOUT = 15000;

  function _callback(cb, args) {
    if (cb && typeof cb === 'function') {
      cb.apply(null, args);
    }
  }

  function _request(options, onsuccess, onerror) {
    var req = new XMLHttpRequest();
    req.open(options.method, options.url, true);
    req.setRequestHeader('Content-Type', 'application/json');
    req.responseType = 'json';
    req.timeout = TIMEOUT;

    if (options.credentials) {
      var hawkHeader = hawk.client.header(options.url, options.method, {
        credentials: options.credentials
      });
      req.setRequestHeader('authorization', hawkHeader.field);
    }
    req.onload = function() {
      if (req.status !== 200 && req.status !== 302) {
        _callback(onerror, [req.response]);
        return;
      }
      _callback(
        onsuccess, [req.response, req.getResponseHeader('Hawk-Session-Token')]
      );
    };

    req.onerror = req.ontimeout = function(event) {
      _callback(onerror, [event.target.status]);
    };

    var body;
    if (options.body) {
      body = JSON.stringify(options.body);
    }

    req.send(body);
  }

  /** Token for HTTP authenticated requests. */
  var _sessionToken = null;

  var ClientRequestHelper = {
    get serverUrl() {
      return SERVER_URL;
    },

    register: function register(pushEndpoint, onsuccess, onerror) {
      _request({
          method: 'POST',
          url: SERVER_URL + '/registration',
          body: {
            simple_push_url: pushEndpoint
          }
        },
        function onSuccess(result, sessionToken) {
          if (!sessionToken) {
            _callback(onerror, [new Error('No session token')]);
            return;
          }
          _sessionToken = sessionToken;
          _callback(onsuccess, [result]);
        },
        onerror);
    },

    generateCallUrl: function generateCallUrl(callerId, onsuccess, onerror) {
      if (!_sessionToken) {
        _callback(onerror, [new Error('No session token')]);
        return;
      }
      deriveHawkCredentials(_sessionToken, 'sessionToken', 2 * 32,
        function(hawkCredentials) {
          _request({
              method: 'POST',
              url: SERVER_URL + '/call-url',
              body: {
               callerId: callerId
              },
              credentials: hawkCredentials
            },
            onsuccess,
            onerror
          );
        }
      );
    },

    getCallUrl: function getCallUrl(token, onsuccess, onerror) {
      _request({
        method: 'GET',
        url: SERVER_URL + '/calls/' + token
      }, onsuccess, onerror);
    },

    makeCall: function makeCall(token, onsuccess, onerror) {
      _request({
        method: 'POST',
        url: SERVER_URL + '/calls/' + token
      }, onsuccess, onerror);
    },

    deleteCall: function deleteCall(token, onsuccess, onerror) {
      if (!_sessionToken) {
        _callback(onerror, [new Error('No session token')]);
        return;
      }
      deriveHawkCredentials(_sessionToken, 'sessionToken', 2 * 32,
        function(hawkCredentials) {
          _request({
              method: 'DELETE',
              url: SERVER_URL + '/calls/' + token,
              credentials: hawkCredentials
            },
            onsuccess,
            onerror
          );
        }
      );
    },

    getCalls: function getCalls(version, onsuccess, onerror) {
      if (!_sessionToken) {
        _callback(onerror, [new Error('No session token')]);
        return;
      }
      deriveHawkCredentials(_sessionToken, 'sessionToken', 2 * 32,
        function(hawkCredentials) {
          _request({
              method: 'GET',
              url: SERVER_URL + '/calls?version=' + version,
              credentials: hawkCredentials
            },
            onsuccess,
            onerror
          );
        }
      );
    },

    getCall: function getCall(callId, onsuccess, onerror) {
      _request({
        method: 'GET',
        url: SERVER_URL + '/calls/id/' + callId
      }, onsuccess, onerror);
    },

    rejectCall: function rejectCall(callId, onsuccess, onerror) {
      _request({
        method: 'DELETE',
        url: SERVER_URL + '/calls/id/' + callId
      }, onsuccess, onerror);
    }
  };

  exports.ClientRequestHelper = ClientRequestHelper;
})(this);
