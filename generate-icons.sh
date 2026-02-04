#!/bin/bash

# Icon Generator Script for Keith's Superstore PWA
# This script generates all required PWA icons from a single source image

echo "🎨 Keith's Superstore - PWA Icon Generator"
echo "=========================================="
echo ""

# Check if source image is provided
if [ -z "$1" ]; then
    echo "❌ Error: No source image provided"
    echo ""
    echo "Usage: ./generate-icons.sh path/to/your-logo.png"
    echo ""
    echo "Requirements:"
    echo "  - Source image should be at least 512x512px"
    echo "  - PNG format recommended"
    echo "  - Square aspect ratio works best"
    echo ""
    exit 1
fi

SOURCE_IMAGE="$1"

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not found!"
    echo ""
    echo "Install ImageMagick:"
    echo "  - macOS: brew install imagemagick"
    echo "  - Ubuntu/Debian: sudo apt install imagemagick"
    echo "  - Windows: Download from https://imagemagick.org"
    echo ""
    exit 1
fi

# Check if source image exists
if [ ! -f "$SOURCE_IMAGE" ]; then
    echo "❌ Error: Source image not found: $SOURCE_IMAGE"
    exit 1
fi

# Create public directory if it doesn't exist
mkdir -p public

# Icon sizes to generate
declare -a sizes=("72" "96" "128" "144" "152" "192" "384" "512")

echo "📦 Generating icons from: $SOURCE_IMAGE"
echo ""

# Generate each icon size
for size in "${sizes[@]}"; do
    output="public/icon-${size}.png"
    echo "  ✓ Creating ${size}x${size}px → $output"
    convert "$SOURCE_IMAGE" -resize ${size}x${size} -background transparent -gravity center -extent ${size}x${size} "$output"
done

echo ""
echo "✅ All icons generated successfully!"
echo ""
echo "Generated files in public/:"
for size in "${sizes[@]}"; do
    echo "  - icon-${size}.png"
done

echo ""
echo "🚀 Next steps:"
echo "  1. Run: pnpm install (to install dependencies)"
echo "  2. Run: pnpm build (to build the app)"
echo "  3. Deploy to Vercel, Netlify, or your hosting"
echo "  4. Install on Android via Chrome menu!"
echo ""
