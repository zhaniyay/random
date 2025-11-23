# Mobile App Troubleshooting Guide

## Network Error - Cannot Sign In

If you're getting a "Network Error" when trying to sign in, follow these steps:

### 1. Check Backend Server is Running

Make sure your backend server is running:

```bash
cd /Users/macbookpro/Desktop/swe/backend
source csci360/bin/activate
export DATABASE_URL='postgresql://postgres:password@localhost:5432/scp_db'
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 2. Find Your Computer's IP Address

The mobile app needs to connect to your backend using your computer's IP address (not localhost).

**On Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**On Windows:**
```bash
ipconfig
```

Look for your **IPv4 Address**. It will look like:
- `192.168.1.100`
- `10.0.1.50`
- `172.16.0.10`

### 3. Update API URL in Mobile App

Edit `frontend/consumer/mobile/src/config/api.ts`:

**Before:**
```typescript
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000'
  : 'https://your-production-api.com';
```

**After (replace with YOUR IP):**
```typescript
export const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.100:8000'  // Replace with YOUR computer's IP
  : 'https://your-production-api.com';
```

### 4. Restart the Mobile App

After changing the API URL:

1. Stop the Expo server (Ctrl+C)
2. Clear cache: `npx expo start -c`
3. Reload the app on your device

### 5. Test Backend Connection

You can test if the backend is accessible:

**From your computer:**
```bash
curl http://localhost:8000/healthz
```

**From your phone's browser:**
Open: `http://YOUR_COMPUTER_IP:8000/healthz`

You should see: `{"ok":true}`

### 6. Common Issues

#### Issue: "Network Error" on iOS Simulator
**Solution:** iOS Simulator can use `localhost`. No IP change needed.

#### Issue: "Network Error" on Android Emulator
**Solution:** Android Emulator uses special IP `10.0.2.2` to reach host machine:
```typescript
export const API_BASE_URL = 'http://10.0.2.2:8000';
```

#### Issue: "Network Error" on Physical Device
**Solution:** 
1. Make sure your phone and computer are on the SAME Wi-Fi network
2. Use your computer's IP address (not localhost)
3. Make sure your firewall isn't blocking port 8000

#### Issue: Backend running but still can't connect
**Solution:** Check firewall settings:

**Mac:**
```bash
# Allow port 8000
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /path/to/python
```

**Windows:**
Go to Windows Defender Firewall → Allow an app through firewall

### 7. Verify Backend CORS

The backend has been updated to allow all origins for development. Check in `backend/app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # This allows mobile apps
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 8. Test with Sample Credentials

If the backend is running correctly, you should be able to register a new account or use existing credentials.

**Register a new consumer:**
- Email: test@example.com
- Password: password123
- Consumer Name: Test Consumer

### Quick Checklist

- [ ] Backend is running on port 8000
- [ ] Can access `http://localhost:8000/healthz` from browser
- [ ] Found computer's IP address
- [ ] Updated `src/config/api.ts` with correct IP
- [ ] Restarted Expo server with cache clear (`npx expo start -c`)
- [ ] Phone and computer on same Wi-Fi network
- [ ] Firewall allows port 8000

### Still Having Issues?

Check the Metro bundler console and backend console for specific error messages:

**Metro Console:**
Look for network errors or API call failures

**Backend Console:**
Should show incoming requests:
```
INFO:     127.0.0.1:52707 - "POST /auth/login?email=test@example.com&password=... HTTP/1.1" 200 OK
```

If you don't see any requests in the backend, the mobile app cannot reach the server.

