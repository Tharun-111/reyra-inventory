<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/aa01563c-7aa5-4193-b890-ac0a1790390d

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Windows Desktop App

1. Install dependencies with `npm install`.
2. Build the installer with `npm run build:desktop`.
3. Find `REYRA Inventory Setup 1.0.0.exe` in the `release` folder and run it.

To launch the desktop app without creating an installer, run `npm run desktop` after building with `npm run build:desktop` (the build command also creates the installer).

Inventory data is stored locally in the app. The AI assistant requires the server's `/api/chat` endpoint and a configured `GEMINI_API_KEY`; it is not available in the standalone desktop installer.

## Android APK

The Android build requires Node.js, Java 21, and the Android SDK (platform 35 and build tools 35.0.0). With the Android SDK configured in `ANDROID_HOME`, run `npm install` and then `npm run build:android`. The sideloadable debug APK is created at `release/REYRA-Inventory-1.0.0.apk`. Android may ask you to allow installs from the app you use to open the APK.

The APK stores inventory data locally. The AI assistant needs the `/api/chat` backend and a configured `GEMINI_API_KEY`; it is not available in the standalone APK.
