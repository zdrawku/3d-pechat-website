const fs = require('fs');
const path = require('path');

// Define image folders and their output files
const imageFolders = [
    {
        name: 'first-page-images',
        dir: path.join(__dirname, '../src/assets/real-images/first-page-images'),
        output: path.join(__dirname, '../src/app/main-page/carousel-images.ts'),
        exportName: 'carouselImages'
    },
    {
        name: 'general-images',
        dir: path.join(__dirname, '../src/assets/real-images/general-images'),
        output: path.join(__dirname, '../src/app/portfolio-page/carousel-images.ts'),
        exportName: 'carouselImages'
    }
];

// Process each folder synchronously
let totalImages = 0;
imageFolders.forEach(folder => {
    try {
        // Check if directory exists
        if (!fs.existsSync(folder.dir)) {
            console.warn(`⚠ Warning: Directory not found: ${folder.dir}`);
            return;
        }

        // Read all files from the directory
        const files = fs.readdirSync(folder.dir);

        // Filter only image files
        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
        });

        // Sort files for consistent ordering
        imageFiles.sort();

        // Generate the TypeScript file content
        const fileContent = `// This file is auto-generated. Do not edit manually.
// Run 'npm run generate-images' to regenerate this file.

export const ${folder.exportName}: string[] = [
${imageFiles.map(file => `  '/assets/real-images/${folder.name}/${file}'`).join(',\n')}
];
`;

        // Write the file synchronously
        fs.writeFileSync(folder.output, fileContent);
        console.log(`✓ Generated ${folder.name}/carousel-images.ts with ${imageFiles.length} images`);
        totalImages += imageFiles.length;
    } catch (err) {
        console.error(`✗ Error processing ${folder.name}:`, err.message);
        process.exit(1);
    }
});

console.log(`\n✓ Total: ${totalImages} images across ${imageFolders.length} carousels`);

