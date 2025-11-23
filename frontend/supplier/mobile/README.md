# Supplier Mobile App

React Native mobile application for suppliers built with Expo, TypeScript, and React Navigation.

## Features

- **Dashboard**: Overview with stats (pending links, orders, complaints, products)
- **Orders**: View and manage orders (accept/reject) - Owner/Manager only
- **Products**: View and manage product catalog (create/edit/delete) - Owner/Manager only
- **Complaints**: View and handle complaints with role-based restrictions
- **Links**: View and manage consumer link requests (approve/reject/block) - Owner/Manager only
- **Messaging**: Chat with consumers via order details (supports text, images, files, audio)

## Role-Based Access Control

### Owner
- Full access to all features
- Can manage products, orders, links, complaints
- Can create/remove staff members (via web portal)

### Manager
- Can manage products, orders, links, complaints
- Cannot create/remove staff members
- Cannot delete/deactivate supplier account

### Sales
- Can view products (read-only)
- Can view linked consumers
- Can chat with consumers
- Can handle first-line complaints (escalate/resolve NEW complaints)
- Cannot manage products, orders, or links
- Cannot resolve escalated complaints

## Setup

1. Install dependencies:
```bash
npm install
```

2. Update API configuration in `src/config/api.ts`:
```typescript
export const API_BASE_URL = 'http://YOUR_COMPUTER_IP:8000';
```

3. Start the development server:
```bash
npx expo start
```

4. Scan QR code with Expo Go app (iOS/Android) or press `i` for iOS simulator / `a` for Android emulator

## Project Structure

```
src/
├── config/          # API configuration
├── lib/            # API client functions
├── navigation/     # React Navigation setup
├── screens/        # Screen components
│   ├── auth/      # Authentication screens
│   └── ...        # Main app screens
├── stores/         # Zustand state management
└── types/          # TypeScript type definitions
```

## API Endpoints Used

- `/auth/login` - Supplier login
- `/orders/my` - Get supplier orders
- `/orders/{id}/accept` - Accept order (Owner/Manager)
- `/orders/{id}/reject` - Reject order (Owner/Manager)
- `/products` - Get/create/update/delete products
- `/complaints/my` - Get complaints
- `/complaints/{id}/escalate` - Escalate complaint (Sales)
- `/complaints/{id}/resolve` - Resolve complaint
- `/links/my` - Get links
- `/links/{id}/approve` - Approve link (Owner/Manager)
- `/links/{id}/reject` - Reject link (Owner/Manager)
- `/links/{id}/block` - Block link (Owner/Manager)
- `/messages` - Get/send messages

## Notes

- The app uses Expo SecureStore for token storage
- All API requests include authentication tokens automatically
- Role-based UI restrictions are enforced on both frontend and backend
- File uploads (images, documents, audio) are supported in messaging

