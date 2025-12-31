// Test Replicate upload using form-data package (like our actual code)
// CommonJS version (Node 18+ with global fetch)
const FormData = require('form-data');
const fs = require('fs');

const imagePath = process.argv[2];
const apiKey = process.argv[3];

(async () => {
  if (!imagePath || !apiKey) {
    console.error('Usage: node test-replicate-node.js <image_path> <api_key>');
    process.exit(1);
  }

  console.log('🧪 Testing Replicate upload with form-data package');
  console.log('==================================================');
  console.log('');

  // Download test image if URL provided
  let imageBuffer;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    console.log(`Downloading image from: ${imagePath}`);
    const response = await fetch(imagePath);
    if (!response.ok) {
      console.error(`❌ Failed to download: ${response.status}`);
      process.exit(1);
    }
    imageBuffer = Buffer.from(await response.arrayBuffer());
    console.log(`✅ Downloaded: ${imageBuffer.length} bytes`);
  } else {
    imageBuffer = fs.readFileSync(imagePath);
    console.log(`✅ Loaded file: ${imageBuffer.length} bytes`);
  }

  const contentType = 'image/png';
  console.log(`Content-Type: ${contentType}`);
  console.log('');

  // Test multiple attempts
  const MAX_ATTEMPTS = 3;
  let successCount = 0;
  let failCount = 0;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Attempt ${attempt}/${MAX_ATTEMPTS}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const formData = new FormData();
    formData.append('content', imageBuffer, {
      filename: 'image.png',
      contentType: contentType,
    });
    
    const headers = {
      'Authorization': `Token ${apiKey}`,
      ...formData.getHeaders()
    };
    try {
      const len = formData.getLengthSync();
      if (typeof len === 'number' && Number.isFinite(len)) {
        headers['Content-Length'] = String(len);
      }
    } catch (err) {
      // ignore if length cannot be determined
    }
    
    console.log('Headers:', JSON.stringify(headers, null, 2));
    console.log('');
    
    const startTime = Date.now();
    try {
      const response = await fetch('https://api.replicate.com/v1/files', {
        method: 'POST',
        headers: headers,
        body: formData,
      });
      
      const duration = Date.now() - startTime;
      const responseText = await response.text();
      
      console.log(`HTTP Status: ${response.status}`);
      console.log(`Response Time: ${duration}ms`);
      console.log('');
      
      let responseBody;
      try {
        responseBody = JSON.parse(responseText);
        console.log('Response Body:');
        console.log(JSON.stringify(responseBody, null, 2));
      } catch {
        console.log('Response Body (raw):');
        console.log(responseText);
      }
      
      if (response.ok) {
        console.log('✅ Upload successful!');
        successCount++;
        
        if (responseBody.url || responseBody.urls) {
          console.log(`Upload URL: ${responseBody.url || responseBody.urls.get || responseBody.urls.post}`);
        }
      } else {
        console.log(`❌ Upload failed with HTTP ${response.status}`);
        failCount++;
        
        // Show response headers for debugging
        console.log('');
        console.log('Response Headers:');
        response.headers.forEach((value, key) => {
          console.log(`  ${key}: ${value}`);
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`❌ Error after ${duration}ms: ${error.message}`);
      failCount++;
    }
    
    console.log('');
    
    // Wait between attempts
    if (attempt < MAX_ATTEMPTS) {
      const waitTime = 2000;
      console.log(`Waiting ${waitTime}ms before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      console.log('');
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Summary: ${successCount} successful, ${failCount} failed out of ${MAX_ATTEMPTS} attempts`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
})();

