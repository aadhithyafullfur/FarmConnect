const fs = require('fs');
const path = require('path');
const https = require('https');

// Function to download image from URL
const downloadImage = (url, filename) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filename);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✅ Downloaded: ${path.basename(filename)}`);
          resolve();
        });
      } else {
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(filename, () => {}); // Delete the file on error
      reject(err);
    });
  });
};

// Enhanced professional crop images with better quality and variety
const enhancedCropImages = {
  // High-quality vegetables
  tomato_fresh: 'https://images.unsplash.com/photo-1592841200221-21e1fc742f9f?w=400&h=400&fit=crop&crop=center&q=80',
  potato_premium: 'https://images.unsplash.com/photo-1590048846200-0d4b5c22d315?w=400&h=400&fit=crop&crop=center&q=80',
  onion_fresh: 'https://images.unsplash.com/photo-1518977956142-3c4b90629fb3?w=400&h=400&fit=crop&crop=center&q=80',
  carrot_organic: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&h=400&fit=crop&crop=center&q=80',
  cabbage_fresh: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&h=400&fit=crop&crop=center&q=80',
  broccoli_organic: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&h=400&fit=crop&crop=center&q=80',
  spinach_fresh: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=400&fit=crop&crop=center&q=80',
  lettuce_crisp: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400&h=400&fit=crop&crop=center&q=80',
  bell_pepper_red: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&h=400&fit=crop&crop=center&q=80',
  cucumber_fresh: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400&h=400&fit=crop&crop=center&q=80',
  
  // Premium fruits
  apple_red: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=400&fit=crop&crop=center&q=80',
  banana_yellow: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=400&h=400&fit=crop&crop=center&q=80',
  orange_fresh: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&h=400&fit=crop&crop=center&q=80',
  mango_ripe: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&h=400&fit=crop&crop=center&q=80',
  grapes_purple: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&h=400&fit=crop&crop=center&q=80',
  strawberry_red: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&h=400&fit=crop&crop=center&q=80',
  watermelon_slice: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop&crop=center&q=80',
  
  // Grains and cereals
  rice_grain: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop&crop=center&q=80',
  wheat_golden: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=400&fit=crop&crop=center&q=80',
  corn_yellow: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=400&fit=crop&crop=center&q=80',
  
  // Fresh herbs
  basil_green: 'https://images.unsplash.com/photo-1618164435735-413d3b066c9a?w=400&h=400&fit=crop&crop=center&q=80',
  cilantro_fresh: 'https://images.unsplash.com/photo-1583509711515-c1c22b3fc299?w=400&h=400&fit=crop&crop=center&q=80',
  mint_leaves: 'https://images.unsplash.com/photo-1628557044797-fbc8946d42d8?w=400&h=400&fit=crop&crop=center&q=80',
  
  // Nuts and seeds
  almonds_raw: 'https://images.unsplash.com/photo-1508919801845-fc2ae1bc2a28?w=400&h=400&fit=crop&crop=center&q=80',
  cashews_white: 'https://images.unsplash.com/photo-1528736235302-52922df5494a?w=400&h=400&fit=crop&crop=center&q=80',
  walnuts_shell: 'https://images.unsplash.com/photo-1448697138198-9aa6d0eec4b6?w=400&h=400&fit=crop&crop=center&q=80'
};

// Create the crops directory if it doesn't exist
const cropsDir = path.join(__dirname, 'client', 'public', 'crops');

// Download enhanced professional images
const downloadEnhancedImages = async () => {
  console.log('🚀 Starting download of enhanced professional crop images...');
  console.log(`📁 Downloading to: ${cropsDir}`);
  console.log(`🎯 Total images to download: ${Object.keys(enhancedCropImages).length}`);
  console.log('');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const [cropName, imageUrl] of Object.entries(enhancedCropImages)) {
    try {
      // Create a clean filename (remove _premium, _fresh, etc. suffixes)
      const cleanName = cropName.split('_')[0];
      const filename = path.join(cropsDir, `${cleanName}_pro.jpg`);
      
      console.log(`⬇️  Downloading ${cleanName} (professional quality)...`);
      await downloadImage(imageUrl, filename);
      successCount++;
      
      // Add a small delay to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Failed to download ${cropName}:`, error.message);
      errorCount++;
    }
  }
  
  console.log('');
  console.log('🎉 Enhanced professional crop images download completed!');
  console.log(`✅ Successfully downloaded: ${successCount} images`);
  console.log(`❌ Failed downloads: ${errorCount} images`);
  console.log(`📊 Total professional images: ${successCount} high-quality photos`);
  console.log('');
  console.log('🌟 Your FarmConnect now has premium professional crop imagery!');
};

downloadEnhancedImages();
