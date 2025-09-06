#!/usr/bin/env node

const http = require('http');

// Test API endpoints
async function testAPI(endpoint, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const url = `http://localhost:5000${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: body,
          success: res.statusCode < 400
        });
      });
    });

    req.on('error', () => {
      resolve({ status: 0, success: false, error: 'Connection failed' });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function checkFrontend() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000', (res) => {
      resolve({
        status: res.statusCode,
        success: res.statusCode === 200
      });
    });

    req.on('error', () => {
      resolve({ status: 0, success: false });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ status: 0, success: false });
    });
  });
}

async function main() {
  console.log('🔍 Testing SubTrackr Integration...\n');

  // Test backend API
  console.log('🔧 Testing Backend API...');
  const apiRoot = await testAPI('/');
  console.log(`  Root endpoint: ${apiRoot.success ? '✅' : '❌'} (Status: ${apiRoot.status})`);

  const authEndpoint = await testAPI('/api/auth/login', 'POST', {
    email: 'test@example.com',
    password: 'wrongpassword'
  });
  console.log(`  Auth endpoint: ${authEndpoint.status === 400 || authEndpoint.status === 401 ? '✅' : '❌'} (Status: ${authEndpoint.status})`);

  // Test frontend
  console.log('\n🎨 Testing Frontend...');
  const frontend = await checkFrontend();
  console.log(`  Next.js app: ${frontend.success ? '✅' : '❌'} (Status: ${frontend.status})`);

  // Integration summary
  console.log('\n📊 Integration Summary:');
  console.log(`Backend API: ${apiRoot.success ? '✅ Running' : '❌ Not Running'}`);
  console.log(`Frontend App: ${frontend.success ? '✅ Running' : '❌ Not Running'}`);
  console.log(`API Endpoints: ${authEndpoint.status === 400 || authEndpoint.status === 401 ? '✅ Responding' : '❌ Not Responding'}`);

  if (apiRoot.success && frontend.success) {
    console.log('\n🎉 Integration Test PASSED!');
    console.log('✨ Both backend and frontend are properly integrated and running.');
    console.log('🌐 Application accessible at: http://localhost:3000');
    console.log('🔌 API accessible at: http://localhost:5000');
  } else {
    console.log('\n❌ Integration Test FAILED!');
    console.log('Please check that both servers are running:');
    console.log('  Backend: cd Back/server && npm run dev');
    console.log('  Frontend: cd Front && npm run dev');
  }
}

main().catch(console.error);
