# NIHUB Attendance Mobile App

Flutter mobile application for on-site attendance management. Staff use the app to scan QR codes or manually check in/out attendees.

## Tech Stack

- **Framework:** Flutter
- **State Management:** Riverpod
- **Routing:** go_router
- **HTTP Client:** Dio
- **Secure Storage:** FlutterSecureStorage (for refresh tokens)

## Routes

| Path | Description |
|------|-------------|
| `/login` | Staff login |
| `/departments` | Department list (home) |
| `/departments/:code/registrants` | Manual check-in: tap a registrant to check in/out |
| `/departments/:code/scan` | QR code scanner for quick check-in |
| `/logout` | Sign out |

## Authentication

On app launch, the app validates the stored JWT access token. If the token is expired or invalid, it attempts a silent refresh using the stored refresh token (`POST /auth/refresh`).

If refresh fails (network error or 401), the `AuthEventBus` signals all providers to force-signout and redirect to `/login`.

Tokens are stored securely using `FlutterSecureStorage`:
- `access_token` — JWT access token
- `refresh_token` — refresh token for rotation
- `expires_at` — access token expiration timestamp

## Check-In / Check-Out Flow

1. Select a department from the home screen.
2. On the registrants screen, tap any registrant tile.
3. Action sheet appears:
   - **[Check In]** — calls `POST /departments/:code/check-in`
   - **[Check Out]** — calls `POST /departments/:code/check-out`
   - **[View]** — shows registrant detail (no action)
4. The registrant's status badge updates immediately (checked in / checked out / not checked in).

The QR scanner (`/departments/:code/scan`) decodes a registrant QR payload and performs the same check-in action without needing to tap.

## Data Models

Key models (see `mobile/lib/models/`):
- `DepartmentModel` — department code, name (replaces `EventModel` from Phase 5)
- `RegistrantModel` — id, name, email, matriculation number, status
- `AttendanceSession` — session type (`in`/`out`), timestamp

## Local Development Setup

### 1. Install Dependencies

```bash
flutter pub get
```

### 2. Environment

Set `API_BASE_URL` in your environment or `.env` file. The app connects to the Caddy proxy in production or directly to `http://10.0.2.2:8000` (Android emulator host) in development.

### 3. Run

```bash
flutter run
```

For Android emulator: `flutter run -d emulator-5554`

## Building

### Debug APK

```bash
flutter build apk --debug
```

Output: `build/app/outputs/flutter-apk/app-debug.apk`

### EAS Build (Cloud)

```bash
eas build --platform android --profile preview
```

See `app.json` for EAS configuration.

## API Integration

All API calls go through Dio interceptors which:
- Attach `Authorization: Bearer <token>` header
- Automatically refresh on 401
- Emit `AuthEventBus.forceSignOut` on refresh failure

Base URL: configurable via `API_BASE_URL` environment variable.