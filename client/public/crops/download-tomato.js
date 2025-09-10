const https = require('https');
const fs = require('fs');
const path = require('path');

// High-quality tomato image URL (public domain)
const tomatoImageUrl = 'https://cdn.pixabay.com/photo/2016/08/10/16/09/tomatoes-1582042_960_720.jpg';
const outputPath = path.join(__dirname, 'tomato.jpg');

console.log('Downloading real tomato image...');

const file = fs.createWriteStream(outputPath);

https.get(tomatoImageUrl, (response) => {
  if (response.statusCode === 200) {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('✅ Real tomato image downloaded successfully!');
      
      // Check file size
      const stats = fs.statSync(outputPath);
      console.log(`📏 File size: ${stats.size} bytes`);
    });
  } else {
    console.log(`❌ HTTP Status: ${response.statusCode}`);
    // Try alternative URL
    tryAlternativeUrl();
  }
}).on('error', (err) => {
  console.error('❌ Download error:', err.message);
  tryAlternativeUrl();
});

function tryAlternativeUrl() {
  console.log('Trying alternative tomato image...');
  const altUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Tomato_je.jpg/800px-Tomato_je.jpg';
  
  const file2 = fs.createWriteStream(outputPath);
  
  https.get(altUrl, (response) => {
    if (response.statusCode === 200) {
      response.pipe(file2);
      file2.on('finish', () => {
        file2.close();
        console.log('✅ Alternative tomato image downloaded!');
        
        const stats = fs.statSync(outputPath);
        console.log(`📏 File size: ${stats.size} bytes`);
      });
    } else {
      console.log('❌ Alternative URL also failed');
      createFallbackImage();
    }
  }).on('error', (err) => {
    console.error('❌ Alternative URL error:', err.message);
    createFallbackImage();
  });
}

function createFallbackImage() {
  console.log('Creating a simple red placeholder as fallback...');
  // Copy an existing good image and rename it
  const appleImage = path.join(__dirname, 'apple.jpg');
  if (fs.existsSync(appleImage)) {
    fs.copyFileSync(appleImage, outputPath);
    console.log('📋 Copied apple image as tomato placeholder');
  }
}
