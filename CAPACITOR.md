# Caderno - Capacitor Build Guide

Caderno is now configured as a Capacitor project with support for multiple platforms: **iOS**, **Android**, and **Desktop (Electron)**.

## Prerequisites

### For iOS Development
- macOS
- Xcode 14 or later
- CocoaPods (`sudo gem install cocoapods`)
- An Apple Developer account (for distribution)

### For Android Development
- Android Studio
- Java Development Kit (JDK) 17 or later
- Android SDK

### For Electron (Desktop) Development
- Node.js 18 or later
- npm or yarn

## Available Scripts

### Build and Sync

```bash
# Build web app and sync to all platforms
npm run cap:sync

# Sync to specific platforms
npm run cap:sync:ios
npm run cap:sync:android
npm run cap:sync:electron
```

### Open Platform IDEs

```bash
# Open iOS project in Xcode
npm run cap:open:ios

# Open Android project in Android Studio
npm run cap:open:android
```

### Electron Desktop App

```bash
# Run Electron app in development mode
npm run electron:start

# Build Electron app for distribution
npm run electron:build
```

## Building for Each Platform

### iOS

1. **Sync the project:**
   ```bash
   npm run cap:sync:ios
   ```

2. **Open in Xcode:**
   ```bash
   npm run cap:open:ios
   ```

3. **Configure signing:**
   - In Xcode, select the project in the navigator
   - Go to "Signing & Capabilities"
   - Select your development team
   - Xcode will automatically create a provisioning profile

4. **Build and run:**
   - Select a simulator or connected device
   - Press the Play button or `Cmd+R`

5. **For distribution:**
   - Archive the app: Product → Archive
   - Use the Organizer to upload to App Store Connect

### Android

1. **Sync the project:**
   ```bash
   npm run cap:sync:android
   ```

2. **Open in Android Studio:**
   ```bash
   npm run cap:open:android
   ```

3. **Build and run:**
   - Wait for Gradle sync to complete
   - Select a device or emulator
   - Click the Run button or press `Shift+F10`

4. **For distribution:**
   - Build → Generate Signed Bundle / APK
   - Follow the wizard to create a signed release build

### Desktop (Electron)

1. **Run in development:**
   ```bash
   npm run electron:start
   ```

2. **Build for distribution:**
   ```bash
   npm run electron:build
   ```

   This will create distributable packages in `electron/dist/`

3. **Platform-specific builds:**
   - The build will create packages for your current OS
   - For cross-platform builds, see the electron-builder documentation

## Configuration

### Main Configuration
The main Capacitor configuration is in `capacitor.config.ts`:
- `appId`: com.caderno.app
- `appName`: Caderno
- `webDir`: dist

### Platform-Specific Configuration

**iOS:** Configuration in `ios/App/App/Info.plist`
**Android:** Configuration in `android/app/src/main/AndroidManifest.xml`
**Electron:** Configuration in `electron/package.json`

## Development Workflow

1. **Make changes to your web app** (React/TypeScript code)
2. **Build the web app:** `npm run build`
3. **Sync to platforms:** `npm run cap:sync` or platform-specific sync
4. **Open and run** in the respective IDE

## Updating Capacitor

To update Capacitor and its plugins:

```bash
npm install @capacitor/cli@latest @capacitor/core@latest
npm install @capacitor/ios@latest @capacitor/android@latest
npm install @capacitor-community/electron@latest
```

Then sync all platforms:
```bash
npm run cap:sync
```

## Troubleshooting

### iOS Build Issues
- Run `pod install` in the `ios/App` directory
- Clean build folder in Xcode: Product → Clean Build Folder
- Delete DerivedData: `rm -rf ~/Library/Developer/Xcode/DerivedData`

### Android Build Issues
- Invalidate caches in Android Studio: File → Invalidate Caches / Restart
- Clean Gradle: `cd android && ./gradlew clean`
- Check Android SDK and Java versions

### Electron Issues
- Remove `electron` folder and re-add: `npx cap add @capacitor-community/electron`
- Check Node.js version compatibility

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor iOS Guide](https://capacitorjs.com/docs/ios)
- [Capacitor Android Guide](https://capacitorjs.com/docs/android)
- [Capacitor Electron Plugin](https://github.com/capacitor-community/electron)

## Notes

- The `android/`, `ios/`, and `electron/` folders are in `.gitignore` as they can be regenerated
- Platform folders are generated from the web build and Capacitor configuration
- Always build the web app (`npm run build`) before syncing to platforms
- Native code changes should be made directly in the platform folders using their respective IDEs
