/* Shore Companion. The pairing key arrives once in the QR link (#k=…), is kept in localStorage and sent with every API call. */
(function () {
  'use strict';
  var STR = {
    de: { 'Connecting to your TV…': 'Verbinde mit deinem Fernseher…', 'Connected to your TV': 'Mit deinem Fernseher verbunden', 'Your TV is not reachable': 'Dein Fernseher ist nicht erreichbar',
      'Pair this phone': 'Dieses Handy koppeln', 'On the TV, open Shore › Settings › Phone and scan the code with your camera.': 'Öffne am Fernseher Shore › Einstellungen › Handy und scanne den Code mit der Kamera.',
      'Send to your TV': 'An den Fernseher senden', 'Photos, GIFs and short videos become wallpapers under My photos. Landscape fills the screen best.': 'Fotos, GIFs und kurze Videos werden zu Hintergründen unter „Meine Fotos“. Querformat füllt den Bildschirm am besten.',
      'Choose photos': 'Fotos auswählen', 'My photos': 'Meine Fotos', 'Nothing here yet.': 'Noch nichts hier.', 'Remove all': 'Alle entfernen', 'Weather place': 'Ort fürs Wetter',
      'The clock shows the weather for this city. Leave it empty to use the TV’s time zone.': 'Die Uhr zeigt das Wetter für diese Stadt. Leer lassen, um die Zeitzone des Fernsehers zu nutzen.',
      'Save': 'Speichern', 'Works on your home Wi-Fi only. Nothing leaves your network.': 'Funktioniert nur im Heim-WLAN. Nichts verlässt dein Netzwerk.',
      'Sending…': 'Wird gesendet…', 'Sent': 'Gesendet', 'Failed': 'Fehlgeschlagen', 'Saved': 'Gespeichert', 'Removed': 'Entfernt', 'Remove all your photos from the TV?': 'Alle deine Fotos vom Fernseher entfernen?', 'Remove this photo?': 'Dieses Foto entfernen?' },
    fr: { 'Connecting to your TV…': 'Connexion au téléviseur…', 'Connected to your TV': 'Connecté au téléviseur', 'Your TV is not reachable': 'Téléviseur injoignable',
      'Pair this phone': 'Associer ce téléphone', 'On the TV, open Shore › Settings › Phone and scan the code with your camera.': 'Sur le téléviseur, ouvrez Shore › Réglages › Téléphone et scannez le code avec l’appareil photo.',
      'Send to your TV': 'Envoyer au téléviseur', 'Photos, GIFs and short videos become wallpapers under My photos. Landscape fills the screen best.': 'Photos, GIF et courtes vidéos deviennent des fonds dans Mes photos. Le format paysage remplit mieux l’écran.',
      'Choose photos': 'Choisir des photos', 'My photos': 'Mes photos', 'Nothing here yet.': 'Rien pour l’instant.', 'Remove all': 'Tout supprimer', 'Weather place': 'Lieu pour la météo',
      'The clock shows the weather for this city. Leave it empty to use the TV’s time zone.': 'L’horloge affiche la météo de cette ville. Laissez vide pour utiliser le fuseau horaire du téléviseur.',
      'Save': 'Enregistrer', 'Works on your home Wi-Fi only. Nothing leaves your network.': 'Fonctionne uniquement sur votre Wi-Fi. Rien ne quitte votre réseau.',
      'Sending…': 'Envoi…', 'Sent': 'Envoyé', 'Failed': 'Échec', 'Saved': 'Enregistré', 'Removed': 'Supprimé', 'Remove all your photos from the TV?': 'Supprimer toutes vos photos du téléviseur ?', 'Remove this photo?': 'Supprimer cette photo ?' },
    es: { 'Connecting to your TV…': 'Conectando con tu televisor…', 'Connected to your TV': 'Conectado a tu televisor', 'Your TV is not reachable': 'No se puede acceder al televisor',
      'Pair this phone': 'Vincular este móvil', 'On the TV, open Shore › Settings › Phone and scan the code with your camera.': 'En el televisor, abre Shore › Ajustes › Móvil y escanea el código con la cámara.',
      'Send to your TV': 'Enviar al televisor', 'Photos, GIFs and short videos become wallpapers under My photos. Landscape fills the screen best.': 'Las fotos, GIF y vídeos cortos se convierten en fondos en Mis fotos. El formato horizontal llena mejor la pantalla.',
      'Choose photos': 'Elegir fotos', 'My photos': 'Mis fotos', 'Nothing here yet.': 'Aún no hay nada.', 'Remove all': 'Quitar todo', 'Weather place': 'Lugar del tiempo',
      'The clock shows the weather for this city. Leave it empty to use the TV’s time zone.': 'El reloj muestra el tiempo de esta ciudad. Déjalo vacío para usar la zona horaria del televisor.',
      'Save': 'Guardar', 'Works on your home Wi-Fi only. Nothing leaves your network.': 'Solo funciona en tu Wi-Fi. Nada sale de tu red.',
      'Sending…': 'Enviando…', 'Sent': 'Enviado', 'Failed': 'Error', 'Saved': 'Guardado', 'Removed': 'Quitado', 'Remove all your photos from the TV?': '¿Quitar todas tus fotos del televisor?', 'Remove this photo?': '¿Quitar esta foto?' },
    nl: { 'Connecting to your TV…': 'Verbinden met je tv…', 'Connected to your TV': 'Verbonden met je tv', 'Your TV is not reachable': 'Je tv is niet bereikbaar',
      'Pair this phone': 'Deze telefoon koppelen', 'On the TV, open Shore › Settings › Phone and scan the code with your camera.': 'Open op de tv Shore › Instellingen › Telefoon en scan de code met je camera.',
      'Send to your TV': 'Naar je tv sturen', 'Photos, GIFs and short videos become wallpapers under My photos. Landscape fills the screen best.': 'Foto’s, gifs en korte video’s worden achtergronden onder Mijn foto’s. Liggend vult het scherm het best.',
      'Choose photos': 'Foto’s kiezen', 'My photos': 'Mijn foto’s', 'Nothing here yet.': 'Nog niets.', 'Remove all': 'Alles verwijderen', 'Weather place': 'Plaats voor het weer',
      'The clock shows the weather for this city. Leave it empty to use the TV’s time zone.': 'De klok toont het weer voor deze stad. Laat leeg om de tijdzone van de tv te gebruiken.',
      'Save': 'Opslaan', 'Works on your home Wi-Fi only. Nothing leaves your network.': 'Werkt alleen op je wifi thuis. Niets verlaat je netwerk.',
      'Sending…': 'Versturen…', 'Sent': 'Verstuurd', 'Failed': 'Mislukt', 'Saved': 'Opgeslagen', 'Removed': 'Verwijderd', 'Remove all your photos from the TV?': 'Al je foto’s van de tv verwijderen?', 'Remove this photo?': 'Deze foto verwijderen?' },
    pl: { 'Connecting to your TV…': 'Łączenie z telewizorem…', 'Connected to your TV': 'Połączono z telewizorem', 'Your TV is not reachable': 'Telewizor jest niedostępny',
      'Pair this phone': 'Sparuj ten telefon', 'On the TV, open Shore › Settings › Phone and scan the code with your camera.': 'Na telewizorze otwórz Shore › Ustawienia › Telefon i zeskanuj kod aparatem.',
      'Send to your TV': 'Wyślij na telewizor', 'Photos, GIFs and short videos become wallpapers under My photos. Landscape fills the screen best.': 'Zdjęcia, GIF-y i krótkie filmy stają się tapetami w Moich zdjęciach. Poziome najlepiej wypełniają ekran.',
      'Choose photos': 'Wybierz zdjęcia', 'My photos': 'Moje zdjęcia', 'Nothing here yet.': 'Jeszcze nic tu nie ma.', 'Remove all': 'Usuń wszystkie', 'Weather place': 'Miejsce pogody',
      'The clock shows the weather for this city. Leave it empty to use the TV’s time zone.': 'Zegar pokazuje pogodę dla tego miasta. Zostaw puste, aby użyć strefy czasowej telewizora.',
      'Save': 'Zapisz', 'Works on your home Wi-Fi only. Nothing leaves your network.': 'Działa tylko w domowej sieci Wi-Fi. Nic nie opuszcza Twojej sieci.',
      'Sending…': 'Wysyłanie…', 'Sent': 'Wysłano', 'Failed': 'Błąd', 'Saved': 'Zapisano', 'Removed': 'Usunięto', 'Remove all your photos from the TV?': 'Usunąć wszystkie Twoje zdjęcia z telewizora?', 'Remove this photo?': 'Usunąć to zdjęcie?' }
  };
  var lang = String((navigator.languages && navigator.languages[0]) || navigator.language || 'en').toLowerCase().split('-')[0];
  var dict = STR[lang] || {};
  function T(s) { return dict[s] || s; }
  function $(id) { return document.getElementById(id); }
  if (STR[lang]) document.documentElement.lang = lang;
  Array.prototype.forEach.call(document.querySelectorAll('[data-t]'), function (el) { el.textContent = T(el.getAttribute('data-t')); });

  var KEY = 'shore.companion.key', key = '';
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
      var wall = $('wall'); wall.onload = function () { wall.className = 'ready'; }; wall.src = '/api/wallpaper?k=' + encodeURIComponent(key) + '&t=' + Date.now();
    }).catch(function (e) { if (e.message !== 'pair') $('status').textContent = T('Your TV is not reachable'); });
  }
  $('files').onchange = function () {
    var files = Array.prototype.slice.call(this.files), queue = $('queue'), input = this;
    var rows = files.map(function (f) { var li = document.createElement('li'); li.innerHTML = '<span></span><span></span>'; li.firstChild.textContent = f.name; li.lastChild.textContent = T('Sending…'); queue.appendChild(li); return li; });
    var i = 0;
    (function next() {
      if (i >= files.length) { input.value = ''; setTimeout(function () { queue.innerHTML = ''; }, 4000); return; }
      var li = rows[i], f = files[i++];
      api('upload', { method: 'POST', body: f }).then(function (info) { li.className = 'done'; li.lastChild.textContent = T('Sent'); show(info); })
        .catch(function (e) { li.className = 'failed'; li.lastChild.textContent = e.message === 'pair' ? T('Failed') : String(e.message).slice(0, 60) || T('Failed'); })
        .then(next);
    })();
  };
  $('clear').onclick = function () { if (confirm(T('Remove all your photos from the TV?'))) api('clear', { method: 'POST' }).then(function (i) { show(i); toast(T('Removed')); }); };
  $('placeForm').onsubmit = function (e) {
    e.preventDefault();
    api('place?name=' + encodeURIComponent($('place').value.trim()), { method: 'POST' }).then(function (i) { show(i); toast(T('Saved')); }).catch(function () { toast(T('Failed')); });
  };
  document.addEventListener('visibilitychange', function () { if (!document.hidden) load(); });
  if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('/sw.js').catch(function () { });
  load();
})();
