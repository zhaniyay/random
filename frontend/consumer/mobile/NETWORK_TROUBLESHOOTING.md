# Network Error Troubleshooting Guide 🔧

## Issue: Network Error When Creating Account (No Logs)

If you're getting a network error with no logs in frontend or backend, the request likely isn't reaching the server. Here's how to fix it:

---

## ✅ Changes Made

### 1. **CORS Configuration Updated**
- Changed from restricted origins to `allow_origins=["*"]` to support mobile apps
- Mobile apps don't have traditional origins, so this is necessary

### 2. **Enhanced Logging Added**
- **Frontend**: Console logs for all API requests/responses
- **Backend**: Print statements for registration endpoint
- **Error Messages**: More detailed error messages with troubleshooting hints

### 3. **Request Timeout Added**
- 10 second timeout to prevent hanging requests

---

## 🔍 How to Debug

### Step 1: Check Console Logs

**In Mobile App (React Native Debugger or Metro):**
Look for logs starting with:
- `[API Request]` - Shows outgoing requests
- `[API Response]` - Shows successful responses
- `[API Error]` - Shows errors
- `[Auth]` - Shows authentication flow

**In Backend Terminal:**
Look for logs starting with:
- `🔵 [REGISTER]` - Registration request received
- `✅ [REGISTER]` - Registration successful
- `❌ [REGISTER]` - Registration failed

### Step 2: Verify API URL Configuration

Check `src/config/api.ts`:

```typescript
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000'  // iOS Simulator
  // ? 'http://10.0.2.2:8000'  // Android Emulator
  : 'https://your-production-api.com';
```

**For iOS Simulator:**
- ✅ Use `http://localhost:8000`
- ✅ Should work out of the box

**For Android Emulator:**
- ❌ `localhost:8000` won't work
- ✅ Use `http://10.0.2.2:8000` (special IP for Android emulator)
- Uncomment the Android line and comment the iOS line

**For Physical Device:**
- ❌ `localhost:8000` won't work (localhost = device itself)
- ✅ Use your computer's IP address: `http://192.168.1.XXX:8000`
- Find your IP:
  ```bash
  # Mac/Linux
  ifconfig | grep "inet " | grep -v 127.0.0.1
  
  # Windows
  ipconfig
  ```

### Step 3: Verify Backend is Running

```bash
cd backend
source csci360/bin/activate
uvicorn app.main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Step 4: Test Backend Directly

Open in browser or use curl:
```bash
curl http://localhost:8000/healthz
```

Should return: `{"status":"ok"}`

---

## 🐛 Common Issues & Solutions

### Issue 1: "Network Error" or "ECONNREFUSED"

**Symptoms:**
- No logs in backend
- Error: `Network Error` or `ECONNREFUSED`
- Request never reaches server

**Solutions:**

1. **Wrong API URL:**
   - Check `src/config/api.ts`
   - For Android: Use `10.0.2.2:8000`
   - For Physical Device: Use computer's IP

2. **Backend Not Running:**
   ```bash
   cd backend
   source csci360/bin/activate
   uvicorn app.main:app --reload
   ```

3. **Firewall Blocking:**
   - Temporarily disable firewall
   - Or allow port 8000

4. **Wrong Network:**
   - Device and computer must be on same WiFi network

### Issue 2: "CORS Error" or "401 Unauthorized"

**Symptoms:**
- Request reaches backend (you see logs)
- Error about CORS or authentication

**Solutions:**

1. **CORS Fixed:**
   - Already updated to allow all origins
   - Restart backend after changes

2. **401 Error:**
   - This is normal for registration (no token needed)
   - If you see this, request is reaching backend ✅

### Issue 3: "Timeout" Error

**Symptoms:**
- Request hangs for 10 seconds
- Then times out

**Solutions:**

1. **Backend is slow:**
   - Check backend logs for errors
   - Database connection issues?

2. **Network is slow:**
   - Check internet connection
   - Try again

### Issue 4: "Email already exists"

**Symptoms:**
- Request reaches backend ✅
- Error: "Email already exists"

**Solutions:**
- Use a different email
- Or delete existing user from database

---

## 📱 Platform-Specific Configuration

### iOS Simulator
```typescript
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000'
  : 'https://your-production-api.com';
```
✅ Works out of the box

### Android Emulator
```typescript
export const API_BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:8000'  // Special Android emulator IP
  : 'https://your-production-api.com';
```
✅ Use `10.0.2.2` instead of `localhost`

### Physical Device (iOS/Android)
```typescript
export const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.100:8000'  // Your computer's IP
  : 'https://your-production-api.com';
```
✅ Replace with your actual IP address

**Find Your IP:**
```bash
# Mac/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
# Look for "IPv4 Address" under your active network adapter
```

---

## 🧪 Testing Steps

### 1. Test Backend Health
```bash
curl http://localhost:8000/healthz
```
Expected: `{"status":"ok"}`

### 2. Test Registration Endpoint
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "role": "CONSUMER",
    "consumer_name": "Test User"
  }'
```
Expected: `{"access_token":"..."}`

### 3. Check Mobile App Logs
- Open React Native Debugger
- Or check Metro bundler console
- Look for `[API Request]` and `[API Response]` logs

### 4. Check Backend Logs
- Look for `🔵 [REGISTER]` logs
- Should see request details

---

## 🔧 Quick Fix Checklist

- [ ] Backend is running (`uvicorn app.main:app --reload`)
- [ ] API URL is correct for your platform
- [ ] Device and computer on same network (for physical device)
- [ ] CORS allows all origins (already fixed)
- [ ] Check console logs for detailed error messages
- [ ] Try curl test to verify backend works
- [ ] Restart both frontend and backend after changes

---

## 📊 What the Logs Should Show

### Successful Registration:

**Frontend Logs:**
```
[API Request] POST /auth/register
[API Base URL] http://localhost:8000
[API Request Data] {
  "email": "user@example.com",
  "password": "password123",
  "consumer_name": "John Doe",
  "role": "CONSUMER"
}
[API Response] 200 /auth/register
[Auth] Registration successful
```

**Backend Logs:**
```
🔵 [REGISTER] Received registration request
🔵 [REGISTER] Email: user@example.com
🔵 [REGISTER] Role: CONSUMER
🔵 [REGISTER] Consumer Name: John Doe
✅ [REGISTER] User created successfully: 1 (user@example.com)
INFO:     127.0.0.1:XXXXX - "POST /auth/register HTTP/1.1" 200 OK
```

### Failed Registration (Network Error):

**Frontend Logs:**
```
[API Request] POST /auth/register
[API Base URL] http://localhost:8000
[API Network Error] No response received
[API Request URL] http://localhost:8000/auth/register
[API Error Details] Network Error
[Auth] Registration error: Error: Network Error
```

**Backend Logs:**
```
(No logs - request never reached backend)
```

---

## 🚀 Next Steps

1. **Update API URL** in `src/config/api.ts` for your platform
2. **Restart backend** to apply CORS changes
3. **Restart mobile app** to apply logging changes
4. **Try registration again** and check logs
5. **Share logs** if issue persists

---

## 💡 Pro Tips

1. **Use React Native Debugger:**
   - Better console logging
   - Network request inspection
   - Install: `npm install -g react-native-debugger`

2. **Use Flipper:**
   - Network inspector
   - Logs viewer
   - Install Flipper app

3. **Test with curl first:**
   - Verify backend works
   - Then test from mobile app

4. **Check Metro bundler:**
   - Shows console.log output
   - Check for errors

---

**Last Updated:** November 22, 2025  
**Status:** ✅ Enhanced logging and CORS fixes applied

