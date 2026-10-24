<div align="center">

# CleanFrame for TCL Google TV

**A calm home screen for your TV: your apps, your HDMI devices, a beautiful picture and the time. Nothing else.**

[Install](#install) · [Features](#features) · [Wallpapers](#online-and-animated-wallpapers) · [Top Shelf](#top-shelf) · [Build](#build-from-source)

![CleanFrame on a TCL 55C6KS](docs/images/tcl/home.jpg)

</div>

CleanFrame-TCL brings [Nathan Clark's CleanFrame](https://github.com/nthnclrk/CleanFrame), originally made for Samsung The Frame, to **Android TV and Google TV**. It is tuned and tested on a **TCL 55C6KS** (55" Mini LED, 4K, Android TV 12). The interface is the original HTML/CSS app; a small Java shell runs it full screen and connects it to the TV.

> [!NOTE]
> **Unofficial.** Not affiliated with TCL, Google, Samsung or any streaming service. Everything here is reversible, and each step says how.

## Features

![Shelf layout with app banners](docs/images/tcl/shelf.jpg)

**Home, your way**
- **Three layouts.** *Dock* and *List* draw every app logo in one consistent style. *Shelf* is an Apple TV–style row of each app's colourful banner, with a [Top Shelf](#top-shelf) above it.
- **Your apps, found automatically.** Pick and order up to nine for Home.
- **HDMI devices appear by themselves**, named by HDMI-CEC ("PlayStation 5" instead of "HDMI 1"). Switch on a console or set-top box and its tile shows up; switch it off and it disappears. Show inputs first on Home or in their own row.
- **Speaks your language.** The launcher follows the TV's system language (*Settings → System → Language*). German, French, Spanish and Dutch are included; anything else falls back to English.

**The picture**
- **15 photographs** with pre-rendered glass, plus **online wallpapers** from NASA, Bing, Wikimedia, Picsum and Unsplash.
- **Animated wallpapers**: bundled seamless loops, Pexels video loops and Klipy GIFs.
- **[My photos](#my-photos-from-your-phone)**: send photos, GIFs and short videos from your phone by scanning a QR code.
- **Drift**: a slow Ken Burns zoom where the photo and its glass move together.
- **Rotation**: a new picture each time Home opens, or every 5, 15 or 60 minutes.
- **Night mode** dims everything on a timer (21–07, 22–06, 23–07) or all the time, in three strengths.

**Make it yours**
- **Eight open-licence fonts**, with text weight and app-name size.
- **Clock**: 12- or 24-hour, optional date, four sizes and weights.
- **[Under the clock](#under-the-clock-weather-and-now-playing)**: the current weather (Open-Meteo, no key) and what's playing in Spotify, YouTube or any other app.
- **Hide controls when idle**: after 1 or 5 minutes only the picture and clock stay.
- Focus style and glass materials.

**Fits the TV**
- **The Home button opens CleanFrame.** Hold Home for the original Google TV Home.
- **Reassign remote buttons** such as the app shortcut keys or the TV button.
- Animations pause outside Home, so menus stay snappy.
- An optional, reversible **debloat** list for TCL's preinstalled extras.

| | |
| --- | --- |
| ![Inputs in their own row](docs/images/tcl/inputs-row.jpg) | ![Settings](docs/images/tcl/settings.jpg) |
| ![Online wallpapers](docs/images/tcl/online.jpg) | ![Animated wallpapers](docs/images/tcl/animated.jpg) |
| ![Wallpaper gallery with online photos and credits](docs/images/tcl/gallery.jpg) | ![Layout settings](docs/images/tcl/layout.jpg) |

<table>
<tr><th>Aurora</th><th>Dusk</th><th>Deep sea</th></tr>
<tr>
<td><img src="docs/images/tcl/loop-aurora.webp" alt="Aurora loop"></td>
<td><img src="docs/images/tcl/loop-dusk.webp" alt="Dusk loop"></td>
<td><img src="docs/images/tcl/loop-deep-sea.webp" alt="Deep sea loop"></td>
</tr>
</table>

<sub>Bundled animated loops. On the TV they play at 1080p behind the interface.</sub>

## Install

You need a computer on the same Wi-Fi with [Android platform tools](https://developer.android.com/tools/releases/platform-tools) (`adb`).

1. **Enable developer options.** On the TV, open *Settings → System → About*. Press OK on **Android TV OS build** seven times, until "You are now a developer" appears. Use the main profile; kids profiles hide this.
2. **Turn on debugging.** *Settings → System → Developer options → USB debugging*.
3. **Connect**, replacing `<tv-ip>` with the address from *Settings → Network*:

   ```sh
   adb connect <tv-ip>:5555
   ```

   The TV asks "Allow debugging?". Tick **Always allow from this computer** and press OK.
4. **Install** the APK from [Releases](https://github.com/taynotfound/CleanFrame-TCL/releases) or [build it](#build-from-source):

   ```sh
   adb install -r CleanFrame-TCL.apk
   ```

CleanFrame now appears in your apps. Open it once; it remembers everything on the TV.

<details>
<summary>Android 14 builds with "Wireless debugging"</summary>

Open *Wireless debugging → Pair device with pairing code*, then run `adb pair <ip>:<pair-port> <code>` and `adb connect <ip>:<port>`. The pairing port is different from the connect port.

</details>

### Make the Home button open CleanFrame

Google TV always sends Home to its own launcher and ignores the "default home app" setting. CleanFrame includes a small accessibility service that catches the Home key instead, the same approach launchers like Projectivy use. Turn it on yourself:

**Settings → System → Accessibility → CleanFrame Home button → On**

- **Press Home** to open CleanFrame.
- **Hold Home** for about a second to open the original Google TV Home. *Settings → Google TV → Google TV Home* in CleanFrame does the same.
- If Google TV Home appears by itself, for example after leaving an app, CleanFrame takes over. It won't do that if you opened Google TV Home on purpose.

The service only sees remote keys and which app is in front. It never reads screen content. Turn the switch off to undo.

### Reassign remote buttons

*Settings → Google TV → Remote buttons* (needs the accessibility service). Choose **Assign a button…**, press a button on the remote, then pick what it does:

- **Default**: what the TV normally does. This removes the assignment.
- **CleanFrame Home**, **Do nothing** or **Screensaver**.
- A **connected HDMI input**, or **an app** from your Home screen.

Assignments work everywhere, including inside other apps.

<details>
<summary>Limits</summary>

- CleanFrame only sees buttons that reach Android's accessibility key filter. If the TV firmware handles a button first, the page says *No button arrived*.
- Navigation, OK, Back, Home, volume and power are never captured.
- Two buttons that send the same Android key code share one assignment.
- Not yet tested on the TCL RC833 remote itself.

</details>

### HDMI inputs

Inputs come from Android's TV Input Framework. A device that is **plugged in and switched on** gets a tile; standby or unplugged devices are hidden. OK switches the TV to that input, and inputs you rename in the TV settings keep their name. Otherwise a tile uses the name the device announces over HDMI-CEC, such as *PlayStation 5* or *Apple TV*. CEC must be on in the TV settings (TCL calls it *T-Link*); without it the port name, such as *HDMI 1*, is shown. Choose *Settings → Layout → Inputs → First in Home* or *Own row*.

### Language

CleanFrame uses the TV's system language: German, French, Spanish and Dutch are built in, and anything else shows English. Change it in *Settings → System → Language* on the TV, then reopen CleanFrame. Translations live in [`app/i18n.js`](app/i18n.js): one dictionary per language, keyed by the English text, so adding a language means adding one block. In the browser preview, `?lang=de` picks a language.

### Under the clock: weather and Now playing

*Settings → Clock → Under the clock.*

- **Weather** shows the temperature and sky, such as *12° Cloudy*, next to the date. It comes from [Open-Meteo](https://open-meteo.com), which needs no key or account. The place is the city of the TV's time zone (*Europe/Berlin* → Berlin). You can type a different place on the [My photos](#my-photos-from-your-phone) phone page. CleanFrame refreshes the weather every 30 minutes, uses °F only for US English, and the weather is off until you turn it on.
- **Now playing** shows *♪ Title · Artist — App* while music or video plays in another app, for example Spotify in the background. Android only shares media sessions with apps that have notification access. So allow **CleanFrame Now playing** under *Settings → Apps → Special app access → Notification access*; the Clock page has a shortcut. CleanFrame reads only the active media session and ignores notifications themselves.

<details>
<summary>Google TV hides Notification access</summary>

Some Google TV builds don't show the Notification access page. In that case you can allow it once from a computer on the same network, using ADB:

```bash
adb shell cmd notification allow_listener app.cleanframe.tv/app.cleanframe.tv.NowPlayingService
```

To undo, run the same command with `disallow_listener`.

</details>

## My photos from your phone

*Settings → Background → Online wallpapers → My photos.* The TV shows a QR code. Scan it with your phone's camera to open a small upload page served by the TV itself. From there, pick photos (JPEG, PNG, WebP), GIFs or MP4 clips. They appear under **My photos**, which works like any other wallpaper source: glass is rendered once, rotation cycles through them, and GIFs and clips play animated.

- The page only works on the same Wi-Fi. The address has a random code and stops working after 15 minutes, or when CleanFrame closes.
- Nothing goes through the internet. Files stay in CleanFrame's private storage on the TV, up to the newest 30. *Remove all my photos* deletes them, on the TV or on the phone page.
- Landscape pictures fill the screen best; portrait photos are centre-cropped. Phone rotation (EXIF) is respected.
- The phone page also sets the place for the weather.

## Online and animated wallpapers

*Settings → Background → Online wallpapers.* The TV downloads up to eight pictures or clips from the chosen source. On download it renders them once into the same files the bundled gallery uses: photo, thumbnail and four pre-blurred glass layers. Nothing is blurred live, so Home stays smooth. New wallpapers arrive every few hours, and rotation cycles through them.

Animated wallpapers play as muted MP4 loops, with glass rendered from the first frame. Klipy GIFs are fetched as MP4s, which are much lighter than GIF files.

NASA, Bing, Wikimedia, Picsum and the bundled loops work without keys. Unsplash, Pexels and Klipy need free developer keys. Put them in `android/local.properties` (ignored by git), or pass them as environment variables when building:

```properties
unsplash.accessKey=...   # https://unsplash.com/developers
pexels.apiKey=...        # https://www.pexels.com/api/
klipy.apiKey=...         # https://partner.klipy.com/
nasa.apiKey=...          # optional, https://api.nasa.gov/ (the default DEMO_KEY is rate limited)
```

> [!WARNING]
> Keys are compiled into your APK, so don't share an APK that contains them.

Credits for each picture appear in the wallpaper gallery, as the sources' terms ask.

## Top Shelf

*Settings → Layout → Shelf.* As on Apple TV, the focused app fills the screen with what is trending there. **Down** opens a row of recommendations. **OK** opens an item directly in YouTube, Twitch, ZDF or ARTE, and opens the app itself for the others. **Up** or **Back** returns to the apps.

Google TV doesn't share its recommendations with other launchers, so CleanFrame reads public catalogues about once an hour, over HTTPS only:

| Apps | Source | Key |
| --- | --- | --- |
| ARD Mediathek, ZDF, ARTE | Their own public catalogues | None |
| Netflix, Disney+, Prime Video, Joyn, waipu.tv, Apple TV | [TMDB](https://www.themoviedb.org) watch providers for Germany | `tmdb.token` |
| YouTube | YouTube Data API v3 | `youtube.apiKey` |
| Twitch | Twitch Helix API | `twitch.clientId`, `twitch.clientSecret` |

Apps without recommendations show their own banner, softly blurred. Keys go in `android/local.properties`, or the environment variables `TMDB_TOKEN`, `YOUTUBE_API_KEY`, `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` (also used as GitHub Actions secrets).

## Build from source

You need JDK 17 and the Android SDK (platform 35), or Android Studio.

```sh
git clone https://github.com/taynotfound/CleanFrame-TCL.git
cd CleanFrame-TCL
echo "sdk.dir=$HOME/Android/Sdk" > android/local.properties
gradle -p android assembleRelease
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

Without signing secrets, the APK is signed with your computer's debug key. Keep using the same key so updates install in place and keep your settings. GitHub Actions builds the APK on every push.

The interface also runs in a desktop browser for design work: `npm ci && npm run dev:public`, then open [localhost:4795/home/](http://localhost:4795/home/). Run `npm run check` and `npm run check:browser` after changing `app/`.

| Path | What it is |
| --- | --- |
| `app/` | The CleanFrame interface, shared with the Samsung version |
| `app/device-android.js` | Android adapter: apps, inputs, wallpapers, remote buttons |
| `app/i18n.js` | Translations |
| `android/` | Java shell: WebView, app and input bridge, Home button service, wallpaper and Top Shelf downloaders |
| `debloat/` | Optional, reversible debloat list and script |
| `docs/android-tv.md` | Port notes. [`docs/upstream-README.md`](docs/upstream-README.md) is the original Samsung README |

## Optional: debloat

[`debloat/packages.txt`](debloat/packages.txt) lists TCL and Google extras that are safe to switch off, such as Samba TV tracking, promo overlays, the store demo and Alexa, each with a comment. Edit the list, then:

```sh
TV=<tv-ip>:5555 debloat/debloat.sh disable   # switch them off (nothing is uninstalled)
TV=<tv-ip>:5555 debloat/debloat.sh status
TV=<tv-ip>:5555 debloat/debloat.sh restore   # switch them back on
```

Live TV, inputs, settings, the remote, casting, updates and Google TV itself are never on the list. A firmware update or factory reset may switch apps back on.

## Ideas

Everything from the earlier list is now built: weather, Now playing, HDMI-CEC names, My photos and more languages. Next up:

- Album art and play/pause for Now playing
- A sleep timer on a remote button
- Italian, Polish and Turkish translations
- Calendar events under the clock (ICS link)

## Credits and licences

- **CleanFrame** by Nathan Clark, MIT. This fork keeps the original [licence](LICENSE) and [third-party notices](THIRD_PARTY_NOTICES.md).
- Android TV port and TCL additions: CleanFrame-TCL contributors, MIT.
- App logos: [Simple Icons](https://simpleicons.org) (CC0) and public-domain wordmarks from Wikimedia Commons; see `app/assets/icons/SOURCES.json`. Trademarks belong to their owners.
- Fonts: SIL Open Font License; see `app/assets/fonts/`.
- Online wallpapers belong to their authors and are shown under each provider's terms: [NASA APOD](https://apod.nasa.gov), [Bing](https://www.bing.com), [Wikimedia Commons](https://commons.wikimedia.org), [Lorem Picsum](https://picsum.photos), [Unsplash](https://unsplash.com), [Pexels](https://www.pexels.com) and [KLIPY](https://klipy.com) ("Powered by KLIPY").
- The bundled animated loops were generated for this project.
- Weather data by [Open-Meteo](https://open-meteo.com) (CC BY 4.0). QR codes are generated with [ZXing](https://github.com/zxing/zxing) (Apache 2.0).
- Top Shelf: this product uses the TMDB API but is not endorsed or certified by TMDB. Recommendations and images come from [TMDB](https://www.themoviedb.org), [ARD Mediathek](https://www.ardmediathek.de), [ZDF](https://www.zdf.de), [ARTE](https://www.arte.tv), [YouTube](https://www.youtube.com) and [Twitch](https://www.twitch.tv) under their terms. Titles and artwork belong to their owners.
