# SupplierConnect - Supplier Portal

Modern, clean web interface for suppliers to manage their products, orders, and consumer relationships.

## Features

- **Authentication** - Secure login/register for supplier staff (Owner, Manager, Sales)
- **Dashboard** - Overview of pending links, orders, products, and key metrics
- **Link Management** - Approve/reject/block consumer link requests
- **Product Management** - Full CRUD operations for product catalog
- **Order Management** - View, accept, or reject incoming orders
- **Real-time Chat** - Communicate with consumers about orders
- **Incident Reporting** - Track internal issues and problems
- **Complaints View** - Monitor customer complaints

## Tech Stack

- **React 19** + **TypeScript** - Modern UI framework
- **Vite** - Fast build tool
- **TailwindCSS v4** - Utility-first CSS
- **React Router** - Client-side routing
- **Zustand** - State management
- **React Query** - Data fetching and caching
- **Axios** - HTTP client
- **Lucide React** - Icon library

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:8000`

### Installation

```bash
cd /Users/macbookpro/Desktop/swe/frontend/supplier/web
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Build for Production

```bash
npm run build
npm run preview
```

## Environment Variables

Create a `.env` file in the root directory:

```
VITE_API_URL=http://localhost:8000
```

## Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   └── Layout.tsx    # Main layout with navigation
├── pages/            # Page components
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── LinksPage.tsx
│   ├── ProductsPage.tsx
│   ├── OrdersPage.tsx
│   ├── OrderDetailsPage.tsx
│   ├── IncidentsPage.tsx
│   └── ComplaintsPage.tsx
├── stores/           # Zustand stores
│   └── authStore.ts
├── lib/              # Utilities and API client
│   └── api.ts
├── types/            # TypeScript types
│   ├── api.ts
│   └── auth.ts
├── models/           # Enums and constants
│   └── enums.ts
├── App.tsx           # Main app component with routing
├── main.tsx          # Entry point
└── index.css         # Global styles

## Pages

### Authentication
- `/login` - Login page for supplier staff
- `/register` - Create new supplier account

### Main Portal (Protected)
- `/dashboard` - Overview and statistics
- `/links` - Manage consumer link requests
- `/products` - Product catalog management (CRUD)
- `/orders` - View and manage orders
- `/orders/:id` - Order details with chat
- `/incidents` - Internal incident reporting
- `/complaints` - View customer complaints

## API Integration

All API calls go through the centralized `api.ts` client:

- **Auth API** - Login, register
- **Links API** - Get pending, approve, reject, block
- **Products API** - CRUD operations
- **Orders API** - Get, accept, reject
- **Messages API** - Send and receive messages
- **Incidents API** - Create, list, resolve
- **Complaints API** - View supplier complaints

## Design System

The app uses a consistent design with inline styles:

### Colors
- **Primary**: `#4CAF50` (Green)
- **Destructive**: `#dc2626` (Red)
- **Muted**: `#6b7280` (Gray)
- **Background**: `#f8fafc` (Light Gray)

### Components
- Cards: White background, rounded corners, subtle shadow
- Buttons: Solid or outline styles with hover effects
- Status badges: Color-coded for different states
- Forms: Clean inputs with proper validation

## Authentication Flow

1. User logs in with email/password
2. JWT token is stored in localStorage
3. Token is automatically attached to all API requests
4. On 401 response, user is redirected to login
5. User can logout to clear token and state

## State Management

- **Auth State** (Zustand + localStorage persistence)
  - User info
  - JWT token
  - Authentication status

- **Server State** (React Query)
  - Products
  - Orders
  - Links
  - Messages
  - Incidents
  - Complaints

## User Roles

- **OWNER** - Full access to all features
- **MANAGER** - Can manage products and orders
- **SALES** - Limited access to orders and customer communication
