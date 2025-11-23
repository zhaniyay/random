#!/bin/bash

# Script to find your computer's IP address for mobile testing

echo "=========================================="
echo "Finding your computer's IP address..."
echo "=========================================="
echo ""

# Check OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "Detected: macOS"
    echo ""
    echo "Your IP addresses:"
    ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print "  " $2}'
    echo ""
    echo "Use one of these IPs in your mobile app config:"
    IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
    echo ""
    echo "Update frontend/consumer/mobile/src/config/api.ts to:"
    echo "  export const API_BASE_URL = 'http://$IP:8000';"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "Detected: Linux"
    echo ""
    echo "Your IP addresses:"
    ip addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print "  " $2}' | cut -d/ -f1
    echo ""
    IP=$(ip addr show | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}' | cut -d/ -f1)
    echo "Update frontend/consumer/mobile/src/config/api.ts to:"
    echo "  export const API_BASE_URL = 'http://$IP:8000';"
else
    echo "Please run 'ipconfig' on Windows to find your IPv4 address"
fi

echo ""
echo "=========================================="
echo "Important: Make sure your backend is running with:"
echo "  uvicorn app.main:app --host 0.0.0.0 --port 8000"
echo "=========================================="

