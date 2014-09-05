/** exported TonePlayerHelper */

/** globals Audio */

'use strict';

(function(exports) {
  var _audioElement = null;
  var _channel = null;

  var BUSY_TONE_TIMEOUT = 5000;

  var DIAL_TONE = '../../resources/media/tones/dial.mp3';
  var BUSY_TONE = '../../resources/media/tones/busy.mp3';
  var HOLD_TONE = '../../resources/media/tones/hold.mp3';

  var _onplaying = function noop() {};

  function _playTone(src) {
    _audioElement.src = src;
    _audioElement.loop = true;
    _audioElement.play();
  };

  var TonePlayerHelper = {
    init: function tph_init(channel) {
      this.setChannel(channel);
    },

    setChannel: function tph_setChannel(channel) {
      var ctx = _audioElement;
      if (!channel || (ctx && (ctx.mozAudioChannelType === channel))) {
        return;
      }

      // If the channel needs to change we need to release resources and to
      // create a new audio context object.
      this.releaseResources();
      _channel = channel;
      this.ensureAudio();
    },

    ensureAudio: function tph_ensureAudio() {
      if (_audioElement || !_channel) {
        return;
      }
      _audioElement = new Audio();
      _audioElement.mozAudioChannelType = _channel;
      _audioElement.addEventListener('playing', _onplaying);
    },

    set onplaying(onplaying) {
      _onplaying = onplaying;
    },

    playDialing: function tph_playDialing() {
      _playTone(DIAL_TONE);
    },

    playBusy: function tph_playBusy() {
      return new Promise(function(resolve, reject) {
        var timeout = window.setTimeout(resolve, BUSY_TONE_TIMEOUT);
        _audioElement.addEventListener('ended', function onplaybackcompleted() {
          _audioElement.removeEventListener(onplaybackcompleted);
          window.clearTimeout(timeout);
          resolve();
        });
        _playTone(BUSY_TONE);
      });
    },

    playHold: function tph_playHold() {
      _playTone(HOLD_TONE);
    },

    stop: function tph_stop() {
      if (!_audioElement) {
        return;
      }
      _audioElement.pause();
      _audioElement.src = '';
    },

    releaseResources: function tph_releaseResources() {
      if ((_channel === 'telephony') && _audioElement) {
        _audioElement.mozAudioChannelType = 'normal';
      }
      _audioElement = null;
    }
  };

  exports.TonePlayerHelper = TonePlayerHelper;
}(this));
