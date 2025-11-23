// API Configuration
// Update this to your backend URL
export const API_BASE_URL = __DEV__ 
  ? 'http://10.101.17.36:8000'  // Physical device - use your computer's IP
  // ? 'http://localhost:8000'  // For iOS simulator use localhost
  // ? 'http://10.0.2.2:8000'  // For Android emulator
  : 'https://your-production-api.com';

