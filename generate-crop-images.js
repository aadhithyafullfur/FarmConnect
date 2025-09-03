const fs = require('fs');
const path = require('path');

// Simple SVG generator for crop placeholders
const generateCropSVG = (cropName, emoji, bgColor) => {
  return `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
  <rect width="300" height="300" fill="${bgColor}"/>
  <text x="150" y="150" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-size="80">${emoji}</text>
  <text x="150" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="white">${cropName}</text>
</svg>`;
};

// Crop definitions - comprehensive list matching CropSelector
const crops = [
  // Vegetables
  { name: 'Tomato', emoji: '🍅', color: '#FF6347' },
  { name: 'Potato', emoji: '🥔', color: '#DEB887' },
  { name: 'Onion', emoji: '🧅', color: '#F0E68C' },
  { name: 'Carrot', emoji: '🥕', color: '#FF8C00' },
  { name: 'Cabbage', emoji: '🥬', color: '#32CD32' },
  { name: 'Broccoli', emoji: '🥦', color: '#228B22' },
  { name: 'Spinach', emoji: '🥬', color: '#228B22' },
  { name: 'Lettuce', emoji: '🥗', color: '#32CD32' },
  { name: 'Bell Pepper', emoji: '🫑', color: '#FF6347' },
  { name: 'Cucumber', emoji: '🥒', color: '#32CD32' },
  { name: 'Eggplant', emoji: '🍆', color: '#4B0082' },
  { name: 'Cauliflower', emoji: '🥦', color: '#F5F5DC' },
  { name: 'Green Beans', emoji: '🫘', color: '#32CD32' },
  { name: 'Peas', emoji: '🟢', color: '#32CD32' },
  { name: 'Beetroot', emoji: '🍠', color: '#8B0000' },
  { name: 'Radish', emoji: '🌶️', color: '#FF6347' },
  
  // Fruits
  { name: 'Apple', emoji: '🍎', color: '#DC143C' },
  { name: 'Banana', emoji: '🍌', color: '#FFD700' },
  { name: 'Orange', emoji: '🍊', color: '#FF8C00' },
  { name: 'Mango', emoji: '🥭', color: '#FFD700' },
  { name: 'Grapes', emoji: '🍇', color: '#8A2BE2' },
  { name: 'Strawberry', emoji: '🍓', color: '#DC143C' },
  { name: 'Pineapple', emoji: '🍍', color: '#FFD700' },
  { name: 'Watermelon', emoji: '🍉', color: '#228B22' },
  { name: 'Papaya', emoji: '🧡', color: '#FF8C00' },
  { name: 'Coconut', emoji: '🥥', color: '#8B4513' },
  { name: 'Lemon', emoji: '🍋', color: '#FFD700' },
  { name: 'Lime', emoji: '🟢', color: '#32CD32' },
  { name: 'Pomegranate', emoji: '🔴', color: '#DC143C' },
  { name: 'Guava', emoji: '🟡', color: '#FFD700' },
  
  // Grains
  { name: 'Rice', emoji: '🌾', color: '#F5DEB3' },
  { name: 'Wheat', emoji: '🌾', color: '#DEB887' },
  { name: 'Corn', emoji: '🌽', color: '#FFD700' },
  { name: 'Barley', emoji: '🌾', color: '#DEB887' },
  { name: 'Oats', emoji: '🌾', color: '#F5DEB3' },
  { name: 'Millet', emoji: '🌾', color: '#DEB887' },
  { name: 'Quinoa', emoji: '🌾', color: '#F5DEB3' },
  { name: 'Sorghum', emoji: '🌾', color: '#DEB887' },
  
  // Dairy (represented symbolically)
  { name: 'Milk', emoji: '🥛', color: '#F5F5F5' },
  { name: 'Cheese', emoji: '🧀', color: '#FFD700' },
  { name: 'Yogurt', emoji: '🥛', color: '#F5F5F5' },
  { name: 'Butter', emoji: '🧈', color: '#FFD700' },
  
  // Herbs
  { name: 'Basil', emoji: '🌿', color: '#228B22' },
  { name: 'Cilantro', emoji: '🌿', color: '#228B22' },
  { name: 'Parsley', emoji: '🌿', color: '#228B22' },
  { name: 'Mint', emoji: '🌿', color: '#228B22' },
  { name: 'Rosemary', emoji: '🌿', color: '#228B22' },
  { name: 'Thyme', emoji: '🌿', color: '#228B22' },
  
  // Nuts & Seeds
  { name: 'Almonds', emoji: '🌰', color: '#DEB887' },
  { name: 'Walnuts', emoji: '🌰', color: '#8B4513' },
  { name: 'Cashews', emoji: '🌰', color: '#F5DEB3' },
  { name: 'Peanuts', emoji: '🥜', color: '#DEB887' },
  { name: 'Sunflower Seeds', emoji: '🌻', color: '#FFD700' },
  { name: 'Pumpkin Seeds', emoji: '🎃', color: '#FF8C00' }
];

// Create the crops directory if it doesn't exist
const cropsDir = path.join(__dirname, 'client', 'public', 'crops');
console.log('Creating crops in directory:', cropsDir);
if (!fs.existsSync(cropsDir)) {
  fs.mkdirSync(cropsDir, { recursive: true });
}

// Generate SVG files
crops.forEach(crop => {
  const fileName = crop.name.toLowerCase().replace(/ /g, '_') + '.svg';
  const filePath = path.join(cropsDir, fileName);
  const svg = generateCropSVG(crop.name, crop.emoji, crop.color);
  
  fs.writeFileSync(filePath, svg);
  console.log(`Generated ${fileName}`);
});

console.log('All crop images generated successfully!');
