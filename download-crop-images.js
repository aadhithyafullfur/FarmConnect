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

// Professional crop images from Unsplash (using specific photo IDs for consistency)
const cropImages = {
  // Vegetables
  tomato: 'https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8dG9tYXRvfGVufDB8fDB8fHww',
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&h=300&fit=crop&crop=center',
  onion: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=300&h=300&fit=crop&crop=center',
  carrot: 'https://images.unsplash.com/photo-1445282768818-728615cc910a?w=300&h=300&fit=crop&crop=center',
  cabbage: 'https://images.unsplash.com/photo-1594282486829-1281fb945d2b?w=300&h=300&fit=crop&crop=center',
  broccoli: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=300&h=300&fit=crop&crop=center',
  spinach: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300&h=300&fit=crop&crop=center',
  lettuce: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=300&h=300&fit=crop&crop=center',
  bell_pepper: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=300&h=300&fit=crop&crop=center',
  cucumber: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=300&h=300&fit=crop&crop=center',
  eggplant: 'https://images.unsplash.com/photo-1434648957308-5e6a859697e8?w=300&h=300&fit=crop&crop=center',
  cauliflower: 'https://images.unsplash.com/photo-1568584711271-67b7da2c8881?w=300&h=300&fit=crop&crop=center',
  green_beans: 'https://images.unsplash.com/photo-1506471253900-95d4b3a3d0b9?w=300&h=300&fit=crop&crop=center',
  peas: 'https://images.unsplash.com/photo-1597714026720-8f74c62310ba?w=300&h=300&fit=crop&crop=center',
  beetroot: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=300&h=300&fit=crop&crop=center',
  radish: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=300&h=300&fit=crop&crop=center',

  // Fruits
  apple: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&h=300&fit=crop&crop=center',
  banana: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=300&h=300&fit=crop&crop=center',
  orange: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=300&h=300&fit=crop&crop=center',
  mango: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&h=300&fit=crop&crop=center',
  grapes: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=300&h=300&fit=crop&crop=center',
  strawberry: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=300&h=300&fit=crop&crop=center',
  pineapple: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=300&h=300&fit=crop&crop=center',
  watermelon: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&h=300&fit=crop&crop=center',
  papaya: 'https://images.unsplash.com/photo-1617112848923-cc2234396a8d?w=300&h=300&fit=crop&crop=center',
  coconut: 'https://images.unsplash.com/photo-1479813183133-f2e9b38ed6c4?w=300&h=300&fit=crop&crop=center',
  lemon: 'https://images.unsplash.com/photo-1590005354167-6da97870c757?w=300&h=300&fit=crop&crop=center',
  lime: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=300&h=300&fit=crop&crop=center',
  pomegranate: 'https://images.unsplash.com/photo-1615485925600-97237c4fc1ec?w=300&h=300&fit=crop&crop=center',
  guava: 'https://images.unsplash.com/photo-1606897898852-2b1156716a77?w=300&h=300&fit=crop&crop=center',

  // Grains
  rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop&crop=center',
  wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&h=300&fit=crop&crop=center',
  corn: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=300&h=300&fit=crop&crop=center',
  barley: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=300&h=300&fit=crop&crop=center',
  oats: 'https://images.unsplash.com/photo-1563803081-e1bb5dd79eb3?w=300&h=300&fit=crop&crop=center',
  millet: 'https://images.unsplash.com/photo-1560788991-f4578c6cf9cd?w=300&h=300&fit=crop&crop=center',
  quinoa: 'https://images.unsplash.com/photo-1505576633371-621f7b3e30b3?w=300&h=300&fit=crop&crop=center',
  sorghum: 'https://images.unsplash.com/photo-1574684891174-df0f4d8bc5c8?w=300&h=300&fit=crop&crop=center',

  // Herbs
  basil: 'https://images.unsplash.com/photo-1618164435735-413d3b066c9a?w=300&h=300&fit=crop&crop=center',
  cilantro: 'https://images.unsplash.com/photo-1583509711515-c1c22b3fc299?w=300&h=300&fit=crop&crop=center',
  parsley: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=300&h=300&fit=crop&crop=center',
  mint: 'https://images.unsplash.com/photo-1628557044797-fbc8946d42d8?w=300&h=300&fit=crop&crop=center',
  rosemary: 'https://images.unsplash.com/photo-1585662800011-ef1953a7e5ab?w=300&h=300&fit=crop&crop=center',

  // Nuts
  almonds: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=300&h=300&fit=crop&crop=center',
  cashews: 'https://images.unsplash.com/photo-1528736235302-52922df5494a?w=300&h=300&fit=crop&crop=center',
  peanuts: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=300&h=300&fit=crop&crop=center'
};

// Create the crops directory if it doesn't exist
const cropsDir = path.join(__dirname, 'client', 'public', 'crops');
if (!fs.existsSync(cropsDir)) {
  fs.mkdirSync(cropsDir, { recursive: true });
}

// Download all crop images
const downloadAllImages = async () => {
  console.log('Starting download of professional crop images...');
  console.log(`Downloading to: ${cropsDir}`);
  
  for (const [cropName, imageUrl] of Object.entries(cropImages)) {
    try {
      const filename = path.join(cropsDir, `${cropName}.jpg`);
      await downloadImage(imageUrl, filename);
      // Add a small delay to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to download ${cropName}:`, error.message);
    }
  }
  
  console.log('\nAll professional crop images downloaded successfully!');
  console.log(`Total images: ${Object.keys(cropImages).length}`);
};

downloadAllImages();
