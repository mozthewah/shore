/* Shore Companion. The pairing key arrives once in the QR link (#k=…), is kept in localStorage and sent with every API call. */
(function () {
  'use strict';
  var STR = {
    de: { 'Use the remote in every app': 'Fernbedienung in jeder App', 'Pair Shore once with the TV’s own remote service. The TV shows a code; type it here.': 'Kopple Shore einmal mit dem Fernbedienungsdienst des Fernsehers. Der Fernseher zeigt einen Code; gib ihn hier ein.', 'Pair': 'Koppeln', 'Enter the code shown on the TV': 'Code vom Fernseher eingeben', 'Confirm': 'Bestätigen', 'Works in every app.': 'Funktioniert in jeder App.', 'Unpair': 'Entkoppeln', 'Paired. The remote now works in every app.': 'Gekoppelt. Die Fernbedienung funktioniert jetzt in jeder App.', 'That code didn’t match. Check the TV and try again.': 'Der Code passt nicht. Schau auf den Fernseher und versuch es noch einmal.', 'The TV’s remote service isn’t available.': 'Der Fernbedienungsdienst des Fernsehers ist nicht erreichbar.', 'Couldn’t pair. Try again.': 'Koppeln fehlgeschlagen. Versuch es noch einmal.', 'Pair below to use the arrows in other apps.': 'Kopple unten, um die Pfeile in anderen Apps zu nutzen.', 'News feed': 'Nachrichtenquelle', 'Headlines under the clock come from this RSS or Atom feed. Leave it empty for Google News top stories in the TV’s language.': 'Die Schlagzeilen unter der Uhr kommen aus diesem RSS- oder Atom-Feed. Leer lassen für die Top-Meldungen von Google News in der Sprache des Fernsehers.', 'That isn’t a web address.': 'Das ist keine Webadresse.', 'Remote': 'Fernbedienung', 'Back': 'Zurück', 'Home': 'Home', 'Arrows and OK control Shore. In other apps they need Android 13 or later and Shore’s remote-button service.': 'Pfeile und OK steuern Shore. In anderen Apps brauchen sie Android 13 oder neuer und Shores Tastendienst.', 'Open Shore on the TV to use the arrows here.': 'Öffne Shore am Fernseher, um die Pfeile hier zu nutzen.', 'Turn on Shore’s remote-button service on the TV for this.': 'Schalte dafür Shores Tastendienst am Fernseher ein.', 'Backup': 'Sicherung', 'Save every TV setting to this phone, then restore it later or on another TV. Photos stay on the TV.': 'Speichere alle TV-Einstellungen auf diesem Handy und stelle sie später oder auf einem anderen Fernseher wieder her. Fotos bleiben auf dem Fernseher.', 'Save backup': 'Sicherung speichern', 'Restore…': 'Wiederherstellen…', 'This isn’t a Shore backup.': 'Das ist keine Shore-Sicherung.', 'Replace the TV’s settings with this backup?': 'Die Einstellungen des Fernsehers durch diese Sicherung ersetzen?', 'Restored': 'Wiederhergestellt', 'Photos': 'Fotos', 'TV settings': 'Einstellungen', 'Apps': 'Apps', 'Open Shore on the TV to change its settings from here.': 'Öffne Shore am Fernseher, um die Einstellungen von hier zu ändern.', 'Connecting to your TV…': 'Verbinde mit deinem Fernseher…', 'Connected to your TV': 'Mit deinem Fernseher verbunden', 'Your TV is not reachable': 'Dein Fernseher ist nicht erreichbar',
      'Pair this phone': 'Dieses Handy koppeln', 'On the TV, open Shore › Settings › Phone and scan the code with your camera.': 'Öffne am Fernseher Shore › Einstellungen › Handy und scanne den Code mit der Kamera.',
      'Send to your TV': 'An den Fernseher senden', 'Photos, GIFs and short videos become wallpapers under My photos. Landscape fills the screen best.': 'Fotos, GIFs und kurze Videos werden zu Hintergründen unter „Meine Fotos“. Querformat füllt den Bildschirm am besten.',
      'Choose photos': 'Fotos auswählen', 'My photos': 'Meine Fotos', 'Nothing here yet.': 'Noch nichts hier.', 'Remove all': 'Alle entfernen', 'Weather place': 'Ort fürs Wetter',
      'The clock shows the weather for this city. Leave it empty to use the TV’s time zone.': 'Die Uhr zeigt das Wetter für diese Stadt. Leer lassen, um die Zeitzone des Fernsehers zu nutzen.',
      'Save': 'Speichern', 'Works on your home Wi-Fi only. Nothing leaves your network.': 'Funktioniert nur im Heim-WLAN. Nichts verlässt dein Netzwerk.',
      'Sending…': 'Wird gesendet…', 'Sent': 'Gesendet', 'Failed': 'Fehlgeschlagen', 'Saved': 'Gespeichert', 'Removed': 'Entfernt', 'Remove all your photos from the TV?': 'Alle deine Fotos vom Fernseher entfernen?', 'Install as an app': 'Als App installieren', 'Remove this photo?': 'Dieses Foto entfernen?', 'Frame it for your TV': 'Für den Fernseher zuschneiden', 'Drag to move. Pinch or use the slider to zoom.': 'Zum Verschieben ziehen. Zum Zoomen mit zwei Fingern oder dem Regler.', 'Skip': 'Überspringen', 'Whole photo': 'Ganzes Foto', 'Send': 'Senden', 'Skipped': 'Übersprungen', 'of': 'von' },
    fr: { 'Use the remote in every app': 'La télécommande dans toutes les applis', 'Pair Shore once with the TV’s own remote service. The TV shows a code; type it here.': 'Associez Shore une fois au service de télécommande du téléviseur. Le téléviseur affiche un code ; saisissez-le ici.', 'Pair': 'Associer', 'Enter the code shown on the TV': 'Saisissez le code affiché sur le téléviseur', 'Confirm': 'Confirmer', 'Works in every app.': 'Fonctionne dans toutes les applis.', 'Unpair': 'Dissocier', 'Paired. The remote now works in every app.': 'Associé. La télécommande fonctionne maintenant dans toutes les applis.', 'That code didn’t match. Check the TV and try again.': 'Ce code ne correspond pas. Vérifiez le téléviseur et réessayez.', 'The TV’s remote service isn’t available.': 'Le service de télécommande du téléviseur est indisponible.', 'Couldn’t pair. Try again.': 'Association impossible. Réessayez.', 'Pair below to use the arrows in other apps.': 'Associez ci-dessous pour utiliser les flèches dans les autres applis.', 'News feed': 'Flux d’actualités', 'Headlines under the clock come from this RSS or Atom feed. Leave it empty for Google News top stories in the TV’s language.': 'Les titres sous l’horloge viennent de ce flux RSS ou Atom. Laissez vide pour les gros titres de Google News dans la langue du téléviseur.', 'That isn’t a web address.': 'Ce n’est pas une adresse web.', 'Remote': 'Télécommande', 'Back': 'Retour', 'Home': 'Accueil', 'Arrows and OK control Shore. In other apps they need Android 13 or later and Shore’s remote-button service.': 'Les flèches et OK pilotent Shore. Dans les autres applis, il faut Android 13 ou plus et le service de boutons de Shore.', 'Open Shore on the TV to use the arrows here.': 'Ouvrez Shore sur le téléviseur pour utiliser les flèches ici.', 'Turn on Shore’s remote-button service on the TV for this.': 'Activez pour cela le service de boutons de Shore sur le téléviseur.', 'Backup': 'Sauvegarde', 'Save every TV setting to this phone, then restore it later or on another TV. Photos stay on the TV.': 'Enregistrez tous les réglages du téléviseur sur ce téléphone, puis restaurez-les plus tard ou sur un autre téléviseur. Les photos restent sur le téléviseur.', 'Save backup': 'Enregistrer la sauvegarde', 'Restore…': 'Restaurer…', 'This isn’t a Shore backup.': 'Ce n’est pas une sauvegarde Shore.', 'Replace the TV’s settings with this backup?': 'Remplacer les réglages du téléviseur par cette sauvegarde ?', 'Restored': 'Restauré', 'Photos': 'Photos', 'TV settings': 'Réglages TV', 'Apps': 'Apps', 'Open Shore on the TV to change its settings from here.': 'Ouvrez Shore sur le téléviseur pour modifier ses réglages d’ici.', 'Connecting to your TV…': 'Connexion au téléviseur…', 'Connected to your TV': 'Connecté au téléviseur', 'Your TV is not reachable': 'Téléviseur injoignable',
      'Pair this phone': 'Associer ce téléphone', 'On the TV, open Shore › Settings › Phone and scan the code with your camera.': 'Sur le téléviseur, ouvrez Shore › Réglages › Téléphone et scannez le code avec l’appareil photo.',
      'Send to your TV': 'Envoyer au téléviseur', 'Photos, GIFs and short videos become wallpapers under My photos. Landscape fills the screen best.': 'Photos, GIF et courtes vidéos deviennent des fonds dans Mes photos. Le format paysage remplit mieux l’écran.',
      'Choose photos': 'Choisir des photos', 'My photos': 'Mes photos', 'Nothing here yet.': 'Rien pour l’instant.', 'Remove all': 'Tout supprimer', 'Weather place': 'Lieu pour la météo',
      'The clock shows the weather for this city. Leave it empty to use the TV’s time zone.': 'L’horloge affiche la météo de cette ville. Laissez vide pour utiliser le fuseau horaire du téléviseur.',
      'Save': 'Enregistrer', 'Works on your home Wi-Fi only. Nothing leaves your network.': 'Fonctionne uniquement sur votre Wi-Fi. Rien ne quitte votre réseau.',
      'Sending…': 'Envoi…', 'Sent': 'Envoyé', 'Failed': 'Échec', 'Saved': 'Enregistré', 'Removed': 'Supprimé', 'Remove all your photos from the TV?': 'Supprimer toutes vos photos du téléviseur ?', 'Install as an app': 'Installer comme app', 'Remove this photo?': 'Supprimer cette photo ?', 'Frame it for your TV': 'Cadrer pour le téléviseur', 'Drag to move. Pinch or use the slider to zoom.': 'Faites glisser pour déplacer. Pincez ou utilisez le curseur pour zoomer.', 'Skip': 'Ignorer', 'Whole photo': 'Photo entière', 'Send': 'Envoyer', 'Skipped': 'Ignorée', 'of': 'sur' },
    es: { 'Use the remote in every app': 'El mando en todas las apps', 'Pair Shore once with the TV’s own remote service. The TV shows a code; type it here.': 'Vincula Shore una vez con el servicio de mando del televisor. El televisor muestra un código; escríbelo aquí.', 'Pair': 'Vincular', 'Enter the code shown on the TV': 'Escribe el código que muestra el televisor', 'Confirm': 'Confirmar', 'Works in every app.': 'Funciona en todas las apps.', 'Unpair': 'Desvincular', 'Paired. The remote now works in every app.': 'Vinculado. El mando ya funciona en todas las apps.', 'That code didn’t match. Check the TV and try again.': 'El código no coincide. Mira el televisor e inténtalo de nuevo.', 'The TV’s remote service isn’t available.': 'El servicio de mando del televisor no está disponible.', 'Couldn’t pair. Try again.': 'No se pudo vincular. Inténtalo de nuevo.', 'Pair below to use the arrows in other apps.': 'Vincula abajo para usar las flechas en otras apps.', 'News feed': 'Fuente de noticias', 'Headlines under the clock come from this RSS or Atom feed. Leave it empty for Google News top stories in the TV’s language.': 'Los titulares bajo el reloj vienen de este feed RSS o Atom. Déjalo vacío para ver las noticias principales de Google News en el idioma del televisor.', 'That isn’t a web address.': 'Eso no es una dirección web.', 'Remote': 'Mando', 'Back': 'Atrás', 'Home': 'Inicio', 'Arrows and OK control Shore. In other apps they need Android 13 or later and Shore’s remote-button service.': 'Las flechas y OK controlan Shore. En otras apps necesitan Android 13 o posterior y el servicio de botones de Shore.', 'Open Shore on the TV to use the arrows here.': 'Abre Shore en el televisor para usar aquí las flechas.', 'Turn on Shore’s remote-button service on the TV for this.': 'Para esto, activa el servicio de botones de Shore en el televisor.', 'Backup': 'Copia de seguridad', 'Save every TV setting to this phone, then restore it later or on another TV. Photos stay on the TV.': 'Guarda todos los ajustes del televisor en este móvil y restáuralos más tarde o en otro televisor. Las fotos se quedan en el televisor.', 'Save backup': 'Guardar copia', 'Restore…': 'Restaurar…', 'This isn’t a Shore backup.': 'Esto no es una copia de Shore.', 'Replace the TV’s settings with this backup?': '¿Sustituir los ajustes del televisor por esta copia?', 'Restored': 'Restaurado', 'Photos': 'Fotos', 'TV settings': 'Ajustes de TV', 'Apps': 'Apps', 'Open Shore on the TV to change its settings from here.': 'Abre Shore en el televisor para cambiar sus ajustes desde aquí.', 'Connecting to your TV…': 'Conectando con tu televisor…', 'Connected to your TV': 'Conectado a tu televisor', 'Your TV is not reachable': 'No se puede acceder al televisor',
      'Pair this phone': 'Vincular este móvil', 'On the TV, open Shore › Settings › Phone and scan the code with your camera.': 'En el televisor, abre Shore › Ajustes › Móvil y escanea el código con la cámara.',
      'Send to your TV': 'Enviar al televisor', 'Photos, GIFs and short videos become wallpapers under My photos. Landscape fills the screen best.': 'Las fotos, GIF y vídeos cortos se convierten en fondos en Mis fotos. El formato horizontal llena mejor la pantalla.',
      'Choose photos': 'Elegir fotos', 'My photos': 'Mis fotos', 'Nothing here yet.': 'Aún no hay nada.', 'Remove all': 'Quitar todo', 'Weather place': 'Lugar del tiempo',
      'The clock shows the weather for this city. Leave it empty to use the TV’s time zone.': 'El reloj muestra el tiempo de esta ciudad. Déjalo vacío para usar la zona horaria del televisor.',
      'Save': 'Guardar', 'Works on your home Wi-Fi only. Nothing leaves your network.': 'Solo funciona en tu Wi-Fi. Nada sale de tu red.',
      'Sending…': 'Enviando…', 'Sent': 'Enviado', 'Failed': 'Error', 'Saved': 'Guardado', 'Removed': 'Quitado', 'Remove all your photos from the TV?': '¿Quitar todas tus fotos del televisor?', 'Install as an app': 'Instalar como app', 'Remove this photo?': '¿Quitar esta foto?', 'Frame it for your TV': 'Encuádrala para el televisor', 'Drag to move. Pinch or use the slider to zoom.': 'Arrastra para mover. Pellizca o usa el control para hacer zoom.', 'Skip': 'Omitir', 'Whole photo': 'Foto entera', 'Send': 'Enviar', 'Skipped': 'Omitida', 'of': 'de' },
    nl: { 'Use the remote in every app': 'De afstandsbediening in elke app', 'Pair Shore once with the TV’s own remote service. The TV shows a code; type it here.': 'Koppel Shore één keer met de afstandsbedieningsdienst van de tv. De tv toont een code; typ die hier.', 'Pair': 'Koppelen', 'Enter the code shown on the TV': 'Voer de code op de tv in', 'Confirm': 'Bevestigen', 'Works in every app.': 'Werkt in elke app.', 'Unpair': 'Ontkoppelen', 'Paired. The remote now works in every app.': 'Gekoppeld. De afstandsbediening werkt nu in elke app.', 'That code didn’t match. Check the TV and try again.': 'Die code klopt niet. Kijk op de tv en probeer het opnieuw.', 'The TV’s remote service isn’t available.': 'De afstandsbedieningsdienst van de tv is niet beschikbaar.', 'Couldn’t pair. Try again.': 'Koppelen mislukt. Probeer het opnieuw.', 'Pair below to use the arrows in other apps.': 'Koppel hieronder om de pijlen in andere apps te gebruiken.', 'News feed': 'Nieuwsfeed', 'Headlines under the clock come from this RSS or Atom feed. Leave it empty for Google News top stories in the TV’s language.': 'De koppen onder de klok komen uit deze RSS- of Atom-feed. Laat leeg voor het topnieuws van Google News in de taal van de tv.', 'That isn’t a web address.': 'Dat is geen webadres.', 'Remote': 'Bediening', 'Back': 'Terug', 'Home': 'Home', 'Arrows and OK control Shore. In other apps they need Android 13 or later and Shore’s remote-button service.': 'Pijlen en OK bedienen Shore. In andere apps is Android 13 of nieuwer en de knoppendienst van Shore nodig.', 'Open Shore on the TV to use the arrows here.': 'Open Shore op de tv om de pijlen hier te gebruiken.', 'Turn on Shore’s remote-button service on the TV for this.': 'Zet hiervoor de knoppendienst van Shore op de tv aan.', 'Backup': 'Back-up', 'Save every TV setting to this phone, then restore it later or on another TV. Photos stay on the TV.': 'Bewaar alle tv-instellingen op deze telefoon en zet ze later of op een andere tv terug. Foto’s blijven op de tv.', 'Save backup': 'Back-up opslaan', 'Restore…': 'Terugzetten…', 'This isn’t a Shore backup.': 'Dit is geen Shore-back-up.', 'Replace the TV’s settings with this backup?': 'De instellingen van de tv vervangen door deze back-up?', 'Restored': 'Teruggezet', 'Photos': 'Foto’s', 'TV settings': 'Tv-instellingen', 'Apps': 'Apps', 'Open Shore on the TV to change its settings from here.': 'Open Shore op de tv om de instellingen hier te wijzigen.', 'Connecting to your TV…': 'Verbinden met je tv…', 'Connected to your TV': 'Verbonden met je tv', 'Your TV is not reachable': 'Je tv is niet bereikbaar',
      'Pair this phone': 'Deze telefoon koppelen', 'On the TV, open Shore › Settings › Phone and scan the code with your camera.': 'Open op de tv Shore › Instellingen › Telefoon en scan de code met je camera.',
      'Send to your TV': 'Naar je tv sturen', 'Photos, GIFs and short videos become wallpapers under My photos. Landscape fills the screen best.': 'Foto’s, gifs en korte video’s worden achtergronden onder Mijn foto’s. Liggend vult het scherm het best.',
      'Choose photos': 'Foto’s kiezen', 'My photos': 'Mijn foto’s', 'Nothing here yet.': 'Nog niets.', 'Remove all': 'Alles verwijderen', 'Weather place': 'Plaats voor het weer',
      'The clock shows the weather for this city. Leave it empty to use the TV’s time zone.': 'De klok toont het weer voor deze stad. Laat leeg om de tijdzone van de tv te gebruiken.',
      'Save': 'Opslaan', 'Works on your home Wi-Fi only. Nothing leaves your network.': 'Werkt alleen op je wifi thuis. Niets verlaat je netwerk.',
      'Sending…': 'Versturen…', 'Sent': 'Verstuurd', 'Failed': 'Mislukt', 'Saved': 'Opgeslagen', 'Removed': 'Verwijderd', 'Remove all your photos from the TV?': 'Al je foto’s van de tv verwijderen?', 'Install as an app': 'Als app installeren', 'Remove this photo?': 'Deze foto verwijderen?', 'Frame it for your TV': 'Uitsnijden voor je tv', 'Drag to move. Pinch or use the slider to zoom.': 'Sleep om te verplaatsen. Knijp of gebruik de schuifregelaar om te zoomen.', 'Skip': 'Overslaan', 'Whole photo': 'Hele foto', 'Send': 'Versturen', 'Skipped': 'Overgeslagen', 'of': 'van' },
    pl: { 'Use the remote in every app': 'Pilot w każdej aplikacji', 'Pair Shore once with the TV’s own remote service. The TV shows a code; type it here.': 'Sparuj Shore raz z usługą pilota telewizora. Telewizor pokaże kod; wpisz go tutaj.', 'Pair': 'Sparuj', 'Enter the code shown on the TV': 'Wpisz kod z telewizora', 'Confirm': 'Potwierdź', 'Works in every app.': 'Działa w każdej aplikacji.', 'Unpair': 'Rozparuj', 'Paired. The remote now works in every app.': 'Sparowano. Pilot działa teraz w każdej aplikacji.', 'That code didn’t match. Check the TV and try again.': 'Kod się nie zgadza. Sprawdź telewizor i spróbuj ponownie.', 'The TV’s remote service isn’t available.': 'Usługa pilota telewizora jest niedostępna.', 'Couldn’t pair. Try again.': 'Nie udało się sparować. Spróbuj ponownie.', 'Pair below to use the arrows in other apps.': 'Sparuj poniżej, aby używać strzałek w innych aplikacjach.', 'News feed': 'Źródło wiadomości', 'Headlines under the clock come from this RSS or Atom feed. Leave it empty for Google News top stories in the TV’s language.': 'Nagłówki pod zegarem pochodzą z tego kanału RSS lub Atom. Zostaw puste, aby widzieć najważniejsze wiadomości Google News w języku telewizora.', 'That isn’t a web address.': 'To nie jest adres internetowy.', 'Remote': 'Pilot', 'Back': 'Wstecz', 'Home': 'Home', 'Arrows and OK control Shore. In other apps they need Android 13 or later and Shore’s remote-button service.': 'Strzałki i OK sterują Shore. W innych aplikacjach potrzebny jest Android 13 lub nowszy i usługa przycisków Shore.', 'Open Shore on the TV to use the arrows here.': 'Otwórz Shore na telewizorze, aby używać tu strzałek.', 'Turn on Shore’s remote-button service on the TV for this.': 'Włącz w tym celu usługę przycisków Shore na telewizorze.', 'Backup': 'Kopia zapasowa', 'Save every TV setting to this phone, then restore it later or on another TV. Photos stay on the TV.': 'Zapisz wszystkie ustawienia telewizora na tym telefonie i przywróć je później lub na innym telewizorze. Zdjęcia zostają na telewizorze.', 'Save backup': 'Zapisz kopię', 'Restore…': 'Przywróć…', 'This isn’t a Shore backup.': 'To nie jest kopia Shore.', 'Replace the TV’s settings with this backup?': 'Zastąpić ustawienia telewizora tą kopią?', 'Restored': 'Przywrócono', 'Photos': 'Zdjęcia', 'TV settings': 'Ustawienia TV', 'Apps': 'Aplikacje', 'Open Shore on the TV to change its settings from here.': 'Otwórz Shore na telewizorze, aby zmieniać ustawienia stąd.', 'Connecting to your TV…': 'Łączenie z telewizorem…', 'Connected to your TV': 'Połączono z telewizorem', 'Your TV is not reachable': 'Telewizor jest niedostępny',
      'Pair this phone': 'Sparuj ten telefon', 'On the TV, open Shore › Settings › Phone and scan the code with your camera.': 'Na telewizorze otwórz Shore › Ustawienia › Telefon i zeskanuj kod aparatem.',
      'Send to your TV': 'Wyślij na telewizor', 'Photos, GIFs and short videos become wallpapers under My photos. Landscape fills the screen best.': 'Zdjęcia, GIF-y i krótkie filmy stają się tapetami w Moich zdjęciach. Poziome najlepiej wypełniają ekran.',
      'Choose photos': 'Wybierz zdjęcia', 'My photos': 'Moje zdjęcia', 'Nothing here yet.': 'Jeszcze nic tu nie ma.', 'Remove all': 'Usuń wszystkie', 'Weather place': 'Miejsce pogody',
      'The clock shows the weather for this city. Leave it empty to use the TV’s time zone.': 'Zegar pokazuje pogodę dla tego miasta. Zostaw puste, aby użyć strefy czasowej telewizora.',
      'Save': 'Zapisz', 'Works on your home Wi-Fi only. Nothing leaves your network.': 'Działa tylko w domowej sieci Wi-Fi. Nic nie opuszcza Twojej sieci.',
      'Sending…': 'Wysyłanie…', 'Sent': 'Wysłano', 'Failed': 'Błąd', 'Saved': 'Zapisano', 'Removed': 'Usunięto', 'Remove all your photos from the TV?': 'Usunąć wszystkie Twoje zdjęcia z telewizora?', 'Install as an app': 'Zainstaluj jako aplikację', 'Remove this photo?': 'Usunąć to zdjęcie?', 'Frame it for your TV': 'Kadruj dla telewizora', 'Drag to move. Pinch or use the slider to zoom.': 'Przeciągnij, aby przesunąć. Uszczypnij lub użyj suwaka, aby powiększyć.', 'Skip': 'Pomiń', 'Whole photo': 'Całe zdjęcie', 'Send': 'Wyślij', 'Skipped': 'Pominięto', 'of': 'z' },
    uk: { 'Use the remote in every app': 'Пульт у будь-якому застосунку', 'Pair Shore once with the TV’s own remote service. The TV shows a code; type it here.': 'Один раз з’єднайте Shore зі службою пульта телевізора. Телевізор покаже код — введіть його тут.', 'Pair': 'З’єднати', 'Enter the code shown on the TV': 'Введіть код із телевізора', 'Confirm': 'Підтвердити', 'Works in every app.': 'Працює в будь-якому застосунку.', 'Unpair': 'Від’єднати', 'Paired. The remote now works in every app.': 'З’єднано. Тепер пульт працює в будь-якому застосунку.', 'That code didn’t match. Check the TV and try again.': 'Код не збігається. Перевірте телевізор і спробуйте ще раз.', 'The TV’s remote service isn’t available.': 'Служба пульта телевізора недоступна.', 'Couldn’t pair. Try again.': 'Не вдалося з’єднати. Спробуйте ще раз.', 'Pair below to use the arrows in other apps.': 'З’єднайте нижче, щоб користуватися стрілками в інших застосунках.', 'News feed': 'Стрічка новин', 'Headlines under the clock come from this RSS or Atom feed. Leave it empty for Google News top stories in the TV’s language.': 'Заголовки під годинником беруться з цієї RSS- або Atom-стрічки. Залиште порожнім, щоб бачити головні новини Google News мовою телевізора.', 'That isn’t a web address.': 'Це не веб-адреса.', 'Remote': 'Пульт', 'Back': 'Назад', 'Home': 'Home', 'Arrows and OK control Shore. In other apps they need Android 13 or later and Shore’s remote-button service.': 'Стрілки й OK керують Shore. В інших застосунках потрібні Android 13 або новіший і служба кнопок пульта Shore.', 'Open Shore on the TV to use the arrows here.': 'Відкрийте Shore на телевізорі, щоб користуватися стрілками.', 'Turn on Shore’s remote-button service on the TV for this.': 'Для цього ввімкніть на телевізорі службу кнопок пульта Shore.', 'Backup': 'Резервна копія', 'Save every TV setting to this phone, then restore it later or on another TV. Photos stay on the TV.': 'Збережіть усі налаштування телевізора на цьому телефоні й відновіть їх пізніше або на іншому телевізорі. Фото залишаються на телевізорі.', 'Save backup': 'Зберегти копію', 'Restore…': 'Відновити…', 'This isn’t a Shore backup.': 'Це не резервна копія Shore.', 'Replace the TV’s settings with this backup?': 'Замінити налаштування телевізора цією копією?', 'Restored': 'Відновлено', 'Photos': 'Фото', 'TV settings': 'Налаштування', 'Apps': 'Застосунки', 'Open Shore on the TV to change its settings from here.': 'Відкрийте Shore на телевізорі, щоб змінювати налаштування звідси.', 'Connecting to your TV…': 'Підключення до телевізора…', 'Connected to your TV': 'Підключено до телевізора', 'Your TV is not reachable': 'Телевізор недоступний', 'Pair this phone': 'З’єднайте цей телефон', 'On the TV, open Shore › Settings › Phone and scan the code with your camera.': 'На телевізорі відкрийте Shore › Налаштування › Телефон і відскануйте код камерою.', 'Send to your TV': 'Надіслати на телевізор', 'Photos, GIFs and short videos become wallpapers under My photos. Landscape fills the screen best.': 'Фото, GIF і короткі відео стають шпалерами в «Моїх фото». Горизонтальні найкраще заповнюють екран.', 'Choose photos': 'Вибрати фото', 'My photos': 'Мої фото', 'Nothing here yet.': 'Тут поки нічого немає.', 'Remove all': 'Видалити всі', 'Weather place': 'Місце для погоди', 'The clock shows the weather for this city. Leave it empty to use the TV’s time zone.': 'Годинник показує погоду для цього міста. Залиште порожнім, щоб використовувати часовий пояс телевізора.', 'Save': 'Зберегти', 'Works on your home Wi-Fi only. Nothing leaves your network.': 'Працює лише в домашній мережі Wi-Fi. Нічого не виходить за межі вашої мережі.', 'Sending…': 'Надсилання…', 'Sent': 'Надіслано', 'Failed': 'Помилка', 'Saved': 'Збережено', 'Removed': 'Видалено', 'Remove all your photos from the TV?': 'Видалити всі ваші фото з телевізора?', 'Install as an app': 'Установити як застосунок', 'Remove this photo?': 'Видалити це фото?', 'Frame it for your TV': 'Обріжте для телевізора', 'Drag to move. Pinch or use the slider to zoom.': 'Перетягніть, щоб перемістити. Зведіть пальці або скористайтеся повзунком для масштабу.', 'Skip': 'Пропустити', 'Whole photo': 'Усе фото', 'Send': 'Надіслати', 'Skipped': 'Пропущено', 'of': 'з' }
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
    if (document.activeElement !== $('feed')) $('feed').value = info.feed || '';
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
  $('feedForm').onsubmit = function (e) {
    e.preventDefault();
    var url = $('feed').value.trim();
    if (url && !/^https?:\/\/\S{4,500}$/i.test(url)) { toast(T('That isn’t a web address.')); return; }
    api('feed?url=' + encodeURIComponent(url), { method: 'POST' }).then(function (i) { show(i); toast(T('Saved')); }).catch(function () { toast(T('Failed')); });
  };
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
    ['photos', 'tv', 'apps', 'remote'].forEach(function (n) { $('tab-' + n).hidden = n !== name; });
    try { sessionStorage.setItem('shore.tab', name); } catch (e) { }
    if (name !== 'photos' && name !== 'remote') refresh();
    if (name === 'remote') api('remote/status').then(function (r) { atvShow(r.atv); }).catch(function () { });
  }
  /* Remote: one POST per press; a short buzz confirms it reached the TV. */
  Array.prototype.forEach.call(document.querySelectorAll('.rk'), function (b) {
    b.onclick = function () {
      api('key?k=' + b.getAttribute('data-k'), { method: 'POST' }).then(function (r) {
        if (r.ok) { if (navigator.vibrate) navigator.vibrate(12); }
        else toast(T(r.atv !== 'paired' ? 'Pair below to use the arrows in other apps.' : r.sdk < 33 && /^(up|down|left|right|ok)$/.test(b.getAttribute('data-k')) ? 'Open Shore on the TV to use the arrows here.' : 'Turn on Shore’s remote-button service on the TV for this.'));
        if (r.atv) atvShow(r.atv);
      }).catch(function () { toast(T('Your TV is not reachable')); });
    };
  });
  /* Pairing with the TV's own remote service: after it, the arrows work in every app (AtvRemote.java). */
  function atvShow(st) {
    var paired = st === 'paired';
    $('atvCard').hidden = paired; $('atvPaired').hidden = !paired;
    $('atvForm').hidden = st !== 'pairing'; $('atvPair').hidden = st === 'pairing';
    $('remoteNote').hidden = paired;
  }
  function atvError(st) {
    toast(T(st === 'error:code' ? 'That code didn’t match. Check the TV and try again.' : st === 'error:service' ? 'The TV’s remote service isn’t available.' : 'Couldn’t pair. Try again.'));
  }
  $('atvPair').onclick = function () {
    $('atvPair').disabled = true;
    api('remote/pair', { method: 'POST' }).then(function (r) { atvShow(r.atv); if (r.ok) $('atvCode').focus(); else atvError(r.atv); })
      .catch(function () { toast(T('Your TV is not reachable')); }).then(function () { $('atvPair').disabled = false; });
  };
  $('atvForm').onsubmit = function (e) {
    e.preventDefault();
    var code = $('atvCode').value.replace(/\s+/g, '').toUpperCase();
    if (!/^[0-9A-F]{6}$/.test(code)) { atvError('error:code'); return; }
    api('remote/code?c=' + code, { method: 'POST' }).then(function (r) {
      if (r.ok) { $('atvCode').value = ''; toast(T('Paired. The remote now works in every app.')); }
      else atvError(r.atv);
      atvShow(r.atv === 'error:code' ? 'pairing' : r.atv);
    }).catch(function () { toast(T('Your TV is not reachable')); });
  };
  $('atvForget').onclick = function () { api('remote/forget', { method: 'POST' }).then(function (r) { atvShow(r.atv); }); };
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
    if (item.kind === 'multi') {
      opts = el('div', 'chips is-list');
      item.options.forEach(function (o) {
        var on = item.value.indexOf(o.value) >= 0, b = el('button', 'chip check' + (on ? ' on' : ''), o.label);
        b.type = 'button'; b.setAttribute('aria-pressed', String(on));
        b.onclick = function () {
          var i = item.value.indexOf(o.value);
          if (i >= 0 && item.value.length === 1) return; // at least one source stays
          if (i >= 0) item.value.splice(i, 1); else item.value.push(o.value);
          b.classList.toggle('on', i < 0); b.setAttribute('aria-pressed', String(i < 0));
          set('source', o.value);
        };
        opts.appendChild(b);
      });
      row.appendChild(opts);
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
  /* Backup: the TV's saved preferences as a file on this phone; restoring sends one back for the TV to check and apply. */
  $('backupSave').onclick = function () {
    api('backup').then(function (b) {
      var d = new Date(), name = 'shore-settings-' + d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) + '.json';
      var url = URL.createObjectURL(new Blob([JSON.stringify(b, null, 2)], { type: 'application/json' })), a = el('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      toast(T('Saved'));
    }).catch(function () { toast(T('Open Shore on the TV to change its settings from here.')); });
  };
  $('backupFile').onchange = function () {
    var file = this.files && this.files[0], input = this;
    if (!file) return;
    if (file.size > 512 * 1024) { toast(T('This isn’t a Shore backup.')); input.value = ''; return; }
    file.text().then(function (text) {
      var b;
      try { b = JSON.parse(text); } catch (e) { b = null; }
      if (!b || b.shore !== 'backup' || !b.settings) { toast(T('This isn’t a Shore backup.')); return; }
      if (!confirm(T('Replace the TV’s settings with this backup?'))) return;
      return api('restore', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: text }).then(function () { toast(T('Restored')); setTimeout(refresh, 1500); });
    }).catch(function () { toast(T('Failed')); }).then(function () { input.value = ''; });
  };
  function draw() {
    var offline = !model || model.offline;
    $('tvOffline').hidden = !offline;
    $('backupCard').hidden = offline;
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
