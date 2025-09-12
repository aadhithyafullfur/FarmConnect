const https = require('https');
const fs = require('fs');

const url = 'https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8dG9tYXRvfGVufDB8fDB8fHww';
const filePath = './client/public/crops/tomato.jpg';

https.get(url, (res) => {
    const fileStream = fs.createWriteStream(filePath);
    res.pipe(fileStream);

    fileStream.on('finish', () => {
        fileStream.close();
        console.log('Download completed');
    });
}).on('error', (err) => {
    console.error('Error downloading image:', err);
});
