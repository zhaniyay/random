#!/bin/bash
# Quick script to create placeholder assets for Expo app

cd "$(dirname "$0")"

# Create a simple 1024x1024 placeholder icon using ImageMagick or sips (macOS)
if command -v sips &> /dev/null; then
    # macOS - create using sips
    echo "Creating placeholder icon using sips..."
    sips -s format png -z 1024 1024 --setProperty formatOptions 100 /System/Library/CoreServices/DefaultDesktop.heic --out assets/icon.png 2>/dev/null || \
    echo "⚠️  Could not create icon.png automatically. Please create a 1024x1024 PNG icon and save it as assets/icon.png"
    
    # Create splash screen (same as icon for now)
    cp assets/icon.png assets/splash.png 2>/dev/null || true
    
    # Create adaptive icon for Android
    cp assets/icon.png assets/adaptive-icon.png 2>/dev/null || true
    
    # Create favicon for web
    sips -s format png -z 48 48 assets/icon.png --out assets/favicon.png 2>/dev/null || true
else
    echo "⚠️  sips not found. Please manually create:"
    echo "   - assets/icon.png (1024x1024)"
    echo "   - assets/splash.png (1242x2436 recommended)"
    echo "   - assets/adaptive-icon.png (1024x1024)"
    echo "   - assets/favicon.png (48x48)"
fi

echo "✅ Assets setup complete (or instructions provided)"

