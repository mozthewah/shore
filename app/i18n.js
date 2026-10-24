/* CleanFrame interface language. Follows the TV's system language (the WebView reports it as
   navigator.language); English is the source text and the fallback. ?lang=de overrides it in previews.
   T(s) translates a whole English string; composite messages are matched by RULES. */
(function (root) {
  var DICT = {
    de: {
      // Home and editor
      'Settings': 'Einstellungen', 'All apps': 'Alle Apps', 'Apps on Home': 'Apps auf Home', 'Other installed apps': 'Weitere installierte Apps',
      'Recently removed': 'Kürzlich entfernt', 'Add to Home': 'Zu Home hinzufügen', 'Remove from Home': 'Von Home entfernen', 'Home is full': 'Home ist voll',
      'Home holds nine apps. Remove one first.': 'Home fasst neun Apps. Entferne zuerst eine.', 'Home needs one app': 'Home braucht mindestens eine App',
      'On Home': 'Auf Home', 'Back cancels this change.': 'Zurück bricht diese Änderung ab.', 'Then scroll': 'Dann blättern',
      'Open CleanFrame on the TV to use this control.': 'Öffne CleanFrame auf dem Fernseher, um das zu nutzen.',
      'The web preview cannot control the TV.': 'Die Web-Vorschau kann den Fernseher nicht steuern.', 'Open Samsung’s Home screen': 'Samsungs Home-Bildschirm öffnen', 'Not on Home': 'Nicht auf Home', 'Open selected group': 'Ausgewählte Gruppe öffnen', 'with date': 'mit Datum', 'Always dimmed': 'Immer gedimmt', '1 app': '1 App', 'of': 'von', 'Add app': 'App hinzufügen', 'Arrange': 'Anordnen', 'Done': 'Fertig', 'Undo': 'Rückgängig', 'Nothing to undo': 'Nichts rückgängig zu machen',
      'Loading installed apps…': 'Installierte Apps werden geladen…', 'Could not read installed apps.': 'Installierte Apps konnten nicht gelesen werden.',
      'No installed apps found.': 'Keine installierten Apps gefunden.', 'These are the apps on your Home screen.': 'Das sind die Apps auf deinem Home-Bildschirm.',
      'No apps on Home': 'Keine Apps auf Home', 'Last app': 'Letzte App', 'Showing your first 8 Home apps.': 'Deine ersten 8 Home-Apps werden angezeigt.',
      'Leave Home?': 'Home verlassen?', 'Stay': 'Bleiben', 'Back': 'Zurück', 'Cancel': 'Abbrechen', 'Try again': 'Erneut versuchen', 'Preview': 'Vorschau',
      'Applied': 'Übernommen', 'The TV could not open this screen.': 'Der Fernseher konnte diesen Bildschirm nicht öffnen.',
      'Couldn’t save. Nothing changed.': 'Speichern fehlgeschlagen. Nichts wurde geändert.', 'Couldn’t save this change.': 'Diese Änderung konnte nicht gespeichert werden.',
      'Not saved. OK tries again.': 'Nicht gespeichert. OK versucht es erneut.', 'Couldn’t load this appearance.': 'Diese Darstellung konnte nicht geladen werden.',
      'Trending': 'Angesagt', 'Inputs': 'Eingänge', 'TV input': 'TV-Eingang',
      // Settings groups and pages
      'Appearance': 'Darstellung', 'Background': 'Hintergrund', 'Layout': 'Layout', 'Text': 'Text', 'Focus': 'Fokus', 'Clock': 'Uhr',
      'Night and idle': 'Nacht und Ruhe', 'Online wallpapers': 'Online-Hintergründe', 'Unsplash themes': 'Unsplash-Themen', 'Animated wallpapers': 'Animierte Hintergründe',
      'Rotation and motion': 'Wechsel und Bewegung', 'Rotation and online wallpapers': 'Wechsel und Online-Hintergründe', 'Remote buttons': 'Fernbedienungstasten',
      'Choose an app': 'App auswählen', 'Home and TV settings': 'Home- und TV-Einstellungen', 'Wallpaper': 'Hintergrundbild', 'Wallpaper rotation': 'Hintergrundwechsel',
      'Background type': 'Hintergrundart', 'App display': 'App-Anzeige', 'Home controls': 'Home-Steuerung', 'Font': 'Schrift', 'Text weight': 'Schriftstärke',
      'App name size': 'Größe der App-Namen', 'Format': 'Format', 'Date': 'Datum', 'Clock size': 'Uhrgröße', 'Clock weight': 'Uhr-Schriftstärke',
      'Night mode': 'Nachtmodus', 'Night hours': 'Nachtzeit', 'Night dimming': 'Nachtabdunklung', 'Hide controls when idle': 'Steuerung bei Inaktivität ausblenden',
      'Focus style': 'Fokusstil', 'Material': 'Material', 'Motion': 'Bewegung', 'Rotation': 'Wechsel', 'Apps': 'Apps', 'Online photos': 'Online-Fotos',
      'TV settings': 'TV-Einstellungen', 'Picture, sound and network settings': 'Bild-, Ton- und Netzwerkeinstellungen', 'Screensaver': 'Bildschirmschoner',
      'Google TV Home': 'Google TV Home', 'Open the Google TV Home screen': 'Den Google TV Home-Bildschirm öffnen',
      'Accessibility settings': 'Bedienungshilfen', 'Open accessibility settings': 'Bedienungshilfen öffnen',
      // Choices
      'Dark': 'Dunkel', 'Light': 'Hell', 'Light weight': 'Leicht', 'Photo': 'Foto', 'List': 'Liste', 'Dock': 'Dock', 'Shelf': 'Regal', 'Type': 'Schrift', 'Glass': 'Glas',
      'Soft': 'Weich', 'Frost': 'Frost', 'Clear tint': 'Klare Tönung', 'Icons': 'Symbole', 'Both': 'Beides', 'Icons and text': 'Symbole und Text',
      'First in Home': 'Vorne', 'Own row': 'Eigene Reihe', 'Still': 'Ruhig', 'Drift': 'Treiben', 'Auto': 'Auto', 'Thin': 'Dünn',
      'Regular': 'Normal', 'Bold': 'Fett', 'Small': 'Klein', 'Default': 'Standard', 'Large': 'Groß', 'Medium': 'Mittel', 'Huge': 'Riesig',
      '12-hour': '12 Stunden', '24-hour': '24 Stunden', 'Show': 'Anzeigen', 'Timed': 'Zeitgesteuert', 'Always': 'Immer', 'Strong': 'Stark', 'Off': 'Aus',
      'After 1 min': 'Nach 1 Min.', 'After 5 min': 'Nach 5 Min.', 'Fixed': 'Fest', 'Each time Home opens': 'Bei jedem Öffnen von Home',
      'Every 5 minutes': 'Alle 5 Minuten', 'Every 15 minutes': 'Alle 15 Minuten', 'Every hour': 'Jede Stunde',
      // Hints and notes
      'Apply selected setting': 'Ausgewählte Einstellung übernehmen', 'Apply selected photo': 'Ausgewähltes Foto übernehmen',
      'Choose a wallpaper': 'Hintergrundbild auswählen', 'Choose a rotation interval': 'Wechselintervall auswählen', 'Choose a wallpaper source': 'Quelle für Hintergründe auswählen',
      'Choose a font': 'Schrift auswählen', 'Show these sources': 'Diese Quellen anzeigen', 'Open on the TV': 'Auf dem Fernseher öffnen',
      'Retry this change': 'Diese Änderung wiederholen', 'Retry this photo': 'Dieses Foto erneut versuchen', 'Return to Background': 'Zurück zu Hintergrund',
      'Choose Glass focus or the Dock layout to use materials.': 'Wähle Glas-Fokus oder das Dock-Layout, um Materialien zu nutzen.',
      'Choose Photo in Background to use online wallpapers.': 'Wähle Foto unter Hintergrund, um Online-Hintergründe zu nutzen.',
      'Choose Photo in Background to use rotation and motion.': 'Wähle Foto unter Hintergrund, um Wechsel und Bewegung zu nutzen.',
      'Choose Photo to use wallpaper and rotation.': 'Wähle Foto, um Hintergrundbild und Wechsel zu nutzen.',
      'Materials are available with a Photo background.': 'Materialien gibt es nur mit Foto-Hintergrund.', 'Own row needs the Dock layout.': 'Eine eigene Reihe braucht das Dock-Layout.',
      'Timed changes pause while Settings or another panel is open.': 'Zeitgesteuerte Wechsel pausieren, solange Einstellungen oder ein anderes Fenster offen sind.',
      'The photo and its glass drift slowly together.': 'Foto und Glas treiben langsam gemeinsam.',
      'The clock and picture stay. Any button brings the controls back.': 'Uhr und Bild bleiben. Jede Taste holt die Steuerung zurück.',
      'New wallpapers arrive every few hours.': 'Alle paar Stunden kommen neue Hintergründe.', 'Downloading wallpapers…': 'Hintergründe werden geladen…',
      'Couldn’t reach this source. CleanFrame tries again later.': 'Diese Quelle ist nicht erreichbar. CleanFrame versucht es später erneut.',
      'No suitable landscape photos right now.': 'Gerade gibt es keine passenden Querformat-Fotos.', 'Online wallpapers off': 'Online-Hintergründe aus', 'Night mode off': 'Nachtmodus aus',
      // Wallpaper sources
      'NASA Astronomy Picture': 'NASA-Astronomiebild', 'Bing Picture of the Day': 'Bing-Bild des Tages', 'Wikimedia Picture of the Day': 'Wikimedia-Bild des Tages',
      'Random photos (Picsum)': 'Zufällige Fotos (Picsum)', 'Unsplash · Nature and landscapes': 'Unsplash · Natur und Landschaften',
      'Unsplash · Cities and architecture': 'Unsplash · Städte und Architektur', 'Unsplash · Night sky and space': 'Unsplash · Nachthimmel und Weltall',
      'Bundled loops': 'Mitgelieferte Loops', 'Pexels · Ocean waves': 'Pexels · Meereswellen', 'Pexels · Rain on glass': 'Pexels · Regen auf Glas',
      'Pexels · Clouds': 'Pexels · Wolken', 'Pexels · City at night': 'Pexels · Stadt bei Nacht', 'Klipy · Lofi': 'Klipy · Lofi',
      'Klipy · Cozy rain': 'Klipy · Gemütlicher Regen', 'Klipy · Space': 'Klipy · Weltall',
      // Remote buttons
      'Assign a button…': 'Taste zuweisen…', 'Assign remote buttons': 'Fernbedienungstasten zuweisen', 'Reassign the app and TV buttons': 'App- und TV-Tasten neu belegen',
      'Assign the app buttons or the TV button to something else.': 'Belege die App-Tasten oder die TV-Taste mit etwas anderem.',
      'Assigned buttons work everywhere, even inside apps.': 'Zugewiesene Tasten funktionieren überall, auch in Apps.',
      'Default keeps what the TV normally does.': 'Standard behält, was der Fernseher normalerweise tut.', 'Change what this button does': 'Ändern, was diese Taste tut',
      'Press a button on the remote…': 'Drücke eine Taste auf der Fernbedienung…', 'Then press the button to assign': 'Dann die zuzuweisende Taste drücken',
      'Waiting for a button. Any other key cancels.': 'Warte auf eine Taste. Jede andere Taste bricht ab.', 'Use this for the button': 'Für diese Taste verwenden',
      'CleanFrame Home': 'CleanFrame Home', 'Do nothing': 'Nichts tun', 'Does nothing': 'Tut nichts', 'An app': 'Eine App', 'App': 'App', 'Action': 'Aktion',
      'Unknown key': 'Unbekannte Taste', 'TV button': 'TV-Taste', 'Red button': 'Rote Taste', 'Green button': 'Grüne Taste', 'Yellow button': 'Gelbe Taste',
      'Blue button': 'Blaue Taste', 'Guide button': 'Guide-Taste', 'Input button': 'Eingangstaste', 'Settings button': 'Einstellungstaste',
      'Menu button': 'Menütaste', 'Bookmark button': 'Lesezeichentaste'
    }
  };
  /* Composite messages: [English pattern, translation with $1… placeholders]. Captured parts are translated too. */
  var RULES = {
    de: [
      [/^Return to (.+)$/, 'Zurück zu $1'], [/^Open ([^.]+)\?$/, '$1 öffnen?'], [/^Open ([^.]+)$/, '$1 öffnen'], [/^Trending on (.+)$/, 'Angesagt auf $1'],
      [/^Undone: (.+)\.$/, 'Rückgängig: $1.'], [/^Undo (.+)$/, '$1 rückgängig machen'], [/^Saved: (.+)$/, 'Gespeichert: $1'], [/^Not saved: (.+)$/, 'Nicht gespeichert: $1'],
      [/^Loading your choice…$/, 'Deine Auswahl wird geladen…'], [/^Loading (.+)…$/, '$1 wird geladen…'], [/^Loading (.+)$/, '$1 wird geladen'], [/^Applying (.+)$/, '$1 wird übernommen'], [/^Preparing (.+)$/, '$1 wird vorbereitet'],
      [/^Couldn’t load (.+)$/, '$1 konnte nicht geladen werden'], [/^Couldn’t save (.+)$/, '$1 konnte nicht gespeichert werden'], [/^Font kept: (.+)$/, 'Schrift beibehalten: $1'],
      [/^(.+) is in Recently removed\. OK puts it back\.$/, '$1 ist unter „Kürzlich entfernt“. OK holt die App zurück.'],
      [/^(.+) is on Home, position (\d+)\.$/, '$1 ist auf Home, Position $2.'], [/^(.+) moved to position (\d+)\.$/, '$1 ist jetzt auf Position $2.'],
      [/^(.+) stays installed\.$/, '$1 bleibt installiert.'], [/^Moving (.+)\. OK places it, Back puts it back\.$/, '$1 wird verschoben. OK setzt die App ab, Zurück bricht ab.'],
      [/^Dimmed (.+)$/, 'Gedimmt $1'], [/^(\d+) apps$/, '$1 Apps']
    ]
  };
  function pick() {
    var forced = /[?&]lang=([a-z]{2})/i.exec(root.location ? root.location.search : '');
    var nav = root.navigator || {}, tag = forced ? forced[1] : (nav.languages && nav.languages[0]) || nav.language || 'en';
    return String(tag).toLowerCase().split(/[-_]/)[0];
  }
  var lang = pick(), dict = DICT[lang] || null, rules = RULES[lang] || [], has = Object.prototype.hasOwnProperty;
  function T(s) {
    if (!dict || typeof s !== 'string' || !s) return s;
    if (has.call(dict, s)) return dict[s];
    for (var i = 0; i < rules.length; i++) {
      var m = rules[i][0].exec(s);
      if (m) return rules[i][1].replace(/\$(\d)/g, function (all, n) { return T(m[+n]); });
    }
    // Summaries such as "Glass, Soft" translate part by part.
    if (s.indexOf(', ') > 0) return s.split(', ').map(T).join(', ');
    return s;
  }
  root.CleanFrameI18n = { lang: dict ? lang : 'en', T: T };
  if (root.document && dict) root.document.documentElement.lang = lang;
})(this);
