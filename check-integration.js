#!/usr/bin/env node

const http = require('http');

async function checkServer(url, name) {
  return new Promise((resolve) => {
    const request = http.get(url, (res) => {
      console.log(`✅ ${name} is running (Status: ${res.statusCode})`);
      resolve(true);
    });
    
    request.on('error', () => {
      console.log(`❌ ${name} is not accessible`);
      resolve(false);
    });
    
    request.setTimeout(5000, () => {
      console.log(`⏰ ${name} request timed out`);
      request.destroy();
      resolve(false);
    });
  });
}

async function main() {
  console.log('🔍 Checking SubTrackr Integration...\n');
  
  const backendStatus = await checkServer('http://localhost:5000', 'Backend API');
  const frontendStatus = await checkServer('http://localhost:3000', 'Frontend App');
  
  console.log('\n📊 Integration Status:');
  console.log(`Backend (API): ${backendStatus ? '✅ Running' : '❌ Not Running'}`);
  console.log(`Frontend (UI): ${frontendStatus ? '✅ Running' : '❌ Not Running'}`);
  
  if (backendStatus && frontendStatus) {
    console.log('\n🎉 Integration successful! Both servers are running.');
    console.log('👤 You can now access the application at: http://localhost:3000');
  } else {
    console.log('\n⚠️  Integration incomplete. Please ensure both servers are running.');
    console.log('📖 Run: npm run dev (from root directory)');
  }
}

main().catch(console.error);
