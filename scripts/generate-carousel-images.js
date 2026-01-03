const fs = require('fs');
const path = require('path');

// Path to the images folder
const imagesDir = path.join(__dirname, '../src/assets/real-images/first-page-images');
const outputFile = path.join(__dirname, '../src/app/main-page/carousel-images.ts');

// Read all files from the directory
fs.readdir(imagesDir, (err, files) => {
  if (err) {
    console.error('Error reading images directory:', err);
    process.exit(1);
  }

  // Filter only image files
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
  });

  // Generate the TypeScript file content
  const fileContent = `// This file is auto-generated. Do not edit manually.
// Run 'npm run generate-images' to regenerate this file.

export const carouselImages: string[] = [
${imageFiles.map(file => `  '/assets/real-images/first-page-images/${file}'`).join(',\n')}
];
`;

  // Write the file
  fs.writeFile(outputFile, fileContent, (err) => {
    if (err) {
      console.error('Error writing carousel-images.ts:', err);
      process.exit(1);
    }
    console.log(`✓ Generated carousel-images.ts with ${imageFiles.length} images`);
  });
});
