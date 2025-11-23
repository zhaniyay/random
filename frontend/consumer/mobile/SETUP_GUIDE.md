# Consumer Mobile App - Setup Guide

## Prerequisites

- Node.js (v20.x)
- npm or yarn
- Expo Go app on your mobile device (for testing)
- iOS Simulator (Mac only) or Android Emulator

## Installation

1. Navigate to the mobile app directory:
```bash
cd /Users/macbookpro/Desktop/swe/frontend/consumer/mobile
```

2. Install dependencies:
```bash
npm install
```

## Running the App

### Start the development server:
```bash
npm start
```

This will start Metro Bundler and show a QR code.

### Testing Options:

1. **On Physical Device:**
   - Install Expo Go from App Store (iOS) or Play Store (Android)
   - Scan the QR code with your camera (iOS) or Expo Go app (Android)

2. **iOS Simulator (Mac only):**
   - Press `i` in the terminal after starting
   - Or run: `npm run ios`

3. **Android Emulator:**
   - Start your Android emulator first
   - Press `a` in the terminal after starting
   - Or run: `npm run android`

4. **Web Browser:**
   - Press `w` in the terminal after starting
   - Or run: `npm run web`

## Configuration

### Backend API URL

The app connects to the backend API. Update the API URL in `src/config/api.ts`:

```typescript
export const API_URL = process.env.VITE_API_URL || 'http://localhost:8000';
```

For testing on a physical device, you'll need to use your computer's IP address instead of `localhost`:

```typescript
export const API_URL = 'http://192.168.1.XXX:8000';
```

Replace `192.168.1.XXX` with your actual IP address.

## Project Structure

```
frontend/consumer/mobile/
├── App.tsx                 # Root component
├── app.json               # Expo configuration
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── src/
│   ├── config/
│   │   └── api.ts         # API configuration
│   ├── lib/
│   │   └── api.ts         # API client
│   ├── navigation/
│   │   └── RootNavigator.tsx  # Navigation setup
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── SupplierLinksScreen.tsx
│   │   ├── ProductsScreen.tsx
│   │   ├── CartScreen.tsx
│   │   ├── OrdersScreen.tsx
│   │   └── ComplaintsScreen.tsx
│   ├── stores/
│   │   ├── authStore.ts   # Authentication state
│   │   └── cartStore.ts   # Shopping cart state
│   └── types/
│       └── index.ts       # TypeScript types
```

## Features

### Implemented
- User authentication (login/register)
- JWT token management with secure storage
- Shopping cart with persistence
- Navigation between screens
- Dashboard with quick actions

### Screens (Placeholders)
- Supplier Links management
- Product browsing
- Shopping cart
- Order management
- Complaint submission

## Troubleshooting

### "Too many open files" error
This is a common macOS issue. The file watch limit is usually sufficient, but if you encounter this:

1. Close other applications
2. Restart the terminal
3. Try starting the app again

### Cannot connect to backend
- Make sure the backend server is running on port 8000
- If testing on a physical device, use your computer's IP address instead of `localhost`
- Check that your device and computer are on the same network

### App crashes on startup
- Clear the Metro bundler cache: `npx expo start -c`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

## Development

### Type Checking
```bash
npx tsc --noEmit
```

### Clear Cache
```bash
npx expo start -c
```

## Next Steps

The basic infrastructure is complete. The following screens need full implementation:
1. Supplier Links screen
2. Products browsing screen
3. Cart screen
4. Orders screen
5. Complaints screen

See `IMPLEMENTATION_STATUS.md` for detailed status.

