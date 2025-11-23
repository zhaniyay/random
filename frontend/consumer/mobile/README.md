# Consumer Mobile App - React Native Expo

A mobile application for consumers to manage supplier relationships, browse products, place orders, and track complaints.

## 🚀 Features

- ✅ **Authentication** - Login & Register
- ✅ **Dashboard** - Overview of links, orders, and complaints
- ✅ **Supplier Links** - Request and manage supplier connections
- ✅ **Product Catalog** - Browse products from approved suppliers
- ✅ **Shopping Cart** - Add products and manage quantities
- ✅ **Orders** - Create orders and track status
- ✅ **Complaints** - Submit and track complaints

## 📱 Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation v6
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query
- **Storage**: Expo SecureStore
- **HTTP Client**: Axios

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Expo CLI installed globally: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Emulator installed
- Physical device with Expo Go app (optional)

### Installation

```bash
# Navigate to mobile directory
cd frontend/consumer/mobile

# Install dependencies
npm install

# Start development server
npm start

# Or run directly on specific platform
npm run ios      # iOS simulator
npm run android  # Android emulator
```

### Configuration

Update the API URL in `src/config/api.ts`:

```typescript
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000'      // iOS simulator
  // ? 'http://10.0.2.2:8000'     // Android emulator  
  : 'https://your-production-api.com';
```

**Note**: 
- iOS Simulator can use `localhost`
- Android Emulator needs `10.0.2.2` (special alias for host machine)
- Physical devices need your computer's local IP (e.g., `http://192.168.1.100:8000`)

## 📂 Project Structure

```
mobile/
├── App.tsx                    # Root component
├── app.json                   # Expo configuration
├── package.json              # Dependencies
├── src/
│   ├── config/
│   │   └── api.ts           # API base URL configuration
│   ├── lib/
│   │   └── api.ts           # Axios client & API functions
│   ├── stores/
│   │   ├── authStore.ts     # Authentication state (Zustand)
│   │   └── cartStore.ts     # Shopping cart state (Zustand)
│   ├── types/
│   │   └── index.ts         # TypeScript type definitions
│   ├── navigation/
│   │   ├── RootNavigator.tsx    # Auth flow routing
│   │   ├── AuthStack.tsx        # Login/Register screens
│   │   └── MainTabs.tsx         # Bottom tab navigation
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── LinksScreen.tsx
│   │   ├── ProductsScreen.tsx
│   │   ├── CartScreen.tsx
│   │   ├── OrdersScreen.tsx
│   │   ├── OrderDetailsScreen.tsx
│   │   └── ComplaintsScreen.tsx
│   └── components/
│       ├── ProductCard.tsx
│       ├── OrderCard.tsx
│       └── StatCard.tsx
└── assets/                   # Images, icons, splash screens
```

## 🎨 Screens Overview

### Authentication Flow
- **LoginScreen** - Email/password login
- **RegisterScreen** - Create consumer account

### Main App (Bottom Tabs)
- **Home Tab** - Dashboard with stats and quick actions
- **Links Tab** - Manage supplier connections
- **Orders Tab** - View and track orders  
- **Cart Tab** - Shopping cart with checkout
- **Profile Tab** - Account settings and logout

### Additional Screens
- **ProductsScreen** - Browse supplier catalog
- **OrderDetailsScreen** - View order details
- **ComplaintsScreen** - Submit and track complaints

## 🔐 Authentication

Uses JWT tokens stored in Expo SecureStore:
- Token automatically added to all API requests via Axios interceptor
- Auto-logout on 401 responses
- Persistent login across app restarts

## 🛒 Shopping Cart

- Persistent cart using SecureStore
- Add/remove products
- Update quantities
- MOQ (Minimum Order Quantity) validation
- Stock availability checking
- Real-time price calculation

## 📦 API Integration

All API calls match the backend endpoints:
- `POST /auth/login` - Login
- `POST /auth/register` - Register
- `GET /suppliers` - List suppliers
- `POST /links/request` - Request supplier link
- `GET /links/my` - Get my links
- `GET /products` - Get products by supplier
- `POST /orders` - Create order
- `GET /orders/my` - Get my orders
- `POST /complaints` - Create complaint
- `GET /complaints/my` - Get my complaints

## 🎯 Key Features Implemented

### Dashboard
- Active suppliers count
- Pending links count
- Total orders count
- Active complaints count
- Quick action buttons

### Supplier Links
- View all links with status badges
- Request new supplier connections
- Filter by status (PENDING, APPROVED, REJECTED, BLOCKED)

### Products & Cart
- Browse products from approved suppliers only
- Add to cart with quantity selection
- MOQ enforcement
- Stock validation
- Discount pricing display
- Delivery options and lead time

### Orders
- Create orders from cart
- View order history
- Filter by status
- Order details with items breakdown
- Cancel pending orders

### Complaints
- Create complaints about orders
- Track complaint status
- Filter by status (NEW, ESCALATED, RESOLVED)

## 🚧 Development Notes

### Running on Devices

**iOS Simulator**:
```bash
npm run ios
```

**Android Emulator**:
```bash
npm run android
```

**Physical Device**:
1. Install Expo Go app from App Store/Play Store
2. Scan QR code from `npm start`
3. Update API_BASE_URL to your computer's local IP

### Debugging

- Use React Native Debugger or Flipper
- Enable remote debugging in Expo DevTools
- Check Expo logs for errors: `npx expo start --dev-client`

### Building for Production

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

Requires Expo Application Services (EAS) account.

## 🎨 Styling

- Uses React Native's built-in StyleSheet API
- Color scheme matches web app (Green primary: #4CAF50)
- Responsive layouts
- Platform-specific styling where needed

## ⚡ Performance Optimizations

- React Query caching for API responses
- Lazy loading of screens
- Memoized components where appropriate
- Optimized FlatList rendering for long lists
- Image optimization via Expo

## 🐛 Known Issues / Limitations

1. **No File Attachments** - Message attachments not implemented
2. **No Real-time Updates** - Polling not implemented (manual refresh needed)
3. **No Push Notifications** - Order/complaint updates require manual check
4. **No Offline Mode** - Requires internet connection
5. **No Image Upload** - Product images from backend only

## 🔮 Future Enhancements

- [ ] Push notifications for order status changes
- [ ] Offline mode with sync
- [ ] In-app messaging with suppliers
- [ ] Barcode scanner for quick product lookup
- [ ] Biometric authentication (Face ID / Fingerprint)
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Product search and filters
- [ ] Order history export (PDF/CSV)
- [ ] Receipt/invoice generation

## 📝 Testing

### Manual Testing Checklist
- [ ] Register new consumer account
- [ ] Login with existing account
- [ ] Request supplier link
- [ ] Browse products (after link approved)
- [ ] Add products to cart
- [ ] Create order from cart
- [ ] View order details
- [ ] Submit complaint
- [ ] Logout and re-login (persistent state)

### Test Accounts
See main README for test credentials.

## 🤝 Contributing

When adding new features:
1. Follow existing folder structure
2. Use TypeScript for type safety
3. Update API client in `src/lib/api.ts`
4. Add types to `src/types/index.ts`
5. Use React Query for data fetching
6. Use Zustand for global state

## 📄 License

Same as parent project.

## 🆘 Troubleshooting

### "Network Error" on API calls
- Check API_BASE_URL configuration
- Ensure backend is running
- For Android emulator, use `10.0.2.2` instead of `localhost`
- For physical device, use computer's local IP

### "Expo Go" app crashes
- Clear Expo cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### Build errors
- Clear watchman: `watchman watch-del-all`
- Reset Metro bundler: `npx expo start -c`
- Check Node version (18+ required)

---

**Status**: ✅ Core features implemented and ready for testing
**Platform**: iOS & Android
**Framework**: React Native (Expo)
**Last Updated**: 2025-11-19

