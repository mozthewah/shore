/* Android TV / Google TV adapter (e.g. TCL Google TV sets).
   Active only inside the CleanFrame Android shell, which exposes window.CleanFrameAndroid.
   On Tizen and in the browser preview this file does nothing, so device.js stays in charge. */
(function () {
  'use strict';
  var bridge = window.CleanFrameAndroid;
  if (!bridge) return;

  /* CleanFrame brand id -> Android TV package. Brands keep CleanFrame's bundled logos. */
  var PACKAGES = {
    stremio: 'com.stremio.one', netflix: 'com.netflix.ninja',
    disneyplus: 'com.disney.disneyplus', youtube: 'io.gh.reisxd.tizentube.cobalt',
    appletv: 'com.apple.atve.androidtv.appletv', primevideo: 'com.amazon.amazonvideo.livingroom',
    applemusic: 'com.apple.android.music', spotify: 'com.spotify.tv.android',
    hbomax: 'com.wbd.stream', tubi: 'com.tubitv',
    joyn: 'de.prosiebensat1digital.seventv', waipu: 'de.exaring.waipu', twitch: 'tv.twitch.android.app',
    ard: 'de.swr.avp.ard.tv', zdf: 'com.zdf.android.mediathek', arte: 'tv.arte.plus7'
  };
  /* Tried when the brand's preferred package is missing (TizenTube -> official YouTube). */
  var FALLBACK = { youtube: 'com.google.android.youtube.tv' };
  /* Saved preferences and the default Home list still carry Tizen IDs. */
  var TIZEN = {
    'IkWsFHtOY9.Stremio': 'stremio', 'org.tizen.netflix-app': 'netflix',
    'MCmYXNxgcu.DisneyPlus': 'disneyplus', '9Ur5IzDKqV.TizenYouTube': 'youtube',
    'com.samsung.tv.aria-video': 'appletv', 'org.tizen.primevideo': 'primevideo',
    'org.tizen.apple.apple-music': 'applemusic', 'rJeHak5zRg.Spotify': 'spotify',
    '5b8c3eb16b.BeamCTVDev': 'hbomax', '3KA0pm7a7V.TubiTV': 'tubi'
  };
  var ORDER = ['stremio', 'netflix', 'disneyplus', 'youtube', 'appletv', 'primevideo', 'applemusic'];
  var EXTRA = ['spotify', 'hbomax', 'tubi', 'joyn', 'waipu', 'twitch', 'ard', 'zdf', 'arte'];
  var BRAND = {};
  Object.keys(PACKAGES).forEach(function (b) { BRAND[PACKAGES[b]] = b; });

  function later(fn) { setTimeout(fn, 0); }
  function ask(name, arg) {
    try { return arg === undefined ? bridge[name]() : bridge[name](arg); } catch (e) { return false; }
  }
  function reply(ok, done, message) {
    later(function () {
      if (ok) done(null);
      else done({ message: message || 'The TV could not open this screen.', detail: 'Try again, or press the remote’s Home button.' });
    });
  }
  function launchApp(id, done) {
    if (/^[A-Za-z0-9._]+\/[A-Za-z0-9._$\/-]+$/.test(id)) { reply(ask('openInput', id), done, 'This input could not be opened.'); return; }
    var pkg = TIZEN[id] ? PACKAGES[TIZEN[id]] : id;
    if (!pkg || !/^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)+$/.test(pkg)) { reply(false, done, 'This app isn’t available on this TV.'); return; }
    var brand = BRAND[pkg], ok = ask('launch', pkg);
    if (!ok && FALLBACK[brand]) ok = ask('launch', FALLBACK[brand]);
    reply(ok, done, 'This app isn’t installed on this TV.');
  }
  function launch(brand, done) {
    if (!PACKAGES[brand]) { reply(false, done, 'This app has no launch target.'); return; }
    launchApp(PACKAGES[brand], done);
  }
  function apps(done) {
    later(function () {
      var list, result = [];
      try { list = JSON.parse(bridge.apps()); } catch (e) { done({ message: 'Could not read installed apps.' }); return; }
      list.forEach(function (a) {
        var brand = BRAND[a.appId] || '', rank = ORDER.indexOf(brand);
        result.push({ appId: a.appId, name: a.name, brand: brand,
          icon: '/appicon/' + a.appId + '.png',
          rank: rank >= 0 ? rank : (EXTRA.indexOf(brand) >= 0 ? 20 : 30) });
      });
      result.sort(function (a, b) { return a.rank - b.rank || a.name.toLowerCase().localeCompare(b.name.toLowerCase()); });
      done(null, result);
    });
  }
  /* Physical inputs (HDMI, AV). state: 0 device on, 1 standby, 2 nothing plugged in. */
  function inputs(done) {
    later(function () {
      var list;
      try { list = JSON.parse(bridge.inputs()); } catch (e) { done({ message: 'Could not read TV inputs.' }); return; }
      done(null, list.filter(function (i) { return i && typeof i.id === 'string' && typeof i.name === 'string'; }));
    });
  }
  var inputListeners = [], onlineListeners = [];
  window.CleanFrameOnlineChanged = function (entries, status) { onlineListeners.forEach(function (fn) { try { fn(entries, status); } catch (e) { } }); };
  /* Online photo sources, fetched and pre-rendered by the Android shell. */
  var online = {
    info: function () { try { return JSON.parse(bridge.onlineInfo()); } catch (e) { return { source: 'off', unsplash: false }; } },
    select: function (source, force) { try { bridge.onlineSource(source, !!force); } catch (e) { } },
    onChange: function (fn) { onlineListeners.push(fn); }
  };
  window.CleanFrameInputsChanged = function () { inputListeners.forEach(function (fn) { try { fn(); } catch (e) { } }); };
  window.FrameDevice = {
    platform: 'android',
    launch: launch, launchApp: launchApp, apps: apps,
    inputs: inputs, onInputs: function (fn) { inputListeners.push(fn); }, online: online,
    /* Android package behind a Home entry (for its TV banner); null for inputs and unknown IDs. */
    packageOf: function (id) { var brand = TIZEN[id] || BRAND[id] || (PACKAGES[id] ? id : ''), pkg = brand === 'youtube' ? FALLBACK.youtube : TIZEN[id] ? PACKAGES[TIZEN[id]] : PACKAGES[id] || id; // YouTube tile shows YouTube's banner
      return /^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)+$/.test(pkg) ? pkg : null; },
    /* No Art Mode on Android TV: start the system screensaver instead. */
    art: function (done) { reply(ask('screensaver'), done, 'The screensaver could not start.'); },
    home: function (done) { reply(ask('systemHome'), done, 'The TV’s own Home screen could not open.'); },
    settings: function (done) { reply(ask('settings'), done, 'TV settings could not open.'); }
  };
}());
