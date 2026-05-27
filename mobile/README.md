# NIHUB Mobile Application

The official mobile application for the NIHUB Attendance System, built with **React Native** and **Expo**.

This app is primarily designed for staff and instructors to easily scan attendee QR codes and log attendance securely at events.

## 🛠️ Tech Stack

- **Framework:** React Native (Expo)
- **Language:** TypeScript
- **Routing:** Expo Router
- **Package Manager:** pnpm

## 🚀 Local Development Setup

### 1. Install Dependencies

Ensure you have Node.js and `pnpm` installed. From this directory, run:
```bash
pnpm install
```

### 2. Environment Setup

Check for any `.env` requirements. Ensure the application is pointing to the correct API host.
- **Android Emulator:** Uses `[IP_ADDRESS]` to reach the local backend running on your host machine.
- **iOS Simulator:** Uses `localhost`.
- **Physical Device:** Must use your computer's local LAN IP (e.g., `192.168.x.x`) and be on the same network.

### 3. Start the Development Server

Start the Expo bundler:
```bash
pnpm run start
```
From the Expo CLI menu, you can press:
- `a` to open on an Android emulator.
- `i` to open on an iOS simulator.
- `w` to run in a web browser.

## 📦 Building & Deployment

We use **Expo Application Services (EAS)** for building native binaries.

### Creating a Build

Make sure you have the EAS CLI installed and are logged in:
```bash
npm install -g eas-cli
eas login
```

Run a build for your desired platform:
```bash
# Build for Android (APK or AAB depending on eas.json profile)
eas build --platform android --profile preview

# Build for iOS
eas build --platform ios --profile preview
```

## 🧹 Code Quality

Run the linter to ensure code style consistency:
```bash
pnpm run lint
```
