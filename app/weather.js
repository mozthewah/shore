/* Weather for the clock, from Open-Meteo (free, no key). Off until the user turns it on in Settings › Clock.
   The place is the one typed on the phone upload page, otherwise the city of the TV's time zone
   (Europe/Berlin -> Berlin). Results are cached for 30 minutes; nothing else leaves the TV. */
(function (root) {
  'use strict';
  var KEY = 'cleanframe.weather.v1', MAX_AGE = 30 * 60000, RETRY = 10 * 60000;
  var state = { text: '', at: 0, place: '', tried: 0, busy: false }, listeners = [];
  /* WMO weather codes, grouped. */
  function label(code) {
    if (code === 0) return 'Clear';
    if (code <= 2) return 'Partly cloudy';
    if (code === 3) return 'Cloudy';
    if (code === 45 || code === 48) return 'Fog';
    if (code >= 51 && code <= 57) return 'Drizzle';
    if (code >= 61 && code <= 67) return 'Rain';
    if (code >= 71 && code <= 77) return 'Snow';
    if (code >= 80 && code <= 82) return 'Showers';
    if (code >= 85 && code <= 86) return 'Snow showers';
    if (code >= 95) return 'Thunderstorm';
    return '';
  }
  function fahrenheit() {
    var nav = root.navigator || {}, tag = String((nav.languages && nav.languages[0]) || nav.language || '');
    return /^en-(US|LR|MM)$/i.test(tag);
  }
  function zoneCity() {
    var zone = '';
    try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { }
    var city = zone.split('/').pop();
    return /^[A-Za-z_-]+$/.test(city) && zone.indexOf('/') > 0 && !/^(UTC|GMT|Etc)/.test(zone) ? city.replace(/_/g, ' ') : '';
  }
  function place() {
    var device = root.FrameDevice, typed = device && device.phone ? device.phone.info().place : '';
    return typed || zoneCity();
  }
  function get(url, done) {
    var x;
    try { x = new XMLHttpRequest(); } catch (e) { done(null); return; }
    x.open('GET', url, true);
    x.timeout = 15000;
    x.onload = function () { var data = null; try { if (x.status === 200) data = JSON.parse(x.responseText); } catch (e) { } done(data); };
    x.onerror = x.ontimeout = function () { done(null); };
    try { x.send(); } catch (e) { done(null); }
  }
  function load() {
    try { var saved = JSON.parse(root.localStorage.getItem(KEY)); if (saved && typeof saved.text === 'string') { state.text = saved.text; state.at = +saved.at || 0; state.place = String(saved.place || ''); } } catch (e) { }
  }
  function save() { try { root.localStorage.setItem(KEY, JSON.stringify({ text: state.text, at: state.at, place: state.place })); } catch (e) { } }
  function changed() { listeners.forEach(function (fn) { try { fn(state.text); } catch (e) { } }); }
  function refresh(force) {
    var name = place(), now = Date.now();
    if (!name) return;
    if (name !== state.place) { state.text = ''; state.at = 0; }
    if (state.busy || !force && (now - state.at < MAX_AGE || now - state.tried < RETRY)) return;
    state.busy = true; state.tried = now;
    get('https://geocoding-api.open-meteo.com/v1/search?count=1&format=json&name=' + encodeURIComponent(name), function (geo) {
      var hit = geo && geo.results && geo.results[0];
      if (!hit || typeof hit.latitude !== 'number') { state.busy = false; return; }
      get('https://api.open-meteo.com/v1/forecast?current=temperature_2m,weather_code&timezone=auto&latitude=' + hit.latitude + '&longitude=' + hit.longitude
        + (fahrenheit() ? '&temperature_unit=fahrenheit' : ''), function (data) {
        state.busy = false;
        var c = data && data.current;
        if (!c || typeof c.temperature_2m !== 'number') return;
        var word = label(c.weather_code), T = root.CleanFrameI18n ? root.CleanFrameI18n.T : function (s) { return s; };
        state.text = Math.round(c.temperature_2m) + '°' + (word ? ' ' + T(word) : '');
        state.at = Date.now(); state.place = name;
        save(); changed();
      });
    });
  }
  load();
  root.CleanFrameWeather = {
    /* Current line such as "12° Cloudy", or '' when unknown or older than three hours. */
    text: function () { return Date.now() - state.at < 3 * 3600000 ? state.text : ''; },
    refresh: refresh,
    onChange: function (fn) { listeners.push(fn); }
  };
})(this);
