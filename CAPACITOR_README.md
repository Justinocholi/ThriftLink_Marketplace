# Capacitor — Native iOS & Android Shell

Capacitor wraps the existing ThriftLink web build (the same `dist/` Vite produces) inside a thin native iOS/Android shell so it can be submitted to the App Store and Google Play. The web code is unchanged; Capacitor only adds a WebView container and a bridge to native APIs (camera, share, push, etc.).

## Prerequisites

- Node 18+ and the repo dependencies (`npm install`)
- **iOS:** macOS with Xcode 15+ and CocoaPods (`sudo gem install cocoapods`)
- **Android:** Android Studio (latest) + JDK 17

The `ios/` and `android/` folders are intentionally **not committed** — each developer generates them locally with `cap:add:*`.

## Build path to the App Store (iOS)

1. `npm install` — install JS deps (already done if you cloned and ran it).
2. `npm run cap:add:ios` — one-time; creates the `ios/` Xcode project.
3. `npm run cap:sync` — runs `vite build` and copies `dist/` into the iOS project.
4. `npm run cap:open:ios` — opens Xcode. Then **Product → Archive → Distribute App → App Store Connect**.

## Build path to Google Play (Android)

1. `npm install`
2. `npm run cap:add:android` — one-time; creates the `android/` Gradle project.
3. `npm run cap:sync` — builds web, syncs into Android project.
4. `npm run cap:open:android` — opens Android Studio. Then **Build → Generate Signed Bundle / APK → Android App Bundle** and upload the `.aab` to the Play Console.

Re-run `npm run cap:sync` whenever the web app changes.

## Configuration notes

- `appId` is currently `com.thriftlink.app` (see `capacitor.config.json`). Once you register the real bundle id with Apple Developer / Google Play, update `appId` and `appName` there and re-run `cap:sync`.
- Splash + status bar colors are set to the WhatsApp green (`#25D366`) used elsewhere in the brand.
- The existing PWA service worker still works inside Capacitor but is largely redundant on native (the WebView serves the bundled assets directly). Leaving it in place is harmless.
- **WhatsApp deep-links work natively.** `https://wa.me/<phone>?text=...` opens the installed WhatsApp app on both iOS and Android, so the existing buy-flow needs no changes.

## Helper

`src/utils/native.js` exports `isNative()` and `platform()` so future feature work can branch on whether it's running in a Capacitor shell (e.g. swap a file input for the native camera plugin).
