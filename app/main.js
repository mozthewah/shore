/* Shore Home. Static materials, local preferences and public Tizen app controls. */
(function () {
  'use strict';

  /* ---------- Bundled data ---------- */
  var ANDROID = !!(window.FrameDevice && FrameDevice.platform === 'android');
  /* Opened by the TV as its system screensaver (ShoreDream): only the screensaver shows. */
  var DREAM = /(^|#)screensaver$/.test(location.hash), SAVER_API = window.FrameDevice && FrameDevice.saver || null;
  var TV = ANDROID ? { brand: 'Google TV', home: 'Google TV Home', homeLine: 'Open the Google TV Home screen', art: 'Screensaver' }
    : { brand: 'Samsung', home: 'Samsung Home', homeLine: 'Open Samsung’s Home screen', art: 'Art Mode' };
  var ASSETS = 'assets/', ICONS = ASSETS + 'icons/', WP = ASSETS + 'wallpapers/';
  var CAP = 9, SCRIM_Y = 560;
  var DOCK_MODES = { both: { tw: 288, th: 200, pitch: 296 }, text: { tw: 288, th: 104, pitch: 296 }, icons: { tw: 176, th: 144, pitch: 184 }, shelf: { tw: 288, th: 250, pitch: 296 } };
  var GRID_ROW = 240, GRID_COL = 344, COLS = 5;
  var ED_ROW = 80, ED_SEP = 56, ED_VIEW = 752, STRIP_PITCH = 188;
  var PH_TOP = 220, PH_PITCH = 128, PH_FULL = 5, PH_HEIGHT = 944, PH_COMPACT_TOP = 144, PH_COMPACT_PITCH = 88, PH_COMPACT_VISIBLE = 9;
  var WALL_VISIBLE = 6, WALL_ROW = 92, WALL_DELAY = 200;
  var KEYS = { 37: 'left', 38: 'up', 39: 'right', 40: 'down', 13: 'ok', 27: 'back', 8: 'back', 10009: 'back', 461: 'back' };
  var FULL = 'Home holds nine apps. Remove one first.', LAST = 'Home needs one app';

  var PRIMARY_APPS = [
    { id: 'stremio', name: 'Stremio', mark: true, appId: 'IkWsFHtOY9.Stremio' },
    { id: 'netflix', name: 'Netflix', mark: true, appId: 'org.tizen.netflix-app' },
    { id: 'disneyplus', name: 'Disney+', mark: true, appId: 'MCmYXNxgcu.DisneyPlus' },
    { id: 'youtube', name: 'YouTube', mark: true, appId: '9Ur5IzDKqV.TizenYouTube' },
    { id: 'appletv', name: 'Apple TV', mark: true, appId: 'com.samsung.tv.aria-video' },
    { id: 'primevideo', name: 'Prime Video', mark: true, appId: 'org.tizen.primevideo' },
    { id: 'abciview', name: 'ABC iview', mark: true, appId: 'mWK87Xghap.ABCiview' },
    { id: 'sbs', name: 'SBS On Demand', mark: true, appId: 'OyE7OuxlUi.SBSOnDemand' },
    { id: 'applemusic', name: 'Apple Music', mark: true, appId: 'org.tizen.apple.apple-music' }
  ];
  /* Bundled marks for apps outside the default Home list. */
  var EXTRA_MARKS = ['hbomax', 'spotify', 'tubi', 'joyn', 'waipu', 'twitch', 'ard', 'zdf', 'arte'];
  var PRIMARY = PRIMARY_APPS.map(function (a) { return a.id; }), APPS = PRIMARY_APPS.slice(), ALPHA = [];
  var WALLS = (window.CleanFrameWallpapers || [{ id: 'misty', name: 'Misty coast', tone: 'light', ut: { tr: 'mist', br: 'mist' }, frostVeil: .20 }])
    .concat(window.CleanFrameOnlineWallpapers || []);
  /* Online photo sources (Android shell only). Photos arrive pre-rendered, like the bundled gallery. */
  var ONLINE = window.FrameDevice && FrameDevice.online, ONLINE_INFO = ONLINE ? ONLINE.info() : { source: 'off', unsplash: false };
  var SOURCES = [{ id: 'builtin', name: 'Shore wallpapers' }, { id: 'phone', name: 'My photos', key: 'phone' }, { id: 'nasa', name: 'NASA Astronomy Picture' }, { id: 'nasalib', name: 'NASA Image Library' }, { id: 'bing', name: 'Bing Picture of the Day' },
    { id: 'wikimedia', name: 'Wikimedia Picture of the Day' }, { id: 'picsum', name: 'Random photos (Picsum)' },
    { id: 'unsplash-nature', name: 'Unsplash · Nature and landscapes', unsplash: true }, { id: 'unsplash-city', name: 'Unsplash · Cities and architecture', unsplash: true },
    { id: 'unsplash-space', name: 'Unsplash · Night sky and space', unsplash: true },
    { id: 'loops', name: 'Bundled loops', page: 'animated' }, { id: 'pexels-ocean', name: 'Pexels · Ocean waves', key: 'pexels', page: 'animated' },
    { id: 'pexels-rain', name: 'Pexels · Rain on glass', key: 'pexels', page: 'animated' }, { id: 'pexels-clouds', name: 'Pexels · Clouds', key: 'pexels', page: 'animated' },
    { id: 'pexels-city', name: 'Pexels · City at night', key: 'pexels', page: 'animated' }, { id: 'klipy-lofi', name: 'Klipy · Lofi', key: 'klipy', page: 'animated' },
    { id: 'klipy-rain', name: 'Klipy · Cozy rain', key: 'klipy', page: 'animated' }, { id: 'klipy-space', name: 'Klipy · Space', key: 'klipy', page: 'animated' }];
  SOURCES.forEach(function (o) { if (o.unsplash) { o.key = 'unsplash'; o.page = 'unsplash'; } else if (!o.page) o.page = 'online'; });
  var ONLINE_STATUS = { loading: 'Downloading wallpapers…', error: 'Couldn’t reach this source. Shore tries again later.', empty: 'No suitable landscape photos right now.', ready: 'New wallpapers arrive every few hours.', off: '' };

  var ADAPTIVE_INK = window.CleanFrameAdaptiveInk || {};
  WALLS.forEach(function (w) { w.ut = w.ut || { tr: 'light', br: 'light' }; w.frostVeil = w.frostVeil || .12; });
  var MODES = [
    { id: 'fixed', name: 'Fixed', min: 0 }, { id: 'open', name: 'Each time Home opens', min: 0 },
    { id: '5', name: 'Every 5 minutes', min: 5 }, { id: '15', name: 'Every 15 minutes', min: 15 }, { id: '30', name: 'Every 30 minutes', min: 30 },
    { id: '60', name: 'Every hour', min: 60 }, { id: 'day', name: 'Once a day', min: 1440 }
  ];
  var KEY = 'cleanframe.home.v1', storageOk = true, catalog = { loading: false, loaded: false, error: null, request: 0, revision: 0 };
  var QA = window.ShoreQA = { minuteMs: window.ShoreQA && window.ShoreQA.minuteMs || 60000 };
  var FONTS = {
    manrope: { name: 'Manrope', family: 'Manrope', display: 600, ui: 500, clock: 500 },
    montreal: { name: 'Neue Montreal', family: 'Study Montreal', display: 300, ui: 400, clock: 300 },
    mori: { name: 'Mori', family: 'Study Mori', display: 200, ui: 400, clock: 200 },
    pangram: { name: 'Pangram Sans', family: 'Study Pangram', display: 300, ui: 400, clock: 300 },
    geist: { name: 'Geist', family: 'Study Geist', display: 300, ui: 400, clock: 300 },
    newsreader: { name: 'Newsreader', family: 'Study Newsreader', display: 400, ui: 400, clock: 400 },
    inter: { name: 'Inter', family: 'Study Inter', display: 300, ui: 400, clock: 300 },
    outfit: { name: 'Outfit', family: 'Study Outfit', display: 300, ui: 400, clock: 300 },
    spacegrotesk: { name: 'Space Grotesk', family: 'Study Space Grotesk', display: 300, ui: 400, clock: 300 },
    sora: { name: 'Sora', family: 'Study Sora', display: 300, ui: 400, clock: 300 },
    playfair: { name: 'Playfair Display', family: 'Study Playfair', display: 400, ui: 400, clock: 400 }
  };
  var PRIVATE_FONTS = window.CleanFramePrivateFontIDs || [], fontMetrics = {}, unavailableFonts = {}, widthCache = {}, fontsReady = false;
  var LOOK_KEYS = ['bg', 'layout', 'apps', 'font', 'controls', 'focus', 'material'];
  var LOOK_VALUES = { bg: ['dark', 'light', 'photo'], layout: ['list', 'dock'], apps: ['icons', 'both', 'text'], font: Object.keys(FONTS).filter(function (id) { return id === 'manrope' || PRIVATE_FONTS.indexOf(id) >= 0; }), controls: ['icons', 'both', 'text'], inputs: ['front', 'row'], lstyle: ['glass', 'shelf'], motion: ['still', 'drift'], tweight: ['auto', 'light', 'regular', 'bold'], tsize: ['small', 'default', 'large'],
    cformat: ['12', '24'], cdate: ['off', 'on'], cweather: ['off', 'on'], wunit: ['c', 'f'], cplaying: ['off', 'on'], cart: ['off', 'on'], clook: ['off', 'on'], saver: ['off', '5', '10', '15'], csize: ['small', 'medium', 'large', 'huge'], cweight: ['auto', 'thin', 'light', 'regular', 'bold'],
    night: ['off', 'scheduled', 'always'], nhours: ['20-7', '21-7', '22-6', '23-7'], ndim: ['soft', 'medium', 'strong'], idle: ['off', '1', '5'], focus: ['type', 'glass'], material: ['soft', 'frost', 'tint'],
    svsrc: ['like', 'every', 'builtin'], svlay: ['mix', 'single', 'mosaic'], svtime: ['15', '30', '60'], svmotion: ['still', 'drift'], iask: ['off', 'on'], svclock: ['off', 'on'], svdate: ['off', 'on'], svmusic: ['off', 'on'], wicon: ['off', 'on'], cwave: ['off', 'on'],
    cpos: ['left', 'center'], csec: ['off', 'on'], tint: ['none', 'warm', 'cool', 'rose', 'green'], dglass: ['clear', 'default', 'solid'], isize: ['small', 'default', 'large'], npdim: ['none', 'soft', 'strong'], svpos: ['move', 'fixed'] };
  /* Newer axes with their defaults: stored, migrated and validated like the others. */
  var MORE_LOOK = { iask: 'on', svsrc: 'like', svlay: 'mix', svtime: '30', svmotion: 'drift', svclock: 'on', svdate: 'on', svmusic: 'on', wicon: 'on', cwave: 'on', cpos: 'left', csec: 'off', tint: 'none', dglass: 'default', isize: 'default', npdim: 'none', svpos: 'move' };
  /* On/off settings that OK flips. */
  var TOGGLES = ['iask', 'cdate', 'cweather', 'cplaying', 'cart', 'clook', 'svclock', 'svdate', 'svmusic', 'wicon', 'cwave', 'csec'];
  var LOOK_NAMES = { bg: 'Background', layout: 'Layout', apps: 'Apps', font: 'Font', controls: 'Home controls', inputs: 'Inputs', motion: 'Motion', tweight: 'Text weight', tsize: 'App name size', cformat: 'Format', cdate: 'Date', cweather: 'Weather', wunit: 'Temperature', cplaying: 'Now playing', cart: 'Album art', clook: 'Artist pictures', saver: 'Screensaver', csize: 'Clock size', cweight: 'Clock weight',
    night: 'Night mode', nhours: 'Night hours', ndim: 'Night dimming', idle: 'Hide controls when idle', focus: 'Focus', material: 'Material',
    iask: 'Ask to switch', svsrc: 'Screensaver photos', svlay: 'Arrangement', svtime: 'Each slide', svmotion: 'Photo motion', svclock: 'Clock', svdate: 'Date and weather', svmusic: 'Music', wicon: 'Weather icon', cwave: 'Level meter',
    cpos: 'Clock position', csec: 'Seconds', tint: 'Accent', dglass: 'App row glass', isize: 'Icon size', npdim: 'Album art dimming', svpos: 'Clock on the screensaver' };
  var VALUE_NAMES = { dark: 'Dark', light: 'Light', photo: 'Photo', list: 'List', dock: 'Dock', type: 'Type', glass: 'Glass', soft: 'Soft', frost: 'Frost', tint: 'Clear tint', icons: 'Icons', both: 'Icons and text', text: 'Text', front: 'First in Home', row: 'Own row', still: 'Still', drift: 'Drift', auto: 'Auto', thin: 'Thin', regular: 'Regular', bold: 'Bold', small: 'Small', 'default': 'Default', large: 'Large',
    medium: 'Medium', huge: 'Huge', '12': '12-hour', '24': '24-hour', on: 'Show', scheduled: 'Timed', always: 'Always', soft: 'Soft', strong: 'Strong',
    '20-7': '20–07', '21-7': '21–07', '22-6': '22–06', '23-7': '23–07', '1': 'After 1 min', '5': 'After 5 min', '10': 'After 10 min', '15': 'After 15 min', c: '°C', f: '°F',
    like: 'Like Home', every: 'Everything', builtin: 'Built-in', mix: 'Mixed', single: 'One photo', mosaic: 'Mosaics',
    left: 'Left', center: 'Centred', none: 'None', warm: 'Warm', cool: 'Cool', rose: 'Rose', green: 'Green', clear: 'Clear', solid: 'Solid', move: 'Moving', fixed: 'Fixed' };
  VALUE_NAMES.off = 'Off'; VALUE_NAMES.light = VALUE_NAMES.light || 'Light';
  var UTIL = { art: [TV.art, 'art'], apps: ['All apps', 'apps'], arrange: ['Arrange', 'arrange'], settings: ['Settings', 'settings'] };
  var MSG = {
    leave: { title: 'Leave Home?', line: 'Open ' + TV.home + '?', note: '', actions: [['stay', 'Stay'], ['samsung', TV.home]] },
    welcome: { title: 'Welcome to Shore', line: 'A few quick steps make Shore feel at home: the Home button, what’s playing, wallpapers and your phone.', note: '', actions: [['setup', 'Set up'], ['stay', 'Later']] },
    restored: { title: 'Settings restored', line: 'Shore now looks and works the way your backup was saved. Photos on the TV stay as they were.', note: '', actions: [['stay', 'OK']] },
    clearphotos: { title: 'Remove all my photos?', line: 'They are deleted from the TV. Your phone keeps its own copies.', note: '', actions: [['stay', 'Keep them'], ['clearphotos', 'Remove']] }
  };
  var SVG = {
    input: '<path d="M4.5 6.5h15a1.5 1.5 0 0 1 1.5 1.5v4l-3 4.5H6L3 12V8a1.5 1.5 0 0 1 1.5-1.5Z"/><path d="M7.5 10.5h9"/>',
    art: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="9.8" r="1.5"/><path d="m4.5 17.5 4.5-4.5 3 3 2.5-2.5 5 5"/>',
    apps: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/>',
    arrange: '<path d="M4 8.5h14M15 5.5l3 3-3 3M20 15.5H6M9 12.5l-3 3 3 3"/>',
    settings: '<path d="m9 3-.6 2.4-2 1.2L4 6l-2 3.5L3.8 11v2L2 14.5 4 18l2.4-.6 2 1.2L9 21h6l.6-2.4 2-1.2 2.4.6 2-3.5-1.8-1.5v-2L22 9.5 20 6l-2.4.6-2-1.2L15 3Z"/><circle cx="12" cy="12" r="3.2"/>',
    home: '<path d="M4 11 12 4.5l8 6.5v8a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1Z"/>',
    /* Weather: same line style as the controls. */
    'w-sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    'w-moon': '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z"/>',
    'w-partly': '<path d="M8.5 3.5v1.2M3.6 8.4h1.2M5 5l.9.9M13 5l-.9.9"/><path d="M5.6 11.4a3.6 3.6 0 0 1 6.5-2.9"/><path d="M8 19.5h9.5a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.6-.6A3.8 3.8 0 0 0 8 19.5Z"/>',
    'w-partly-night': '<path d="M10.8 6.6A4.4 4.4 0 0 1 5.4 9.8a4.4 4.4 0 0 0 5.4-3.2Z"/><path d="M8 19.5h9.5a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.6-.6A3.8 3.8 0 0 0 8 19.5Z"/>',
    'w-cloud': '<path d="M7 18.5h10.5a4 4 0 0 0 .4-8 5.6 5.6 0 0 0-10.8-.6A4.3 4.3 0 0 0 7 18.5Z"/>',
    'w-fog': '<path d="M7 13.5h10.5a3.6 3.6 0 0 0 .3-7.2 5.2 5.2 0 0 0-10-.5A3.9 3.9 0 0 0 7 13.5Z"/><path d="M4 17h16M6.5 20.5h11"/>',
    'w-drizzle': '<path d="M7 14.5h10.5a3.6 3.6 0 0 0 .3-7.2 5.2 5.2 0 0 0-10-.5A3.9 3.9 0 0 0 7 14.5Z"/><path d="M8.5 18v.5M12 18v.5M15.5 18v.5M10.3 21v.5M13.8 21v.5"/>',
    'w-rain': '<path d="M7 14.5h10.5a3.6 3.6 0 0 0 .3-7.2 5.2 5.2 0 0 0-10-.5A3.9 3.9 0 0 0 7 14.5Z"/><path d="m9 17.5-1 3M13 17.5l-1 3M17 17.5l-1 3"/>',
    'w-snow': '<path d="M7 14.5h10.5a3.6 3.6 0 0 0 .3-7.2 5.2 5.2 0 0 0-10-.5A3.9 3.9 0 0 0 7 14.5Z"/><path d="M8.5 18.5h.01M12 20.5h.01M15.5 18.5h.01M10.2 21.8h.01M13.8 21.8h.01" stroke-width="2.4"/>',
    'w-storm': '<path d="M7 14.5h10.5a3.6 3.6 0 0 0 .3-7.2 5.2 5.2 0 0 0-10-.5A3.9 3.9 0 0 0 7 14.5Z"/><path d="m12.8 15.5-2.3 3.5h3l-2.2 3.5"/>',
    undo: '<path d="M9 6 5 10l4 4"/><path d="M5 10h9.5a4.5 4.5 0 0 1 0 9H11"/>',
    check: '<path d="m5.5 12.5 4 4 9-9"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    left: '<path d="m14.5 5-7 7 7 7"/>',
    right: '<path d="m9.5 5 7 7-7 7"/>',
    up: '<path d="m5 15.5 7-7 7 7"/>',
    down: '<path d="m5 8.5 7 7 7-7"/>',
    updown: '<path d="m7.5 9.5 4.5-4.5 4.5 4.5M7.5 14.5l4.5 4.5 4.5-4.5"/>',
    tv: '<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8.5 20h7"/>',
    warn: '<path d="M12 4 2.8 19.5h18.4Z"/><path d="M12 10v4.5M12 17.3v.1"/>'
  };

  /* ---------- State ---------- */
  var REDUCED_MOTION = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var S = {
    variant: 'B', geom: 'broad', c: null, stack: null,
    sel: null, selIdx: 0, lastUtil: 0, appsFocus: null, settingsFocus: 'background', appearanceFocus: 'bg', detailFocus: {},
    undo: [], removedAt: {}, note: null, err: null,
    writes: 0, failed: 0, log: [], logN: 0, lastLaunch: null, press: null,
    wallShown: null, wallPending: null, wallError: null,
    shown: null, pending: null, lookError: null, bundleKey: null, previewBundle: null, reflow: false, fontSwitch: false,
    phone: { enabled: false, url: '', qr: '', count: 0, place: '' }, update: null, playing: { access: false, playing: false, key: '' }, saver: false,
    remote: { service: false, keys: [], learning: false, missed: false, timer: 0 }
  };
  var scroll = { first: 0, off: 0, photo: 0, photoArrange: 0 };
  function pick(v, list, fallback) {
    v = String(v || '').toLowerCase();
    for (var i = 0; i < list.length; i++) if (list[i].toLowerCase() === v) return list[i];
    return fallback;
  }
  function lookOf(c) { return { bg: c.bg, wall: c.wall, layout: c.layout, apps: c.apps, font: c.font, controls: c.controls, inputs: c.inputs, lstyle: c.lstyle, motion: c.motion, tweight: c.tweight, tsize: c.tsize, cformat: c.cformat, cdate: c.cdate, cweather: c.cweather, wunit: c.wunit, cplaying: c.cplaying, cart: c.cart, clook: c.clook, saver: c.saver, csize: c.csize, cweight: c.cweight,
      night: c.night, nhours: c.nhours, ndim: c.ndim, idle: c.idle, focus: c.focus, material: c.material, svsrc: c.svsrc, svlay: c.svlay, svtime: c.svtime,
      svmotion: c.svmotion, iask: c.iask, svclock: c.svclock, svdate: c.svdate, svmusic: c.svmusic, wicon: c.wicon, cwave: c.cwave,
      cpos: c.cpos, csec: c.csec, tint: c.tint, dglass: c.dglass, isize: c.isize, npdim: c.npdim, svpos: c.svpos }; }
  function materialApplies(c) { c = c || S.c; return c.bg === 'photo' && (c.layout === 'dock' || c.focus === 'glass'); }
  function derivedTheme() { return S.c.layout === 'list' ? 'list' : 'shore'; }

  /* ---------- Helpers ---------- */
  function app(id) { for (var i = 0; i < APPS.length; i++) if (APPS[i].id === id) return APPS[i]; return null; }
  function wall(id) { for (var i = 0; i < WALLS.length; i++) if (WALLS[i].id === id) return WALLS[i]; return null; }
  function wallIndex(id) { for (var i = 0; i < WALLS.length; i++) if (WALLS[i].id === id) return i; return 0; }
  function frostClass(w) { var i = [.12, .20, .30, .36, .44].indexOf(w.frostVeil); return i > 0 ? ' fv-' + (i + 1) : ''; }
  function wallClasses(w) { return frostClass(w) + (w.listColumn ? ' lc-' + w.listColumn : '') + (w.dockQuiet ? ' db-quiet' : '') + (w.clockMist ? ' tl-mist' : ''); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function without(list, id) { return list.filter(function (x) { return x !== id; }); }
  function same(a, b) { if (a.length !== b.length) return false; for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; }
  /* Every visible string passes through esc() or T(), so the interface follows the TV language (app/i18n.js). */
  var T = window.CleanFrameI18n ? CleanFrameI18n.T : function (s) { return s; };
  function escRaw(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function esc(s) { return String(T(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function onHome(id) { return S.c.home.indexOf(id) >= 0; }
  /* Home as browsed: saved apps, then inputs with a powered-on device. Inputs are never saved. */
  var LIVE = [];
  function isShelf() { return S.c.layout === 'dock' && S.c.lstyle === 'shelf'; }
  function inputRow() { return S.c.inputs === 'row' && S.c.layout === 'dock' && LIVE.length > 0; }
  function visibleHome() { return !LIVE.length || inputRow() ? S.c.home : LIVE.concat(S.c.home); }
  function top() { return S.stack[S.stack.length - 1]; }
  function inStack(id) { for (var i = S.stack.length - 1; i >= 0; i--) if (S.stack[i].id === id) return S.stack[i]; return null; }
  function push(e) { S.stack.push(e); return e; }
  function pop() { if (S.stack.length > 1) S.stack.pop(); }
  function px(n) { return n.toFixed(2) + 'px'; }
  function icon(name, cls, underlay) {
    return '<svg class="ico' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">'
      + (underlay ? '<g class="ut-underlay" transform="translate(0 .5)">' + SVG[name] + '</g><g class="ut-ink">' + SVG[name] + '</g>' : SVG[name]) + '</svg>';
  }
  function badge(on) {
    return on
      ? '<svg class="badge is-on" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><path class="badge-tick" d="m7.6 12.4 3 3 5.8-6.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<svg class="badge is-off" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
  }
  function log(text) { S.log.unshift('#' + (++S.logN) + ' ' + text); if (S.log.length > 10) S.log.pop(); }

  var maskSupport = 'webkitMaskImage' in document.documentElement.style || 'maskImage' in document.documentElement.style, markProbes = {};
  function probeMark(id) {
    if (markProbes[id]) return;
    var im = new Image(); markProbes[id] = 'loading';
    im.onload = function () { markProbes[id] = 'ok'; };
    im.onerror = function () {
      markProbes[id] = 'bad';
      Array.prototype.forEach.call(document.querySelectorAll('[data-mark="' + id + '"]'), function (el) { el.className += ' is-bad'; });
    };
    im.src = ICONS + id + '.svg';
  }
  /* Optical placement is identical for the CSS mask and the image fallback. */
  function markHtml(id, w, h, size) {
    var m = window.FrameIconMetrics && window.FrameIconMetrics[id], st;
    if (m) {
      var weight = clamp(Math.pow(0.45 / m.fill, 0.3), 0.84, 1.25);
      var k = Math.min(w / m.w, h / m.h, size * weight / Math.sqrt(m.w * m.h)), s = m.n * k;
      st = 'width:' + px(s) + ';height:' + px(s) + ';left:' + px(w / 2 - (m.x + m.w / 2) * k) + ';top:' + px(h / 2 - (m.y + m.h / 2) * k);
    } else st = 'width:' + w + 'px;height:' + h + 'px;left:0;top:0;object-fit:contain';
    probeMark(id);
    return '<span class="mark' + (markProbes[id] === 'bad' ? ' is-bad' : '') + '" data-mark="' + id + '" style="width:' + w + 'px;height:' + h + 'px">'
      + (maskSupport ? '<span class="mk" style="' + st + ';-webkit-mask-image:url(' + ICONS + id + '.svg);mask-image:url(' + ICONS + id + '.svg)"></span>' : '<img alt="" src="' + ICONS + id + '.svg" style="' + st + '">') + '</span>';
  }
  function appMark(a, w, h, size) {
    if (a.mark && (maskSupport || S.c.bg !== 'light')) return markHtml(a.brand || a.id, w, h, size);
    var words = a.name.split(/\s+/), letters = words[0].charAt(0) + (words.length > 1 ? words[1].charAt(0) : '');
    return '<span class="mark monogram' + (a.icon ? ' native-icon' : '') + '" style="width:' + w + 'px;height:' + h + 'px;font-size:' + Math.round(size * .65) + 'px"><span>' + esc(letters.toUpperCase()) + '</span>'
      + (a.icon ? '<img alt="" data-native-icon="true" src="' + esc(a.icon) + '">' : '') + '</span>';
  }
  function smallMark(a) { return appMark(a, 56, 44, 36); }
  var measureCanvas = document.createElement('canvas'), measureContext = measureCanvas.getContext('2d'), measureSpan = document.createElement('span');
  measureSpan.setAttribute('aria-hidden', 'true');
  measureSpan.style.cssText = 'position:absolute;left:-10000px;top:0;visibility:hidden;white-space:pre;font-synthesis:none;';
  document.body.appendChild(measureSpan);
  function homeFont() { return S.shown && S.shown.font || 'manrope'; }
  function fontRole(id, role, size) {
    var f = FONTS[id], serif = id === 'newsreader';
    return { family: f.family,
      weight: role === 'display' ? f.display : role === 'clock' ? f.clock : serif ? 400 : f.ui,
      opsz: serif ? role === 'display' ? 72 : role === 'clock' ? 48 : role === 'ui' && (!size || size === 28) ? 28 : 36 : 0 };
  }
  function measureFace(id, faces) {
    var result = { roles: {}, digits: [], digitCell: 0 }, roles = { display: [88, 76, 56], clock: [48], primary: [30, 32, 34, 36, 40], ui: [28, 30, 48] };
    var face = id === 'newsreader' ? faces[0][0] : null, original = face ? face.variationSettings : '', r, widths, min, max;
    Object.keys(roles).forEach(function (role) {
      result.roles[role] = {};
      // Canvas has no optical-size property. Set this face's default only while measuring;
      // CSS specifies each rendered role explicitly, and the descriptor is restored below.
      roles[role].forEach(function (size) {
        r = fontRole(id, role, size);
        if (face) face.variationSettings = r.opsz ? '"opsz" ' + r.opsz : original;
        measureContext.font = r.weight + ' ' + size + 'px "' + r.family + '"';
        var m = measureContext.measureText('H'), d = measureContext.measureText('gjpqy');
        result.roles[role][size] = { cap: m.actualBoundingBoxAscent || size * .72, ascent: m.fontBoundingBoxAscent || size * 1.066, descent: m.fontBoundingBoxDescent || size * .3, lower: d.actualBoundingBoxDescent || size * .255 };
      });
    });
    if (face) face.variationSettings = original;
    r = fontRole(id, 'clock');
    measureSpan.style.font = r.weight + ' 48px/64px "' + r.family + '"';
    measureSpan.style.letterSpacing = '0'; measureSpan.style.fontVariantNumeric = 'tabular-nums';
    measureSpan.style.fontVariationSettings = r.opsz ? '"opsz" ' + r.opsz : 'normal';
    widths = '0123456789'.split('').map(function (n) { measureSpan.textContent = n; return measureSpan.getBoundingClientRect().width; });
    min = Math.min.apply(Math, widths); max = Math.max.apply(Math, widths);
    result.digits = widths; result.digitCell = max - min > .02 ? max : 0;
    return result;
  }
  function fontChoices() {
    LOOK_VALUES.font = Object.keys(FONTS).filter(function (id) { return id === 'manrope' || PRIVATE_FONTS.indexOf(id) >= 0 && !unavailableFonts[id]; });
  }
  function retryFontFaces(id) {
    // A rejected CSS FontFace cannot load again. Recreate only that failed family's
    // rules; the displayed family's faces and the rest of the stylesheet stay intact.
    Array.prototype.forEach.call(document.styleSheets, function (sheet) {
      var rules, i, rule, family, css;
      try { rules = sheet.cssRules; } catch (e) { return; }
      if (!rules) return;
      for (i = 0; i < rules.length; i++) {
        rule = rules[i];
        if (rule.type !== 5) continue;
        family = rule.style.getPropertyValue('font-family').replace(/["']/g, '').trim();
        if (family !== FONTS[id].family) continue;
        css = rule.cssText; sheet.deleteRule(i); sheet.insertRule(css, i);
      }
    });
  }
  function loadFont(id, done) {
    var f = FONTS[id], weights = [f.display], timer, ended = false;
    if (fontMetrics[id]) { done(true); return; }
    if (!document.fonts || !document.fonts.load) { if (id === 'manrope') { fontMetrics.manrope = measureFace('manrope', []); fontsReady = true; done(true); } else done(false, 'unsupported'); return; }
    if (unavailableFonts[id]) retryFontFaces(id);
    if (id !== 'newsreader' && weights.indexOf(f.ui) < 0) weights.push(f.ui);
    function finish(ok, reason, faces) {
      if (ended) return;
      ended = true; clearTimeout(timer);
      if (ok) {
        fontMetrics[id] = measureFace(id, faces); delete unavailableFonts[id];
        if (id === 'manrope') fontsReady = true;
      } else if (reason !== 'timeout') unavailableFonts[id] = true;
      fontChoices(); done(ok, reason);
    }
    timer = setTimeout(function () { finish(false, 'timeout'); }, 3000);
    Promise.all(weights.map(function (weight) { return document.fonts.load(weight + ' 88px "' + f.family + '"'); })).then(function (faces) {
      finish(faces.every(function (list) { return list.length > 0 && list.every(function (face) { return face.status === 'loaded'; }); }), 'load', faces);
    }, function () { finish(false, 'load'); });
  }
  var baselineRecovery = false;
  function ensureFont(id, done) {
    loadFont('manrope', function (ok, reason) {
      if (!ok && id === 'manrope') {
        // The local fallback keeps Home usable if the baseline face is slow or missing.
        fontMetrics.manrope = measureFace('manrope', []); fontMetrics.manrope.fallback = true; fontsReady = true;
        done(true, reason);
        if (!baselineRecovery && document.fonts && document.fonts.ready) {
          baselineRecovery = true;
          document.fonts.ready.then(function () {
            delete fontMetrics.manrope; delete unavailableFonts.manrope;
            loadFont('manrope', function (loaded) {
              if (!loaded) { fontMetrics.manrope = measureFace('manrope', []); fontMetrics.manrope.fallback = true; fontsReady = true; }
              render();
            });
          });
        }
        return;
      }
      if (!ok || id === 'manrope') done(ok, reason); else loadFont(id, done);
    });
  }
  function fontShift(role, size) {
    var id = homeFont(), base = fontMetrics.manrope, metrics = fontMetrics[id], a, b;
    if (id === 'manrope' || !base || !metrics) return 0;
    a = base.roles[role][size]; b = metrics.roles[role][size];
    return (a.ascent - a.descent - a.cap - b.ascent + b.descent + b.cap) / 2;
  }
  function textWidth(text, size, weight, spacing, role) {
    var id = homeFont(), r = fontRole(id, role || 'ui', size), key, width;
    if (id !== 'manrope') { weight = r.weight; spacing = role === 'display' ? -size * .01 : 0; }
    key = [id, role || 'ui', text, size, weight, spacing].join('|');
    if (widthCache.hasOwnProperty(key)) return widthCache[key];
    if (r.opsz) {
      measureSpan.style.font = weight + ' ' + size + 'px "' + r.family + '"';
      measureSpan.style.fontVariationSettings = '"opsz" ' + r.opsz;
      measureSpan.style.fontVariantNumeric = 'normal'; measureSpan.style.letterSpacing = '0'; measureSpan.textContent = text;
      width = measureSpan.getBoundingClientRect().width;
    } else {
      measureContext.font = (weight || 500) + ' ' + size + 'px "' + r.family + '", Arial, sans-serif';
      width = measureContext.measureText(text).width;
    }
    width += Math.max(0, text.length - 1) * (spacing || 0);
    // Do not retain fallback measurements made before the baseline font is ready.
    if (fontMetrics[id]) widthCache[key] = width;
    return width;
  }
  function dockLabelSize(id) { return S.c.apps === 'text' ? (textWidth(app(id).name, 40, 600, -.8, 'primary') > 264 ? 34 : 40) : textWidth(app(id).name, 36, 500, -.8, 'primary') > 280 ? 32 : 36; }
  function reducedDockLabel(id) { return S.c.apps !== 'icons' && dockLabelSize(id) === (S.c.apps === 'text' ? 34 : 32); }
  function actionWidth(text) { return clamp(Math.ceil(textWidth(text, 30, 500, -.3) + 40), 288, 400); }
  function photoLabel(id, compact) {
    var text = app(id).name, size = compact ? 56 : 88, limit = compact ? 640 : 992, width = textWidth(text, size, 600, -1.8, 'display');
    if (!compact && width > limit) { size = 76; width = textWidth(text, size, 600, -1.8, 'display'); }
    // Newsreader's ninth compact Type row otherwise enters the lower fade by .63px.
    return { size: size, top: (compact ? 10.66 : size === 76 ? 10.36 : 9.68) + fontShift('display', size) - (compact && homeFont() === 'newsreader' ? .7 : 0), width: Math.min(limit, width), ellipsis: width > limit };
  }
  function listPlateWidth(id, compact) {
    if (S.c.apps === 'icons') return compact ? 120 : 144;
    var text = S.c.apps === 'text';
    return clamp(Math.ceil(photoLabel(id, compact).width + (text ? 84 : compact ? 156 : 184)), text ? 280 : 360, text ? compact ? 724 : 1076 : compact ? 796 : 1176);
  }

  /* Keyed children: elements persist by key so transforms animate instead of re-creating.
     Children are absolutely positioned, so DOM order never needs to change. */
  function keyed(parent, items, update) {
    var map = parent._k || (parent._k = {}), seen = {}, i, it, el, isNew, k;
    for (i = 0; i < items.length; i++) {
      it = items[i]; el = map[it.key]; isNew = !el;
      if (isNew) { el = document.createElement('div'); map[it.key] = el; }
      update(el, it, i);
      if (isNew) parent.appendChild(el);
      seen[it.key] = 1;
    }
    for (k in map) if (map.hasOwnProperty(k) && !seen[k]) { if (map[k].parentNode === parent) parent.removeChild(map[k]); delete map[k]; }
  }
  function setContent(el, sig, html) {
    sig += '|' + catalog.revision;
    if (el._sig === sig) return;
    el._sig = sig; el.innerHTML = html;
    Array.prototype.forEach.call(el.querySelectorAll('[data-native-icon]'), function (img) {
      function ready() { img.parentNode.classList.add('has-native-icon'); }
      function failed() { img.style.display = 'none'; img.parentNode.classList.remove('has-native-icon'); }
      img.onload = ready; img.onerror = failed;
      if (img.complete) { if (img.naturalWidth) ready(); else failed(); }
    });
  }
  function setHTML(el, html) { if (el._html !== html) { el._html = html; el.innerHTML = html; } }
  function attrs(el, z, i, action) { el.setAttribute('data-z', z); el.setAttribute('data-i', String(i)); el.setAttribute('data-action', action); }

  /* ---------- Saved preferences ---------- */
  function safeId(id) { return typeof id === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,160}$/.test(id) && ['constructor', 'prototype', '__proto__'].indexOf(id) < 0; }
  function safeIcon(path) { return typeof path === 'string' && path.length < 2048 && /^(?:\/[^\/]|file:\/\/\/|wgt-package:\/\/\/)/.test(path) ? path : ''; }
  function load() {
    var keys = [KEY, 'cleanframe.shore.v1'], raw, saved, i;
    for (i = 0; i < keys.length; i++) {
      try {
        raw = localStorage.getItem(keys[i]);
        if (!raw) continue;
        saved = JSON.parse(raw);
        if (saved && typeof saved === 'object' && !Array.isArray(saved)) return saved;
      } catch (e) { storageOk = false; }
    }
    return null;
  }
  /* Favourite and hidden wallpapers: ids only, unique, capped. */
  function idList(v) { var out = []; (Array.isArray(v) ? v : []).forEach(function (id) { if (safeId(id) && out.indexOf(id) < 0 && out.length < 300) out.push(id); }); return out; }
  function clean(saved) {
    var s = saved && typeof saved === 'object' ? saved : {}, modern = s.look && typeof s.look === 'object' ? s.look : s;
    var legacyList = s.theme === 'list', h = [], recent = [], records = Array.isArray(s.appRecords) ? s.appRecords : [];
    records.slice(0, 256).forEach(function (a) {
      if (!a || !safeId(a.id) || !safeId(a.appId) || typeof a.name !== 'string' || !a.name.trim() || app(a.id)) return;
      APPS.push({ id: a.id, appId: a.appId, name: a.name.slice(0, 160), brand: EXTRA_MARKS.indexOf(a.brand) >= 0 ? a.brand : '', mark: EXTRA_MARKS.indexOf(a.brand) >= 0, icon: safeIcon(a.icon) });
    });
    (Array.isArray(s.home) ? s.home : Array.isArray(s.dock) ? s.dock : []).forEach(function (id) {
      if (!safeId(id) || h.indexOf(id) >= 0 || h.length >= CAP) return;
      if (!app(id) && id.indexOf('.') > 0) APPS.push({ id: id, appId: id, name: id.split('.').pop(), mark: false });
      if (app(id)) h.push(id);
    });
    if (!h.length) h = PRIMARY.slice();
    (Array.isArray(s.recent) ? s.recent : []).forEach(function (id) { if (safeId(id) && app(id) && h.indexOf(id) < 0 && recent.indexOf(id) < 0 && recent.length < 5) recent.push(id); });
    var out = {
      bg: pick(modern.bg, LOOK_VALUES.bg, legacyList ? 'dark' : 'photo'), layout: pick(modern.layout, LOOK_VALUES.layout, legacyList ? 'list' : 'dock'),
      apps: pick(modern.apps, LOOK_VALUES.apps, legacyList ? 'text' : 'both'), controls: pick(modern.controls, LOOK_VALUES.controls, 'both'), inputs: pick(modern.inputs, LOOK_VALUES.inputs, 'front'), lstyle: pick(modern.lstyle, LOOK_VALUES.lstyle, 'glass'), motion: pick(modern.motion, LOOK_VALUES.motion, 'still'),
      tweight: pick(modern.tweight, LOOK_VALUES.tweight, 'auto'), tsize: pick(modern.tsize, LOOK_VALUES.tsize, 'default'),
      cformat: pick(modern.cformat, LOOK_VALUES.cformat, '12'), cdate: pick(modern.cdate, LOOK_VALUES.cdate, 'off'),
      cweather: pick(modern.cweather, LOOK_VALUES.cweather, 'off'), wunit: pick(modern.wunit, LOOK_VALUES.wunit, window.CleanFrameWeather ? CleanFrameWeather.defaultUnit() : 'c'), cplaying: pick(modern.cplaying, LOOK_VALUES.cplaying, 'on'),
      cart: pick(modern.cart, LOOK_VALUES.cart, 'on'), clook: pick(modern.clook, LOOK_VALUES.clook, 'on'), saver: pick(modern.saver, LOOK_VALUES.saver, ANDROID ? '10' : 'off'),
      csize: pick(modern.csize, LOOK_VALUES.csize, 'small'), cweight: pick(modern.cweight, LOOK_VALUES.cweight, 'auto'),
      night: pick(modern.night, LOOK_VALUES.night, 'off'), nhours: pick(modern.nhours, LOOK_VALUES.nhours, '22-6'),
      ndim: pick(modern.ndim, LOOK_VALUES.ndim, 'medium'), idle: pick(modern.idle, LOOK_VALUES.idle, 'off'),
      focus: pick(modern.focus, LOOK_VALUES.focus, legacyList ? 'type' : 'glass'), material: pick(modern.material, LOOK_VALUES.material, 'soft'),
      font: pick(modern.font, LOOK_VALUES.font, 'manrope'), wall: wall(modern.wall || s.wallpaper) ? modern.wall || s.wallpaper : WALLS[0].id,
      home: h, recent: recent, lastApp: h.indexOf(s.lastApp) >= 0 ? s.lastApp : h[0],
      mode: pick(s.mode, MODES.map(function (m) { return m.id; }), 'fixed'),
      source: sourceCsv(ONLINE ? ONLINE_INFO.source : 'builtin'),
      fav: idList(s.fav), hide: idList(s.hide)
    };
    Object.keys(MORE_LOOK).forEach(function (k) { out[k] = pick(modern[k], LOOK_VALUES[k], MORE_LOOK[k]); });
    return out;
  }
  function serialise(c) {
    var out = {}, id;
    Object.keys(c).forEach(function (key) { out[key] = c[key]; });
    out.version = 2; out.look = lookOf(c); out.dock = c.home.slice(); out.wallpaper = c.wall;
    out.theme = c.layout === 'list' ? 'list' : 'shore';
    out.appRecords = [];
    c.home.concat(c.recent).forEach(function (key) {
      var a = app(key);
      if (a && PRIMARY.indexOf(key) < 0 && !out.appRecords.some(function (r) { return r.id === key; })) out.appRecords.push({ id: a.id, appId: a.appId, name: a.name, brand: a.brand || '', icon: a.icon || '' });
    });
    return out;
  }
  /* ---------- TV inputs ---------- */
  /* A device was just switched on while Home is showing: offer to switch to it (Layout › Inputs › Ask to switch). */
  var inputsSeen = false, askTimer = 0;
  function askInput(id) {
    var a = app(id), t = top();
    if (!a || S.c.iask !== 'on' || document.hidden || (t.id !== 'home' && !S.saver)) return;
    stopSaver();
    push({ id: 'message', content: { title: a.name + ' is on', line: 'Switch to it now?', note: '', actions: [['input:' + id, 'Switch'], ['stay', 'Stay']] }, f: { b: 0 } });
    render();
    clearTimeout(askTimer);
    askTimer = setTimeout(function () { var m = top(); if (m.id === 'message' && m.content && m.content.actions[0][0] === 'input:' + id) { pop(); render(); } }, 20000);
  }
  function refreshInputs() {
    if (!FrameDevice.inputs) return;
    FrameDevice.inputs(function (err, list) {
      var live = [];
      if (err) list = [];
      list.forEach(function (input) {
        var id = 'input.' + input.id.replace(/[^A-Za-z0-9._-]/g, '_'), a;
        if (input.state !== 0 || !safeId(id)) return;
        a = app(id);
        if (!a) { a = { id: id }; APPS.push(a); }
        a.appId = input.id; a.name = input.name.slice(0, 160); a.brand = 'hdmi'; a.mark = true; a.input = true;
        live.push(id);
      });
      if (same(live, LIVE)) { inputsSeen = true; return; }
      var fresh = inputsSeen ? live.filter(function (id) { return LIVE.indexOf(id) < 0; }) : [];
      inputsSeen = true;
      LIVE = live; render();
      if (fresh.length) askInput(fresh[0]);
    });
  }
  function initialise() {
    var saved = load(), initial; S.c = clean(saved);
    S.firstRun = !saved && ANDROID; // a fresh install greets the owner with the setup checklist
    initial = next(S.c.home.slice(), S.c.recent.slice());
    S.stack = [{ id: 'home', f: { zone: 'apps', u: 0 } }];
    S.sel = S.c.lastApp; S.selIdx = S.c.home.indexOf(S.sel);
    // Each time Home opens: the next photo in rotation (chosen sources, favourites, never hidden ones).
    if (saved && initial.mode === 'open') { var pool = rotationPool(), at = pool.indexOf(wall(initial.wall)); initial.wall = pool[(at + 1) % pool.length].id; }
    // Keep the old schema keys alongside the builder values for in-place updates.
    try { localStorage.setItem(KEY, JSON.stringify(serialise(initial))); S.c = initial; storageOk = true; } catch (e) { storageOk = false; }
  }
  function clearSession() { S.undo = []; S.removedAt = {}; S.note = null; S.err = null; }
  function begin() { S.note = null; }
  function next(home, recent) { var c = lookOf(S.c); c.home = home; c.recent = recent; c.lastApp = S.c.lastApp; c.mode = S.c.mode; c.source = S.c.source; c.fav = S.c.fav.slice(); c.hide = S.c.hide.slice(); return c; }
  function snap() { return { home: S.c.home.slice(), recent: S.c.recent.slice() }; }
  function pushRecent(list, id) { return [id].concat(without(list, id)).slice(0, 5); }
  function write(c, label) {
    try { localStorage.setItem(KEY, JSON.stringify(serialise(c))); }
    catch (e) { storageOk = false; S.failed++; S.err = label; log('Not saved: ' + label); return false; }
    if (c.wall !== S.c.wall || c.mode !== S.c.mode) resetRotation();
    storageOk = true; S.c = c; S.writes++; S.err = null; log('Saved: ' + label);
    return true;
  }
  function errText(lifted) {
    return 'Couldn’t save. Nothing changed.';
  }
  function statusHtml(def, lifted) {
    if (S.err) return '<span class="warn error-chip">' + esc(errText(lifted)) + '</span>';
    return esc(S.note || def);
  }

  function ensureSel() {
    var h = visibleHome(), i;
    if (!h.length) { S.sel = null; return -1; }
    i = h.indexOf(S.sel);
    if (i < 0) { i = clamp(S.selIdx, 0, h.length - 1); S.sel = h[i]; }
    S.selIdx = i;
    return i;
  }
  function setSel(id) { S.sel = id; S.selIdx = visibleHome().indexOf(id); }

  /* Membership and order operations shared by B and C. A works on slots (below). */
  function homeRemove(id) {
    var a = app(id), i = S.c.home.indexOf(id), before = snap(), h;
    if (i < 0) return false;
    if (S.c.home.length <= 1) { S.note = LAST; return false; }
    h = S.c.home.slice(); h.splice(i, 1);
    if (!write(next(h, pushRecent(S.c.recent, id)), 'Remove ' + a.name + ' from Home')) return false;
    S.removedAt[id] = i;
    S.undo.push({ label: 'Remove ' + a.name, snap: before });
    return true;
  }
  function homeAdd(id) {
    var a = app(id), before = snap(), h = S.c.home.slice(), at;
    if (h.length >= CAP) { S.note = FULL; return false; }
    at = S.removedAt.hasOwnProperty(id) ? Math.min(S.removedAt[id], h.length) : h.length;
    h.splice(at, 0, id);
    if (!write(next(h, without(S.c.recent, id)), 'Add ' + a.name + ' to Home')) return false;
    S.undo.push({ label: 'Add ' + a.name, snap: before });
    return true;
  }
  function homeMove(order, id, before) {
    var a = app(id);
    if (!write(next(order, S.c.recent.slice()), 'Move ' + a.name)) return false;
    S.undo.push({ label: 'Move ' + a.name, snap: before });
    return true;
  }
  function undoLast(arr) {
    var u = S.undo[S.undo.length - 1];
    if (!u) { S.note = 'Nothing to undo'; return false; }
    if (!write(next(u.snap.home.slice(), u.snap.recent.slice()), 'Undo ' + u.label)) return false;
    S.undo.pop();
    S.note = 'Undone: ' + u.label + '.';
    return true;
  }
  function undoLabel() { var u = S.undo[S.undo.length - 1]; return u ? u.label : ''; }
  function undoCaption() { var label = undoLabel(); return label ? 'Undo ' + label.charAt(0).toLowerCase() + label.slice(1) : 'Nothing to undo'; }
  function editStatus(hint, move) {
    if (S.err) return statusHtml('', !!move);
    if (S.note === FULL || S.note === LAST) return '<span class="warn">' + esc(S.note) + '</span>';
    if (hint === FULL || hint === LAST) return '<span class="warn">' + esc(hint) + '</span>';
    return esc(move || hint || S.note || '');
  }

  var busy = false, busyTimer = 0;
  function release() { busy = false; clearTimeout(busyTimer); S.press = null; }
  function message(title, line, note) {
    push({ id: 'message', msg: 'error', content: { title: title, line: line, note: note || '', actions: [['back', 'Back']] }, f: { b: 0 } });
  }
  function perform(title, run) {
    if (busy) return;
    busy = true; busyTimer = setTimeout(release, 10000);
    run(function (err) {
      release();
      if (err) message(title, err.message || 'The TV could not open this screen.', err.detail || '');
      render(); syncRotation();
    });
  }
  function launch(id) {
    var a = app(id), c;
    if (!a || busy) return;
    if (S.c.home.indexOf(id) >= 0) { c = next(S.c.home.slice(), S.c.recent.slice()); c.lastApp = id; write(c, 'Last app'); }
    S.press = id; S.lastLaunch = a.name;
    perform(a.name, function (done) { FrameDevice.launchApp(a.appId, done); });
  }
  /* Top Shelf: deep link into the tile's app where it supports one, otherwise launch it. */
  function openRec(id, it) {
    var a = app(id);
    if (!a || !it || busy) return;
    S.press = id; S.lastLaunch = a.name;
    perform(a.name, function (done) { SHELF.open(a.appId, it.url, done); });
  }
  function refreshCatalog() {
    var request, oldFocus;
    if (catalog.loading) return;
    request = ++catalog.request; catalog.loading = true; catalog.error = null;
    FrameDevice.apps(function (err, entries) {
      if (request !== catalog.request) return;
      catalog.loading = false;
      if (err) { catalog.error = err.message || 'Could not read installed apps.'; if (!catalog.loaded) ALPHA = []; render(); return; }
      oldFocus = top().id === 'apps' ? ALPHA[top().f.i] : null;
      ALPHA = [];
      entries.forEach(function (entry) {
        var id = PRIMARY.indexOf(entry.brand) >= 0 ? entry.brand : entry.appId, a;
        if (!safeId(id) || !safeId(entry.appId) || ALPHA.indexOf(id) >= 0) return;
        a = app(id);
        if (!a) { a = { id: id }; APPS.push(a); }
        a.appId = entry.appId; a.brand = entry.brand || ''; a.mark = !!entry.brand;
        a.icon = safeIcon(entry.icon);
        a.name = PRIMARY.indexOf(id) >= 0 ? PRIMARY_APPS[PRIMARY.indexOf(id)].name : String(entry.name).slice(0, 160);
        ALPHA.push(id);
      });
      ALPHA.sort(function (a, b) { return app(a).name.toLowerCase().localeCompare(app(b).name.toLowerCase()); });
      catalog.loaded = true; catalog.error = null; catalog.revision++;
      if (top().id === 'apps' && oldFocus && ALPHA.indexOf(oldFocus) >= 0) top().f.i = ALPHA.indexOf(oldFocus);
      norm(); render();
    });
  }

  /* ---------- Navigation targets ---------- */
  function utils() { return ['art', 'apps', 'settings']; }
  /* prev/next run along the apps; out goes to the controls, inn comes back (or to a per-app action). */
  function axes() {
    var v = S.c.layout === 'list';
    return { prev: v ? 'up' : 'left', next: v ? 'down' : 'right', out: v ? 'right' : 'up', inn: v ? 'left' : 'down' };
  }
  function utilAction(u) {
    if (u === 'art') { if (ANDROID) startSaver(); else perform(TV.art, FrameDevice.art); }
    else if (u === 'apps') openApps();
    else openSettings();
  }
  function addAppsRoute() { openEditor('home'); }
  function openSettings() { push({ id: 'settings', f: { id: S.settingsFocus } }); }
  function openAppearance(group) {
    var axis = { background: 'bg', layout: 'layout', typography: 'tweight', fonts: 'font', focus: 'focus', clock: 'cformat', display: 'night' }[group];
    var action = S.detailFocus[group] || (axis ? 'choice.' + axis + '.' + S.c[axis] : group === 'rotation' ? 'rotation.' + S.c.mode : PARENT[group] === 'online' || group === 'online' ? 'online.' + sourceList()[0] : group === 'updates' ? updateSections()[0].items[0].action : group === 'health' ? (healthItems()[0] || {}).action : 'samsung.home');
    push({ id: 'appearance', group: group, f: { action: action } });
  }
  function openMessage(key) { push({ id: 'message', msg: key, f: { b: 0 } }); }
  function openApps() {
    var e = { id: 'apps', mode: 'browse', top: 0, f: { zone: 'grid', i: Math.max(0, ALPHA.indexOf(S.appsFocus)), h: 0 } };
    push(e); refreshCatalog(); return e;
  }
  function openEditor(origin) {
    var i = ensureSel();
    clearSession();
    refreshCatalog();
    push({ id: 'editor', origin: origin, lifted: null, top: 0, otherReturn: { id: otherList()[0] || null, index: 0, top: 0 }, f: { zone: S.c.home.length ? 'home' : 'other', i: Math.max(0, i), part: 'name', h: 1, j: 0 } });
  }
  function openWallpaper() {
    var i = wallIndex(S.c.wall);
    S.err = null; S.wallError = null;
    push({ id: 'wallpaper', i: i, top: clamp(i - 2, 0, Math.max(0, WALLS.length - WALL_VISIBLE)), f: { zone: 'photo' },
      previewTimer: 0, previewDue: null, applyPending: null, failedId: null, failedApply: false, retryBundle: null });
  }
  function isSettingsDetail(t) { return t.id === 'appearance' || t.id === 'wallpaper'; }

  var V = {};

  /* ---------- Home (browse) ---------- */
  V.home = {
    key: function (t, k) {
      var f = t.f, h = visibleHome(), U = utils(), x = axes(), i = ensureSel();
      if (S.c.layout === 'list') { listHomeKey(t, k, i, U); return; }
      if (f.zone === 'input') {
        if (!inputRow()) f.zone = 'apps';
        else {
          f.n = clamp(f.n || 0, 0, LIVE.length - 1);
          if (k === 'left' && f.n > 0) f.n--;
          else if (k === 'right' && f.n < LIVE.length - 1) f.n++;
          else if (k === 'down' || k === 'back') f.zone = 'apps';
          else if (k === 'up') { f.zone = 'util'; f.u = clamp(S.lastUtil, 0, U.length - 1); }
          else if (k === 'ok') launch(LIVE[f.n]);
          return;
        }
      }
      if (f.zone === 'util') {
        f.u = clamp(f.u, 0, U.length - 1);
        if (k === x.prev && f.u > 0) f.u--;
        else if (k === x.next && f.u < U.length - 1) f.u++;
        else if (k === x.inn && inputRow()) { f.zone = 'input'; f.n = clamp(f.n || 0, 0, LIVE.length - 1); }
        else if (k === x.inn || k === 'back') f.zone = 'apps';
        else if (k === 'ok') { S.lastUtil = f.u; utilAction(U[f.u]); return; }
        S.lastUtil = f.u;
        return;
      }
      if (f.zone === 'recs') {
        var R = recsFor(S.sel);
        if (!R) f.zone = 'apps';
        else {
          f.r = clamp(f.r || 0, 0, R.items.length - 1);
          if (k === 'left' && f.r > 0) f.r--;
          else if (k === 'right' && f.r < R.items.length - 1) f.r++;
          else if (k === 'up' || k === 'back') f.zone = 'apps';
          else if (k === 'ok') openRec(S.sel, R.items[f.r]);
          return;
        }
      }
      f.zone = 'apps';
      if (k === x.out && inputRow()) { f.zone = 'input'; f.n = clamp(f.n || 0, 0, LIVE.length - 1); }
      else if (k === x.inn && recsFor(S.sel)) { f.zone = 'recs'; f.r = 0; }
      else if (k === x.out) { f.zone = 'util'; f.u = clamp(S.lastUtil, 0, U.length - 1); }
      else if (k === 'back') openMessage('leave');
      else if (!h.length) { if (k === 'ok') addAppsRoute(); }
      else if (k === x.prev && i > 0) setSel(h[i - 1]);
      else if (k === x.next && i < h.length - 1) setSel(h[i + 1]);
      else if (k === 'ok') launch(S.sel);
    },
    point: function (t, z, i) {
      if (z === 'util') { t.f.zone = 'util'; t.f.u = i; S.lastUtil = i; }
      else if (z === 'input') { t.f.zone = 'input'; t.f.n = i; }
      else if (z === 'app') { t.f.zone = 'apps'; setSel(visibleHome()[i]); }
      else if (z === 'empty') t.f.zone = 'apps';
      else return;
      this.key(t, 'ok');
    }
  };
  function listHomeKey(t, k, i, U) {
    var f = t.f, h = visibleHome();
    if (f.zone === 'util') {
      f.u = clamp(f.u, 0, U.length - 1);
      if (k === 'up' && f.u > 0) f.u--;
      else if (k === 'down' && f.u < U.length - 1) f.u++;
      else if (k === 'left' || k === 'back') f.zone = 'apps';
      else if (k === 'ok') { S.lastUtil = f.u; utilAction(U[f.u]); return; }
      S.lastUtil = f.u;
      return;
    }
    f.zone = 'apps';
    if (k === 'up' && i > 0) setSel(h[i - 1]);
    else if (k === 'right') { f.zone = 'util'; f.u = clamp(S.lastUtil, 0, U.length - 1); }
    else if (k === 'down' && i < h.length - 1) setSel(h[i + 1]);
    else if (k === 'back') openMessage('leave');
    else if (k === 'ok') { if (h.length) launch(S.sel); else addAppsRoute(); }
  }

  /* ---------- Wallpaper child: focus previews, activation applies ---------- */
  function cancelWallpaperTimer(t) {
    clearTimeout(t.previewTimer); t.previewTimer = 0; t.previewDue = null;
  }
  function failWallpaper(t, id, apply, bundle) {
    t.applyPending = null; t.failedId = id; t.failedApply = apply; t.retryBundle = bundle || null;
    restoreLook();
    if (!bundle) S.wallError = id;
  }
  function applyWallpaper(t, prepared) {
    var w = WALLS[t.i], c, bundle = prepared || S.previewBundle;
    if (!prepared && (S.wallPending || t.previewDue || S.wallShown !== w.id || S.wallError)) {
      t.applyPending = w.id;
      if (t.previewDue || S.wallPending !== w.id) { cancelWallpaperTimer(t); loadWallpaperPreview(t); }
      return;
    }
    t.applyPending = null;
    if (w.id === S.c.wall) { S.err = null; t.failedId = null; t.failedApply = false; t.retryBundle = null; return; }
    if (!bundle || bundle.key !== bundleKey({ wall: w.id, material: S.c.material })) { t.applyPending = w.id; loadWallpaperPreview(t); return; }
    c = next(S.c.home.slice(), S.c.recent.slice()); c.wall = w.id;
    if (!write(c, 'Wallpaper ' + w.name)) { failWallpaper(t, w.id, true, bundle); return; }
    installBundle(bundle, c); committedBundle = bundle; S.previewBundle = null;
    t.failedId = null; t.failedApply = false; t.retryBundle = null;
  }
  function loadWallpaperPreview(t) {
    var id = WALLS[t.i].id;
    cancelWallpaperTimer(t);
    showWall(id, function (ok) {
      if (top() !== t || WALLS[t.i].id !== id) return;
      if (!ok) failWallpaper(t, id, t.applyPending === id, null);
      else if (t.applyPending === id) applyWallpaper(t);
      render(); syncRotation();
    });
  }
  function previewWallpaper(t, index, apply, immediate) {
    var id, target;
    cancelWallpaperTimer(t); cancelLook();
    t.i = index; t.f.zone = 'photo'; id = WALLS[index].id;
    t.applyPending = apply ? id : null; t.failedId = null; t.failedApply = false; t.retryBundle = null;
    S.err = null; S.wallError = null;
    if (id === S.c.wall && committedBundle) {
      installBundle(committedBundle, S.c, true); S.previewBundle = null;
      if (apply) applyWallpaper(t);
      return;
    }
    if (S.wallShown === id && S.previewBundle && S.previewBundle.key === bundleKey({ wall: id, material: S.c.material })) {
      if (apply) applyWallpaper(t);
      return;
    }
    if (apply || immediate) { loadWallpaperPreview(t); return; }
    target = lookOf(S.c); target.wall = id;
    S.pending = { patch: { wall: id }, target: target, row: 'bg', preview: true, transient: false, deferred: true };
    t.previewDue = id;
    t.previewTimer = setTimeout(function () { if (top() === t && WALLS[t.i].id === id) loadWallpaperPreview(t); }, WALL_DELAY);
  }
  /* Favourite or hide one wallpaper. Online favourites are kept by the native side, so a refresh never deletes them. */
  function markWallpaper(w, kind) {
    var c = next(S.c.home.slice(), S.c.recent.slice()), list = kind === 'fav' ? c.fav : c.hide, other = kind === 'fav' ? c.hide : c.fav, i = list.indexOf(w.id), on = i < 0;
    if (on) { list.push(w.id); if (other.indexOf(w.id) >= 0) other.splice(other.indexOf(w.id), 1); } else list.splice(i, 1);
    if (!write(c, kind === 'fav' ? 'Favourite' : 'Hide')) return;
    S.c = c;
    if (w.online && ONLINE && ONLINE.keep) ONLINE.keep(w.id, S.c.fav.indexOf(w.id) >= 0);
    S.note = on ? (kind === 'fav' ? w.name + ' is a favourite.' : w.name + ' is hidden.') : null;
    syncRotation();
  }
  function retryWallpaper(t) {
    var apply = t.failedApply, bundle = t.retryBundle;
    t.f.zone = 'photo';
    if (bundle && apply) applyWallpaper(t, bundle);
    else previewWallpaper(t, t.i, apply, true);
  }
  function closeWallpaper(t) {
    cancelWallpaperTimer(t); t.applyPending = null; S.err = null; pop(); restoreLook();
    if (top().id === 'appearance' && top().group === 'background') detailFocus(top(), { action: 'background.wallpaper' }, 0);
  }
  V.wallpaper = {
    norm: function (t) {
      t.i = clamp(t.i, 0, WALLS.length - 1);
      if (t.f.zone === 'retry' && !t.failedId) t.f.zone = 'photo';
      if (t.i < t.top) t.top = t.i;
      if (t.i >= t.top + WALL_VISIBLE) t.top = t.i - WALL_VISIBLE + 1;
      t.top = clamp(t.top, 0, Math.max(0, WALLS.length - WALL_VISIBLE));
    },
    key: function (t, k) {
      if (k === 'back') { closeWallpaper(t); return; }
      if (t.f.zone === 'back') {
        if (k === 'ok') closeWallpaper(t);
        else if (k === 'down' || k === 'right') t.f.zone = 'photo';
        return;
      }
      if (t.f.zone === 'retry') {
        if (k === 'ok') retryWallpaper(t);
        else if (k === 'up' || k === 'left') t.f.zone = 'photo';
        return;
      }
      // Favourite and Hide sit under the preview; up and down keep stepping through photos so several can be marked quickly.
      if (t.f.zone === 'fav' || t.f.zone === 'hide') {
        if (k === 'ok') markWallpaper(WALLS[t.i], t.f.zone);
        else if (k === 'left') t.f.zone = t.f.zone === 'hide' ? 'fav' : 'photo';
        else if (k === 'right' && t.f.zone === 'fav') t.f.zone = 'hide';
        else if ((k === 'up' && t.i > 0) || (k === 'down' && t.i < WALLS.length - 1)) { var zone = t.f.zone; previewWallpaper(t, t.i + (k === 'up' ? -1 : 1), false); t.f.zone = zone; }
        return;
      }
      if (k === 'left' || k === 'up' && t.i === 0) { t.f.zone = 'back'; t.applyPending = null; }
      else if (k === 'up' && t.i > 0) previewWallpaper(t, t.i - 1, false);
      else if (k === 'down' && t.i < WALLS.length - 1) previewWallpaper(t, t.i + 1, false);
      else if ((k === 'right' || k === 'down') && t.failedId) t.f.zone = 'retry';
      else if (k === 'right') t.f.zone = 'fav';
      else if (k === 'ok') { if (t.retryBundle) applyWallpaper(t, t.retryBundle); else applyWallpaper(t); }
    },
    point: function (t, z, i) {
      if (z === 'wall-back') closeWallpaper(t);
      else if (z === 'wall-retry') retryWallpaper(t);
      else if (z === 'wall-fav' || z === 'wall-hide') { t.f.zone = z.slice(5); markWallpaper(WALLS[t.i], t.f.zone); }
      else if (z === 'wall-choice' && i >= 0 && i < WALLS.length) {
        if (i === t.i) { t.f.zone = 'photo'; this.key(t, 'ok'); }
        else previewWallpaper(t, i, true);
      }
    }
  };

  /* ---------- Installed apps ---------- */
  function appsItems() { return catalog.error ? [] : ALPHA; }
  function appsHead() { return catalog.error ? [['retry', 'Try again', '', '']] : [['editor', 'Apps on Home', '', 'home']]; }
  V.apps = {
    sheet: true,
    norm: function (t) {
      var n = appsItems().length;
      t.f.i = clamp(t.f.i, 0, Math.max(0, n - 1));
      if (!n) t.f.zone = 'head';
    },
    key: function (t, k) {
      var f = t.f, items = appsItems(), n = items.length, col = f.i % COLS, row = Math.floor(f.i / COLS);
      if (k === 'back') { pop(); return; }
      if (f.zone === 'head') {
        if (k === 'down' && n) f.zone = 'grid';
        else if (k === 'ok') { if (catalog.error) refreshCatalog(); else openEditor('apps'); }
        return;
      }
      if (k === 'left' && col > 0) f.i--;
      else if (k === 'right' && col < COLS - 1 && f.i < n - 1) f.i++;
      else if (k === 'down' && row < Math.ceil(n / COLS) - 1) f.i = Math.min(f.i + COLS, n - 1);
      else if (k === 'up') { if (row > 0) f.i -= COLS; else f.zone = 'head'; }
      else if (k === 'ok' && n) launch(items[f.i]);
      S.appsFocus = items[f.i] || null;
    },
    point: function (t, z, i) { if (z === 'grid') { t.f.zone = 'grid'; t.f.i = i; } else if (z === 'head') t.f.zone = 'head'; else return; this.key(t, 'ok'); }
  };

  /* ---------- B: two-zone Home editor ---------- */
  function otherGroups() {
    var rec = S.c.recent.filter(function (id) { return !onHome(id) && app(id); });
    return { recent: rec, rest: ALPHA.filter(function (id) { return !onHome(id) && rec.indexOf(id) < 0; }) };
  }
  function otherList() { var o = otherGroups(); return o.recent.concat(o.rest); }
  function editorCut() { return 5; }
  function editorHomeY(i) { return i * ED_ROW + (i >= editorCut() ? 24 : 0); }
  function editorOtherY(j) {
    var o = otherGroups();
    return j * ED_ROW + (o.recent.length ? ED_SEP : 0) + (o.recent.length && j >= o.recent.length ? ED_SEP : 0);
  }
  function rememberOther(t) {
    var list = otherList();
    t.otherReturn = { id: list[t.f.j] || null, index: t.f.j, top: t.top };
  }
  function returnOther(t) {
    var list = otherList(), memory = t.otherReturn, i = memory ? list.indexOf(memory.id) : -1;
    t.f.zone = 'other';
    t.f.j = i >= 0 ? i : clamp(memory ? memory.index : 0, 0, Math.max(0, list.length - 1));
    if (memory) t.top = memory.top;
  }
  function nearestHome(t, count) {
    var target = editorOtherY(t.f.j) - t.top + 36, best = 0, distance = Infinity, i, d;
    for (i = 0; i < count; i++) {
      d = Math.abs(editorHomeY(i) + 36 - target);
      if (d < distance) { best = i; distance = d; }
    }
    return best;
  }
  V.editor = {
    sheet: true,
    norm: function (t) {
      var f = t.f, nh = (t.lifted ? t.lifted.order : S.c.home).length, no = otherList().length;
      f.i = clamp(f.i, 0, Math.max(0, nh - 1));
      f.j = clamp(f.j, 0, Math.max(0, no - 1));
      if (f.zone === 'home' && !nh) f.zone = no ? 'other' : 'head';
      if (f.zone === 'other' && !no) f.zone = nh ? 'home' : 'head';
    },
    key: function (t, k) {
      var f = t.f, H = t.lifted ? t.lifted.order : S.c.home, O = otherList(), nh = H.length, no = O.length, d, tmp;
      if (t.lifted) {
        d = k === 'up' ? -1 : k === 'down' ? 1 : 0;
        if (d && f.i + d >= 0 && f.i + d < nh) { tmp = H[f.i + d]; H[f.i + d] = H[f.i]; H[f.i] = tmp; f.i += d; S.err = null; }
        else if (k === 'ok') editorPlace(t);
        else if (k === 'back') { f.i = t.lifted.from; t.lifted = null; S.err = null; }
        return;
      }
      if (k === 'back') { closeEditor(t); return; }
      if (f.zone === 'head') {
        if (k === 'left' && f.h > 0) f.h--;
        else if (k === 'right' && f.h < 1) f.h++;
        else if (k === 'down') { if (no) returnOther(t); else if (nh) f.zone = 'home'; }
        else if (k === 'ok') { begin(); if (f.h === 0) undoLast(null); else closeEditor(t); }
      } else if (f.zone === 'home') {
        if (k === 'up') { if (f.i > 0) f.i--; else f.zone = 'head'; }
        else if (k === 'down') { if (f.i < nh - 1) f.i++; }
        else if (k === 'right') { if (f.part === 'name') f.part = 'remove'; else if (no) returnOther(t); }
        else if (k === 'left') { if (f.part === 'remove') f.part = 'name'; }
        else if (k === 'ok') {
          begin();
          if (f.part === 'name') t.lifted = { id: H[f.i], from: f.i, order: H.slice(), snap: snap() };
          else editorRemove(t, H[f.i]);
        }
      } else {
        if (k === 'up') { if (f.j > 0) { f.j--; rememberOther(t); } else f.zone = 'head'; }
        else if (k === 'down') { if (f.j < no - 1) { f.j++; rememberOther(t); } }
        else if (k === 'left') { if (nh) { rememberOther(t); f.i = nearestHome(t, nh); f.zone = 'home'; f.part = 'name'; } }
        else if (k === 'ok') { begin(); editorAdd(t, O[f.j]); }
      }
    },
    point: function (t, z, i) {
      if (t.lifted) { if (z === 'name' && i === t.f.i) this.key(t, 'ok'); return; }
      if (z === 'name' || z === 'remove') { t.f.zone = 'home'; t.f.i = i; t.f.part = z; }
      else if (z === 'other') { t.f.zone = 'other'; t.f.j = i; rememberOther(t); }
      else if (z === 'head') { t.f.zone = 'head'; t.f.h = i; }
      else return;
      this.key(t, 'ok');
    }
  };
  /* Focus follows the app between zones, so a repeated OK toggles the same app. */
  function editorRemove(t, id) {
    if (!homeRemove(id)) return;
    t.f.zone = 'other'; t.f.j = otherList().indexOf(id);
    S.note = app(id).name + ' is in Recently removed. OK puts it back.';
  }
  function editorAdd(t, id) {
    rememberOther(t);
    if (!homeAdd(id)) return;
    var remaining = otherList(), at = clamp(t.otherReturn.index, 0, Math.max(0, remaining.length - 1));
    t.otherReturn.id = remaining[at] || null; t.otherReturn.index = at;
    t.f.zone = 'home'; t.f.i = S.c.home.indexOf(id); t.f.part = 'remove';
    S.note = app(id).name + ' is on Home, position ' + (t.f.i + 1) + '.';
  }
  function editorPlace(t) {
    var L = t.lifted;
    begin();
    if (same(L.order, S.c.home)) { t.lifted = null; return; }
    if (!homeMove(L.order.slice(), L.id, L.snap)) return;
    t.lifted = null;
    S.note = app(L.id).name + ' moved to position ' + (t.f.i + 1) + '.';
  }
  function closeEditor() { clearSession(); pop(); }

  /* ---------- Settings, Layout and messages ---------- */
  var PARENT = { health: 'samsung', updates: 'samsung', focusmore: 'focus', saveropts: 'idle', saverlook: 'saveropts', rotation: 'background', bgmore: 'background', online: 'bgmore', clockextra: 'clock', idle: 'display', unsplash: 'online', animated: 'online', fonts: 'typography', remote: 'samsung', remotepick: 'remote', remoteapp: 'remotepick' };
  function subPage(t) { return !!PARENT[t.group]; }
  function groupName(group, t) { return group === 'remotepick' ? buttonName(t.key) : DETAIL_NAMES[group]; }
  function parentName(t) { return PARENT[t.group] ? groupName(PARENT[t.group], t) : 'Settings'; }
  /* ---------- Wallpaper sources: any mix of Shore's own, My photos and online sources ----------
     S.c.source is a comma list in SOURCES order. Only photos from these sources rotate. */
  function sourceCsv(value) {
    var have = String(value || '').split(','), out = SOURCES.filter(function (o) { return have.indexOf(o.id) >= 0; }).map(function (o) { return o.id; });
    return out.length ? out.join(',') : 'builtin'; // "off" and old empty choices mean Shore's own wallpapers
  }
  function sourceList() { return S.c.source.split(','); }
  function sourceOn(id) { return sourceList().indexOf(id) >= 0; }
  function sourceName(id) { var o = SOURCES.filter(function (x) { return x.id === id; })[0]; return o ? o.name : id; }
  function sourceShort() { var l = sourceList().map(function (id) { return T(sourceName(id)); }); return l.length > 1 ? l[0] + ' +' + (l.length - 1) : l[0]; }
  function sourceSummary() { return sourceList().map(function (id) { return T(sourceName(id)); }).join(', '); }
  /* A wallpaper rotates when its source is chosen. Online and phone photos carry their source; older entries count as online. */
  function isFav(w) { return S.c.fav.indexOf(w.id) >= 0; }
  function isHidden(w) { return S.c.hide.indexOf(w.id) >= 0; }
  /* Hidden photos never rotate; favourites always do, whatever their source. */
  function inRotation(w) { return isHidden(w) ? false : isFav(w) || (w.online ? !w.source || sourceOn(w.source) : sourceOn('builtin')); }
  function source() { for (var i = 0; i < SOURCES.length; i++) if (SOURCES[i].id === S.c.source) return SOURCES[i]; return SOURCES[0]; }
  function mode() { for (var i = 0; i < MODES.length; i++) if (MODES[i].id === S.c.mode) return MODES[i]; return MODES[0]; }
  function settingsRows() {
    var n = S.c.home.length;
    return [{ id: 'background', label: 'Background', value: S.c.bg === 'photo' ? wall(S.c.wall).name : VALUE_NAMES[S.c.bg] },
      { id: 'layout', label: 'Layout', value: isShelf() ? 'Shelf' : VALUE_NAMES[S.c.layout] },
      { id: 'typography', label: 'Text', value: FONTS[S.c.font].name + (S.c.tweight !== 'auto' ? ', ' + VALUE_NAMES[S.c.tweight] : '') + (S.c.tsize !== 'default' ? ', ' + VALUE_NAMES[S.c.tsize] : '') },
      { id: 'clock', label: 'Clock', value: VALUE_NAMES[S.c.cformat] + ', ' + VALUE_NAMES[S.c.csize] + (S.c.cdate === 'on' ? ', with date' : '') + (S.c.cweather === 'on' ? ', with weather' : '') },
      { id: 'display', label: 'Night and idle', value: S.c.night === 'off' ? 'Night mode off' : S.c.night === 'always' ? 'Always dimmed' : 'Dimmed ' + VALUE_NAMES[S.c.nhours] },
      { id: 'focus', label: 'Focus', value: VALUE_NAMES[S.c.focus] + (materialApplies() ? ', ' + VALUE_NAMES[S.c.material] : '') },
      { id: 'editor', label: 'Apps on Home', value: n + (n === 1 ? ' app' : ' apps') },
      { id: 'samsung', label: TV.brand, value: updateReady() ? 'Shore update available' : 'Home and TV settings' }]
      .concat(PHONE ? [{ id: 'phone', label: 'Phone', value: !S.phone.enabled ? 'Phone companion off' : S.phone.count ? (S.phone.count === 1 ? '1 photo' : S.phone.count + ' photos') : 'Phone companion on' }] : []);
  }
  function settingsIds() { return settingsRows().map(function (r) { return r.id; }); }
  V.settings = {
    sheet: true,
    norm: function (t) { var ids = settingsIds(); if (ids.indexOf(t.f.id) < 0) t.f.id = ids[0]; },
    key: function (t, k) {
      var ids = settingsIds(), i = Math.max(0, ids.indexOf(t.f.id));
      if (k === 'up' && i > 0) i--;
      else if (k === 'down' && i < ids.length - 1) i++;
      else if (k === 'back') { pop(); return; }
      t.f.id = ids[i]; S.settingsFocus = ids[i];
      if (k === 'ok') settingsOk(ids[i]);
    },
    point: function (t, z, i, id) { if (z === 'row' && id) { t.f.id = id; this.key(t, 'ok'); } }
  };
  function settingsOk(id) {
    if (id === 'editor') openEditor('settings');
    else if (id === 'phone') openPhone();
    else openAppearance(id);
  }
  var DETAIL_NAMES = { health: 'Setup and health', updates: 'Shore updates', fonts: 'Font', clock: 'Clock', display: 'Night and idle', online: 'Wallpaper sources', unsplash: 'Unsplash themes', animated: 'Animated wallpapers', background: 'Background', layout: 'Layout', typography: 'Text', focus: 'Focus', rotation: 'Rotation', samsung: TV.brand, remote: 'Remote buttons', remoteapp: 'Choose an app', phone: 'Phone', clockextra: 'Under the clock', idle: 'When idle', bgmore: 'Online and album art', saveropts: 'Screensaver options', saverlook: 'Motion and clock', focusmore: 'Colour and motion' };
  function choice(axis, value, disabled) {
    if (axis === 'source') return { action: 'online.' + value, axis: axis, value: value, disabled: !!disabled, label: sourceName(value), tick: true, applied: sourceOn(value) };
    return { action: axis === 'mode' ? 'rotation.' + value : 'choice.' + axis + '.' + value, axis: axis, value: value, disabled: !!disabled,
      label: axis === 'cdate' ? 'Date' : axis === 'cweather' ? 'Weather' : axis === 'cplaying' ? 'Now playing' : axis === 'cart' ? 'Album art' : axis === 'clook' ? 'Find artist pictures online' : axis === 'saver' && value !== 'off' ? value + ' min' : axis === 'svtime' ? value + ' s' : axis === 'csec' ? shortSeconds() : axis === 'iask' ? askLabel() : /^(svclock|svdate|svmusic|wicon|cwave)$/.test(axis) ? LOOK_NAMES[axis] : axis === 'font' ? FONTS[value].name : axis === 'mode' ? MODES.filter(function (m) { return m.id === value; })[0].name : value === 'both' ? 'Both' : value === 'light' && /weight$/.test(axis) ? weightLight() : VALUE_NAMES[value] };
  }
  /* "Seconds" in the Format row, abbreviated where the word is long. */
  /* "Ask" (to switch inputs), short enough to share the Inputs row in every language. */
  function askLabel() { var w = T('Ask (inputs)'); return w === 'Ask (inputs)' ? 'Ask' : w; }
  function shortSeconds() { var w = T('Seconds (short)'); return w === 'Seconds (short)' ? 'Seconds' : w; }
  /* "Light" as a font weight differs from the Light background in some languages. */
  function weightLight() { var w = T('Light weight'); return w === 'Light weight' ? 'Light' : w;
  }
  /* ---------- Remote buttons (Android: HomeButtonService applies them, even inside other apps) ---------- */
  var REMOTE = ANDROID && FrameDevice.remote ? FrameDevice.remote : null;
  /* Android key names for the TCL RC833 remote; unknown keys show their Android name. */
  var BUTTON_NAMES = { KEYCODE_TV: 'TV button', KEYCODE_PROG_RED: 'Red button', KEYCODE_PROG_GREEN: 'Green button',
    KEYCODE_PROG_YELLOW: 'Yellow button', KEYCODE_PROG_BLUE: 'Blue button', KEYCODE_GUIDE: 'Guide button',
    KEYCODE_TV_INPUT: 'Input button', KEYCODE_SETTINGS: 'Settings button', KEYCODE_MENU: 'Menu button', KEYCODE_BOOKMARK: 'Bookmark button' };
  function buttonName(key) {
    var name = key && key.name || '';
    if (BUTTON_NAMES[name]) return BUTTON_NAMES[name];
    name = /^KEYCODE_/.test(name) ? name.slice(8).toLowerCase().replace(/_/g, ' ') + ' button' : 'Button ' + (key ? key.code : '');
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  function remoteTarget(action) {
    var kind = action.slice(0, action.indexOf(':')), id = action.slice(action.indexOf(':') + 1), found = null;
    APPS.forEach(function (a) { if (!found && a.appId && (kind === 'input' ? a.input && a.appId === id : !a.input && REMOTE.appTarget(a.id) === id)) found = a; });
    return found;
  }
  function actionName(action) {
    var a;
    if (action === 'home') return 'Shore Home';
    if (action === 'none') return 'Does nothing';
    if (action === 'screensaver') return TV.art;
    a = remoteTarget(action);
    return a ? a.name : /^input:/.test(action) ? 'TV input' : action.slice(4);
  }
  function remoteAction(key) {
    var found = 'default';
    S.remote.keys.forEach(function (k) { if (k.code === key.code) found = k.action; });
    return found;
  }
  function refreshRemote() {
    var info = REMOTE.info(), r = S.remote;
    if (r.learning && !info.learning) { r.learning = false; r.missed = true; clearTimeout(r.timer); }
    r.service = info.service; r.blocked = !!info.blocked; r.keys = info.keys;
  }
  function remotePage(t) { return t.id === 'appearance' && PARENT[t.group] && (t.group === 'remote' || PARENT[t.group] === 'remote' || PARENT[t.group] === 'remotepick'); }
  function openRemote() { refreshRemote(); S.remote.missed = false; openAppearance('remote'); }
  function startLearn() {
    var r = S.remote;
    r.missed = false;
    r.learning = REMOTE.learn(true);
    clearTimeout(r.timer);
    if (r.learning) r.timer = setTimeout(function () { refreshRemote(); render(); }, 20500);
    else refreshRemote();
  }
  function stopLearn() { var r = S.remote; clearTimeout(r.timer); r.learning = false; REMOTE.learn(false); }
  function remoteLearned(key) {
    var t = top(), r = S.remote;
    clearTimeout(r.timer); r.learning = false; r.missed = false;
    if (t.id !== 'appearance' || t.group !== 'remote') return;
    refreshRemote(); openRemotePick({ code: key.code, name: String(key.name || '') });
    render();
  }
  function openRemotePick(key) {
    var current = remoteAction(key), t;
    push({ id: 'appearance', group: 'remotepick', key: key, f: { action: 'remote.apps' } });
    t = top();
    detailRows(t).forEach(function (items) { items.forEach(function (item) { if (item.remote === current) t.f.action = item.action; }); });
  }
  function assignRemote(t, value) {
    REMOTE.set(t.key.code, t.key.name, value);
    refreshRemote();
    while (top().id === 'appearance' && top().group !== 'remote') pop();
  }
  function remoteSections(t) {
    var r = S.remote, items, current, choices, inputs, apps, n = 0;
    function choose(value, label) { return { action: 'remote.pick.' + (n++), remote: value, label: label, tick: true, applied: current === value }; }
    if (t.group === 'remote') {
      items = r.keys.map(function (k, i) { return { action: 'remote.key.' + i, label: buttonName(k), description: actionName(k.action), pair: true }; });
      items.push({ action: 'remote.learn', label: r.learning ? 'Press a button on the remote…' : 'Assign a button…', disabled: !r.service });
      if (!r.service) items.push({ action: 'remote.service', label: 'Accessibility settings' });
      return [{ id: 'remote', title: '', items: items,
        reason: r.blocked ? 'The TV stopped “Shore Home button” after a restart. Allow Shore to auto start in TV Guard, then switch the service off and on again.'
          : !r.service ? 'Turn on “Shore Home button” in Settings › System › Accessibility to assign buttons.'
          : r.learning ? 'Waiting for a button. Any other key cancels.'
          : r.missed ? 'No button arrived. The TV handles that button before Shore sees it, so it can’t be reassigned.'
          : r.keys.length ? 'Assigned buttons work everywhere, even inside apps.' : 'Assign the app buttons or the TV button to something else.' }];
    }
    current = remoteAction(t.key);
    if (t.group === 'remoteapp') {
      apps = S.c.home.filter(function (id) { var a = app(id); return a && !a.input && REMOTE.appTarget(id); });
      items = apps.slice(0, 8).map(function (id) { return choose('app:' + REMOTE.appTarget(id), app(id).name); });
      return [{ id: 'apps', title: '', items: items.length ? items : [{ action: 'remote.none', label: 'No apps on Home', disabled: true }],
        reason: apps.length > 8 ? 'Showing your first 8 Home apps.' : 'These are the apps on your Home screen.' }];
    }
    choices = [choose('default', 'Default'), choose('home', 'Shore Home'), choose('none', 'Do nothing'), choose('screensaver', TV.art)];
    inputs = LIVE.slice(0, 3).map(function (id) { return choose('input:' + app(id).appId, app(id).name); });
    return [{ id: 'action', title: 'Action', items: choices }]
      .concat(inputs.length ? [{ id: 'inputs', title: 'Inputs', horizontal: true, items: inputs }] : [])
      .concat([{ id: 'app', title: 'App', items: [{ action: 'remote.apps', label: /^app:/.test(current) ? actionName(current) : 'An app', more: true }],
        reason: current === 'default' ? 'Default keeps what the TV normally does.' : '' }]);
  }
  /* ---------- Under the clock: weather (Open-Meteo) and what is playing (Android media sessions) ---------- */
  var WEATHER = window.CleanFrameWeather || null, NOWPLAYING = ANDROID && FrameDevice.nowPlaying ? FrameDevice.nowPlaying : null;
  function saverSummary() { return [VALUE_NAMES[S.c.svsrc], VALUE_NAMES[S.c.svlay], S.c.svtime + ' s'].map(T).join(', '); }
  function saverLookSummary() {
    var on = (S.c.svclock === 'on' ? ['Clock'] : []).concat(S.c.svdate === 'on' ? ['Date and weather'] : []).concat(NOWPLAYING && S.c.svmusic === 'on' ? ['Music'] : []);
    return [VALUE_NAMES[S.c.svmotion]].concat(on).map(T).join(', ');
  }
  function idleSummary() { return S.c.saver === 'off' ? T('Screensaver off') : T('Screensaver') + ' · ' + T(S.c.saver + ' min'); }
  function clockExtraSummary() {
    var on = (S.c.cweather === 'on' ? ['Weather'] : []).concat(NOWPLAYING && S.c.cplaying === 'on' ? ['Now playing'] : []);
    return on.length ? on.join(', ') : 'Nothing';
  }
  function clockExtraNote() {
    if (NOWPLAYING && S.c.cplaying === 'on' && !S.playing.access) return 'Allow “Shore Now playing” in Notification access to show what’s playing.';
    return S.c.cweather === 'on' ? PHONE ? 'Weather by Open-Meteo. Set your place in the phone companion.' : 'Weather by Open-Meteo.' : '';
  }
  function pollPlaying() {
    var info, key;
    if (!NOWPLAYING || document.hidden || S.c.cplaying !== 'on' && S.c.cart !== 'on' && !S.saver) return;
    info = NOWPLAYING.info(S.c.clook === 'on'); key = info.access + '|' + (info.playing ? info.title + '|' + info.artist + '|' + info.art + '|' + info.wide : '');
    if (key === S.playing.key) return;
    info.key = key; S.playing = info;
    if (S.saver) renderSaver();
    if (top().id === 'home' || isSettingsDetail(top())) render();
  }
  /* A small looping level meter: decoration only, Shore never hears the audio. */
  var WAVE = '<span class="wave" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
  function wave() { return S.c.cwave === 'on' ? WAVE : ''; }
  /* Album art as the background: a soft backdrop pre-rendered natively, shown above the photo while music plays. */
  function npArt() { var p = S.playing; return !!(NOWPLAYING && S.c.cart === 'on' && S.c.bg === 'photo' && p.playing && (p.back || p.wide)) && !DREAM; }
  var npEl = document.createElement('div'), npImgs = [document.createElement('img'), document.createElement('img')], npFront = 0, npSrc = '';
  npEl.className = 'np-bg'; npEl.setAttribute('aria-hidden', 'true');
  npImgs.forEach(function (img) { img.className = 'np-img'; img.alt = ''; npEl.appendChild(img); });
  function crossfade(imgs, front, src, cls) {
    var back = imgs[1 - front];
    if (!src) { imgs[0].className = imgs[1].className = cls; return front; }
    if (imgs[front].getAttribute('src') === src && imgs[front].className.indexOf('is-on') >= 0) return front;
    back.onload = function () { if (back.getAttribute('src') !== src) return; back.className = cls + ' is-on'; imgs[front].className = cls; };
    back.onerror = function () { back.className = cls; };
    if (back.getAttribute('src') === src && back.complete && back.naturalWidth) back.onload(); else back.src = src;
    return 1 - front;
  }
  function syncNpArt() {
    var src = npArt() ? S.c.clook === 'on' && S.playing.wide || S.playing.back : '';
    if (src === npSrc) return;
    npSrc = src; npFront = crossfade(npImgs, npFront, src, 'np-img');
  }
  function weatherIcon() { var name = WEATHER && S.c.cweather === 'on' && S.c.wicon === 'on' && WEATHER.icon ? WEATHER.icon() : ''; return name && SVG['w-' + name] ? icon('w-' + name, 'wx') : ''; }
  function clockExtras() {
    var html = '', p = S.playing, w = S.c.cweather === 'on' && WEATHER ? WEATHER.text(S.c.wunit) : '', date = S.c.cdate === 'on' ? T(dateText()) : '';
    if (date || w) html += '<span class="cap-date">' + escRaw(date) + (date && w ? ' · ' : '') + weatherIcon() + escRaw(w) + '</span>';
    if (NOWPLAYING && S.c.cplaying === 'on' && p.playing) html += '<span class="cap-date cap-playing">' + wave() + escRaw(p.title + (p.artist ? ' · ' + p.artist : '') + (p.app ? ' — ' + p.app : '')) + '</span>';
    return html;
  }
  /* ---------- Screensaver: Shore's own, instead of the TV's ---------- */
  /* After the chosen idle time Shore fades to a slow slideshow of the wallpapers with a large clock, or the album
     art while music plays. The clock block moves every few minutes. While it is enabled and Shore is in front,
     Shore keeps the TV's own screensaver away; after four hours it lets the TV take over (and sleep as usual). */
  var SAVER_MOVE_EVERY = 4, SAVER_AWAKE_MS = 4 * 3600000;
  /* Slides alternate between one photo and small mosaics; every photo slowly pans and zooms. */
  var SAVER_LAYOUTS = { mix: ['full', 'trio', 'full', 'pair'], single: ['full'], mosaic: ['trio', 'pair'] }, SAVER_TILES = { full: 1, pair: 2, trio: 3 };
  /* Below this many photos, "Like Home" tops the slideshow up with Shore's own wallpapers. */
  var SAVER_MIN_PHOTOS = 6;
  function saverSlideMs() { return +S.c.svtime * 1000 * (QA.slideScale || 1); }
  var saverTimer = 0, saverPhotoTimer = 0, saverSrc = '', saverFront = 0, saverStep = 0, saverPos = 0, saverOrder = [], saverAt = 0, saverSince = 0, awakeOn = null, saverMotion = 0;
  var saverEl = document.createElement('div');
  saverEl.className = 'saver'; saverEl.setAttribute('aria-hidden', 'true');
  saverEl.innerHTML = '<div class="sv-slide"></div><div class="sv-slide"></div>'
    + '<div class="sv-shade"></div><div class="sv-night"></div><div class="sv-info"><div class="sv-clock"></div><div class="sv-date"></div><div class="sv-np"></div></div>';
  var svSlides = saverEl.querySelectorAll('.sv-slide'), svInfo = saverEl.querySelector('.sv-info');
  function saverDelay() { return S.c.saver === 'off' ? 0 : +S.c.saver * QA.minuteMs; }
  function saverReset() {
    clearTimeout(saverTimer); saverTimer = 0;
    if (S.saver || DREAM || document.hidden || !saverDelay()) { syncAwake(); return; }
    saverTimer = setTimeout(function () {
      saverTimer = 0;
      if (!saverDelay()) return;
      if (S.pending || S.remote && S.remote.learning) { saverReset(); return; } // busy: try again after another full wait
      startSaver();
    }, saverDelay());
    syncAwake();
  }
  /* FLAG_KEEP_SCREEN_ON while Shore's screensaver is enabled and Shore is in front, for at most four hours of screensaver. */
  function syncAwake() {
    var on = !!SAVER_API && !DREAM && !document.hidden && S.c.saver !== 'off' && !(S.saver && Date.now() - saverSince > SAVER_AWAKE_MS);
    if (on === awakeOn || !SAVER_API) return;
    awakeOn = on; SAVER_API.keepAwake(on);
  }
  /* Like Home: the rotation pool, topped up when small. Everything: the current online source (or My photos) and Shore's own. */
  function saverPool() {
    var shown = WALLS.filter(function (w) { return !isHidden(w); }), builtIn = shown.filter(function (w) { return !w.online; }), pool;
    if (!shown.length) shown = builtIn = WALLS.slice(); // everything hidden: show something rather than nothing
    if (S.c.svsrc === 'builtin') return builtIn.length ? builtIn : shown;
    if (S.c.svsrc === 'every') return shown;
    pool = rotationPool().filter(function (w) { return !isHidden(w); });
    return pool.length >= SAVER_MIN_PHOTOS ? pool : pool.concat(builtIn.filter(function (w) { return pool.indexOf(w) < 0; }));
  }
  /* The rotation pool in a shuffled order that starts with the wallpaper on Home. */
  function saverQueue() {
    var pool = saverPool().filter(function (w) { return w.src; }).map(function (w) { return w.src; }), i, j, t, first;
    for (i = pool.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    first = wall(S.c.wall);
    if (first && first.src && pool.indexOf(first.src) > 0) { pool.splice(pool.indexOf(first.src), 1); pool.unshift(first.src); }
    return pool;
  }
  function saverTake(n) {
    var out = [];
    while (out.length < n) {
      if (saverAt >= saverOrder.length) { saverOrder = saverQueue(); saverAt = 0; if (!saverOrder.length) break; }
      if (out.indexOf(saverOrder[saverAt]) < 0) out.push(saverOrder[saverAt]);
      saverAt++;
      if (out.length >= saverOrder.length) break; // fewer photos than tiles
    }
    return out;
  }
  function nextSaverPhoto() {
    var layouts = SAVER_LAYOUTS[S.c.svlay] || SAVER_LAYOUTS.mix, layout = layouts[saverStep % layouts.length], photos, slide = svSlides[1 - saverFront], left, html = '';
    clearTimeout(saverPhotoTimer);
    if (!S.saver) return;
    saverPhotoTimer = setTimeout(nextSaverPhoto, saverSlideMs());
    photos = saverTake(SAVER_TILES[layout]);
    if (!photos.length) return;
    if (photos.length < SAVER_TILES[layout]) layout = photos.length === 2 ? 'pair' : 'full';
    photos.forEach(function (src, i) { html += '<div class="sv-tile t' + i + '"><img class="sv-img ' + (S.c.svmotion === 'drift' ? 'm' + (saverMotion++ % 4) + '" style="animation-duration:' + (saverSlideMs() / 1000 + 4) + 's' : 'still') + '" alt="" src="' + escRaw(src) + '"></div>'; });
    left = photos.length;
    slide.className = 'sv-slide l-' + layout;
    slide.innerHTML = html;
    saverSrc = photos[0];
    Array.prototype.forEach.call(slide.querySelectorAll('img'), function (img) {
      function one() { img.onload = img.onerror = null; if (--left === 0) show(); }
      img.onload = one; img.onerror = one;
      if (img.complete) one();
    });
    function show() {
      if (!S.saver || slide !== svSlides[1 - saverFront]) return;
      slide.className = 'sv-slide l-' + layout + ' is-on'; svSlides[saverFront].className = svSlides[saverFront].className.replace(' is-on', ' is-out');
      saverFront = 1 - saverFront; saverStep++;
      if (saverStep % SAVER_MOVE_EVERY === 0 && S.c.svpos === 'move') moveSaverInfo();
    }
  }
  /* Fade out, jump to the next corner, fade in: keeps the clock from sitting on the same pixels for hours. */
  function moveSaverInfo() {
    svInfo.className = 'sv-info pos-' + saverPos + ' is-moving';
    setTimeout(function () { saverPos = (saverPos + 1) % 4; svInfo.className = 'sv-info pos-' + saverPos; }, 900);
  }
  /* What is playing shows as a card with its cover; the photos keep running behind it. */
  function renderSaver() {
    var p = S.playing, music = !!(NOWPLAYING && S.c.cplaying === 'on' && S.c.svmusic === 'on' && p.playing), w = S.c.cweather === 'on' && WEATHER ? WEATHER.text(S.c.wunit) : '', np = '';
    if (!S.saver) return;
    setHTML(svInfo.querySelector('.sv-clock'), S.c.svclock === 'on' ? escRaw(clockText()) : '');
    setHTML(svInfo.querySelector('.sv-date'), S.c.svdate === 'on' ? escRaw(T(dateText())) + (w ? ' · ' + weatherIcon() + escRaw(w) : '') : '');
    if (music) np = (p.art ? '<img class="sv-cover" alt="" src="' + escRaw(p.art) + '">' : '')
      + '<span class="sv-np-text"><span class="sv-title">' + wave() + escRaw(p.title) + '</span>'
      + (p.artist || p.app ? '<span class="sv-artist">' + escRaw(p.artist + (p.artist && p.app ? ' — ' : '') + p.app) + '</span>' : '') + '</span>';
    setHTML(svInfo.querySelector('.sv-np'), np);
    svInfo.querySelector('.sv-np').className = 'sv-np' + (np ? ' is-on' : '') + (p.art ? ' has-cover' : '');
    saverEl.className = 'saver is-on' + (DREAM ? ' is-dream' : '');
    syncAwake();
  }
  function startSaver() {
    if (S.saver) return;
    if (!saverEl.parentNode) stage.appendChild(saverEl);
    clearTimeout(saverTimer); saverTimer = 0;
    S.saver = true; saverSince = Date.now(); saverStep = 0; saverSrc = ''; saverOrder = []; saverAt = 0;
    svInfo.className = 'sv-info pos-' + saverPos;
    pollPlaying(); renderSaver(); nextSaverPhoto();
    render(); syncRotation();
  }
  function stopSaver() {
    if (!S.saver || DREAM) return;
    S.saver = false; clearTimeout(saverPhotoTimer); saverPhotoTimer = 0;
    saverEl.className = 'saver';
    Array.prototype.forEach.call(svSlides, function (sl) { sl.className = 'sv-slide'; sl.innerHTML = ''; }); // frees the decoded photos
    render(); syncRotation(); saverReset();
  }
  /* ---------- My photos: sent from a phone over the local network (Android shell) ---------- */
  var PHONE = ANDROID && FrameDevice.phone && ONLINE_INFO.phone ? FrameDevice.phone : null;
  var phoneWall = '';
  function openPhone() { S.phone = PHONE.info(); openAppearance('phone'); }
  /* ---------- Updates: the native side checks the public releases and opens Android's installer ---------- */
  var UPDATE = ANDROID && FrameDevice.update ? FrameDevice.update : null;
  function updateReady() { return S.update && (S.update.status === 'available' || S.update.status === 'ready'); }
  function updateLine() {
    var u = S.update;
    if (!u) return '';
    if (u.status === 'checking') return 'Checking…';
    if (u.status === 'downloading') return 'Downloading ' + u.progress + '%';
    if (u.status === 'installing') return 'Opening the installer…';
    if (updateReady()) return 'Update available: ' + u.latest;
    if (u.status === 'error') return 'Couldn’t check for updates';
    return 'Version ' + u.current;
  }
  function updateSections() {
    var u = S.update, main;
    if (u.status === 'downloading') main = { action: 'update.wait', label: 'Downloading Shore ' + u.latest, description: u.progress + '%' };
    else if (u.status === 'installing') main = { action: 'update.wait', label: 'Opening the installer…', description: 'Android asks you to confirm' };
    else if (updateReady() && u.personal) main = { action: 'update.check', label: 'Shore ' + u.latest + ' is out', description: 'Rebuild Shore to update' };
    else if (updateReady()) main = { action: 'update.install', label: 'Install Shore ' + u.latest, description: u.title || (u.size ? (u.size / 1048576).toFixed(1) + ' MB' : '') };
    else main = { action: 'update.check', label: u.status === 'checking' ? 'Checking…' : 'Check for updates', description: u.status === 'current' ? 'Shore ' + u.current + ' is the latest version' : 'You have Shore ' + u.current };
    return [{ id: 'update', title: '', items: [main, { action: 'update.auto', label: 'Check automatically', description: 'Every few hours, when Shore opens', tick: true, applied: u.auto }],
      reason: u.status === 'error' ? u.error
        : u.personal ? (updateReady() ? 'You built this copy of Shore yourself, so it doesn’t replace itself with the public APK. Pull the latest source, then build and install the new APK.' : 'You built this copy of Shore yourself. Shore tells you when a new version is out; then rebuild it from the latest source.')
        : updateReady() && !u.canInstall ? 'First, Shore asks for permission to install apps. Allow it, then come back and press OK again.'
        : 'Updates come from Shore’s public releases. Android asks you to confirm, and your settings and photos stay.' }];
  }
  /* Settings › Phone: the Shore Companion web app, paired by QR code, and the photos it sent. */
  function phoneSections(flat) {
    var p = S.phone, n = p.count;
    var sections = [{ id: 'companion', title: '', items: [{ action: 'phone.toggle', label: 'Phone companion', description: 'Photos and weather from your phone', tick: true, applied: p.enabled }],
      reason: p.enabled ? '' : 'The companion runs on your home Wi-Fi only and needs this code to pair.' }];
    if (p.enabled) sections.push({ id: 'phonecode', title: '', items: [], qr: p.qr || ' ', url: p.url,
      qrNote: p.url ? 'Point your phone’s camera at the code, then tap Install app to keep Shore Companion on your phone. Without internet, open this address instead:' : 'Connect the TV to your Wi-Fi to use the companion.' });
    sections.push({ id: 'phoneuse', title: 'Wallpaper', items: [choice('source', 'phone', flat || !n)]
      .concat(n ? [{ action: 'phone.clear', label: 'Remove all my photos', description: n === 1 ? '1 photo' : n + ' photos' }] : [])
      .concat(p.enabled ? [{ action: 'phone.forget', label: 'Forget paired phones' }] : []),
      reason: flat ? 'Choose Photo in Background to use online wallpapers.' : !n ? 'Send a photo from your phone first.' : sourceOn('phone') && S.onlineStatus ? ONLINE_STATUS[S.onlineStatus] || '' : '' });
    return sections;
  }
  /* ---------- Setup and health: each step with its live status; OK opens the place that fixes it ---------- */
  function healthItems() {
    var items = [], r = S.remote, failed;
    if (REMOTE) items.push({ action: 'health.remote', label: 'Home button opens Shore', tick: true, applied: r.service && !r.blocked,
      description: !r.service ? 'Turn on Shore in Accessibility' : r.blocked ? 'Blocked after a restart: turn it off and on' : 'Working' });
    if (NOWPLAYING) items.push({ action: 'nowplaying.access', label: 'Show what’s playing', tick: true, applied: !!S.playing.access,
      description: S.playing.access ? 'Working' : 'Allow Shore in Notification access' });
    if (ONLINE) {
      failed = String(ONLINE_INFO.failed || '').split(',').filter(function (id) { return id && sourceOn(id); });
      items.push({ action: 'background.online', label: 'Wallpaper sources', tick: true, applied: !failed.length,
        description: failed.length ? T('Couldn’t reach') + ' ' + failed.map(function (id) { return T(sourceName(id)); }).join(', ') : sourceNote() });
    }
    if (PHONE) items.push({ action: 'health.phone', label: 'Phone companion', tick: true, applied: S.phone.enabled,
      description: S.phone.enabled ? (S.phone.url ? 'On · ' + S.phone.url.replace(/^https?:\/\//, '') : 'On') : 'Send photos and change settings from your phone' });
    if (UPDATE) items.push({ action: 'open.updates', label: 'Shore updates', tick: true, applied: !updateReady() && S.update.status !== 'error', description: updateLine() });
    return items;
  }
  function healthTodo() { return healthItems().filter(function (i) { return !i.applied; }).length; }
  function healthLine() { var n = healthTodo(); return !n ? 'Everything is set up' : n === 1 ? '1 thing to check' : n + ' things to check'; }
  function healthSections() {
    return [{ id: 'health', title: '', items: healthItems() }]; // ticks and the OK hint say what to do; a note would not fit
  }
  function openHealth() {
    if (REMOTE) refreshRemote();
    if (NOWPLAYING) S.playing.access = NOWPLAYING.info(false).access;
    if (ONLINE) ONLINE_INFO = ONLINE.info();
    if (PHONE) S.phone = PHONE.info();
    if (UPDATE) S.update = UPDATE.info();
    openAppearance('health');
  }
  /* ---------- Phone companion: every setting from the phone ----------
     Shore publishes what each setting can be and what it is now; the companion sends a choice back and
     Shore applies it exactly as if it was chosen with the remote. */
  var COMPANION_GROUPS = [
    ['Background', ['bg', 'wall', 'mode', 'source', 'cart', 'npdim', 'clook']],
    ['Layout', ['layout', 'apps', 'controls', 'inputs', 'iask', 'isize']],
    ['Text', ['font', 'tweight', 'tsize']],
    ['Clock', ['cformat', 'csec', 'cdate', 'csize', 'cweight', 'cpos', 'cweather', 'wunit', 'wicon', 'cplaying', 'cwave']],
    ['Focus', ['focus', 'material', 'tint', 'dglass', 'motion']],
    ['Night and idle', ['night', 'nhours', 'ndim', 'idle', 'saver']],
    ['Screensaver', ['svsrc', 'svlay', 'svtime', 'svmotion', 'svpos', 'svclock', 'svdate', 'svmusic']]];
  var companionTimer = 0, companionLast = '';
  function companionAxis(axis) {
    var out;
    if (axis === 'wall') return { id: 'wall', name: T('Wallpaper'), kind: 'wall', value: S.c.wall,
      options: WALLS.map(function (w) { return { value: w.id, label: T(w.name), mine: /^file:/.test(w.src || '') }; }) };
    if (axis === 'mode') return { id: 'mode', name: T('Rotation'), kind: 'list', value: S.c.mode, options: MODES.map(function (m) { return { value: m.id, label: T(m.name) }; }) };
    if (axis === 'source') return ONLINE ? { id: 'source', name: T('Wallpaper sources'), kind: 'multi', value: sourceList(),
      options: SOURCES.filter(function (o) { return !o.key || ONLINE_INFO[o.key]; }).filter(function (o) { return o.id !== 'phone' || PHONE; }).map(function (o) { return { value: o.id, label: T(o.name) }; }) } : null;
    if (axis === 'layout') return { id: 'layout', name: T('Layout'), kind: 'choice', value: isShelf() ? 'shelf' : S.c.layout,
      options: [{ value: 'list', label: T('List') }, { value: 'dock', label: T('Dock') }, { value: 'shelf', label: T('Shelf') }] };
    if ((axis === 'cart' || axis === 'npdim' || axis === 'clook' || axis === 'cplaying' || axis === 'cwave' || axis === 'svmusic') && !NOWPLAYING) return null;
    if (!LOOK_VALUES[axis]) return null;
    if (TOGGLES.indexOf(axis) >= 0) return { id: axis, name: T(LOOK_NAMES[axis]), kind: 'toggle', value: S.c[axis] };
    out = { id: axis, name: T(LOOK_NAMES[axis] || axis), kind: 'choice', value: S.c[axis], options: LOOK_VALUES[axis].map(function (v) { return { value: v, label: T(choice(axis, v).label) }; }) };
    return out;
  }
  function companionModel() {
    var home = S.c.home.map(function (id) { var a = app(id); return a ? { id: id, name: a.name } : null; }).filter(Boolean);
    var others = APPS.filter(function (a) { return !a.input && a.appId && S.c.home.indexOf(a.id) < 0 && installedApp(a); }).slice(0, 80).map(function (a) { return { id: a.id, name: a.name }; });
    return { version: 1, lang: (window.CleanFrameI18n && CleanFrameI18n.lang) || 'en', saver: !!S.saver, cap: CAP,
      groups: COMPANION_GROUPS.map(function (g) { return { name: T(g[0]), items: g[1].map(companionAxis).filter(Boolean) }; }),
      home: home, others: others, backup: backupOf(),
      labels: { start: T('Start the screensaver now'), apps: T('Apps on Home'), more: T('Other installed apps'), full: T(FULL) } };
  }
  function installedApp(a) { return !!a; }
  /* Backup for the companion: every saved preference, in the same format Shore stores. No timestamp, so an unchanged
     model is not republished; the phone dates the file. Photos stay on the TV and are not part of it. */
  function backupOf() { return { shore: 'backup', format: 1, settings: serialise(S.c) }; }
  /* Restore from the companion. The backup goes through clean(), exactly like saved preferences at startup,
     so a damaged or edited file can only fall back to defaults. Shore then reloads with it. */
  window.CleanFrameCompanionRestore = function (json) {
    var o, c;
    try { o = JSON.parse(String(json)); } catch (e) { return; }
    if (!o || o.shore !== 'backup' || !o.settings || typeof o.settings !== 'object' || Array.isArray(o.settings)) return;
    c = clean(o.settings);
    c.source = sourceCsv(o.settings.source);
    if (ONLINE) ONLINE.select(c.source, false);
    try { localStorage.setItem(KEY, JSON.stringify(serialise(c))); sessionStorage.setItem('shore.restored', '1'); } catch (e) { return; }
    location.reload();
  };
  function publishCompanion(now) {
    if (!PHONE || !PHONE.publish) return;
    clearTimeout(companionTimer);
    if (!now) { companionTimer = setTimeout(function () { publishCompanion(true); }, 400); return; }
    var text;
    try { text = JSON.stringify(companionModel()); } catch (e) { return; }
    if (text === companionLast) return;
    companionLast = text; PHONE.publish(text);
  }
  window.CleanFrameCompanionSet = function (axis, value) {
    var patch = {}, i, order;
    axis = String(axis); value = String(value);
    try {
      if (axis === 'mode') { if (MODES.some(function (m) { return m.id === value; })) applyRotation(value); }
      else if (axis === 'source') { if (SOURCES.some(function (o) { return o.id === value; })) applySource(value); }
      else if (axis === 'layout') { if (/^(list|dock|shelf)$/.test(value)) setLook({ layout: value === 'list' ? 'list' : 'dock', lstyle: value === 'shelf' ? 'shelf' : 'glass' }, { row: 'layout' }); }
      else if (axis === 'action') { if (value === 'saver') startSaver(); }
      else if (axis === 'home.add') { if (app(value)) homeAdd(value); }
      else if (axis === 'home.remove') { if (app(value)) homeRemove(value); }
      else if (axis === 'home.up' || axis === 'home.down') {
        i = S.c.home.indexOf(value); order = S.c.home.slice();
        if (i >= 0 && (axis === 'home.up' ? i > 0 : i < order.length - 1)) {
          order.splice(i, 1); order.splice(axis === 'home.up' ? i - 1 : i + 1, 0, value);
          homeMove(order, value, snap());
        }
      }
      else if (axis === 'wall') { if (wall(value)) setLook({ wall: value }, { row: 'bg' }); }
      else if (LOOK_VALUES[axis] && LOOK_VALUES[axis].indexOf(value) >= 0) { patch[axis] = value; setLook(patch, { row: axis }); }
    } catch (e) { log('Companion: ' + e.message); }
    S.note = ''; render(); publishCompanion(true);
  };
  function detailSections(t) {
    var flat = S.c.bg !== 'photo', inactive = !materialApplies();
    function options(axis, values, disabled) { return values.map(function (value) { return choice(axis, value, disabled); }); }
    if (t.group === 'background') return [
      { id: 'bg', title: 'Background type', items: options('bg', ['photo', 'light', 'dark']) },
      { id: 'wall', title: 'Wallpaper', items: [{ action: 'background.wallpaper', label: wall(S.c.wall).name, thumbnail: true, disabled: flat }] },
      { id: 'rotation', title: ONLINE || NOWPLAYING ? 'Rotation and more' : 'Rotation', items: [{ action: 'background.rotation', label: mode().name + (S.c.motion === 'drift' ? ' · Drift' : ''), disabled: flat }]
        .concat(ONLINE || NOWPLAYING ? [{ action: 'open.bgmore', label: 'Online and album art', disabled: flat }] : []), reason: flat ? 'Choose Photo to use wallpaper and rotation.' : '' }
    ];
    /* Sub-page: online sources and the album art background. */
    if (t.group === 'bgmore') return (ONLINE ? [{ id: 'online', title: 'Wallpaper sources', items: [{ action: 'background.online', label: sourceShort(), disabled: flat }] }] : [])
      .concat(NOWPLAYING ? [{ id: 'cart', title: 'While music plays', items: [{ action: 'choice.cart.on', axis: 'cart', value: 'on', label: 'Album art as background', tick: true, applied: S.c.cart === 'on', disabled: flat }],
        reason: '' },
        { id: 'npdim', title: 'Album art dimming', horizontal: true, items: options('npdim', ['none', 'soft', 'strong'], flat || S.c.cart !== 'on') },
        { id: 'clook', title: 'Sharper pictures', items: options('clook', ['on'], flat || S.c.cart !== 'on'),
          reason: S.c.clook === 'on' ? 'Asks TheAudioDB and iTunes, sending only the artist, title and album.' : 'Uses only the cover the music app provides.' }] : []);
    if (t.group === 'layout') return [
      { id: 'layout', title: 'Layout', horizontal: true, items: [
        { action: 'choice.layout.list', axis: 'layout', value: 'list', label: 'List', applied: S.c.layout === 'list' },
        { action: 'choice.layout.dock', axis: 'layout', value: 'dock', label: 'Dock', applied: S.c.layout === 'dock' && S.c.lstyle !== 'shelf' },
        { action: 'choice.layout.shelf', axis: 'layout', value: 'shelf', label: 'Shelf', applied: isShelf() }] },
      { id: 'apps', title: 'App display', horizontal: true, items: options('apps', ['text', 'icons', 'both']) },
      { id: 'controls', title: 'Home controls', horizontal: true, items: options('controls', ['text', 'icons', 'both']) },
      { id: 'inputs', title: 'Inputs', horizontal: true, items: options('inputs', ['front', 'row'], S.c.layout === 'list').concat(ANDROID ? options('iask', ['on']) : []),
        reason: S.c.layout === 'list' ? 'Own row needs the Dock layout.' : '' }
    ];
    if (t.group === 'fonts') return [{ id: 'font', title: '', items: options('font', LOOK_VALUES.font) }];
    if (t.group === 'typography') return [
      { id: 'fontpick', title: 'Font', items: [{ action: 'typography.fonts', label: FONTS[S.c.font].name }] },
      { id: 'tweight', title: 'Text weight', horizontal: true, items: options('tweight', ['auto', 'light', 'regular', 'bold']) },
      { id: 'tsize', title: 'App name size', horizontal: true, items: options('tsize', ['small', 'default', 'large']) }];
    if (t.group === 'clock') return [
      { id: 'cformat', title: 'Format', horizontal: true, items: options('cformat', ['12', '24']).concat(options('cdate', ['on'])).concat(options('csec', ['on'])) },
      { id: 'csize', title: 'Clock size', horizontal: true, items: options('csize', ['small', 'medium', 'large', 'huge']) },
      { id: 'cweight', title: 'Clock weight', horizontal: true, items: options('cweight', ['auto', 'thin', 'light', 'bold']) },
      { id: 'cextra', title: 'Under the clock', items: [{ action: 'open.clockextra', label: clockExtraSummary(), more: true }] }];
    if (t.group === 'clockextra') return [
      { id: 'cpos', title: 'Clock position', horizontal: true, items: options('cpos', ['left', 'center'], S.c.layout === 'list') },
      { id: 'cextra', title: 'Show', horizontal: true, items: options('cweather', ['on']).concat(NOWPLAYING ? options('cplaying', ['on']) : []), reason: clockExtraNote() },
      { id: 'wunit', title: 'Temperature', horizontal: true, items: options('wunit', ['c', 'f'], S.c.cweather !== 'on') }]
      .concat(NOWPLAYING && S.c.cplaying === 'on' && !S.playing.access ? [{ id: 'nowplaying', title: '', items: [{ action: 'nowplaying.access', label: 'Notification access', description: 'Let Shore see what’s playing' }] }]
        : [{ id: 'cdetails', title: 'Details', horizontal: true, items: options('wicon', ['on'], S.c.cweather !== 'on').concat(NOWPLAYING ? options('cwave', ['on'], S.c.cplaying !== 'on') : []) }]);
    if (t.group === 'display') return [
      { id: 'night', title: 'Night mode', horizontal: true, items: options('night', ['off', 'scheduled', 'always']) },
      { id: 'nhours', title: 'Night hours', horizontal: true, items: options('nhours', ['21-7', '22-6', '23-7'], S.c.night !== 'scheduled') },
      { id: 'ndim', title: 'Night dimming', horizontal: true, items: options('ndim', ['soft', 'medium', 'strong'], S.c.night === 'off') },
      { id: 'whenidle', title: 'When idle', items: [{ action: 'open.idle', label: idleSummary(), more: true }] }];
    if (t.group === 'idle') return [
      { id: 'saver', title: 'Screensaver', horizontal: true, items: options('saver', ['off', '5', '10', '15']),
        reason: S.c.saver !== 'off' ? 'Your photos, the clock and what’s playing. Any button wakes Shore.' : '' },
      { id: 'idle', title: 'Hide controls when idle', horizontal: true, items: options('idle', ['off', '1', '5']),
        reason: S.c.idle !== 'off' ? 'The clock and picture stay. Any button brings the controls back.' : '' },
      { id: 'saverstart', title: '', items: [{ action: 'open.saveropts', label: 'Screensaver options', description: saverSummary(), more: true }, { action: 'saver.start', label: 'Start the screensaver now' }] }];
    if (t.group === 'saveropts') return [
      { id: 'svsrc', title: 'Photos', horizontal: true, items: options('svsrc', ['like', 'every', 'builtin']) },
      { id: 'svlay', title: 'Arrangement', horizontal: true, items: options('svlay', ['mix', 'single', 'mosaic']) },
      { id: 'svtime', title: 'Each slide', horizontal: true, items: options('svtime', ['15', '30', '60']) },
      { id: 'svmore', title: '', items: [{ action: 'open.saverlook', label: 'Motion and clock', description: saverLookSummary(), more: true }] }];
    if (t.group === 'saverlook') return [
      { id: 'svmotion', title: 'Photo motion', horizontal: true, items: options('svmotion', ['drift', 'still']) },
      { id: 'svpos', title: 'Clock on the screensaver', horizontal: true, items: options('svpos', ['move', 'fixed']) },
      { id: 'svshow', title: 'Show', items: options('svclock', ['on']).concat(options('svdate', ['on'])).concat(NOWPLAYING ? options('svmusic', ['on']) : []),
        reason: 'With everything off, only the photos remain.' }];
    if (t.group === 'focus') return [
      { id: 'focus', title: 'Focus style', horizontal: true, items: options('focus', ['type', 'glass']) },
      { id: 'material', title: 'Material', horizontal: true, items: options('material', ['soft', 'frost', 'tint'], inactive),
        reason: inactive ? flat ? 'Materials are available with a Photo background.' : 'Choose Glass focus or the Dock layout to use materials.' : '' },
      { id: 'fmore', title: '', items: [{ action: 'open.focusmore', label: 'Colour and motion', description: [VALUE_NAMES[S.c.tint], VALUE_NAMES[S.c.motion]].map(T).join(', '), more: true }] }
    ];
    if (t.group === 'focusmore') return [
      { id: 'tint', title: 'Accent', horizontal: true, items: options('tint', ['none', 'warm', 'cool', 'rose', 'green'], flat) },
      { id: 'dglass', title: 'App row glass', horizontal: true, items: options('dglass', ['clear', 'default', 'solid'], flat || S.c.layout !== 'dock') },
      { id: 'isize', title: 'Icon size', horizontal: true, items: options('isize', ['small', 'default', 'large'], S.c.layout !== 'dock' || S.c.apps === 'text') },
      { id: 'motion', title: 'Background motion', horizontal: true, items: options('motion', ['still', 'drift'], flat),
        reason: flat ? 'Accent, glass and motion need a Photo background.' : S.c.motion === 'drift' ? 'The photo and its glass drift slowly together.' : '' }
    ];
    if (t.group === 'phone') return phoneSections(flat);
    if (t.group === 'updates') return updateSections();
    if (t.group === 'health') return healthSections();
    if (t.group === 'online' || t.group === 'unsplash' || t.group === 'animated') {
      var items = SOURCES.filter(function (o) { return o.page === t.group; }).map(function (o) { return choice('source', o.id, flat || o.key && !ONLINE_INFO[o.key]); });
      var missing = SOURCES.filter(function (o) { return o.page === t.group && o.key && !ONLINE_INFO[o.key]; }).map(function (o) { return o.key; });
      if (t.group === 'online') items = items.filter(function (item) { return item.value !== 'phone' || PHONE; }).concat([
        { action: 'open.unsplash', label: pageCount('unsplash', 'Unsplash themes'), more: true, disabled: flat },
        { action: 'open.animated', label: pageCount('animated', 'Animated wallpapers'), more: true, disabled: flat }]);
      return [{ id: 'source', title: '', compact: t.group === 'online', items: items,
        reason: flat ? 'Choose Photo in Background to use online wallpapers.' : sourceNote() || (missing.length ? keyNote(missing) : '') }];
    }
    if (t.group === 'rotation') return [{ id: 'mode', title: '', items: options('mode', MODES.map(function (m) { return m.id; }), flat),
      reason: flat ? 'Choose Photo in Background to use rotation.' : '' }];
    if (PARENT[t.group] && remotePage(t)) return remoteSections(t);
    return [{ id: 'samsung', title: '', items: [
      { action: 'samsung.home', label: TV.home, description: TV.homeLine },
      { action: 'samsung.settings', label: 'TV settings', description: 'Picture, sound and network settings' }
    ].concat(ANDROID ? [{ action: 'open.health', label: 'Setup and health', description: healthLine() }] : []).concat(UPDATE ? [{ action: 'open.updates', label: 'Shore updates', description: updateLine() }] : []).concat(REMOTE ? [{ action: 'samsung.remote', label: 'Remote buttons', description: S.remote.keys.length ? S.remote.keys.length + (S.remote.keys.length === 1 ? ' button assigned' : ' buttons assigned') : 'Reassign the app and TV buttons' }] : []) }];
  }
  function detailRows(t) {
    var rows = [[{ action: 'settings.back', label: parentName(t) }]];
    detailSections(t).forEach(function (section) {
      var enabled = section.items.filter(function (item) { return !item.disabled; });
      if (section.horizontal && enabled.length) rows.push(enabled);
      else enabled.forEach(function (item) { rows.push([item]); });
    });
    if (S.lookError) rows.push([{ action: 'settings.retry', label: 'Try again' }]);
    return rows;
  }
  function detailLocation(t) {
    var rows = detailRows(t), row = 0, column = 0;
    rows.forEach(function (items, r) { items.forEach(function (item, c) { if (item.action === t.f.action) { row = r; column = c; } }); });
    return { rows: rows, row: row, column: column, item: rows[row][column] };
  }
  function detailFocus(t, item, column) {
    t.f.action = item.action;
    if (item.action !== 'settings.back') S.detailFocus[t.group] = item.action;
    if (column !== undefined) t.f.column = column;
    if (item.axis) S.appearanceFocus = item.axis;
  }
  function applyRotation(value) {
    var c;
    if (S.c.bg !== 'photo') return;
    S.err = null; S.lookError = null;
    if (value === S.c.mode) return;
    c = next(S.c.home.slice(), S.c.recent.slice()); c.mode = value;
    if (!write(c, 'Wallpaper rotation')) S.lookError = { type: 'save', patch: { mode: value }, row: 'mode', transient: false };
  }
  function pageCount(page, label) { var n = SOURCES.filter(function (o) { return o.page === page && sourceOn(o.id); }).length; return n ? T(label) + ' · ' + n : label; }
  /* What rotates now, and what could not be reached. */
  function sourceNote() {
    var failed = String(ONLINE_INFO.failed || '').split(',').filter(function (id) { return id && sourceOn(id); }).map(function (id) { return T(sourceName(id)); });
    if (S.onlineStatus === 'loading') return ONLINE_STATUS.loading;
    if (failed.length) return T('Couldn’t reach') + ' ' + failed.join(', ') + '. ' + T('Shore tries again later.');
    return T('Rotating') + ' ' + rotationPool().length + ' ' + T('photos') + '.';
  }
  function keyNote(keys) {
    var names = keys.filter(function (k, i) { return keys.indexOf(k) === i; }).map(function (k) { return { unsplash: 'Unsplash', pexels: 'Pexels', klipy: 'Klipy' }[k]; });
    return names.join(' and ') + (names.length > 1 ? ' need API keys' : ' needs an API key') + ' when the app is built. See the README.';
  }
  /* OK on a source adds it to the rotation or takes it out; at least one source stays. */
  function applySource(value) {
    var c, list = sourceList(), i = list.indexOf(value);
    if (S.c.bg !== 'photo') return;
    S.err = null; S.lookError = null;
    if (i >= 0) { if (list.length === 1) { S.note = 'Keep at least one source.'; return; } list.splice(i, 1); }
    else list.push(value);
    c = next(S.c.home.slice(), S.c.recent.slice()); c.source = sourceCsv(list.join(','));
    if (!write(c, 'Wallpaper sources')) return;
    S.note = '';
    if (ONLINE) { S.onlineStatus = c.source.split(',').some(function (id) { return id !== 'builtin'; }) ? 'loading' : ''; ONLINE.select(c.source, false); }
    keepWallInRotation(); syncRotation();
  }
  /* When the shown wallpaper leaves the rotation, the first photo that rotates takes its place. */
  function keepWallInRotation() {
    var w = wall(S.c.wall), pool = rotationPool();
    if (w && inRotation(w) || !pool.length) return;
    if (S.pending) { setTimeout(keepWallInRotation, 600); return; } // a wallpaper is still loading; try once it settled
    setLook({ wall: pool[0].id }, { row: 'bg' });
  }
  /* New online photos replace the previous set in the gallery; the first new photo is shown after a source change. */
  function onlineChanged(entries, status) {
    var i, ids = [];
    S.onlineStatus = status === 'off' ? '' : status;
    if (entries) {
      for (i = WALLS.length - 1; i >= 0; i--) if (WALLS[i].online) WALLS.splice(i, 1);
      entries.forEach(function (w) { if (w && safeId(w.id) && !wall(w.id)) { WALLS.push(w); ids.push(w.id); } });
      if (!wall(S.c.wall)) setLook({ wall: (rotationPool()[0] || WALLS[0]).id }, { row: 'bg' });
      else keepWallInRotation();
    }
    if (ONLINE) ONLINE_INFO.failed = ONLINE.info().failed || '';
    render(); syncRotation();
  }
  /* The photos that rotate: those from the chosen sources. While online photos are still downloading, Shore's own fill in. */
  function rotationPool() {
    var pool = WALLS.filter(inRotation), builtin = WALLS.filter(function (w) { return !w.online; });
    return pool.length ? pool : builtin.filter(function (w) { return !isHidden(w); }).length ? builtin.filter(function (w) { return !isHidden(w); }) : builtin;
  }
  function detailBack() { cancelLook(); S.err = null; pop(); }
  function detailOk(t, item) {
    var patch = {}, error = S.lookError;
    if (item.action === 'settings.back') { detailBack(); return; }
    if (item.disabled || S.pending) return;
    if (item.action === 'samsung.remote') { openRemote(); return; }
    if (item.action === 'remote.learn') { startLearn(); return; }
    if (item.action === 'remote.service') { perform('Accessibility settings', REMOTE.openSettings); return; }
    if (item.action.indexOf('remote.key.') === 0) { openRemotePick(S.remote.keys[+item.action.slice(11)]); return; }
    if (item.action === 'remote.apps') { push({ id: 'appearance', group: 'remoteapp', key: t.key, f: { action: '' } }); return; }
    if (item.remote) { assignRemote(t, item.remote); return; }
    if (item.action === 'settings.retry') {
      if (error && error.patch[error.row] !== undefined) detailFocus(t, choice(error.row, error.patch[error.row]), 0);
      if (error && error.row === 'mode') applyRotation(error.patch.mode);
      else if (error) setLook(error.patch, { row: error.row });
    } else if (item.axis === 'mode') applyRotation(item.value);
    else if (item.axis === 'source') applySource(item.value);
    else if (item.axis === 'layout') setLook({ layout: item.value === 'list' ? 'list' : 'dock', lstyle: item.value === 'shelf' ? 'shelf' : 'glass' }, { row: 'layout' });
    else if (TOGGLES.indexOf(item.axis) >= 0) { patch[item.axis] = S.c[item.axis] === 'on' ? 'off' : 'on'; setLook(patch, { row: item.axis }); }
    else if (item.axis) { patch[item.axis] = item.value; setLook(patch, { row: item.axis }); }
    else if (item.action === 'background.wallpaper') openWallpaper();
    else if (item.action === 'background.rotation') openAppearance('rotation');
    else if (item.action === 'background.online') openAppearance('online');
    else if (item.action === 'typography.fonts') openAppearance('fonts');
    else if (item.action === 'open.unsplash') openAppearance('unsplash');
    else if (item.action === 'open.animated') openAppearance('animated');
    else if (item.action === 'open.clockextra') openAppearance('clockextra');
    else if (item.action === 'open.idle') openAppearance('idle');
    else if (item.action === 'open.saveropts') openAppearance('saveropts');
    else if (item.action === 'open.saverlook') openAppearance('saverlook');
    else if (item.action === 'open.focusmore') openAppearance('focusmore');
    else if (item.action === 'open.bgmore') openAppearance('bgmore');
    else if (item.action === 'open.health') openHealth();
    else if (item.action === 'health.remote') perform('Accessibility settings', REMOTE.openSettings);
    else if (item.action === 'health.phone') openPhone();
    else if (item.action === 'open.updates') { S.update = UPDATE.info(); openAppearance('updates'); }
    else if (item.action === 'update.check') UPDATE.check();
    else if (item.action === 'update.install') UPDATE.install();
    else if (item.action === 'update.auto') { UPDATE.auto(!S.update.auto); S.update = UPDATE.info(); }
    else if (item.action === 'saver.start') startSaver();
    else if (item.action === 'phone.toggle') { PHONE.enable(!S.phone.enabled); S.phone = PHONE.info(); }
    else if (item.action === 'phone.forget') { PHONE.forget(); S.phone = PHONE.info(); S.note = 'Paired phones forgotten. Scan the new code.'; }
    else if (item.action === 'phone.clear') openMessage('clearphotos'); // never delete photos on a single press
    else if (item.action === 'nowplaying.access') perform('Notification access', NOWPLAYING.openSettings);
    else if (item.action === 'samsung.home') perform(TV.home, FrameDevice.home);
    else if (item.action === 'samsung.settings') perform('TV settings', FrameDevice.settings);
  }
  V.appearance = {
    norm: function (t) {
      var rows = detailRows(t), exists = false, applied = null;
      var axis = { background: 'bg', layout: 'layout', typography: 'tweight', focus: 'focus', rotation: 'mode', online: 'source', unsplash: 'source', animated: 'source', fonts: 'font', clock: 'cformat', display: 'night' }[t.group];
      rows.forEach(function (items) { items.forEach(function (item) {
        if (item.action === t.f.action) exists = true;
        if (axis ? item.axis === axis && item.value === S.c[axis] : item.applied) applied = item;
      }); });
      // Updates: the top row changes action (check, install, wait), so focus stays on it rather than on the toggle.
      if (!exists) detailFocus(t, t.group === 'updates' || t.group === 'health' ? (rows[1] || rows[0])[0] : applied || (rows[1] || rows[0])[0], 0);
      if (t.f.column === undefined) t.f.column = detailLocation(t).column;
    },
    key: function (t, k) {
      var at = detailLocation(t), row = at.row, column = at.column;
      if (t.group === 'remote' && S.remote.learning) { stopLearn(); return; }
      if (k === 'back') { detailBack(); return; }
      if (k === 'ok') { detailOk(t, at.item); return; }
      if (k === 'up' || k === 'down') {
        row = clamp(row + (k === 'up' ? -1 : 1), 0, at.rows.length - 1);
        column = Math.min(t.f.column || 0, at.rows[row].length - 1);
        detailFocus(t, at.rows[row][column]);
      } else if (k === 'left' || k === 'right') {
        column = clamp(column + (k === 'left' ? -1 : 1), 0, at.rows[row].length - 1);
        detailFocus(t, at.rows[row][column], column);
      }
    },
    point: function (t, z, i, action) {
      if (z !== 'detail') return;
      detailRows(t).some(function (items) { return items.some(function (item, column) {
        if (item.action !== action) return false;
        detailFocus(t, item, column); detailOk(t, item); return true;
      }); });
    }
  };
  function messageContent(t) { return t.content || MSG[t.msg]; }
  V.message = {
    sheet: true,
    key: function (t, k) {
      var A = messageContent(t).actions, a;
      if (k === 'left') t.f.b = Math.max(0, t.f.b - 1);
      else if (k === 'right') t.f.b = Math.min(A.length - 1, t.f.b + 1);
      else if (k === 'back') pop();
      else if (k === 'ok') { a = A[t.f.b][0]; pop(); if (a.indexOf('input:') === 0) { clearTimeout(askTimer); launch(a.slice(6)); } else if (a === 'setup') openHealth(); else if (a === 'samsung') perform(TV.home, FrameDevice.home); else if (a === 'clearphotos' && PHONE) { PHONE.clear(); S.phone.count = 0; render(); } }
    },
    point: function (t, z, i) { if (z === 'act') { t.f.b = i; this.key(t, 'ok'); } }
  };

  /* ---------- Dispatch ---------- */
  function norm() { var t = top(), v = V[t.id]; if (v.norm) v.norm(t); }
  function press(k) {
    norm();
    var t = top();
    V[t.id].key(t, k);
    norm();
    render();
    syncRotation();
  }

  /* ---------- Rendering ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var stage = $('stage'), homeEl = $('home'), caption = $('caption'), utilsEl = $('utils');
  var utilFocusLabel = $('utilFocusLabel'), utilFocusKey = '', appFocusName = $('appFocusName');
  var dock = $('dock'), shelf = $('shelf'), track = $('track'), plate = $('plate'), matScrim = $('matScrim'), dockEmpty = $('dockEmpty');
  var cueL = $('cueL'), cueR = $('cueR'), dockAction = $('dockAction');
  var focusStatus = $('focusStatus'), sceneEl = $('scene'), appearanceEl = $('appearance'), appearanceRows = $('appearanceRows'), appearanceDesc = $('appearanceDesc');
  var appearanceBack = $('appearanceBack'), appearanceTitle = $('appearanceTitle'), appearanceStatus = $('appearanceStatus');
  var phScene = $('phScene'), phPlate = $('phPlate'), phField = $('phField'), phList = $('phList'), phRows = $('phRows'), phAction = $('phAction'), phEmpty = $('phEmpty');
  var phPlates = [phPlate, $('phPlateAlt')], phFields = [phField, $('phFieldAlt')], photoPlateIndex = 0, photoPlateKey = null;
  var utPlates = [$('utLens'), $('utLensAlt')], utFields = [$('utField'), $('utFieldAlt')], utPlateIndex = 0, utPlateKey = null;
  var photoMode = null, photoTransitionToken = 0;
  var sheetEl = $('sheet'), sheetView = $('sheetView');
  var IMG = { photo: $('photo'), mat: $('matImg'), bg: $('sheetBg'), field: $('phFieldImg'), fieldAlt: $('phFieldImgAlt'), utility: $('utFieldImg'), utilityAlt: $('utFieldImgAlt') };
  var sheetKey = '', slotEls = {}, dockEdgeFrame = 0, dockEdgeUntil = 0, dockAnchorCenter = 960;
  var appliedPalette = null, appliedPhoto = null, appliedFont = null, appliedFontMetrics = null;

  /* Curated locked palettes keep the existing rendering path exactly. */
  function applyAdaptiveInk(palette) {
    var active = S.c.bg === 'photo' && palette && !palette.locked && palette.light && palette.tl && palette.tr && palette.br;
    if (appliedPalette === palette && appliedPhoto === (S.c.bg === 'photo')) return !!active;
    appliedPalette = palette; appliedPhoto = S.c.bg === 'photo';
    ['tl', 'tr', 'br'].forEach(function (zone) {
      var r = active ? palette[zone] : null;
      var values = r ? { ink: r.ink, 'clock-ink': r.clockInk || r.ink, 'rest-ink': r.restInk, 'peer-ink': r.peerInk, rest: r.restAlpha, peer: r.peerAlpha, under: r.halo, shadow: r.shadow } : {};
      ['ink', 'clock-ink', 'rest-ink', 'peer-ink', 'rest', 'peer', 'under', 'shadow'].forEach(function (key) {
        var name = '--' + zone + '-' + key, value = values[key];
        if (value !== undefined && value !== null) stage.style.setProperty(name, String(value));
        else stage.style.removeProperty(name);
      });
    });
    if (active && palette.light) stage.style.setProperty('--home-app-ink', palette.light);
    else stage.style.removeProperty('--home-app-ink');
    return !!active;
  }
  function inkRungClasses(palette, active) {
    if (!active) return '';
    return ['tl', 'tr', 'br'].map(function (zone) {
      var rung = palette[zone].rung;
      return ['light', 'mist', 'mist-high', 'dark', 'dark-halo'].indexOf(rung) >= 0 ? ' ink-' + zone + '-' + rung : '';
    }).join('');
  }
  /* Drift: every photo-registered layer runs one animation with a phase taken from the wall clock,
     so the photo and its pre-rendered glass stay aligned whenever a layer is (re)created. */
  var DRIFT_MS = 90000, driftPausedAt = 0, driftOffset = 0;
  /* Animations run only on Home: Settings and other panels freeze them to keep the TV responsive.
     Drift uses a virtual clock that stops while paused, so layers created meanwhile stay in phase. */
  /* Night mode: dims the photo, video and glass together (one brightness filter) and softens the text. */
  function nightActive() {
    if (S.c.night === 'always') return true;
    if (S.c.night !== 'scheduled') return false;
    var p = S.c.nhours.split('-'), from = +p[0], to = +p[1], h = new Date().getHours();
    return from > to ? h >= from || h < to : h >= from && h < to;
  }
  var idleTimer = 0;
  function idleReset() {
    clearTimeout(idleTimer);
    if (S.idleHidden) { S.idleHidden = false; render(); }
    idleTimer = S.c.idle === 'off' ? 0 : setTimeout(function () { idleTimer = 0; if (S.c.idle !== 'off' && top().id === 'home' && !document.hidden) { S.idleHidden = true; render(); } }, +S.c.idle * QA.minuteMs);
  }
  function animationsPaused() { return document.hidden || top().id !== 'home' || S.saver; }
  function driftNow() { return (driftPausedAt || Date.now()) - driftOffset; }
  function syncPause() {
    var paused = animationsPaused();
    if (paused && !driftPausedAt) driftPausedAt = Date.now();
    else if (!paused && driftPausedAt) { driftOffset += Date.now() - driftPausedAt; driftPausedAt = 0; }
    return paused;
  }
  /* Animated wallpapers: a muted loop above the still poster; the pre-rendered glass uses the poster. */
  var VIDEO = document.createElement('video');
  VIDEO.className = 'photo-video'; VIDEO.muted = true; VIDEO.loop = true; VIDEO.setAttribute('playsinline', ''); VIDEO.setAttribute('aria-hidden', 'true');
  VIDEO._src = '';
  VIDEO.addEventListener('playing', function () { VIDEO.className = 'photo-video is-playing'; });
  /* Animated GIFs from the phone play in an image above the poster, only while Home is in front. */
  var GIF = document.createElement('img');
  GIF.className = 'photo-video'; GIF.alt = ''; GIF.setAttribute('aria-hidden', 'true'); GIF._src = '';
  GIF.addEventListener('load', function () { if (GIF._src) GIF.className = 'photo-video is-playing'; });
  function animated(w) { return !!(w && (w.video || w.gif)); }
  function syncGif(shown) {
    var src = S.c.bg === 'photo' && shown && shown.gif && !animationsPaused() ? shown.gif : '';
    if (!GIF.parentNode && IMG.photo.parentNode) IMG.photo.parentNode.insertBefore(GIF, IMG.photo.nextSibling);
    if (GIF._src === src) return;
    GIF._src = src; GIF.className = 'photo-video';
    if (src) GIF.src = src; else GIF.removeAttribute('src');
  }
  function syncVideo(shown) {
    syncGif(shown);
    if (PHONE && shown && shown.id !== phoneWall) { phoneWall = shown.id; PHONE.wallpaper(shown.id); }
    var src = S.c.bg === 'photo' && shown && shown.video ? shown.video : '';
    if (!VIDEO.parentNode && IMG.photo.parentNode) IMG.photo.parentNode.insertBefore(VIDEO, IMG.photo.nextSibling);
    if (VIDEO._src !== src) {
      VIDEO._src = src; VIDEO.className = 'photo-video';
      if (src) VIDEO.src = src; else { VIDEO.removeAttribute('src'); VIDEO.load(); }
    }
    if (src && !animationsPaused() && VIDEO.paused) { var played = VIDEO.play(); if (played && played.catch) played.catch(function () { }); }
    if ((!src || animationsPaused()) && !VIDEO.paused) VIDEO.pause();
  }
  function syncDrift() {
    var on = S.c.motion === 'drift' && S.c.bg === 'photo' && !animated(wall(S.c.wall));
    Array.prototype.forEach.call(stage.querySelectorAll('.photo,.mat-img,.ph-field-img'), function (el) {
      if (!on) { if (el._drift) { el._drift = false; el.style.animationDelay = ''; } return; }
      if (!el._drift) { el._drift = true; el.style.animationDelay = (-(driftNow() % (2 * DRIFT_MS))) + 'ms'; }
    });
  }
  function render() {
    var t = top(), sheet = !!V[t.id].sheet, shown = wall(S.shown ? S.shown.wall : S.c.wall), np = npArt(), palette = np ? null : ADAPTIVE_INK[shown.id];
    var adaptive = applyAdaptiveInk(palette), tr = np ? 'light' : adaptive && palette.tr ? palette.tr.pol : shown.ut.tr, br = np ? 'light' : adaptive && palette.br ? palette.br.pol : shown.ut.br;
    stage.className = 'stage bg-' + S.c.bg + ' l-' + S.c.layout + ' v-' + S.variant + ' m-' + (materialApplies() ? S.c.material : 'none') + ' f-' + S.c.focus + ' a-' + S.c.apps + ' u-' + S.c.controls + ' g-' + S.geom + ' tone-' + (np ? 'dark' : shown.tone) + ' tr-' + tr + ' br-' + br + wallClasses(shown) + inkRungClasses(palette, adaptive) + ' at-' + t.id + ' font-' + homeFont() + (homeFont() !== 'manrope' ? ' font-custom' : '') + (S.fontSwitch ? ' is-font-switch' : '') + (adaptive ? ' has-adaptive-ink adaptive-tl-' + palette.tl.pol : '') + (!adaptive && !np && shown.clockInk ? ' has-clock-ink' : '') + (!adaptive && !np && shown.dockClockInk ? ' has-dock-clock-ink' : '') + (np ? ' has-np-art' : '') + (S.saver ? ' is-saver' : '') + (registeredMaterial(shown.id) ? ' registered-material' : '') + (sheet ? ' is-sheet' : '') + (S.reflow ? ' is-reflow' : '') + ' mo-' + (S.c.bg === 'photo' && !animated(shown) ? S.c.motion : 'still') + (syncPause() ? ' anim-paused' : '') + (nightActive() ? ' is-night nd-' + S.c.ndim : '') + (S.idleHidden && top().id === 'home' ? ' is-idle' : '')
      + ' ls-' + (isShelf() ? 'shelf' : 'glass') + ' cs-' + S.c.csize + ' cw-' + S.c.cweight + ' tw-' + S.c.tweight + ' ts-' + S.c.tsize
      + ' cp-' + S.c.cpos + ' tint-' + S.c.tint + ' dg-' + S.c.dglass + ' is-' + S.c.isize + ' npd-' + S.c.npdim;
    if (!adaptive && !np && shown.clockInk) stage.style.setProperty('--clock-ink', shown.clockInk);
    else stage.style.removeProperty('--clock-ink');
    if (!adaptive && !np && shown.dockClockInk) stage.style.setProperty('--dock-clock-ink', shown.dockClockInk);
    else stage.style.removeProperty('--dock-clock-ink');
    applyHomeFont();
    if (!sheet) renderHome(t);
    renderTopShelf(t, sheet);
    renderSheet(t, sheet);
    renderAppearance(t);
    renderFocusStatus(t);
    syncDrift();
    syncVideo(shown);
    syncNpArt();
    if (!S.saver && !saverTimer !== !saverDelay() && !document.hidden) saverReset(); // the delay was switched on or off
    publishCompanion();
  }

  function applyHomeFont() {
    var id = homeFont(), f = FONTS[id], primary = fontRole(id, 'primary'), ui = fontRole(id, 'ui'), metrics = fontMetrics[id];
    if (appliedFont === id && appliedFontMetrics === metrics) return;
    appliedFont = id; appliedFontMetrics = metrics;
    var values = { 'display-family': '"' + f.family + '"', 'ui-family': '"' + ui.family + '"', 'primary-family': '"' + primary.family + '"', 'display-weight': f.display, 'ui-weight': ui.weight, 'primary-weight': primary.weight, 'clock-weight': f.clock,
      'clock-shift': px(fontShift('clock', 48)), 'utility-shift': px(fontShift('ui', 28)), 'action-shift': px(fontShift('ui', 30)), 'heading-shift': px(fontShift('ui', 48)), 'full-name-shift': px(fontShift('primary', 30)), 'clock-digit': px(metrics ? metrics.digitCell : 0) };
    Object.keys(values).forEach(function (key) { homeEl.style.setProperty('--font-' + key, String(values[key])); });
  }

  function homeState(t) {
    var h = visibleHome(), hs = { mode: 'browse', zone: null, i: Math.max(0, ensureSel()), u: -1, lifted: false, from: -1, arr: null, items: h.map(function (id) { return { key: id, kind: 'app', id: id }; }) };
    if (isSettingsDetail(t)) hs.zone = 'preview';
    else if (t.id === 'home') { hs.zone = t.f.zone; hs.u = t.f.u; hs.n = t.f.n || 0; }
    return hs;
  }

  function renderHome(t) {
    var hs = homeState(t);
    renderCaption(t, hs);
    renderUtils(hs);
    renderInputRow(hs);
    if (S.c.layout === 'list') renderList(hs);
    else { photoMode = null; renderDock(hs); }
    renderAppFocusName(hs);
  }

  function clockText() {
    var d = new Date(), h = S.c.cformat === '24' ? d.getHours() : d.getHours() % 12 || 12, m = d.getMinutes();
    var sec = d.getSeconds();
    return (S.c.cformat === '24' && h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + (S.c.csec === 'on' ? ':' + (sec < 10 ? '0' : '') + sec : '');
  }
  function dateText() {
    try { return new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }); } catch (e) { return new Date().toDateString(); }
  }
  function clockHtml() {
    var text = clockText(), metrics = fontMetrics[homeFont()];
    if (!metrics || !metrics.digitCell) return text;
    return text.replace(/[0-9]/g, function (digit) { return '<span class="clock-digit">' + digit + '</span>'; });
  }
  function renderCaption(t, hs) {
    var html = '<span class="clock">' + clockHtml() + '</span>' + clockExtras();
    if (S.c.apps !== 'icons' && hs.items[hs.i] && (S.c.layout === 'list' ? photoLabel(hs.items[hs.i].id, false).size < 88 || photoLabel(hs.items[hs.i].id, false).ellipsis : hs.zone === 'apps' && reducedDockLabel(hs.items[hs.i].id))) html += '<span class="cap-line full-name">' + esc(app(hs.items[hs.i].id).name) + '</span>';
    setHTML(caption, html);
  }

  function utilBtn(z, i, action, inner, extra, name) {
    return '<button type="button" tabindex="-1" class="u' + (extra || '') + '" data-z="' + z + '" data-i="' + i + '" data-action="' + action + '" aria-label="' + esc(name) + '"><span class="u-content">' + inner + '</span></button>';
  }
  function renderUtils(hs) {
    var html = '', style = hs.mode === 'arrange' && S.c.controls !== 'text' ? 'both' : S.c.controls;
    var iconsOnly = style === 'icons', U = utils(), focused = null;
    utilsEl.className = 'utils quiet-utils is-' + style + (hs.zone === 'util' || hs.zone === 'ctl' ? ' is-awake' : '');
    U.forEach(function (u, i) { html += utilBtn('util', i, 'util.' + u, icon(UTIL[u][1], '', true) + '<span class="u-label">' + esc(UTIL[u][0]) + '</span>', '', T(UTIL[u][0])); });
    setHTML(utilsEl, html);
    Array.prototype.forEach.call(utilsEl.querySelectorAll('.u'), function (b) {
      var z = b.getAttribute('data-z'), focus = hs.zone === z && hs.u === Number(b.getAttribute('data-i'));
      b.className = b.className.replace(/\s+is-focus/g, '') + (focus ? ' is-focus' : '');
      if (focus) focused = b;
    });
    renderUtilFocusLabel(iconsOnly ? focused : null);
    renderUtilityLens(focused, iconsOnly);
  }
  var inputRowEl = document.createElement('div');
  inputRowEl.id = 'inputRow';
  utilsEl.parentNode.insertBefore(inputRowEl, utilsEl.nextSibling);
  /* Own-row inputs: quiet controls above the dock, focused with Up from the apps. */
  function renderInputRow(hs) {
    var html = '', on = inputRow() && hs.mode === 'browse', style = S.c.controls;
    inputRowEl.className = 'utils quiet-utils input-row is-' + style + (on && hs.zone === 'input' ? ' is-awake' : '') + (on ? '' : ' is-off');
    if (on) LIVE.forEach(function (id, i) {
      html += utilBtn('input', i, 'home.input.' + id, icon('input', '', true) + '<span class="u-label">' + esc(app(id).name) + '</span>', hs.zone === 'input' && hs.n === i ? ' is-focus' : '', app(id).name);
    });
    setHTML(inputRowEl, html);
    if (on && hs.zone === 'input') renderUtilityLens(inputRowEl.querySelector('.u.is-focus'), style === 'icons');
  }
  function renderUtilFocusLabel(button) {
    var text, key, r, sr, scale, width, x;
    if (!button) { utilFocusLabel.className = 'util-focus-label'; utilFocusKey = ''; return; }
    text = S.err ? 'Not saved. OK tries again.' : button.getAttribute('aria-label');
    key = button.getAttribute('data-action') + '|' + text + '|' + homeFont();
    if (key !== utilFocusKey) {
      utilFocusLabel.className = 'util-focus-label'; utilFocusLabel.textContent = T(text);
      utilFocusLabel.offsetWidth;
      utilFocusKey = key;
    }
    r = button.getBoundingClientRect(); sr = sceneEl.getBoundingClientRect(); scale = sr.width / 1920 || 1;
    width = Math.ceil(textWidth(text, 28, 500, -.2) + 8); x = (r.left + r.width / 2 - sr.left) / scale - width / 2;
    if (S.c.layout === 'list') x = 1730 - width;
    utilFocusLabel.style.width = width + 'px'; utilFocusLabel.style.left = clamp(x, 112, 1808 - width) + 'px';
    utilFocusLabel.style.top = ((S.c.layout === 'list' ? (r.top + r.height / 2 - sr.top) / scale - 19 : 140) + fontShift('ui', 28)) + 'px';
    utilFocusLabel.className = 'util-focus-label is-on';
  }
  function renderUtilityLens(button, iconsOnly) {
    var r, label, sr, scale, x, y, width, key, el;
    if (!button || S.c.focus !== 'glass') {
      utPlates.forEach(function (plateEl) { plateEl.className = 'ph-plate ut-lens is-outgoing'; });
      utPlateKey = null;
      return;
    }
    r = button.getBoundingClientRect(); sr = sceneEl.getBoundingClientRect(); scale = sr.width / 1920 || 1;
    y = (r.top - sr.top) / scale + 2;
    if (S.c.layout === 'list') {
      label = iconsOnly ? utilFocusLabel : button.querySelector('.u-label');
      x = (label.getBoundingClientRect().left - sr.left) / scale - 24;
      width = 1800 - x;
    } else {
      // Dock icons keep a fixed lens; the separate caption cannot overlap its neighbours.
      x = (r.left - sr.left) / scale; width = r.width / scale;
    }
    key = button.getAttribute('data-action') + '|' + x + '|' + y + '|' + width;
    if (key !== utPlateKey) {
      utPlates[utPlateIndex].className = 'ph-plate ut-lens is-outgoing';
      utPlateIndex = 1 - utPlateIndex; el = utPlates[utPlateIndex];
      el.className = 'ph-plate ut-lens is-preparing';
      el.style.width = width + 'px'; el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      fieldTransform(utFields[utPlateIndex], x, y, width, 60);
      el.offsetWidth;
      utPlateKey = key;
    }
    fieldTransform(utFields[utPlateIndex], x, y, width, 60);
    utPlates[utPlateIndex].className = 'ph-plate ut-lens is-current on-focus';
  }
  function renderAppFocusName(hs) {
    var it = hs.items[hs.i], width, x, y, placement;
    if (S.c.apps !== 'icons' || hs.mode !== 'browse' || hs.zone !== 'apps' || !it) { appFocusName.className = 'app-focus-name'; return; }
    appFocusName.textContent = app(it.id).name;
    width = Math.min(S.c.layout === 'list' ? 1056 : 1640, Math.ceil(textWidth(app(it.id).name, S.c.layout === 'list' ? 40 : 36, 500, -.6, 'primary') + 8));
    appFocusName.style.width = width + 'px';
    if (S.c.layout === 'list') {
      x = 280; placement = phFields[photoPlateIndex]._placement;
      y = placement.y + placement.height / 2 - 24;
    } else {
      x = clamp(dockAnchorCenter - width / 2, 140, 1780 - width); y = 932;
    }
    appFocusName.style.left = x + 'px'; appFocusName.style.top = (y + fontShift('primary', S.c.layout === 'list' ? 40 : 36)) + 'px';
    appFocusName.className = 'app-focus-name is-on';
  }

  function dockGeom(n) {
    var m = DOCK_MODES[isShelf() ? 'shelf' : S.c.apps], vis = Math.max(1, Math.min(5, n)), shelfW = vis * m.pitch - 8, w = shelfW + 32;
    var broad = S.geom === 'broad' && n > 5;
    if (n < 0) { w = 912; shelfW = 880; }
    else if (broad) { w = 1728; shelfW = 1696; }
    return { x: Math.round((1920 - w) / 2), y: shelfLifted() ? SHELF_ROW_Y : 908 - m.th - 32, h: m.th + 32, w: w, shelf: shelfW, vis: vis, broad: broad, empty: n < 0, tw: m.tw, th: m.th, pitch: m.pitch };
  }
  /* Five centred: the window moves one tile when focus passes an edge. Broad: keep a
     148px glimpse of the neighbour, as the current dock does. */
  function dockOffset(n, i, g) {
    var off, left, first, glimpse = g.tw / 2;
    if (g.broad) {
      off = scroll.off * g.pitch; left = i * g.pitch;
      if (left - off < (i > 0 ? glimpse : 0)) off = left - (i > 0 ? glimpse : 0);
      if (left + g.tw - off > g.shelf - (i < n - 1 ? glimpse : 0)) off = left + g.tw - g.shelf + (i < n - 1 ? glimpse : 0);
      off = clamp(off, 0, Math.max(0, n * g.pitch - 8 - g.shelf));
      if (!S.reflow) { scroll.off = off / g.pitch; scroll.first = Math.round(scroll.off); }
      return off;
    }
    first = clamp(scroll.first, 0, Math.max(0, n - g.vis));
    if (i < first) first = i;
    if (i > first + g.vis - 1) first = i - g.vis + 1;
    if (!S.reflow) { scroll.first = first; scroll.off = first; }
    return first * g.pitch;
  }
  /* Shelf: Android TV banner cards (tvOS-style); apps without a banner and inputs get a frosted card with their mark. */
  function shelfTileHtml(a) {
    var pkg = !a.input && FrameDevice.packageOf ? FrameDevice.packageOf(a.appId) : null;
    return '<span class="card' + (pkg ? '' : ' no-art') + '">' + (pkg ? '<img class="card-art" alt="" src="/appbanner/' + esc(pkg) + '.png" onerror="this.parentNode.className=\'card no-art\'">' : '')
      + '<span class="card-mark">' + appMark(a, 120, 72, 58) + '</span></span>'
      + '<span class="label"><span class="label-ink">' + esc(a.name) + '</span></span>';
  }
  function dockTileHtml(it, full) {
    var a, body;
    if (it.kind !== 'add' && isShelf() && app(it.id)) return shelfTileHtml(app(it.id));
    if (it.kind === 'add') return '<span class="add">' + icon('plus') + '</span><span class="label">' + (full ? 'Home is full' : 'Add app') + '</span>';
    a = app(it.id);
    body = S.c.apps === 'text' ? '' : appMark(a, S.c.apps === 'icons' ? 136 : 120, S.c.apps === 'icons' ? 88 : 72, S.c.apps === 'icons' ? 72 : 58);
    return body + (S.c.apps === 'icons' ? '' : '<span class="label" style="font-size:' + dockLabelSize(a.id) + 'px;top:' + ((S.c.apps === 'text' ? 28 : 128) + fontShift('primary', dockLabelSize(a.id))) + 'px"><span class="label-ink">' + esc(a.name) + '</span></span>') + '<span class="nudge nudge-l">' + icon('left') + '</span><span class="nudge nudge-r">' + icon('right') + '</span>';
  }
  /* A wide label can reach the shelf before its icon. Check the rendered icon box,
     including during the track's 180ms transition, so both disappear together. */
  function syncDockEdges() {
    var broad = S.c.layout === 'dock' && S.geom === 'broad', clip = shelf.getBoundingClientRect(), changes = [];
    Array.prototype.forEach.call(track.querySelectorAll('.tile'), function (tile) {
      var content = tile.querySelector(isShelf() ? '.card' : S.c.apps === 'text' ? '.label-ink' : '.mark'), r = content ? content.getBoundingClientRect() : null;
      var outside = broad && r && (r.right <= clip.left || r.left >= clip.right);
      var cls = tile.className.replace(/\s+is-outside-icon/g, '') + (outside ? ' is-outside-icon' : '');
      if (tile.className !== cls) changes.push({ tile: tile, cls: cls });
    });
    changes.forEach(function (change) { change.tile.className = change.cls; });
  }
  function trackDockEdges() {
    dockEdgeFrame = 0;
    if (S.c.layout !== 'dock' || S.geom !== 'broad') return;
    syncDockEdges();
    if (Date.now() < dockEdgeUntil) dockEdgeFrame = window.requestAnimationFrame(trackDockEdges);
  }

  /* ---------- Top Shelf (Shelf layout, Android shell) ----------
     The focused app's first recommendation (or its blurred TV banner) becomes the backdrop, and Down
     opens a row of its recommendations. Images arrive pre-rendered from TopShelf.java; nothing blurs here. */
  var SHELF = ANDROID && FrameDevice.topShelf ? FrameDevice.topShelf : null, shelfIndex = {}, shelfAsked = '';
  var SHELF_ROW_Y = 400, REC_LEFT = 140, REC_PITCH = 376, REC_VIEW = 1920 - 2 * REC_LEFT;
  var heroEl = document.createElement('div'), heroImgs = [document.createElement('img'), document.createElement('img')], heroFront = 0, heroSrc = '', heroTimer = 0;
  var heroText = document.createElement('div'), recsEl = document.createElement('div'), recsTrack = document.createElement('div'), recsTitle = document.createElement('div'), recsKey = '';
  heroEl.className = 'hero'; heroEl.setAttribute('aria-hidden', 'true');
  heroImgs.forEach(function (img) { img.className = 'hero-img'; img.alt = ''; heroEl.appendChild(img); });
  heroEl.appendChild(document.createElement('div')).className = 'hero-shade';
  IMG.photo.parentNode.insertBefore(heroEl, IMG.photo.parentNode.querySelector('.scrim')); // above photo and video, below the scrim
  IMG.photo.parentNode.insertBefore(npEl, heroEl); // album art: above the photo, below a Top Shelf hero
  heroText.className = 'hero-text'; heroText.setAttribute('aria-live', 'polite');
  recsEl.className = 'recs'; recsTrack.className = 'recs-track'; recsTitle.className = 'recs-title';
  recsEl.appendChild(recsTrack); recsEl.appendChild(recsTitle);
  homeEl.insertBefore(heroText, dock); homeEl.insertBefore(recsEl, dock);

  function cleanShelfIndex(index) {
    var out = {}, img = /^\/topshelf\/img\/[0-9a-f]+-(card|hero)\.jpg$/;
    Object.keys(index || {}).forEach(function (pkg) {
      var e = index[pkg], items = e && e.items && e.items.filter ? e.items.filter(function (it) {
        return it && typeof it.title === 'string' && img.test(it.card) && img.test(it.hero) && typeof (it.url || '') === 'string';
      }) : [];
      if (items.length) out[pkg] = { service: String(e.service || ''), items: items };
    });
    return out;
  }
  function shelfPkg(id) { var a = app(id); return a && !a.input && FrameDevice.packageOf ? FrameDevice.packageOf(a.appId) : null; }
  function recsFor(id) {
    var pkg = SHELF && isShelf() ? shelfPkg(id) : null, e = pkg ? shelfIndex[pkg] : null;
    return e ? { pkg: pkg, service: e.service, items: e.items } : null;
  }
  /* Stable layout: the row moves up once any Home app has recommendations, not per focused app. */
  function shelfLifted() { return !!SHELF && isShelf() && visibleHome().some(function (id) { return !!recsFor(id); }); }
  function requestShelf() {
    var pkgs = [];
    if (!SHELF || !isShelf()) return;
    visibleHome().forEach(function (id) { var p = shelfPkg(id); if (p && pkgs.indexOf(p) < 0) pkgs.push(p); });
    if (pkgs.join() === shelfAsked) return;
    shelfAsked = pkgs.join(); SHELF.request(pkgs);
  }
  /* Two images crossfade; the next one only shows once loaded, and fast scrolling settles first. */
  function showHero(src) {
    if (src === heroSrc) return;
    heroSrc = src; clearTimeout(heroTimer);
    heroEl.className = 'hero' + (src ? ' is-on' : '');
    if (!src) { heroImgs[0].className = heroImgs[1].className = 'hero-img'; return; }
    heroTimer = setTimeout(function () {
      var back = heroImgs[1 - heroFront], want = src;
      function swap() {
        if (heroSrc !== want) return;
        back.className = 'hero-img is-on'; heroImgs[heroFront].className = 'hero-img'; heroFront = 1 - heroFront;
      }
      back.onload = swap;
      back.onerror = function () { if (heroSrc === want) heroImgs[heroFront].className = 'hero-img'; };
      if (back.getAttribute('src') === want && back.complete) swap(); else back.src = want;
    }, 160);
  }
  function renderTopShelf(t, sheet) {
    var on = !!SHELF && isShelf() && !sheet && t.id === 'home' && !S.idleHidden, f = t.f || {};
    var zone = on && (f.zone === 'apps' || f.zone === 'recs') ? f.zone : null, R = zone ? recsFor(S.sel) : null;
    var r = R ? clamp(f.r || 0, 0, R.items.length - 1) : 0, item = R ? R.items[zone === 'recs' ? r : 0] : null, pkg = zone ? shelfPkg(S.sel) : null;
    var off = R ? clamp((r - 2) * REC_PITCH, 0, Math.max(0, R.items.length * REC_PITCH - 24 - REC_VIEW)) : 0, key;
    if (on) requestShelf();
    showHero(item ? item.hero : pkg ? '/topshelf/banner/' + pkg + '.jpg' : '');
    setHTML(heroText, item ? '<span class="hero-title">' + esc(item.title) + '</span><span class="hero-service">' + esc('Trending on ' + R.service) + '</span>' : '');
    heroText.className = 'hero-text' + (item ? ' is-on' : '');
    key = R ? R.pkg + '|' + R.items.map(function (it) { return it.card; }).join() : '';
    if (key !== recsKey) {
      recsKey = key;
      setHTML(recsTrack, R ? R.items.map(function (it, i) {
        return '<span class="rec" style="transform:translate3d(' + (i * REC_PITCH) + 'px,0,0)"><img alt="" src="' + esc(it.card) + '" onerror="this.style.visibility=\'hidden\'"></span>';
      }).join('') : '');
    }
    Array.prototype.forEach.call(recsTrack.childNodes, function (el, i) { el.className = 'rec' + (zone === 'recs' && i === r ? ' is-focus' : ''); });
    recsTrack.style.transform = 'translate3d(' + (-off) + 'px,0,0)';
    setHTML(recsTitle, zone === 'recs' && R ? '<span class="recs-name">' + esc(R.items[r].title) + '</span>' + (R.items[r].sub ? '<span class="recs-sub">' + esc(R.items[r].sub) + '</span>' : '') : '');
    recsTitle.style.transform = 'translate3d(' + (r * REC_PITCH - off) + 'px,0,0)';
    recsEl.className = 'recs' + (R ? ' is-on' : '') + (zone === 'recs' ? ' is-active' : '');
  }
  if (SHELF) {
    shelfIndex = cleanShelfIndex(SHELF.index());
    SHELF.onChange(function (index) {
      shelfIndex = cleanShelfIndex(index); recsKey = ''; // new files may replace images that failed to load
      if (heroImgs[0].className === heroImgs[1].className) heroSrc = '';
      render();
    });
  }

  function renderDock(hs) {
    var items = hs.items, n = items.length, empty = hs.mode !== 'arrange' && !n, g = dockGeom(empty ? -1 : n);
    var anchor = clamp(hs.i, 0, Math.max(0, n - 1)), off = empty ? 0 : dockOffset(n, anchor, g);
    var full = hs.arr ? live(hs.arr.slots).length >= CAP : false, ns = hs.arr ? hs.arr.slots.length : n;
    var tileFocus = hs.zone === 'apps' || hs.zone === 'tiles', tileSel = hs.zone === 'act' || hs.zone === 'ctl' || hs.zone === 'preview' || hs.zone === 'recs';
    var focusItem = items[anchor], s, ax, label, width;

    dock.className = 'dock' + (empty ? ' is-empty' : '');
    inputRowEl.style.left = (g.x + 2) + 'px'; inputRowEl.style.top = (g.y - 84) + 'px';
    dock.style.left = g.x + 'px'; dock.style.top = g.y + 'px'; dock.style.width = g.w + 'px'; dock.style.height = g.h + 'px';
    dock.style.setProperty('--tile-w', g.tw + 'px'); dock.style.setProperty('--tile-h', g.th + 'px'); dock.style.setProperty('--dock-h', g.h + 'px');
    dock.style.setProperty('--nudge-top', ((g.th - 48) / 2) + 'px');
    dockAnchorCenter = g.x + 16 + anchor * g.pitch - off + g.tw / 2;
    IMG.mat.style.left = (-g.x) + 'px'; IMG.mat.style.top = (-g.y) + 'px';
    IMG.mat.style.transformOrigin = '960px ' + (g.y + g.h / 2) + 'px';
    matScrim.style.left = (-g.x) + 'px'; matScrim.style.top = (SCRIM_Y - g.y) + 'px';
    matScrim.style.transformOrigin = '960px ' + (g.y + g.h / 2 - SCRIM_Y) + 'px';
    shelf.style.width = g.shelf + 'px';
    shelf.className = 'shelf' + (g.broad && off > 0 ? ' fade-l' : '') + (g.broad && off + g.shelf < n * g.pitch - 8 ? ' fade-r' : '');

    keyed(track, empty ? [] : items, function (el, it, i) {
      var a = it.id ? app(it.id) : null, left = i * g.pitch, focus = tileFocus && i === anchor, sel = tileSel && i === anchor;
      var lifted = hs.lifted && i === anchor, partial = g.broad && (left - off < -1 || left + g.tw - off > g.shelf + 1);
      setContent(el, it.kind + '|' + (it.id || '') + '|' + (it.id ? dockLabelSize(it.id) : full) + '|' + S.c.bg + '|' + S.c.apps + '|' + S.c.lstyle + '|' + homeFont(), '<span class="tile-content">' + dockTileHtml(it, full) + '</span>');
      el.className = 'tile k-' + it.kind + (focus ? ' is-focus' : '') + (sel ? ' is-sel' : '') + (lifted ? ' is-lifted' : '') + (partial ? ' is-partial' : '')
        + (a && !a.mark ? ' is-text' : '') + (it.kind === 'add' && full ? ' is-full' : '') + (it.kind === 'app' && S.press === it.id ? ' is-press' : '')
        + (lifted && i === 0 ? ' no-l' : '') + (lifted && i >= ns - 1 ? ' no-r' : '');
      el.style.transform = 'translate3d(' + left + 'px,0,0)';
      el.setAttribute('role', 'button');
      if (a) el.setAttribute('aria-label', a.name);
      if (hs.mode === 'arrange') attrs(el, 'tile', i, 'arrange.' + (it.kind === 'add' ? 'add' : (it.kind === 'ph' ? 'placeholder.' : 'tile.') + it.id));
      else attrs(el, 'app', i, 'home.app.' + it.id);
    });
    track.style.transform = 'translate3d(' + (-off) + 'px,0,0)';
    syncDockEdges();
    if (g.broad) {
      dockEdgeUntil = Date.now() + 220;
      if (!dockEdgeFrame) dockEdgeFrame = window.requestAnimationFrame(trackDockEdges);
    }
    plate.className = 'plate' + (!n || empty || hs.zone === null ? '' : hs.lifted ? ' on-lift' : tileFocus ? ' on-focus' : tileSel ? ' on-sel' : '');
    plate.style.transform = 'translate3d(' + (anchor * g.pitch) + 'px,0,0)';

    cueL.style.left = (g.x - 72) + 'px'; cueR.style.left = (g.x + g.w + 24) + 'px';
    cueL.style.top = cueR.style.top = (g.y + g.h / 2 - 24) + 'px';
    cueL.className = 'cue' + (!g.broad && !empty && scroll.first > 0 ? ' is-on' : '');
    cueR.className = 'cue' + (!g.broad && !empty && scroll.first + g.vis < n ? ' is-on' : '');

    ax = g.x + 16 + anchor * g.pitch - off;
    if (hs.mode === 'arrange' && !hs.lifted && (hs.zone === 'tiles' || hs.zone === 'act') && focusItem && focusItem.kind !== 'add') {
      s = hs.arr.slots[anchor];
      label = (s.removed ? 'Restore ' : 'Remove ') + app(s.id).name; width = actionWidth(label);
      ax = clamp(ax + (g.tw - width) / 2, 112, 1808 - width);
      setHTML(dockAction, '<span>' + esc(label) + '</span>');
      dockAction.className = 'dock-action is-on' + (hs.zone === 'act' ? ' is-focus' : '');
      dockAction.style.width = width + 'px';
      dockAction.style.transform = 'translate3d(' + ax + 'px,0,0)';
      attrs(dockAction, 'act', anchor, 'arrange.' + (s.removed ? 'restore.' : 'remove.') + s.id);
    } else {
      dockAction.className = 'dock-action';
      dockAction.removeAttribute('data-z'); dockAction.removeAttribute('data-action');
    }
    setHTML(dockEmpty, empty ? '<p>No apps on Home</p><button type="button" tabindex="-1" class="btn' + (hs.zone === 'empty' ? ' is-focus' : '') + '" data-z="empty" data-i="0" data-action="home.add-apps">' + icon('plus') + '<span>Add apps</span></button>' : '');
  }

  function photoModeTransition(compact) {
    if (photoMode !== null && photoMode !== compact) {
      var ghost = phScene.cloneNode(true), token = ++photoTransitionToken;
      ghost.removeAttribute('id'); ghost.setAttribute('aria-hidden', 'true');
      Array.prototype.forEach.call(ghost.querySelectorAll('[id],[data-action],[data-z]'), function (el) {
        el.removeAttribute('id'); el.removeAttribute('data-action'); el.removeAttribute('data-z');
      });
      ghost.className = 'ph-scene ph-ghost';
      phScene.parentNode.appendChild(ghost);
      phScene.className = 'ph-scene ph-incoming';
      setTimeout(function () {
        if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
        if (token === photoTransitionToken) phScene.className = 'ph-scene';
      }, 180);
    }
    photoMode = compact;
  }
  /* Each plate keeps a stationary, stage-registered field while its opacity changes.
     Reuse the hidden group for the next label; never animate plate width or position. */
  function renderPhotoPlate(id, width, height, y, state) {
    var key = id + '|' + width + '|' + height + '|' + y, plateEl, fieldEl;
    if (key !== photoPlateKey) {
      phPlates[photoPlateIndex].className = phPlates[photoPlateIndex].className.replace(' is-current', '') + ' is-outgoing';
      photoPlateIndex = 1 - photoPlateIndex;
      plateEl = phPlates[photoPlateIndex]; fieldEl = phFields[photoPlateIndex];
      plateEl.className = 'ph-plate is-preparing';
      plateEl.style.width = width + 'px'; plateEl.style.height = height + 'px';
      plateEl.style.transform = 'translate3d(0,' + y + 'px,0)';
      fieldTransform(fieldEl, 112, y, width, height);
      plateEl.offsetWidth; // Establish zero opacity before the incoming crossfade.
      photoPlateKey = key;
    }
    fieldTransform(phFields[photoPlateIndex], 112, y, width, height);
    phPlates[photoPlateIndex].className = 'ph-plate is-current' + (state ? ' ' + state : '');
  }
  function fieldTransform(el, x, y, width, height) {
    el._placement = { x: x, y: y, width: width, height: height };
    el.style.transformOrigin = (x + width / 2) + 'px ' + (y + height / 2) + 'px';
    el.style.transform = 'translate3d(' + (-x) + 'px,' + (-y) + 'px,0)' + (S.c.bg === 'photo' && S.c.material === 'tint' && !REDUCED_MOTION ? ' scale(1.04)' : '');
  }
  function renderList(hs) {
    var items = hs.items, n = items.length, compact = hs.mode === 'arrange', pitch = compact ? PH_COMPACT_PITCH : PH_PITCH;
    var anchor = clamp(hs.i, 0, Math.max(0, n - 1)), first, off, width, slot, y, s, label, aw, plateState;
    var rowFocus = hs.zone === 'apps' || hs.zone === 'tiles', remembered = hs.zone === 'act' || hs.zone === 'ctl' || hs.zone === 'preview';
    photoModeTransition(compact);
    if (compact) {
      first = clamp(scroll.photoArrange, anchor - 7, anchor - 1);
      first = clamp(first, 0, Math.max(0, n - PH_COMPACT_VISIBLE));
      scroll.photoArrange = first;
    } else {
      first = clamp(scroll.photo, anchor - 3, anchor - 1);
      first = clamp(first, 0, Math.max(0, n - PH_FULL));
      scroll.photo = first;
    }
    off = first * pitch; slot = anchor - first;
    width = items[anchor] ? listPlateWidth(items[anchor].id, compact) : 360;
    phList.className = 'ph-list' + (compact ? ' is-compact' : '');
    phList.style.height = PH_HEIGHT + 'px';
    phRows.style.top = (compact ? 72 : 148) + 'px';
    keyed(phRows, items, function (row, it, i) {
      var typography = photoLabel(it.id, compact), focus = rowFocus && i === anchor, lifted = hs.lifted && i === anchor, markImage, body = '';
      if (S.c.apps !== 'text') body += appMark(app(it.id), S.c.apps === 'icons' ? compact ? 64 : 88 : compact ? 60 : 84, S.c.apps === 'icons' ? compact ? 64 : 88 : compact ? 44 : 64, S.c.apps === 'icons' ? compact ? 52 : 72 : compact ? 42 : 54);
      if (S.c.apps !== 'icons') body += '<span class="ph-name" style="font-size:' + typography.size + 'px;top:' + typography.top + 'px">' + esc(app(it.id).name) + '</span>';
      setContent(row, it.id + '|' + typography.size + '|' + S.c.bg + '|' + S.c.apps + '|' + homeFont(), '<span class="ph-group">' + body + '</span><span class="ph-move ph-move-up">' + icon('up') + '</span><span class="ph-move ph-move-down">' + icon('down') + '</span>');
      markImage = row.querySelector('.mark img');
      if (markImage) {
        markImage.onerror = function () { this.style.visibility = 'hidden'; };
        if (markImage.complete && !markImage.naturalWidth) markImage.style.visibility = 'hidden';
      }
      row.className = 'ph-row k-' + it.kind + (focus ? ' is-focus' : '') + (remembered && i === anchor ? ' is-sel' : '') + (lifted ? ' is-lifted' : '')
        + (lifted && i === 0 ? ' no-up' : '') + (lifted && i === n - 1 ? ' no-down' : '')
        + (it.kind === 'app' && S.press === it.id ? ' is-press' : '');
      row.style.width = (compact ? listPlateWidth(it.id, compact) : 1200) + 'px'; row.style.height = pitch + 'px';
      row.style.transform = 'translate3d(0,' + (i * pitch) + 'px,0)';
      row.setAttribute('role', 'button'); row.setAttribute('aria-label', app(it.id).name);
      attrs(row, compact ? 'tile' : 'app', i, compact ? 'arrange.' + (it.kind === 'ph' ? 'placeholder.' : 'tile.') + it.id : 'home.app.' + it.id);
    });
    phRows.style.transform = 'translate3d(0,' + (-off) + 'px,0)';
    y = (compact ? PH_COMPACT_TOP + 2 : PH_TOP + 1) + slot * pitch;
    plateState = !n || hs.zone === null ? '' : hs.lifted ? 'on-lift' : S.c.focus === 'glass' && rowFocus ? 'on-focus' : S.c.focus === 'glass' && remembered ? 'on-sel' : '';
    renderPhotoPlate(items[anchor] ? items[anchor].id : '', width, compact ? 88 : 134, y, plateState);
    if (compact && !hs.lifted && (hs.zone === 'tiles' || hs.zone === 'act') && items[anchor]) {
      s = hs.arr.slots[anchor]; label = (s.removed ? 'Restore ' : 'Remove ') + app(s.id).name; aw = actionWidth(label);
      setHTML(phAction, '<span>' + esc(label) + '</span>');
      phAction.className = 'ph-action is-on' + (hs.zone === 'act' ? ' is-focus' : '');
      phAction.style.width = aw + 'px';
      phAction.style.transform = 'translate3d(' + (112 + width + 24) + 'px,' + (PH_COMPACT_TOP + slot * pitch + 12) + 'px,0)';
      attrs(phAction, 'act', anchor, 'arrange.' + (s.removed ? 'restore.' : 'remove.') + s.id);
    } else { phAction.className = 'ph-action'; phAction.removeAttribute('data-z'); phAction.removeAttribute('data-action'); }
    phEmpty.className = 'ph-empty' + (!compact && !n ? ' is-on' : '');
    setHTML(phEmpty, !compact && !n ? '<p>No apps on Home</p><button type="button" tabindex="-1" class="btn' + (hs.zone === 'empty' ? ' is-focus' : '') + '" data-z="empty" data-i="0" data-action="home.add-apps">' + icon('plus') + '<span>Add apps</span></button>' : '');
  }

  /* Sheets: a frame is built once per view/mode; fill() updates its slots. Persistent
     scrollers let transforms animate. */
  function renderSheet(t, sheet) {
    var v = V[t.id], key;
    sheetEl.hidden = !(sheet || isSettingsDetail(t));
    sheetView.hidden = !sheet;
    if (sheet) sheetView.setAttribute('aria-modal', 'true');
    else sheetView.removeAttribute('aria-modal');
    sceneEl.setAttribute('aria-hidden', sheet || isSettingsDetail(t) ? 'true' : 'false');
    if (!sheet) { sheetView.innerHTML = ''; sheetKey = ''; return; }
    key = t.id + '|' + (t.mode || '') + '|' + (t.msg || '') + '|' + S.variant + '|' + S.c.bg;
    if (key !== sheetKey) {
      sheetView.innerHTML = FRAMES[t.id](t);
      sheetKey = key; slotEls = {};
      Array.prototype.forEach.call(sheetView.querySelectorAll('[data-slot]'), function (el) { slotEls[el.getAttribute('data-slot')] = el; });
    }
    FILLS[t.id](t, slotEls);
  }
  function renderAppearance(t) {
    appearanceEl.hidden = !isSettingsDetail(t);
    if (appearanceEl.hidden) { appearanceEl.removeAttribute('aria-modal'); return; }
    appearanceEl.setAttribute('aria-modal', 'true');
    if (t.id === 'wallpaper') { renderWallpaper(t); return; }
    V.appearance.norm(t);
    appearanceEl.className = 'appearance detail-' + t.group;
    appearanceRows.className = 'appearance-rows';
    appearanceTitle.textContent = T(groupName(t.group, t));
    var at = detailLocation(t), selected = at.item, error = S.lookError, status = '', hint;
    function command(item, inner, cls) {
      var applied = item.applied !== undefined ? item.applied : item.axis && S.c[item.axis] === item.value, ticked = item.axis || item.tick;
      var loading = !!(item.axis && S.pending && S.pending.target[item.axis] === item.value && S.pending.row === item.axis);
      return '<button type="button" tabindex="-1" class="setting-choice' + (cls ? ' ' + cls : '') + (t.f.action === item.action ? ' is-focus' : '') + (item.disabled ? ' is-disabled' : '') + (applied ? ' is-applied' : '') + (loading ? ' is-loading' : '') + '"'
        + (ticked ? ' role="radio" aria-checked="' + !!applied + '"' : '') + ' aria-label="' + esc(item.axis && item.value === 'both' ? 'Icons and text' : item.label) + '" aria-disabled="' + !!item.disabled + '" aria-busy="' + loading + '"'
        + ' data-z="detail" data-i="0" data-id="' + item.action + '" data-action="' + item.action + '">' + inner
        + (ticked ? '<span class="setting-tick" aria-hidden="true">' + (applied ? icon('check') : '') + '</span>' : '') + '</button>';
    }
    setHTML(appearanceBack, command({ action: 'settings.back', label: parentName(t) }, icon('left') + '<span>' + esc(parentName(t)) + '</span>', 'setting-back'));
    setHTML(appearanceRows, detailSections(t).map(function (section) {
      return '<section class="setting-section' + (section.horizontal ? ' is-horizontal' + (section.items.length >= 4 ? ' is-many' : '') + (section.items.length >= 5 ? ' is-five' : '') + (section.compact ? ' is-compact' : '') : '') + ' section-' + section.id + '">'
        + (section.title ? '<h3 class="setting-label" id="setting-' + section.id + '">' + esc(section.title) + '</h3>' : '')
        + (section.qr ? '<div class="setting-qr">' + (section.qr.length > 1 ? '<img src="' + section.qr + '" alt="">' : '') + '<div class="setting-qr-copy"><h3>' + esc('Scan with your phone') + '</h3><p>' + esc(section.qrNote) + '</p>'
          + (section.url ? '<p class="setting-url">' + escRaw(section.url.replace(/^http:\/\//, '')) + '</p>' : '') + '</div></div>' : '')
        + '<div class="setting-options"' + (section.items[0] && section.items[0].axis ? ' role="radiogroup" aria-label="' + esc(section.title || LOOK_NAMES[section.id] || DETAIL_NAMES[t.group]) + '"' : '') + '>'
        + section.items.map(function (item) {
          var swatch = item.axis === 'bg', body = '';
          if (swatch || item.thumbnail) body += item.value === 'light' || item.value === 'dark'
            ? '<span class="setting-swatch swatch-' + item.value + '" aria-hidden="true"></span>'
            : '<img class="setting-swatch" src="' + WP + S.c.wall + '-thumb.jpg" alt="">';
          body += '<span class="setting-copy"><span class="setting-name">' + esc(item.label) + '</span>'
            + (item.description ? '<span class="setting-description">' + esc(item.description) + '</span>' : '') + '</span>';
          if (!item.axis && !item.tick) body += icon('right', 'setting-forward');
          return command(item, body, item.pair ? 'is-pair' : item.description ? 'has-description' : '');
        }).join('') + '</div>'
        + (section.reason ? '<p class="setting-reason">' + esc(section.reason) + '</p>' : '') + '</section>';
    }).join(''));
    if (S.pending) status = '<p>' + esc('Loading ' + (S.pending.row === 'font' ? FONTS[S.pending.target.font].name : 'your choice') + '…') + '</p><p>' + esc('Back cancels this change.') + '</p>';
    else if (error) {
      status = '<p class="setting-error">' + (error.type === 'save' ? 'Couldn’t save this change.' : error.type === 'font' ? 'Couldn’t load ' + esc(FONTS[error.font].name) + '.' : 'Couldn’t load this appearance.') + ' Your current choice is kept.</p>'
        + command({ action: 'settings.retry', label: 'Try again' }, '<span>Try again</span>', 'setting-retry');
    }
    setHTML(appearanceStatus, status);
    hint = selected.disabled ? '' : remoteHint(selected) || (selected.action === 'settings.back' ? 'Return to ' + (parentName(t)) : selected.action === 'settings.retry' ? 'Retry this change' : selected.axis === 'source' ? (selected.applied ? 'Remove from rotation' : 'Add to rotation') : selected.axis ? 'Apply selected setting' : selected.action === 'background.wallpaper' ? 'Choose a wallpaper' : selected.action === 'background.rotation' ? 'Choose a rotation interval' : selected.action === 'background.online' ? 'Choose a wallpaper source' : selected.action === 'phone.toggle' ? (S.phone.enabled ? 'Turn off' : 'Turn on') : selected.action === 'phone.forget' ? 'Phones scan a new code' : selected.action === 'phone.clear' ? 'Remove all my photos' : selected.action === 'nowplaying.access' ? 'Open Notification access' : /^open\./.test(selected.action) ? 'Open selected group' : selected.more ? 'Show these sources' : selected.action === 'typography.fonts' ? 'Choose a font' : selected.action === 'saver.start' ? 'Start the screensaver now' : selected.action === 'health.remote' ? 'Open Accessibility settings' : selected.action === 'health.phone' ? 'Open Phone settings' : selected.action === 'update.install' ? 'Download and install' : selected.action === 'update.check' ? 'Check now' : selected.action === 'update.auto' ? (S.update.auto ? 'Turn off' : 'Turn on') : selected.action === 'update.wait' ? 'Please wait' : 'Open on the TV');
    setHTML(appearanceDesc, hint ? '<span class="remote-key">OK</span><span>' + esc(hint) + '</span>' : '');
  }
  function remoteHint(item) {
    var a = item.action;
    return a === 'samsung.remote' ? 'Assign remote buttons' : a === 'remote.learn' ? (S.remote.learning ? 'Cancel' : 'Then press the button to assign')
      : a.indexOf('remote.key.') === 0 ? 'Change what this button does' : a === 'remote.apps' ? 'Choose an app' : a === 'remote.service' ? 'Open accessibility settings'
      : item.remote ? 'Use this for the button' : '';
  }
  function renderWallpaper(t) {
    V.wallpaper.norm(t);
    appearanceEl.className = 'appearance detail-wallpaper';
    appearanceTitle.textContent = T('Wallpaper');
    appearanceRows.className = 'appearance-rows wallpaper-picker';
    setHTML(appearanceBack, '<button type="button" tabindex="-1" class="setting-choice setting-back' + (t.f.zone === 'back' ? ' is-focus' : '') + '" data-z="wall-back" data-action="wallpaper.back">' + icon('left') + '<span>Background</span></button>');
    setHTML(appearanceRows, '<div class="wallpaper-edge wallpaper-before" aria-hidden="true">' + icon('up') + '</div><div class="wallpaper-list" role="radiogroup" aria-label="Wallpaper"><div class="wallpaper-rows"></div></div><div class="wallpaper-edge wallpaper-after" aria-hidden="true">' + icon('down') + '</div>');
    var rows = appearanceRows.querySelector('.wallpaper-rows'), shown = wall(S.wallShown) || wall(S.c.wall), candidate = WALLS[t.i], status, note, hint;
    keyed(rows, WALLS.map(function (w) { return { key: w.id, wall: w }; }), function (row, item, i) {
      var visible = i >= t.top && i < t.top + WALL_VISIBLE, w = item.wall, image;
      setContent(row, w.id + '|' + visible + '|' + inRotation(w) + '|' + isFav(w) + '|' + isHidden(w), '<span class="wallpaper-thumb">' + (visible ? '<img src="' + WP + w.id + '-thumb.jpg" alt="">' : '') + '</span><span class="setting-copy"><span class="setting-name">' + esc(w.name) + '</span>' + (isHidden(w) ? '<span class="setting-credit not-rotating">' + esc(T('Hidden')) + '</span>' : !inRotation(w) ? '<span class="setting-credit not-rotating">' + esc(T('Not in rotation')) + '</span>' : isFav(w) ? '<span class="setting-credit is-fav">' + esc(T('Favourite')) + (w.credit ? ' · ' + esc(w.credit) : '') + '</span>' : w.credit ? '<span class="setting-credit">' + esc(w.credit) + '</span>' : '') + '</span><span class="setting-tick" aria-hidden="true"></span>');
      row.className = 'setting-choice wallpaper-choice' + (t.f.zone === 'photo' && t.i === i ? ' is-focus' : '') + (w.id === S.c.wall ? ' is-applied' : '');
      row.style.transform = 'translate3d(0,' + (i * WALL_ROW) + 'px,0)'; row.style.visibility = visible ? 'visible' : 'hidden';
      row.setAttribute('role', 'radio'); row.setAttribute('tabindex', '-1'); row.setAttribute('aria-label', w.name);
      row.setAttribute('aria-checked', String(w.id === S.c.wall)); row.setAttribute('aria-posinset', String(i + 1)); row.setAttribute('aria-setsize', String(WALLS.length));
      row.setAttribute('aria-busy', String(t.previewDue === w.id || S.wallPending === w.id));
      attrs(row, 'wall-choice', i, 'wallpaper.choose.' + w.id);
      setHTML(row.querySelector('.setting-tick'), w.id === S.c.wall ? icon('check') : '');
      image = row.querySelector('img');
      if (image && !image._wallBound) {
        image._wallBound = true;
        image.onerror = function () { this.parentNode.className = 'wallpaper-thumb is-missing'; };
        if (image.complete && !image.naturalWidth) image.onerror();
      }
    });
    rows.style.transform = 'translate3d(0,' + (-t.top * WALL_ROW) + 'px,0)';
    appearanceRows.querySelector('.wallpaper-before').className = 'wallpaper-edge wallpaper-before' + (t.top > 0 ? ' is-on' : '');
    appearanceRows.querySelector('.wallpaper-after').className = 'wallpaper-edge wallpaper-after' + (t.top + WALL_VISIBLE < WALLS.length ? ' is-on' : '');
    note = t.previewDue ? 'Preparing ' + candidate.name + '…' : S.wallPending ? (t.applyPending ? 'Applying ' : 'Loading ') + candidate.name + '…' : shown.id === S.c.wall ? 'Applied' : 'Preview';
    if (t.failedId) note = S.err ? 'Couldn’t save ' + wall(t.failedId).name + '.' : 'Couldn’t load ' + wall(t.failedId).name + '.';
    status = '<p class="wallpaper-preview-name"><span>' + esc(shown.name) + '</span><span class="wallpaper-count">' + (wallIndex(shown.id) + 1) + ' of ' + WALLS.length + '</span></p><p class="wallpaper-preview-state' + (t.failedId ? ' setting-error' : '') + '">' + esc(note) + '</p>';
    if (!t.failedId) status += '<div class="wallpaper-marks"><button type="button" tabindex="-1" class="setting-choice setting-retry wallpaper-mark' + (t.f.zone === 'fav' ? ' is-focus' : '') + (isFav(candidate) ? ' is-on' : '') + '" data-z="wall-fav" data-action="wallpaper.fav">' + icon(isFav(candidate) ? 'check' : 'plus') + '<span>' + esc('Favourite') + '</span></button>'
      + '<button type="button" tabindex="-1" class="setting-choice setting-retry wallpaper-mark' + (t.f.zone === 'hide' ? ' is-focus' : '') + (isHidden(candidate) ? ' is-on' : '') + '" data-z="wall-hide" data-action="wallpaper.hide">' + (isHidden(candidate) ? icon('check') : '') + '<span>' + esc('Hide') + '</span></button></div>';
    if (t.failedId) status += '<button type="button" tabindex="-1" class="setting-choice setting-retry' + (t.f.zone === 'retry' ? ' is-focus' : '') + '" data-z="wall-retry" data-action="wallpaper.retry">Try again</button>';
    setHTML(appearanceStatus, status);
    hint = t.f.zone === 'back' ? 'Return to Background' : t.f.zone === 'retry' ? 'Retry this photo'
      : t.f.zone === 'fav' ? (isFav(candidate) ? 'Remove from favourites' : 'Always keep this photo in rotation')
      : t.f.zone === 'hide' ? (isHidden(candidate) ? 'Show this photo again' : 'Never show this photo') : 'Apply selected photo';
    if (t.f.zone === 'photo' && candidate.id === S.c.wall && !S.pending && !t.failedId) hint = '';
    setHTML(appearanceDesc, hint ? '<span class="remote-key">OK</span><span>' + esc(hint) + '</span>' : '');
  }
  /* Keep the retry or membership state on the focused control. The stage-level line
     shares its position without changing the control's identity or key behaviour. */
  function renderFocusStatus(t) {
    if (isSettingsDetail(t)) { focusStatus.className = 'focus-status'; return; }
    var root = isSettingsDetail(top()) ? appearanceEl : sheetEl.hidden ? homeEl : sheetEl, active = root.querySelectorAll('.is-focus[data-action]'), target = null, text = S.err ? 'Not saved. OK tries again.' : '', i, r, sr, scale, x, y, w, action, solid, photoRow = false, photoFree = false;
    Array.prototype.forEach.call(stage.querySelectorAll('.has-local-status'), function (el) { el.className = el.className.replace(/\s+has-local-status/g, ''); });
    for (i = 0; i < active.length; i++) if (renderedAction(active[i])) { target = active[i]; break; }
    if (!text && t.id === 'arrange' && (t.f.zone === 'act' || t.f.zone === 'tiles')) {
      var slot = t.slots[t.f.i];
      if (slot && !slot.removed && t.f.zone === 'act' && S.c.home.length === 1) text = LAST;
    }
    if (!text && S.note === LAST && t.id === 'arrange') text = LAST;
    if (!target || !text) { focusStatus.className = 'focus-status'; return; }
    if (target.parentNode === utilsEl && utilsEl.className.indexOf('is-icons') >= 0) { renderUtilFocusLabel(target); focusStatus.className = 'focus-status'; return; }
    // Photo action pills stay on one line; the header already carries this status.
    if (S.c.layout === 'list' && t.id === 'arrange' && !t.lifted && (t.f.zone === 'act' || t.f.zone === 'tiles')) { focusStatus.className = 'focus-status'; return; }
    photoRow = S.c.layout === 'list' && target.className.indexOf('ph-row') >= 0;
    if (photoRow && phAction.className.indexOf('is-on') >= 0) target = phAction;
    else if (photoRow) photoFree = true;
    target.className += ' has-local-status';
    action = target.getAttribute('data-action');
    r = target.getBoundingClientRect(); sr = stage.getBoundingClientRect(); scale = sr.width / 1920 || 1;
    x = (r.left - sr.left) / scale; y = (r.top - sr.top) / scale; w = r.width / scale;
    if (photoFree) { x = 112 + parseFloat(phPlates[photoPlateIndex].style.width) + 24; y += (r.height / scale - 28) / 2; w = 400; }
    else if (action.indexOf('home.app.') === 0 || action.indexOf('arrange.tile.') === 0 || action.indexOf('arrange.placeholder.') === 0) y += 171;
    else if (action.indexOf('apps.order.') === 0) y += 86;
    else if (action.indexOf('apps.toggle.') === 0 || action.indexOf('apps.add.') === 0) y += 164;
    else if (action.indexOf('layout.') === 0) y += 54;
    else y += action.indexOf('arrange.remove.') === 0 || action.indexOf('arrange.restore.') === 0 ? 43 : 40;
    solid = /(?:^|\s)(?:u|btn|er-rm|dock-action|set-row|ph-action)(?:\s|$)/.test(target.className) && target.parentNode !== utilsEl && target.parentNode.className.indexOf('s-head') < 0;
    if (target === phAction && target.className.indexOf('is-focus') < 0) solid = false;
    focusStatus.className = 'focus-status is-on' + (solid ? ' dark-ink' : '') + (photoFree ? ' photo-status' : '');
    focusStatus.textContent = T(text);
    focusStatus.style.left = clamp(x + 8, 112, 1808 - Math.min(w - 16, 800)) + 'px';
    focusStatus.style.top = clamp(y, 72, 988) + 'px';
    focusStatus.style.width = Math.min(w - 16, 800) + 'px';
  }
  function headButtons(list, fi, prefix) {
    return list.map(function (b, i) {
      return '<button type="button" tabindex="-1" class="btn' + (i === fi ? ' is-focus' : '') + (b[2] ? ' ' + b[2] : '') + '" data-z="head" data-i="' + i + '" data-action="' + prefix + '.' + b[0] + '" aria-label="' + esc(b[0] === 'undo' ? undoCaption() : b[1]) + '">' + (b[3] ? icon(b[3]) : '') + '<span>' + esc(b[1]) + '</span></button>';
    }).join('');
  }
  var FRAMES = {
    apps: function () {
      return '<h2 class="s-title" data-slot="title"></h2><p class="s-sub" data-slot="sub"></p><div class="s-head" data-slot="head"></div>'
        + '<div class="grid-view" data-slot="view"><div class="grid-in" data-slot="grid"></div></div>'
        + '<div class="row-cue grid-before" data-slot="before" aria-hidden="true">' + icon('up') + '</div><div class="row-cue grid-after" data-slot="after" aria-hidden="true">' + icon('down') + '</div>';
    },
    editor: function () {
      return '<h2 class="s-title">' + esc('Apps on Home') + '</h2><p class="s-sub" data-slot="sub"></p><div class="s-head" data-slot="head"></div>'
        + '<p class="s-label z-home" data-slot="lh"></p><p class="s-label z-other">' + esc('Not on Home') + '</p>'
        + '<div class="ed-home" data-slot="home"></div><div class="ed-order-break" data-slot="break">' + esc('Then scroll') + '</div><div class="ed-other-view" data-slot="ov"><div class="ed-other" data-slot="other"></div></div><div class="ed-origin" data-slot="origin"></div>'
        + '<div class="row-cue editor-before" data-slot="otherBefore" aria-hidden="true">' + icon('up') + '</div><div class="row-cue editor-after" data-slot="otherAfter" aria-hidden="true">' + icon('down') + '</div>';
    },
    settings: function () { return '<h2 class="s-title">' + esc('Settings') + '</h2><div class="settings-overview" data-slot="list"></div><p class="settings-overview-hint"><span class="remote-key">OK</span><span>' + esc('Open selected group') + '</span></p>'; },
    message: function (t) {
      var m = messageContent(t);
      return '<h2 class="msg-title">' + esc(m.title) + '</h2><p class="msg-line">' + esc(m.line) + '</p><p class="msg-note">' + esc(m.note) + '</p><div class="msg-acts" data-slot="acts"></div>';
    }
  };
  function gridTileHtml(id) {
    var a = app(id), state = onHome(id) ? badge(true) + '<span>On Home</span>' : '';
    return '<span class="panel-content">' + appMark(a, 120, 72, 58) + '<span class="label">' + esc(a.name) + '</span></span><span class="state">' + state + '</span>';
  }
  var FILLS = {
    apps: function (t, el) {
      var f = t.f, items = appsItems(), n = items.length, rows = Math.ceil(n / COLS), vis = 3, row = Math.floor(f.i / COLS);
      setHTML(el.title, esc('All apps'));
      setHTML(el.sub, esc(catalog.loading ? 'Loading installed apps…' : catalog.error || (!n ? 'No installed apps found.' : '')));
      setHTML(el.head, headButtons(appsHead(), f.zone === 'head' ? 0 : -1, 'apps'));
      el.head.className = 's-head' + (f.zone === 'head' ? ' is-awake' : '');
      if (f.zone === 'grid') { if (row < t.top) t.top = row; if (row > t.top + vis - 1) t.top = row - vis + 1; }
      t.top = clamp(t.top, 0, Math.max(0, rows - vis));
      keyed(el.grid, items.map(function (id) { return { key: id, id: id }; }), function (tile, it, i) {
        var focus = f.zone === 'grid' && i === f.i;
        setContent(tile, [it.id, app(it.id).name, onHome(it.id)].join('|'), gridTileHtml(it.id));
        tile.className = 'gt' + (focus ? ' is-focus' : '');
        tile.style.transform = 'translate3d(' + ((i % COLS) * GRID_COL) + 'px,' + (Math.floor(i / COLS) * GRID_ROW) + 'px,0)';
        tile.setAttribute('role', 'button'); tile.setAttribute('aria-label', app(it.id).name);
        attrs(tile, 'grid', i, 'apps.open.' + it.id);
      });
      el.grid.style.transform = 'translate3d(0,' + (-t.top * GRID_ROW) + 'px,0)';
      el.view.className = 'grid-view' + (t.top > 0 ? ' more-before' : '') + (rows - t.top > vis ? ' more-after' : '');
      el.before.className = 'row-cue grid-before' + (t.top > 0 ? ' is-on' : '');
      el.after.className = 'row-cue grid-after' + (rows - t.top > vis ? ' is-on' : '');
    },
    editor: function (t, el) {
      var f = t.f, H = t.lifted ? t.lifted.order : S.c.home, O = otherGroups(), list = O.recent.concat(O.rest), full = S.c.home.length >= CAP;
      var entries = [], ys = [], y = 0, yf, minTop, maxTop = 0, rowEnd, before = false, afterRows = false;
      var hint = catalog.error ? catalog.error : catalog.loading ? 'Loading installed apps…' : f.zone === 'head' && f.h === 0 ? undoCaption() : f.zone === 'home' && f.part === 'remove' ? (H.length <= 1 ? LAST : app(H[f.i]).name + ' stays installed.') : '';
      setHTML(el.sub, editStatus(hint, t.lifted ? 'Moving ' + app(t.lifted.id).name + '. OK places it, Back puts it back.' : ''));
      setHTML(el.head, headButtons([['undo', 'Undo', S.undo.length ? '' : 'is-idle', 'undo'], ['done', 'Done', '', 'check']], f.zone === 'head' ? f.h : -1, 'editor'));
      el.head.className = 's-head' + (f.zone === 'head' ? ' is-awake' : '');
      setHTML(el.lh, esc('On Home') + ' <span class="s-count">' + S.c.home.length + ' ' + esc('of') + ' ' + CAP + '</span>');
      el['break'].className = 'ed-order-break' + (H.length > editorCut() ? ' is-on' : '');
      el['break'].style.top = (264 + editorCut() * ED_ROW) + 'px';

      keyed(el.home, H.map(function (id) { return { key: id, id: id }; }), function (row, it, i) {
        var a = app(it.id), here = f.zone === 'home' && i === f.i, lifted = !!t.lifted && i === f.i;
        setContent(row, it.id, '<div class="er-name" role="button"><span class="panel-content"><span class="er-num"></span>' + smallMark(a) + '<span class="er-text">' + esc(a.name) + '</span><span class="er-move">' + icon('updown') + '</span></span></div><div class="er-rm" role="button"><span></span></div>');
        row.className = 'er' + (here ? ' is-active' : '') + (lifted ? ' is-lifted' : '');
        row.style.transform = 'translate3d(' + (lifted ? 16 : 0) + 'px,' + editorHomeY(i) + 'px,0)';
        row.querySelector('.er-num').textContent = String(i + 1);
        row.firstChild.className = 'er-name' + (here && (f.part === 'name' || lifted) ? ' is-focus' : '');
        row.lastChild.className = 'er-rm' + (here && f.part === 'remove' && !lifted ? ' is-focus' : '') + (H.length <= 1 ? ' is-limit' : '');
        row.lastChild.firstChild.textContent = T(H.length <= 1 ? LAST : 'Remove from Home');
        attrs(row.firstChild, 'name', i, 'editor.move.' + it.id);
        attrs(row.lastChild, 'remove', i, 'editor.remove.' + it.id);
      });
      el.origin.className = 'ed-origin' + (t.lifted && t.lifted.from !== f.i ? ' is-on' : '');
      if (t.lifted) el.origin.style.transform = 'translate3d(0,' + (264 + editorHomeY(t.lifted.from) + 16) + 'px,0)';

      if (O.recent.length) { entries.push({ key: 'sep-recent', sep: 'Recently removed', y: y }); y += ED_SEP; }
      O.recent.forEach(function (id) { entries.push({ key: id, id: id, y: y }); ys.push(y); y += ED_ROW; });
      if (O.recent.length && O.rest.length) { entries.push({ key: 'sep-rest', sep: 'Other installed apps', y: y }); y += ED_SEP; }
      O.rest.forEach(function (id) { entries.push({ key: id, id: id, y: y }); ys.push(y); y += ED_ROW; });
      if (f.zone === 'other' && ys.length) {
        yf = ys[f.j] - (O.recent.length && (f.j === 0 || f.j === O.recent.length) ? ED_SEP : 0);
        if (yf < t.top) t.top = yf;
        if (ys[f.j] + 72 > t.top + ED_VIEW) {
          minTop = ys[f.j] + 72 - ED_VIEW;
          entries.some(function (it) { if (it.y < minTop) return false; t.top = it.y; return true; });
        }
      }
      entries.some(function (it) { if (it.y < Math.max(0, y - ED_VIEW)) return false; maxTop = it.y; return true; });
      t.top = clamp(t.top, 0, maxTop);
      keyed(el.other, entries, function (row, it) {
        var j, focus, a;
        row.style.transform = 'translate3d(0,' + it.y + 'px,0)';
        rowEnd = it.y + (it.sep ? ED_SEP : 72);
        row.style.visibility = it.y >= t.top && rowEnd <= t.top + ED_VIEW ? 'visible' : 'hidden';
        before = before || it.y < t.top; afterRows = afterRows || rowEnd > t.top + ED_VIEW;
        if (it.sep) { setContent(row, 'sep|' + it.sep, esc(it.sep)); row.className = 'eo-sep'; return; }
        j = list.indexOf(it.id); focus = f.zone === 'other' && j === f.j; a = app(it.id);
        setContent(row, it.id, '<span class="panel-content">' + smallMark(a) + '<span class="eo-text">' + esc(a.name) + '</span><span class="eo-verb"></span></span>');
        row.querySelector('.eo-verb').innerHTML = focus ? '<span class="verb' + (full ? ' is-off' : '') + '">' + esc(full ? 'Home is full' : 'Add to Home') + '</span>' : '';
        row.className = 'eo' + (focus ? ' is-focus' : '');
        row.setAttribute('role', 'button');
        attrs(row, 'other', j, 'editor.add.' + it.id);
      });
      el.other.style.transform = 'translate3d(0,' + (-t.top) + 'px,0)';
      el.ov.className = 'ed-other-view';
      el.otherBefore.className = 'row-cue editor-before' + (before ? ' is-on' : '');
      el.otherAfter.className = 'row-cue editor-after' + (afterRows ? ' is-on' : '');
    },
    settings: function (t, el) {
      var html = '', rows = settingsRows();
      rows.forEach(function (r) {
        html += '<button type="button" tabindex="-1" class="settings-group' + (r.id === t.f.id ? ' is-focus' : '') + '" data-z="row" data-i="0" data-id="' + r.id + '" data-action="settings.' + (r.id === 'editor' ? 'editor' : 'group.' + r.id) + '"><span class="settings-group-copy"><span class="settings-group-name">' + esc(r.label) + '</span><span class="settings-group-value">' + esc(r.value) + '</span></span>' + icon('right') + '</button>';
      });
      setHTML(el.list, html);
    },
    message: function (t, el) {
      setHTML(el.acts, messageContent(t).actions.map(function (a, i) {
        return '<button type="button" tabindex="-1" class="btn' + (i === t.f.b ? ' is-focus' : '') + '" data-z="act" data-i="' + i + '" data-action="message.' + esc(a[0]) + '"><span>' + esc(a[1]) + '</span></button>';
      }).join(''));
    }
  };

  /* ---------- Atomic appearance bundles ---------- */
  var wallToken = 0, committedBundle = null, reflowToken = 0, fontSwitchToken = 0;
  function registeredMaterial(id) { return S.c.bg === 'photo' && S.c.material === 'soft' && !!wall(id); }
  function matSrc(id, material) { return 'assets/materials/' + id + (material === 'soft' ? '-study-soft.jpg' : material === 'tint' ? '-field-clear.jpg' : '-field-frost.jpg'); }
  function fieldSrc(id, material) { return 'assets/materials/' + id + (material === 'soft' ? '-field-blur.jpg' : material === 'tint' ? '-field-clear.jpg' : '-field-frost.jpg'); }
  function makeImg(cls, src) { var im = document.createElement('img'); im.className = cls; im.alt = ''; im._src = src; im.src = src; return im; }
  function whenReady(im, done) {
    var fin = false, timer = setTimeout(function () { finish(false); }, 8000);
    function finish(ok) { if (fin) return; fin = true; clearTimeout(timer); done(ok); }
    function ready() { if (im.decode) im.decode().then(function () { finish(true); }, function () { finish(false); }); else finish(true); }
    if (im.complete) { if (im.naturalWidth) ready(); else finish(false); }
    else { im.onload = ready; im.onerror = function () { finish(false); }; }
  }
  function swapImg(k, im) { var old = IMG[k]; if (old === im) return; im.style.cssText = old.style.cssText; if (old.id) im.id = old.id; old.parentNode.replaceChild(im, old); IMG[k] = im; }
  function bundleKey(look) { return look.wall + '|' + look.material; }
  function loadBundle(look, token, done) {
    var imgs = { photo: makeImg('photo', WP + look.wall + '.jpg'), bg: makeImg('sheet-bg', WP + look.wall + '-panel.jpg') }, keys, left, allOk = true;
    imgs.mat = makeImg('mat-img', matSrc(look.wall, look.material));
    imgs.field = makeImg('ph-field-img', fieldSrc(look.wall, look.material));
    imgs.fieldAlt = makeImg('ph-field-img', fieldSrc(look.wall, look.material));
    imgs.utility = makeImg('ph-field-img', fieldSrc(look.wall, look.material));
    imgs.utilityAlt = makeImg('ph-field-img', fieldSrc(look.wall, look.material));
    keys = Object.keys(imgs); left = keys.length;
    keys.forEach(function (k) { whenReady(imgs[k], function (ok) {
      allOk = allOk && ok;
      if (--left || token !== wallToken) return;
      done(allOk ? { key: bundleKey(look), imgs: imgs } : null);
    }); });
  }
  function installBundle(bundle, look, previewOnly) {
    if (bundle) {
      Object.keys(bundle.imgs).forEach(function (k) { if (!previewOnly || k !== 'bg') swapImg(k, bundle.imgs[k]); });
      S.bundleKey = bundle.key;
    }
    S.shown = { bg: look.bg, wall: look.wall, material: look.material, font: look.font };
    phFields.concat(utFields).forEach(function (el) { var p = el._placement; if (p) fieldTransform(el, p.x, p.y, p.width, p.height); });
    S.wallShown = look.wall; S.wallPending = null; S.wallError = null;
  }
  function cleanPatch(patch) {
    var out = {}, k;
    if (!patch || typeof patch !== 'object') throw new Error('look needs an appearance patch');
    for (k in patch) if (patch.hasOwnProperty(k)) {
      if (k === 'wall') { if (!wall(patch[k])) throw new Error('Unknown wallpaper: ' + patch[k]); }
      else if (k === 'font') { if (!FONTS[patch[k]] || patch[k] !== 'manrope' && PRIVATE_FONTS.indexOf(patch[k]) < 0) throw new Error('Unavailable font: ' + patch[k]); }
      else if (!LOOK_VALUES[k] || LOOK_VALUES[k].indexOf(patch[k]) < 0) throw new Error('Invalid appearance value: ' + k);
      out[k] = patch[k];
    }
    return out;
  }
  function cancelLook() { wallToken++; S.pending = null; S.wallPending = null; S.lookError = null; }
  function setLook(patch, options) {
    var opts = options || {}, changes = cleanPatch(patch), target = lookOf(S.c), k, token, needs, needsFont, changed, loadedBundle = null, imageDone, fontDone, failed = false;
    for (k in changes) if (changes.hasOwnProperty(k)) target[k] = changes[k];
    changed = Object.keys(target).some(function (key) { return target[key] !== S.c[key]; });
    cancelLook(); S.err = null; token = wallToken;
    function finish(bundle) {
      var c = next(S.c.home.slice(), S.c.recent.slice()), fontChanged = target.font !== S.c.font, reflow = target.apps !== S.c.apps || target.controls !== S.c.controls || fontChanged, frame, fontFrame;
      Object.keys(target).forEach(function (key) { c[key] = target[key]; });
      S.pending = null; S.wallPending = null;
      if (!opts.transient && changed && !write(c, 'Appearance')) { S.lookError = { type: 'save', patch: changes, row: opts.row || S.appearanceFocus, transient: false }; render(); syncRotation(); return; }
      if (opts.transient) S.c = c;
      if (reflow) { S.reflow = true; frame = ++reflowToken; }
      if (fontChanged) { S.fontSwitch = true; fontFrame = ++fontSwitchToken; }
      installBundle(bundle, target);
      if (bundle) committedBundle = bundle;
      S.lookError = null; S.previewBundle = null;
      render(); syncRotation();
      if (reflow) window.requestAnimationFrame(function () { window.requestAnimationFrame(function () {
        if (frame !== reflowToken) return;
        S.reflow = false; stage.className = stage.className.replace(/\s+is-reflow/g, '');
      }); });
      if (fontChanged) setTimeout(function () {
        if (fontFrame !== fontSwitchToken) return;
        S.fontSwitch = false; stage.className = stage.className.replace(/\s+is-font-switch/g, '');
      }, REDUCED_MOTION ? 130 : 170);
    }
    function fail(type, reason) {
      if (token !== wallToken || failed) return;
      failed = true; S.pending = null; S.wallPending = null;
      if (type === 'load') S.wallError = target.wall;
      S.lookError = { type: type, reason: reason || null, patch: changes, row: opts.row || (type === 'font' ? 'font' : S.appearanceFocus), transient: !!opts.transient, wall: target.wall, font: target.font };
      if (type === 'font') log((opts.startup ? 'font fallback: ' : 'Font kept: ') + (opts.startup ? target.font : FONTS[S.c.font].name) + (opts.startup ? '' : ' (' + reason + ')'));
      if (type === 'font' && opts.startup && target.font !== 'manrope') { setLook({ font: 'manrope' }, { transient: true }); return; }
      render(); syncRotation();
    }
    function complete() {
      if (!imageDone || !fontDone || failed || token !== wallToken) return;
      window.requestAnimationFrame(function () { if (!failed && token === wallToken) finish(loadedBundle); });
    }
    needs = target.bg === 'photo' && S.bundleKey !== bundleKey(target) && (!S.shown || S.shown.bg !== 'photo' || target.wall !== S.c.wall || materialApplies(target));
    needsFont = !fontMetrics[target.font]; imageDone = !needs; fontDone = !needsFont;
    if (!needs && !needsFont) { finish(null); return; }
    S.pending = { patch: changes, target: target, row: opts.row || (needsFont ? 'font' : S.appearanceFocus), transient: !!opts.transient, preview: false };
    if (needs) {
      S.wallPending = target.wall;
      loadBundle(target, token, function (bundle) {
        if (!bundle) { fail('load'); return; }
        loadedBundle = bundle; imageDone = true; complete();
      });
    }
    if (needsFont) ensureFont(target.font, function (ok, reason) {
      if (!ok) { fail('font', reason); return; }
      fontDone = true; complete();
    });
    render();
  }
  function showWall(id, done) {
    var target = lookOf(S.c), token;
    target.bg = 'photo'; target.wall = id;
    cancelLook(); token = wallToken; S.wallError = null;
    S.pending = { patch: { wall: id }, target: target, row: 'bg', preview: true, transient: false }; S.wallPending = id;
    loadBundle(target, token, function (bundle) {
      S.pending = null; S.wallPending = null;
      if (!bundle) { S.wallError = id; done(false); return; }
      S.previewBundle = bundle; installBundle(bundle, target, true); done(true);
    });
    render();
  }
  function restoreLook() {
    cancelLook(); S.previewBundle = null;
    if (S.c.bg === 'photo' && committedBundle && committedBundle.key === bundleKey(S.c)) installBundle(committedBundle, S.c);
    else if (S.c.bg !== 'photo' || S.bundleKey === bundleKey(S.c)) installBundle(null, S.c);
    else setLook({}, { transient: true });
  }

  /* ---------- Lifecycle and remote input ---------- */
  var clockTimer = 0, rotationTimer = 0, activeSince = 0, activeMs = 0, rotationKey = '';
  function rotationActive() { return !document.hidden && !S.saver && top().id === 'home' && S.c.bg === 'photo' && !S.pending && mode().min > 0; }
  function pauseRotation() {
    if (activeSince) { activeMs += Date.now() - activeSince; activeSince = 0; }
    clearTimeout(rotationTimer); rotationTimer = 0;
  }
  function resetRotation() { pauseRotation(); activeMs = 0; rotationKey = ''; }
  function syncRotation() {
    var key = S.c.wall + '|' + S.c.mode;
    pauseRotation();
    if (key !== rotationKey) { activeMs = 0; rotationKey = key; }
    if (!rotationActive()) return;
    activeSince = Date.now();
    rotationTimer = setTimeout(function () {
      pauseRotation(); activeMs = 0;
      var pool = rotationPool(), at = pool.indexOf(wall(S.c.wall));
      if (rotationActive()) setLook({ wall: pool[(at + 1) % pool.length].id }, { row: 'bg' });
    }, Math.max(10, mode().min * QA.minuteMs - activeMs));
  }
  function updateClock() {
    clearTimeout(clockTimer);
    if (document.hidden) return;
    if (S.night !== nightActive()) { S.night = nightActive(); render(); }
    if (S.c.idle !== 'off' && !idleTimer && !S.idleHidden) idleReset();
    if (WEATHER && S.c.cweather === 'on') WEATHER.refresh(false);
    if (top().id === 'home' || isSettingsDetail(top())) renderCaption(top(), homeState(top()));
    if (S.saver) renderSaver(); else if (!saverTimer) saverReset();
    syncAwake();
    clockTimer = setTimeout(updateClock, S.c.csec === 'on' ? 1000 - (Date.now() % 1000) + 20 : 60000 - (Date.now() % 60000) + 30);
  }
  function focusStage() { try { stage.focus({ preventScroll: true }); } catch (e) { stage.focus(); } }
  function after() { norm(); render(); syncRotation(); }
  function goScene(name) {
    if (top().id === 'wallpaper') cancelWallpaperTimer(top());
    S.stack = [S.stack[0]]; S.stack[0].f.zone = 'apps'; clearSession(); restoreLook();
    if (name === 'apps') openApps();
    else if (name === 'settings') openSettings();
    else if (name === 'appearance') { openSettings(); top().f.id = 'background'; S.settingsFocus = 'background'; openAppearance('background'); }
    else if (name === 'editor') { openSettings(); openEditor('settings'); }
    after();
  }
  function fit() {
    // Android TV WebView grows innerWidth to the 1920px stage; clientWidth is the visible viewport.
    var w = document.documentElement.clientWidth || window.innerWidth, h = document.documentElement.clientHeight || window.innerHeight;
    var scale = Math.min(w / 1920, h / 1080);
    stage.style.transform = 'scale(' + scale + ')';
    stage.style.left = ((w - 1920 * scale) / 2) + 'px';
    stage.style.top = ((h - 1080 * scale) / 2) + 'px';
  }
  function renderedAction(el) {
    return el.getClientRects().length > 0 && window.getComputedStyle(el).visibility !== 'hidden';
  }
  function focusedAction() {
    var root = isSettingsDetail(top()) ? appearanceEl : sheetEl.hidden ? homeEl : sheetEl, els = root.querySelectorAll('.is-focus[data-action]'), i;
    for (i = 0; i < els.length; i++) if (renderedAction(els[i])) return els[i].getAttribute('data-action');
    return null;
  }
  function activate(action) {
    var root = isSettingsDetail(top()) ? appearanceEl : sheetEl.hidden ? homeEl : sheetEl, els = root.querySelectorAll('[data-action]'), i;
    if (action === 'appearance.bg' && top().id === 'appearance' && top().group === 'background') action = 'background.wallpaper';
    if (action === 'settings.appearance' && top().id === 'settings') action = 'settings.group.background';
    for (i = 0; i < els.length; i++) if (renderedAction(els[i]) && els[i].getAttribute('data-action') === action) { pointAt(els[i]); return true; }
    return false;
  }
  function pointAt(el) {
    var t = top(), v = V[t.id];
    norm();
    if (v.point) v.point(t, el.getAttribute('data-z'), +el.getAttribute('data-i'), el.getAttribute('data-id'));
    norm();
    render();
    syncRotation();
  }

  utilsEl.addEventListener('mouseover', function (ev) {
    var b = ev.target, t = top(), z, i;
    if (utilsEl.className.indexOf('quiet-utils') < 0 || t.lifted) return;
    while (b && b !== utilsEl && !(b.getAttribute && b.getAttribute('data-z'))) b = b.parentNode;
    if (!b || b === utilsEl || (ev.relatedTarget && b.contains(ev.relatedTarget))) return;
    z = b.getAttribute('data-z'); i = Number(b.getAttribute('data-i'));
    if ((t.id !== 'home' || z !== 'util') && (t.id !== 'arrange' || z !== 'ctl')) return;
    if (t.f.zone === z && t.f.u === i) return;
    t.f.zone = z; t.f.u = i;
    if (z === 'util') S.lastUtil = i;
    render();
  });
  stage.addEventListener('click', function (ev) {
    var el = ev.target;
    while (el && el !== stage && !(el.getAttribute && el.getAttribute('data-z'))) el = el.parentNode;
    focusStage();
    if (S.saver) { stopSaver(); return; }
    saverReset();
    if (!el || el === stage) return;
    pointAt(el);
  });
  var heldKeys = {};
  document.addEventListener('keydown', function (ev) {
    var code = ev.keyCode, k = KEYS[code];
    if (code === 9) { ev.preventDefault(); return; }
    if (!k || ev.metaKey || ev.ctrlKey || ev.altKey) return;
    ev.preventDefault();
    if (S.saver) { if (!ev.repeat) stopSaver(); return; } // the first press only wakes Shore
    saverReset();
    if (S.idleHidden) { idleReset(); return; } // the first press only brings the controls back
    idleReset();
    if (k === 'ok' || k === 'back') { if (ev.repeat || heldKeys[code]) return; heldKeys[code] = true; }
    press(k);
  });
  document.addEventListener('keyup', function (ev) { delete heldKeys[ev.keyCode]; });
  window.addEventListener('blur', function () { heldKeys = {}; });
  window.addEventListener('focus', function () { release(); focusStage(); after(); updateClock(); });
  document.addEventListener('visibilitychange', function () {
    heldKeys = {};
    if (document.hidden) { pauseRotation(); clearTimeout(clockTimer); VIDEO.pause(); if (S.saver && !DREAM) stopSaver(); clearTimeout(saverTimer); saverTimer = 0; syncAwake(); }
    else { shelfAsked = ''; release(); after(); updateClock(); focusStage(); saverReset(); pollPlaying(); }
  });
  window.addEventListener('resize', fit);

  /* Readable browser checks use the real state and actions, without fake outcomes. */
  var NAV = { left: 'left', right: 'right', up: 'up', down: 'down', ok: 'ok', enter: 'ok', back: 'back', escape: 'back' };
  QA.state = function () {
    var out = serialise(S.c), t = top(), item = t.id === 'appearance' ? detailLocation(t).item : null;
    out.committed = S.c; out.shown = S.shown; out.pending = S.pending; out.view = t.id; out.selected = S.sel;
    out.focusAction = focusedAction(); out.writes = S.writes; out.failedWrites = S.failed; out.error = S.err;
    out.catalog = { loading: catalog.loading, loaded: catalog.loaded, error: catalog.error, ids: ALPHA.slice() };
    out.fonts = { available: LOOK_VALUES.font.slice(), loaded: Object.keys(fontMetrics).filter(function (id) { return !fontMetrics[id].fallback; }), baselineFallback: !!(fontMetrics.manrope && fontMetrics.manrope.fallback), error: S.lookError && S.lookError.type === 'font' ? S.lookError : null };
    out.rotation = { activeMs: activeMs + (activeSince ? Date.now() - activeSince : 0), active: !!activeSince };
    out.draft = t.lifted ? { id: t.lifted.id, order: t.lifted.order.slice() } : null;
    out.settingsGroup = t.id === 'wallpaper' ? 'wallpaper' : t.id === 'appearance' ? t.group : null;
    out.focusedChoice = item && item.axis ? { axis: item.axis, value: item.value, action: item.action, disabled: item.disabled } : null;
    out.candidate = out.focusedChoice ? { axis: item.axis, value: item.value, action: item.action, pending: !!S.pending, pendingTarget: S.pending ? S.pending.target : null } : null;
    out.wallpaperPicker = t.id === 'wallpaper' ? { candidate: WALLS[t.i].id, applied: S.c.wall, shown: S.wallShown, pending: t.previewDue || S.wallPending,
      queuedApplying: !!t.applyPending, applyPending: t.applyPending, failed: t.failedId, zone: t.f.zone, top: t.top, visible: WALL_VISIBLE, backdrop: IMG.bg.src } : null;
    out.undo = S.undo.map(function (u) { return u.label; }); out.storageOk = storageOk;
    return JSON.parse(JSON.stringify(out));
  };
  QA.where = function () {
    var action = focusedAction(), active = stage.querySelectorAll('.is-focus[data-action]'), count = 0, name = '';
    Array.prototype.forEach.call(active, function (el) { if (renderedAction(el)) { count++; if (el.getAttribute('data-action') === action) name = el.getAttribute('aria-label') || el.textContent.replace(/\s+/g, ' ').trim(); } });
    return { view: top().id, settingsGroup: top().id === 'wallpaper' ? 'wallpaper' : top().id === 'appearance' ? top().group : null, focus: name, focusAction: action, focusCount: count, wallpaper: S.wallShown, zone: top().f.zone || null };
  };
  QA.ready = function () { return fontsReady && !S.pending && !!S.shown && S.shown.bg === S.c.bg && S.shown.wall === S.c.wall && S.shown.font === S.c.font; };
  QA.nav = function () { var keys = arguments.length === 1 && Array.isArray(arguments[0]) ? arguments[0] : Array.prototype.slice.call(arguments); keys.forEach(function (key) { if (!NAV[key]) throw new Error('Unknown key'); press(NAV[key]); }); return QA.state(); };
  QA.look = function (patch) { setLook(patch, {}); return QA.state(); };
  QA.scene = function (name) { if (['home', 'apps', 'settings', 'appearance', 'editor'].indexOf(name) < 0) throw new Error('Unknown view'); goScene(name); return QA.state(); };
  QA.activate = function (action) { return activate(action) ? QA.state() : null; };
  QA.saver = function (on) { if (on === true) startSaver(); else if (on === false) stopSaver(); else if (on === 'next' && S.saver) nextSaverPhoto(); return { on: S.saver, scheduled: !!saverTimer, awake: awakeOn, photo: saverSrc }; };
  QA.actions = function () { var view = isSettingsDetail(top()) ? appearanceEl : sheetEl.hidden ? homeEl : sheetEl; return Array.prototype.filter.call(view.querySelectorAll('[data-action]'), renderedAction).map(function (el) { return el.getAttribute('data-action'); }); };

  /* ---------- Start ---------- */
  cueL.innerHTML = icon('left'); cueR.innerHTML = icon('right');
  initialise();
  if (FrameDevice.onInputs) { FrameDevice.onInputs(refreshInputs); refreshInputs(); }
  if (WEATHER) WEATHER.onChange(function () { if (S.c.cweather === 'on' && (top().id === 'home' || isSettingsDetail(top()))) renderCaption(top(), homeState(top())); });
  if (NOWPLAYING) { pollPlaying(); setInterval(pollPlaying, 5000); }
  if (UPDATE) { S.update = UPDATE.info(); UPDATE.onChange(function () { S.update = UPDATE.info(); if (isSettingsDetail(top()) || top().id === 'settings') render(); }); }
  if (PHONE) { S.phone = PHONE.info(); PHONE.onChange(function (count) { S.phone.count = count; if (isSettingsDetail(top()) || top().id === 'settings') render(); }); }
  if (REMOTE) {
    REMOTE.onLearned(remoteLearned);
    REMOTE.onChange(function () { refreshRemote(); if (top().id === 'appearance') render(); });
    refreshRemote();
  }
  if (ONLINE) { ONLINE.onChange(onlineChanged); ONLINE.select(S.c.source, false); }
  setLook({}, { transient: true, startup: true });
  norm(); render(); fit(); focusStage(); updateClock(); syncRotation();
  if (S.firstRun) { openMessage('welcome'); render(); }
  try { if (sessionStorage.getItem('shore.restored')) { sessionStorage.removeItem('shore.restored'); openMessage('restored'); render(); } } catch (e) { }
  window.CleanFrameSaver = function () { startSaver(); };
  if (DREAM || SAVER_API && SAVER_API.requested()) startSaver();
})();
