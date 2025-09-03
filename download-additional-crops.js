const fs = require('fs');
const path = require('path');
const https = require('https');

// Function to download image from URL
const downloadImage = (url, filename) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filename);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${path.basename(filename)}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filename, () => {}); // Delete the file on error
      reject(err);
    });
  });
};

// Additional professional crop images for missing items
const additionalCropImages = {
  // Dairy products (using creative representations)
  milk: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop&crop=center',
  cheese: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300&h=300&fit=crop&crop=center',
  butter: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&h=300&fit=crop&crop=center',
  
  // Additional nuts and seeds
  walnuts: 'https://images.unsplash.com/photo-1448697138198-9aa6d0eec4b6?w=300&h=300&fit=crop&crop=center',
  sunflower_seeds: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=300&h=300&fit=crop&crop=center',
  pumpkin_seeds: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=300&fit=crop&crop=center',
  
  // Additional herbs
  thyme: 'https://images.unsplash.com/photo-1622987437805-0d6bb2b5e4c5?w=300&h=300&fit=crop&crop=center'
};

// Create the crops directory if it doesn't exist
const cropsDir = path.join(__dirname, 'client', 'public', 'crops');

// Download additional crop images
const downloadAdditionalImages = async () => {
  console.log('Starting download of additional professional crop images...');
  
  for (const [cropName, imageUrl] of Object.entries(additionalCropImages)) {
    try {
      const filename = path.join(cropsDir, `${cropName}.jpg`);
      await downloadImage(imageUrl, filename);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to download ${cropName}:`, error.message);
    }
  }
  
  console.log('\nAdditional professional crop images downloaded successfully!');
};

downloadAdditionalImages();
