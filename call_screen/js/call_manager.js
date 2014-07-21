(function(exports) {
  'use strict';

  var _call = {};
  var _session;
  var _publisher;
  var _subscriber;
  var _peersInSession = 0;
  var _publishersInSession = 0;
  var _connectionTimeout;
  var _callProgressHelper = null;
  var _callee;
  var _reason;
  var _speakerManager;

  /**
   * Helper function. Handles call progress protocol state changes.
   *
   * @param {Object} callProgressHelper CallProgressHelper object.
   */
  function _handleCallProgress(callProgressHelper) {
    var state = callProgressHelper && callProgressHelper.state || 'unknown';
    switch(state) {
      case 'alerting':
        if (!_callee) {
          return;
        }
        callProgressHelper.accept();
        break;
      case 'connecting':
        _session.connect(_call.sessionToken, function(e) {
          if (e) {
            console.log('Session connect error ' + e.message);
            return;
          }
          _publisher = _session.publish(
            'local-video', null, function onPublish(ee) {
              if (ee) {
                console.log('Session publish error ' + ee.message);
              }
              var container =  document.querySelector('.OT_publisher');
              if (!container) {
                return;
              }
              callProgressHelper.mediaUp();
              _publishersInSession += 1;

              container.style.width = '140%';
              container.querySelector('video').style.width = '140% !important';
          });
        });
        break;
      case 'error':
      case 'terminated':
        CallManager.stop();
        break;
      default:
        break;
    }
  }

  var CallManager = {
    init: function() {
      // Get params from URL
      var query = window.location.search.slice(1);
      var urlParams = query.split('&');
      for (var i=0; i < urlParams.length; i++) {
        var keyValue = urlParams[i].split('=');
        _call[keyValue[0]] = decodeURIComponent(keyValue[1]);
      }

      _call.apiKey = '44632522';
      _call.sessionId = '2_MX40NDYzMjUyMn5-TW9uIEp1bCAyMSAwNjozNToxMiBQRFQgMjAxNH4wLjU4ODk0MzY2fn4';
      _call.sessionToken = 'T1==cGFydG5lcl9pZD00NDYzMjUyMiZzaWc9Njg4Mjc3OWU3MDNmYWRjOGM4NzNhZDUyN2QxMGVkNDc4NmJjOTA4NTpyb2xlPXB1Ymxpc2hlciZzZXNzaW9uX2lkPTJfTVg0ME5EWXpNalV5TW41LVRXOXVJRXAxYkNBeU1TQXdOam96TlRveE1pQlFSRlFnTWpBeE5INHdMalU0T0RrME16WTJmbjQmY3JlYXRlX3RpbWU9MTQwNTk0OTcyNyZub25jZT0wLjM2ODI2OTQ4MDQ1MjY2OTUmZXhwaXJlX3RpbWU9MTQwODU0MTA1MA==';

      var identities = _call.identities;
      var layout = _call.layout;
      var video = _call.isVideoCall;

      _callee = _call.layout === 'incoming' ? true : false;
      // TODO: Send busy as reason in case we are in another webrtc call.
      _reason = _callee ?  'reject' : 'cancel';
      // _callProgressHelper = new CallProgressHelper(_call.callId,
      //                                              _call.progressURL,
      //                                              _call.websocketToken);
      // _callProgressHelper.onerror = function onError(evt) {
      //   _handleCallProgress(_callProgressHelper);
      // };
      return {
        identities: identities,
        layout: layout,
        video: video
      };
    },

    toggleVideo: function(isVideoOn) {
      if (!_publisher) {
        console.error('No publisher in this call');
        return;
      }
      
      if (!_speakerManager) {
        _speakerManager = new window.MozSpeakerManager();
      }
      _speakerManager.forcespeaker = isVideoOn;
      _publisher.publishVideo(isVideoOn);
    },

    toggleSpeaker: function(isSpeakerOn) {
      if (!_subscriber) {
        console.error('No subscriber in this call');
        return;
      }
      _subscriber.subscribeToAudio(isSpeakerOn);
    },

    toggleMic: function(isMicOn) {
      if (!_publisher) {
        console.error('No publisher in this call');
        return;
      }
      _publisher.publishAudio(isMicOn);
    },

    join: function(isVideoCall) {
      Countdown.reset();

      // Choose default camera
      var cameraConstraint =
        navigator.mozCameras.getListOfCameras().length > 1 ?
          {facingMode: 'user', require:['facingMode']} : true;
      var constraints = {
        // TODO Ask for facing mode if possible
        video: cameraConstraint,
        audio: true
      };
      Opentok.setConstraints(constraints);

      _session = TB.initSession(_call.apiKey, _call.sessionId);
      var that = this;
      _session.on({
        // Fired when a new peer is connected to the session.
        connectionCreated: function(event) {
          _peersInSession += 1;
          if (_peersInSession > 1) {
            // Start counter
            Countdown.start();
          }
        },
        // Fired when an existing peer is disconnected from the session.
        connectionDestroyed: function(event) {
          _peersInSession -= 1;
          if (_peersInSession === 1) {
            // We are alone in the session now so lets disconnect.
            that.stop();
          }
        },
        // Fired when a peer publishes the media stream.
        streamCreated: function(event) {
          _subscriber = _session.subscribe(event.stream, 'fullscreen-video', null);
          _publishersInSession += 1;

          // Hack to fix OT Css
          var container =  document.querySelector('.OT_subscriber');
          if (!container) {
            return;
          }
          // Update the styles of the video strem
          container.style.width = '100%';
          container.style.height = '100%';

          CallManager.toggleVideo(isVideoCall);
        },
        // Fired when a peer stops publishing the media stream.
        streamDestroyed: function(event) {
          _publishersInSession -= 1;
        }
      });

      // _handleCallProgress(_callProgressHelper);
      // _callProgressHelper.onstatechange = function onStateChange(evt) {
      //   _handleCallProgress(_callProgressHelper);
      // };

      _session.connect(_call.sessionToken, function(e) {
	if (e) {
	  console.log('Session connect error ' + e.message);
	  return;
	}
	_publisher = _session.publish(
	  'local-video', null, function onPublish(ee) {
	    if (ee) {
	      console.log('Session publish error ' + ee.message);
	    }
	    var container =  document.querySelector('.OT_publisher');
	    if (!container) {
	      return;
	    }
	    callProgressHelper.mediaUp();
	    _publishersInSession += 1;

	    container.style.width = '140%';
	    container.querySelector('video').style.width = '140% !important';
	});
      });
    },

    stop: function() {
      // if ((_callProgressHelper.state !== 'connected') ||
      //     (_callProgressHelper.state !== 'closed')) {
      //   _callProgressHelper.terminate(_reason);
      // }
      try {
        _session.disconnect();
      } catch(e) {
        console.log('Session is not available to disconnect ' + e);
      }

      // Stop the countdown
      var duration = Countdown.stop();
      var connected = false;

      if (duration > 0) {
        connected = true;
      }
      
      function onCallEnded() {
        // Send result to the Controller
        var hangoutMessage = {
          id: 'call_screen',
          message: 'hangout',
          params: {
            duration: duration,
            connected: connected
          }
        };
        ControllerCommunications.send(hangoutMessage);
      }

      if (connected) {
        CallScreenUI.showFeedback(onCallEnded);
      } else {
        onCallEnded();
      }
      
      // Clean the call
      _call = {};
      // _callProgressHelper.finish();
      _callProgressHelper = null;
    }
  };

  exports.CallManager = CallManager;
}(this));
