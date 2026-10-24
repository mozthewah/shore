/* Shore Companion. The pairing key arrives once in the QR link (#k=…), is kept in localStorage and sent with every API call. */
(function () {
  'use strict';
  var STR = {
    de: { 'Photos': 'Fotos', 'TV settings': 'TV-Einstellungen', 'Apps': 'Apps', 'Open Shore on the TV to change its settings from here.': 'Öffne Shore am Fernseher, um die Einstellungen von hier zu ändern.', 'Connecting to your TV…': 'Verbinde mit deinem Fernseher…', 'Connected to your TV': 'Mit deinem Fernseher verbunden', 'Your TV is not reachable': 'Dein Fernseher ist nicht erreichbar',
      'Pair this phone': 'Dieses Handy koppeln', 'On the TV, open Shore › Settings › Phone and scan the code with your camera.': 'Öffne am Fernseher Shore › Einstellungen › Handy und scanne den Code mit der Kamera.',
      'Send to your TV': 'An den Fernseher senden', 'Photos, GIFs and short videos become wallpapers under My photos. Landscape fills the screen best.': 'Fotos, GIFs und kurze Videos werden zu Hintergründen unter „Meine Fotos“. Querformat füllt den Bildschirm am besten.',
      'Choose photos': 'Fotos auswählen', 'My photos': 'Meine Fotos', 'Nothing here yet.': 'Noch nichts hier.', 'Remove all': 'Alle entfernen', 'Weather place': 'Ort fürs Wetter',
      'The clock shows the weather for this city. Leave it empty to use the TV’s time zone.': 'Die Uhr zeigt das Wetter für diese Stadt. Leer lassen, um die Zeitzone des Fernsehers zu nutzen.',
      'Save': 'Speichern', 'Works on your home Wi-Fi only. Nothing leaves your network.': 'Funktioniert nur im Heim-WLAN. Nichts verlässt dein Netzwerk.',
      'Sending…': 'Wird gesendet…', 'Sent': 'Gesendet', 'Failed': 'Fehlgeschlagen', 'Saved': 'Gespeichert', 'Removed': 'Entfernt', 'Remove all your photos from the TV?': 'Alle deine Fotos vom Fernseher entfernen?', 'Install as an app': 'Als App installieren', 'Remove this photo?': 'Dieses Foto entfernen?', 'Frame it for your TV': 'Für den Fernseher zuschneiden', 'Drag to move. Pinch or use the slider to zoom.': 'Zum Verschieben ziehen. Zum Zoomen mit zwei Fingern oder dem Regler.', 'Skip': 'Überspringen', 'Whole photo': 'Ganzes Foto', 'Send': 'Senden', 'Skipped': 'Übersprungen', 'of': 'von' },
    fr: { 'Photos': 'Photos', 'TV settings': 'Réglages TV', 'Apps': 'Apps', 'Open Shore on the TV to change its settings from here.': 'Ouvrez Shore sur le téléviseur pour modifier ses réglages d’ici.', 'Connecting to your TV…': 'Connexion au téléviseur…', 'Connected to your TV': 'Connecté au téléviseur', 'Your TV is not reachable': 'Téléviseur injoignable',
      'Pair this phone': 'Associer ce téléphone', 'On the TV, open Shore › Settings › Phone and scan the code with your camera.': 'Sur le téléviseur, ouvrez Shore › Réglages › Téléphone et scannez le code avec l’appareil photo.',
      'Send to your TV': 'Envoyer au téléviseur', 'Photos, GIFs and short videos become wallpapers under My photos. Landscape fills the screen best.': 'Photos, GIF et courtes vidéos deviennent des fonds dans Mes photos. Le format paysage remplit mieux l’écran.',
      'Choose photos': 'Choisir des photos', 'My photos': 'Mes photos', 'Nothing here yet.': 'Rien pour l’instant.', 'Remove all': 'Tout supprimer', 'Weather place': 'Lieu pour la météo',
      'The clock shows the weather for this city. Leave it empty to use the TV’s time zone.': 'L’horloge affiche la météo de cette ville. Laissez vide pour utiliser le fuseau horaire du téléviseur.',
      'Save': 'Enregistrer', 'Works on your home Wi-Fi only. Nothing leaves your network.': 'Fonctionne uniquement sur votre Wi-Fi. Rien ne quitte votre réseau.',
      'Sending…': 'Envoi…', 'Sent': 'Envoyé', 'Failed': 'Échec', 'Saved': 'Enregistré', 'Removed': 'Supprimé', 'Remove all your photos from the TV?': 'Supprimer toutes vos photos du téléviseur ?', 'Install as an app': 'Installer comme app', 'Remove this photo?': 'Supprimer cette photo ?', 'Frame it for your TV': 'Cadrer pour le téléviseur', 'Drag to move. Pinch or use the slider to zoom.': 'Faites glisser pour déplacer. Pincez ou utilisez le curseur pour zoomer.', 'Skip': 'Ignorer', 'Whole photo': 'Photo entière', 'Send': 'Envoyer', 'Skipped': 'Ignorée', 'of': 'sur' },
    es: { 'Photos': 'Fotos', 'TV settings': 'Ajustes de TV', 'Apps': 'Apps', 'Open Shore on the TV to change its settings from here.': 'Abre Shore en el televisor para cambiar sus ajustes desde aquí.', 'Connecting to your TV…': 'Conectando con tu televisor…', 'Connected to your TV': 'Conectado a tu televisor', 'Your TV is not reachable': 'No se puede acceder al televisor',
      'Pair this phone': 'Vincular este móvil', 'On the TV, open Shore › Settings › Phone and scan the code with your camera.': 'En el televisor, abre Shore › Ajustes › Móvil y escanea el código con la cámara.',
      'Send to your TV': 'Enviar al televisor', 'Photos, GIFs and short videos become wallpapers under My photos. Landscape fills the screen best.': 'Las fotos, GIF y vídeos cortos se convierten en fondos en Mis fotos. El formato horizontal llena mejor la pantalla.',
      'Choose photos': 'Elegir fotos', 'My photos': 'Mis fotos', 'Nothing here yet.': 'Aún no hay nada.', 'Remove all': 'Quitar todo', 'Weather place': 'Lugar del tiempo',
      'The clock shows the weather for this city. Leave it empty to use the TV’s time zone.': 'El reloj muestra el tiempo de esta ciudad. Déjalo vacío para usar la zona horaria del televisor.',
      'Save': 'Guardar', 'Works on your home Wi-Fi only. Nothing leaves your network.': 'Solo funciona en tu Wi-Fi. Nada sale de tu red.',
      'Sending…': 'Enviando…', 'Sent': 'Enviado', 'Failed': 'Error', 'Saved': 'Guardado', 'Removed': 'Quitado', 'Remove all your photos from the TV?': '¿Quitar todas tus fotos del televisor?', 'Install as an app': 'Instalar como app', 'Remove this photo?': '¿Quitar esta foto?', 'Frame it for your TV': 'Encuádrala para el televisor', 'Drag to move. Pinch or use the slider to zoom.': 'Arrastra para mover. Pellizca o usa el control para hacer zoom.', 'Skip': 'Omitir', 'Whole photo': 'Foto entera', 'Send': 'Enviar', 'Skipped': 'Omitida', 'of': 'de' },
    nl: { 'Photos': 'Foto’s', 'TV settings': 'Tv-instellingen', 'Apps': 'Apps', 'Open Shore on the TV to change its settings from here.': 'Open Shore op de tv om de instellingen hier te wijzigen.', 'Connecting to your TV…': 'Verbinden met je tv…', 'Connected to your TV': 'Verbonden met je tv', 'Your TV is not reachable': 'Je tv is niet bereikbaar',
      'Pair this phone': 'Deze telefoon koppelen', 'On the TV, open Shore › Settings › Phone and scan the code with your camera.': 'Open op de tv Shore › Instellingen › Telefoon en scan de code met je camera.',
      'Send to your TV': 'Naar je tv sturen', 'Photos, GIFs and short videos become wallpapers under My photos. Landscape fills the screen best.': 'Foto’s, gifs en korte video’s worden achtergronden onder Mijn foto’s. Liggend vult het scherm het best.',
      'Choose photos': 'Foto’s kiezen', 'My photos': 'Mijn foto’s', 'Nothing here yet.': 'Nog niets.', 'Remove all': 'Alles verwijderen', 'Weather place': 'Plaats voor het weer',
      'The clock shows the weather for this city. Leave it empty to use the TV’s time zone.': 'De klok toont het weer voor deze stad. Laat leeg om de tijdzone van de tv te gebruiken.',
      'Save': 'Opslaan', 'Works on your home Wi-Fi only. Nothing leaves your network.': 'Werkt alleen op je wifi thuis. Niets verlaat je netwerk.',
      'Sending…': 'Versturen…', 'Sent': 'Verstuurd', 'Failed': 'Mislukt', 'Saved': 'Opgeslagen', 'Removed': 'Verwijderd', 'Remove all your photos from the TV?': 'Al je foto’s van de tv verwijderen?', 'Install as an app': 'Als app installeren', 'Remove this photo?': 'Deze foto verwijderen?', 'Frame it for your TV': 'Uitsnijden voor je tv', 'Drag to move. Pinch or use the slider to zoom.': 'Sleep om te verplaatsen. Knijp of gebruik de schuifregelaar om te zoomen.', 'Skip': 'Overslaan', 'Whole photo': 'Hele foto', 'Send': 'Versturen', 'Skipped': 'Overgeslagen', 'of': 'van' },
    pl: { 'Photos': 'Zdjęcia', 'TV settings': 'Ustawienia TV', 'Apps': 'Aplikacje', 'Open Shore on the TV to change its settings from here.': 'Otwórz Shore na telewizorze, aby zmieniać ustawienia stąd.', 'Connecting to your TV…': 'Łączenie z telewizorem…', 'Connected to your TV': 'Połączono z telewizorem', 'Your TV is not reachable': 'Telewizor jest niedostępny',
      'Pair this phone': 'Sparuj ten telefon', 'On the TV, open Shore › Settings › Phone and scan the code with your camera.': 'Na telewizorze otwórz Shore › Ustawienia › Telefon i zeskanuj kod aparatem.',
      'Send to your TV': 'Wyślij na telewizor', 'Photos, GIFs and short videos become wallpapers under My photos. Landscape fills the screen best.': 'Zdjęcia, GIF-y i krótkie filmy stają się tapetami w Moich zdjęciach. Poziome najlepiej wypełniają ekran.',
      'Choose photos': 'Wybierz zdjęcia', 'My photos': 'Moje zdjęcia', 'Nothing here yet.': 'Jeszcze nic tu nie ma.', 'Remove all': 'Usuń wszystkie', 'Weather place': 'Miejsce pogody',
      'The clock shows the weather for this city. Leave it empty to use the TV’s time zone.': 'Zegar pokazuje pogodę dla tego miasta. Zostaw puste, aby użyć strefy czasowej telewizora.',
      'Save': 'Zapisz', 'Works on your home Wi-Fi only. Nothing leaves your network.': 'Działa tylko w domowej sieci Wi-Fi. Nic nie opuszcza Twojej sieci.',
      'Sending…': 'Wysyłanie…', 'Sent': 'Wysłano', 'Failed': 'Błąd', 'Saved': 'Zapisano', 'Removed': 'Usunięto', 'Remove all your photos from the TV?': 'Usunąć wszystkie Twoje zdjęcia z telewizora?', 'Install as an app': 'Zainstaluj jako aplikację', 'Remove this photo?': 'Usunąć to zdjęcie?', 'Frame it for your TV': 'Kadruj dla telewizora', 'Drag to move. Pinch or use the slider to zoom.': 'Przeciągnij, aby przesunąć. Uszczypnij lub użyj suwaka, aby powiększyć.', 'Skip': 'Pomiń', 'Whole photo': 'Całe zdjęcie', 'Send': 'Wyślij', 'Skipped': 'Pominięto', 'of': 'z' }
  };
  var lang = String((navigator.languages && navigator.languages[0]) || navigator.language || 'en').toLowerCase().split('-')[0];
  var dict = STR[lang] || {};
  function T(s) { return dict[s] || s; }
  function $(id) { return document.getElementById(id); }
  if (STR[lang]) document.documentElement.lang = lang;
  Array.prototype.forEach.call(document.querySelectorAll('[data-t]'), function (el) { el.textContent = T(el.getAttribute('data-t')); });

  var KEY = 'shore.companion.key', key = '';
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  var hash = /[#&]k=([A-Za-z0-9_-]{16,})/.exec(location.hash);
  try { if (hash) localStorage.setItem(KEY, hash[1]); key = localStorage.getItem(KEY) || ''; } catch (e) { key = hash ? hash[1] : ''; }
  if (hash) history.replaceState(null, '', location.pathname);

  var toastTimer = 0;
  function toast(text) { var t = $('toast'); t.textContent = text; t.className = 'toast show'; clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.className = 'toast'; }, 2600); }
  function api(path, options) {
    options = options || {};
    options.headers = options.headers || {};
    options.headers['X-Shore-Key'] = key;
    return fetch('/api/' + path, options).then(function (r) {
      if (r.status === 401) { paired(false); throw new Error('pair'); }
      if (!r.ok) return r.text().then(function (t) { throw new Error(t || r.status); });
      return r.json();
    });
  }
  function paired(on) { $('paired').hidden = !on; $('unpaired').hidden = on; }
  function show(info) {
    $('status').textContent = T('Connected to your TV');
    $('count').textContent = info.count + ' / ' + info.max;
    if (document.activeElement !== $('place')) $('place').value = info.place || '';
    $('empty').hidden = info.photos.length > 0;
    $('clear').hidden = !info.photos.length;
    var grid = $('grid'); grid.innerHTML = '';
    info.photos.forEach(function (name) {
      var tile = document.createElement('div'), src = '/api/photo/' + name + '?k=' + encodeURIComponent(key), media, del;
      tile.className = 'tile';
      if (/\.mp4$/.test(name)) { media = document.createElement('video'); media.muted = true; media.loop = true; media.autoplay = true; media.playsInline = true; media.setAttribute('playsinline', ''); }
      else { media = document.createElement('img'); media.loading = 'lazy'; media.alt = ''; }
      media.src = src; tile.appendChild(media);
      del = document.createElement('button'); del.type = 'button'; del.textContent = '×'; del.setAttribute('aria-label', T('Remove this photo?'));
      del.onclick = function () { if (confirm(T('Remove this photo?'))) api('delete/' + name, { method: 'POST' }).then(function (i) { show(i); toast(T('Removed')); }); };
      tile.appendChild(del); grid.appendChild(tile);
    });
  }
  function load() {
    if (!key) { paired(false); $('status').textContent = T('Pair this phone'); return; }
    api('info').then(function (info) {
      paired(true); show(info);
      // This http page can't be installed; the HTTPS launcher on the website can, and brings the phone back here.
      if (info.install && /^https:\/\//.test(info.install) && !standalone) {
        $('installLink').href = info.install + '#tv=' + encodeURIComponent(location.origin) + '&k=' + encodeURIComponent(key);
        $('installLink').hidden = false;
      }
      var wall = $('wall'); wall.onload = function () { wall.className = 'ready'; }; wall.src = '/api/wallpaper?k=' + encodeURIComponent(key) + '&t=' + Date.now();
    }).catch(function (e) { if (e.message !== 'pair') $('status').textContent = T('Your TV is not reachable'); });
  }
  /* Crop: still photos open in a 16:9 frame (the TV's shape). Drag pans, pinch, wheel or the slider zoom.
     The crop is drawn at the photo's own resolution (at most 3840 px wide) and sent as JPEG. GIFs and videos go as they are. */
  var crop = { img: $('cropImg'), frame: $('cropFrame'), w: 0, h: 0, s: 1, min: 1, x: 0, y: 0, done: null, url: '' };
  function cropLayout() {
    var fw = crop.frame.clientWidth, fh = crop.frame.clientHeight;
    crop.s = Math.max(crop.min, Math.min(crop.min * 4, crop.s));
    crop.x = Math.min(0, Math.max(fw - crop.w * crop.s, crop.x));
    crop.y = Math.min(0, Math.max(fh - crop.h * crop.s, crop.y));
    crop.img.style.transform = 'translate(' + crop.x + 'px,' + crop.y + 'px) scale(' + crop.s + ')';
    $('cropZoom').value = String(crop.s / crop.min);
  }
  /* Zoom around a point in the frame, so what is under the fingers stays put. */
  function cropZoom(scale, px, py) {
    var old = crop.s;
    crop.s = Math.max(crop.min, Math.min(crop.min * 4, scale));
    crop.x = px - (px - crop.x) * crop.s / old; crop.y = py - (py - crop.y) * crop.s / old;
    cropLayout();
  }
  function cropFit() {
    var fw = crop.frame.clientWidth, fh = crop.frame.clientHeight;
    crop.min = Math.max(fw / crop.w, fh / crop.h); crop.s = crop.min;
    crop.x = (fw - crop.w * crop.s) / 2; crop.y = (fh - crop.h * crop.s) / 2;
    cropLayout();
  }
  function cropFinish(result) {
    var done = crop.done; crop.done = null;
    $('crop').hidden = true; document.body.style.overflow = '';
    if (crop.url) { URL.revokeObjectURL(crop.url); crop.url = ''; }
    if (done) done(result);
  }
  /* Resolves with a Blob (cropped), the File (whole photo) or null (skipped). */
  function askCrop(file, index, total, done) {
    crop.done = done; crop.url = URL.createObjectURL(file);
    $('cropCount').textContent = total > 1 ? (index + 1) + ' ' + T('of') + ' ' + total : '';
    crop.img.onload = function () {
      crop.w = crop.img.naturalWidth; crop.h = crop.img.naturalHeight;
      crop.img.style.width = crop.w + 'px'; crop.img.style.height = crop.h + 'px';
      $('crop').hidden = false; document.body.style.overflow = 'hidden';
      cropFit();
    };
    crop.img.onerror = function () { cropFinish(file); }; // the TV checks the file anyway
    crop.img.src = crop.url;
  }
  function cropBlob(file, done) {
    var fw = crop.frame.clientWidth, fh = crop.frame.clientHeight;
    var sx = -crop.x / crop.s, sy = -crop.y / crop.s, sw = fw / crop.s, sh = fh / crop.s;
    var out = Math.min(3840, Math.round(sw)), canvas = document.createElement('canvas');
    canvas.width = out; canvas.height = Math.round(out * 9 / 16);
    var g = canvas.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(crop.img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(function (blob) { done(blob || file); }, 'image/jpeg', 0.92);
  }
  (function () {
    var pts = {}, last = null;
    function list() { return Object.keys(pts).map(function (k) { return pts[k]; }); }
    function local(e) { var r = crop.frame.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function gesture() {
      var p = list();
      if (p.length === 1) return { x: p[0].x, y: p[0].y, d: 0 };
      return { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2, d: Math.sqrt(Math.pow(p[0].x - p[1].x, 2) + Math.pow(p[0].y - p[1].y, 2)) };
    }
    crop.frame.addEventListener('pointerdown', function (e) { crop.frame.setPointerCapture(e.pointerId); pts[e.pointerId] = local(e); last = gesture(); });
    crop.frame.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId]) return;
      pts[e.pointerId] = local(e);
      var g = gesture();
      if (last && list().length === (last.d ? 2 : 1)) {
        crop.x += g.x - last.x; crop.y += g.y - last.y;
        if (g.d && last.d) cropZoom(crop.s * g.d / last.d, g.x, g.y); else cropLayout();
      }
      last = g;
    });
    function up(e) { delete pts[e.pointerId]; last = list().length ? gesture() : null; }
    crop.frame.addEventListener('pointerup', up);
    crop.frame.addEventListener('pointercancel', up);
    crop.frame.addEventListener('wheel', function (e) { e.preventDefault(); var p = local(e); cropZoom(crop.s * Math.pow(1.0015, -e.deltaY), p.x, p.y); }, { passive: false });
    $('cropZoom').addEventListener('input', function () { cropZoom(crop.min * +this.value, crop.frame.clientWidth / 2, crop.frame.clientHeight / 2); });
    window.addEventListener('resize', function () { if (!$('crop').hidden) cropFit(); });
  })();
  var cropFile = null;
  function cropBusy(on) { ['cropSend', 'cropWhole', 'cropSkip'].forEach(function (id) { $(id).disabled = on; }); }
  $('cropSend').onclick = function () { cropBusy(true); cropBlob(cropFile, function (blob) { cropBusy(false); cropFinish(blob); }); };
  $('cropWhole').onclick = function () { cropFinish(cropFile); };
  $('cropSkip').onclick = function () { cropFinish(null); };
  function cropable(f) { return /^image\/(jpeg|png|webp)$/.test(f.type) && window.HTMLCanvasElement && HTMLCanvasElement.prototype.toBlob; }

  $('files').onchange = function () {
    var files = Array.prototype.slice.call(this.files), queue = $('queue'), input = this;
    var rows = files.map(function (f) { var li = document.createElement('li'); li.innerHTML = '<span></span><span></span>'; li.firstChild.textContent = f.name; li.lastChild.textContent = '…'; queue.appendChild(li); return li; });
    var i = 0, stills = files.filter(cropable), still = 0;
    (function next() {
      if (i >= files.length) { input.value = ''; setTimeout(function () { queue.innerHTML = ''; }, 4000); return; }
      var li = rows[i], f = files[i++];
      function send(body) {
        if (!body) { li.lastChild.textContent = T('Skipped'); next(); return; }
        li.lastChild.textContent = T('Sending…');
        api('upload', { method: 'POST', body: body }).then(function (info) { li.className = 'done'; li.lastChild.textContent = T('Sent'); show(info); })
          .catch(function (e) { li.className = 'failed'; li.lastChild.textContent = e.message === 'pair' ? T('Failed') : String(e.message).slice(0, 60) || T('Failed'); })
          .then(next);
      }
      if (cropable(f)) { cropFile = f; askCrop(f, still++, stills.length, send); } else send(f);
    })();
  };
  $('clear').onclick = function () { if (confirm(T('Remove all your photos from the TV?'))) api('clear', { method: 'POST' }).then(function (i) { show(i); toast(T('Removed')); }); };
  $('placeForm').onsubmit = function (e) {
    e.preventDefault();
    api('place?name=' + encodeURIComponent($('place').value.trim()), { method: 'POST' }).then(function (i) { show(i); toast(T('Saved')); }).catch(function () { toast(T('Failed')); });
  };
  /* ---------- TV settings and Apps: the same choices as on the TV, published by Shore itself ---------- */
  var model = null, modelText = '', tab = 'photos', pollTimer = 0, openGroups = {}, busy = 0;
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function setTab(name) {
    tab = name;
    Array.prototype.forEach.call(document.querySelectorAll('.tabs button'), function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-tab') === name)); });
    ['photos', 'tv', 'apps'].forEach(function (n) { $('tab-' + n).hidden = n !== name; });
    try { sessionStorage.setItem('shore.tab', name); } catch (e) { }
    if (name !== 'photos') refresh();
  }
  Array.prototype.forEach.call(document.querySelectorAll('.tabs button'), function (b) { b.onclick = function () { setTab(b.getAttribute('data-tab')); }; });
  function refresh() {
    clearTimeout(pollTimer);
    if (tab === 'photos' || document.hidden || !key) return;
    api('settings').then(function (m) { var text = JSON.stringify(m); if (!busy && text !== modelText) { modelText = text; model = m; draw(); } }).catch(function () { }).then(function () { pollTimer = setTimeout(refresh, 5000); });
  }
  /* Sends one choice; the TV applies it and publishes the new state, which arrives with the next read. */
  function set(axis, value, note) {
    busy++;
    return api('set?axis=' + encodeURIComponent(axis) + '&value=' + encodeURIComponent(value), { method: 'POST' })
      .then(function () { if (note) toast(note); })
      .catch(function (e) { toast(e.message === 'pair' ? T('Failed') : T('Open Shore on the TV to change its settings from here.')); })
      .then(function () { setTimeout(function () { busy--; refresh(); }, 450); });
  }
  function thumb(id) { return '/api/thumb/' + encodeURIComponent(id) + '?k=' + encodeURIComponent(key); }
  function control(item) {
    var row = el('div', 'set-row'), head = el('div', 'set-head'), opts;
    head.appendChild(el('span', 'set-name', item.name));
    row.appendChild(head);
    if (item.kind === 'toggle') {
      var sw = el('button', 'switch' + (item.value === 'on' ? ' on' : ''));
      sw.type = 'button'; sw.setAttribute('role', 'switch'); sw.setAttribute('aria-checked', String(item.value === 'on')); sw.setAttribute('aria-label', item.name);
      sw.onclick = function () { var v = item.value === 'on' ? 'off' : 'on'; item.value = v; sw.className = 'switch' + (v === 'on' ? ' on' : ''); sw.setAttribute('aria-checked', String(v === 'on')); set(item.id, v); };
      head.appendChild(sw); row.className += ' is-toggle';
      return row;
    }
    if (item.kind === 'wall') {
      opts = el('div', 'walls');
      item.options.forEach(function (o) {
        var b = el('button', 'wall' + (o.value === item.value ? ' on' : '')), img = el('img');
        b.type = 'button'; b.setAttribute('aria-label', o.label); b.title = o.label;
        img.loading = 'lazy'; img.alt = ''; img.src = thumb(o.value); img.onerror = function () { img.remove(); b.classList.add('no-thumb'); };
        b.appendChild(img); b.appendChild(el('span', '', o.label));
        b.onclick = function () { Array.prototype.forEach.call(opts.children, function (c) { c.classList.remove('on'); }); b.classList.add('on'); item.value = o.value; set('wall', o.value); };
        opts.appendChild(b);
      });
      row.appendChild(opts);
      setTimeout(function () { var on = opts.querySelector('.on'); if (on) opts.scrollLeft = on.offsetLeft - 16; }, 0);
      return row;
    }
    opts = el('div', 'chips' + (item.kind === 'list' ? ' is-list' : ''));
    item.options.forEach(function (o) {
      var b = el('button', 'chip' + (o.value === item.value ? ' on' : ''), o.label);
      b.type = 'button'; b.setAttribute('aria-pressed', String(o.value === item.value));
      b.onclick = function () {
        if (o.value === item.value) return;
        Array.prototype.forEach.call(opts.children, function (c) { c.classList.remove('on'); c.setAttribute('aria-pressed', 'false'); });
        b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); item.value = o.value; set(item.id, o.value);
      };
      opts.appendChild(b);
    });
    row.appendChild(opts);
    return row;
  }
  function draw() {
    var offline = !model || model.offline;
    $('tvOffline').hidden = !offline;
    var box = $('tvGroups'); box.innerHTML = '';
    if (offline) { $('homeList').innerHTML = ''; $('otherList').innerHTML = ''; return; }
    var start = el('button', 'button primary saver-start', model.labels.start);
    start.type = 'button'; start.onclick = function () { set('action', 'saver', T('Sent')); };
    box.appendChild(start);
    model.groups.forEach(function (g, gi) {
      var d = el('details', 'card group'), sum = el('summary', '', g.name);
      d.open = !!openGroups[g.name] || (gi === 0 && openGroups[g.name] === undefined);
      d.ontoggle = function () { openGroups[g.name] = d.open; };
      d.appendChild(sum);
      g.items.forEach(function (item) { d.appendChild(control(item)); });
      box.appendChild(d);
    });
    $('appsTitle').textContent = model.labels.apps; $('othersTitle').textContent = model.labels.more;
    $('appsCount').textContent = model.home.length + ' / ' + model.cap;
    var home = $('homeList'); home.innerHTML = '';
    model.home.forEach(function (a, i) {
      var li = el('li'), name = el('span', 'app-name', a.name), tools = el('span', 'app-tools');
      [['↑', 'home.up', i === 0], ['↓', 'home.down', i === model.home.length - 1], ['−', 'home.remove', model.home.length <= 1]].forEach(function (t) {
        var b = el('button', 'icon-button', t[0]); b.type = 'button'; b.disabled = t[2]; b.setAttribute('aria-label', t[1].slice(5) + ' ' + a.name);
        b.onclick = function () { set(t[1], a.id); };
        tools.appendChild(b);
      });
      li.appendChild(name); li.appendChild(tools); home.appendChild(li);
    });
    var others = $('otherList'); others.innerHTML = '';
    model.others.forEach(function (a) {
      var li = el('li'), name = el('span', 'app-name', a.name), b = el('button', 'icon-button', '+');
      b.type = 'button'; b.disabled = model.home.length >= model.cap; b.setAttribute('aria-label', 'add ' + a.name);
      b.onclick = function () { set('home.add', a.id); };
      li.appendChild(name); li.appendChild(b); others.appendChild(li);
    });
  }
  try { if (sessionStorage.getItem('shore.tab')) setTab(sessionStorage.getItem('shore.tab')); } catch (e) { }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { load(); refresh(); } });
  if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('/sw.js').catch(function () { });
  load();
})();
