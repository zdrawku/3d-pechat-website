# Dynamic Image Loading for Carousel

## How It Works

The carousel images are now **truly dynamic**. The system automatically detects all images in the `src/assets/real-images/first-page-images/` folder.

## Setup

A Node.js script (`scripts/generate-carousel-images.js`) scans the images folder and generates a TypeScript file (`carousel-images.ts`) with the list of all images found.

## When Images Are Updated

The image list is automatically regenerated in these scenarios:

1. **Before `npm start`** - The `prestart` script runs automatically
2. **Before `npm run build`** - The `prebuild` script runs automatically
3. **Manually** - Run `npm run generate-images` anytime

## Adding/Removing Images

To add or remove images from the carousel:

1. Simply add or delete image files in `src/assets/real-images/first-page-images/`
2. Run `npm start` or `npm run build` (images will be auto-detected)
3. Or manually run: `npm run generate-images`

## Supported Image Formats

- `.jpg` / `.jpeg`
- `.png`
- `.webp`
- `.gif`

## Files Involved

- `scripts/generate-carousel-images.js` - The generator script
- `src/app/main-page/carousel-images.ts` - Auto-generated file (don't edit manually)
- `src/app/main-page/main-page.component.ts` - Imports the image list
- `src/app/main-page/main-page.component.html` - Displays images with `*ngFor`

## Example

```bash
# Add a new image
cp new-image.jpg src/assets/real-images/first-page-images/

# Regenerate the list
npm run generate-images

# Start the app (or it will auto-regenerate)
npm start
```

That's it! The carousel will automatically include the new image. 🎉
