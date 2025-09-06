#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function generateSecretKey(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

async function createEnvFile(directory, templateFile, outputFile) {
  const templatePath = path.join(directory, templateFile);
  const outputPath = path.join(directory, outputFile);
  
  if (!fs.existsSync(templatePath)) {
    console.log(`${colors.yellow}⚠️  Template file not found: ${templatePath}${colors.reset}`);
    return false;
  }
  
  if (fs.existsSync(outputPath)) {
    const overwrite = await question(`${colors.yellow}⚠️  ${outputFile} already exists in ${directory}. Overwrite? (y/n): ${colors.reset}`);
    if (overwrite.toLowerCase() !== 'y') {
      console.log(`${colors.blue}Skipping ${outputFile} in ${directory}${colors.reset}`);
      return true;
    }
  }
  
  let content = fs.readFileSync(templatePath, 'utf8');
  
  // Generate JWT secret
  if (content.includes('your_jwt_secret_key_here') || content.includes('your_super_secure_jwt_secret_key_here')) {
    const jwtSecret = generateSecretKey();
    content = content.replace(/your_jwt_secret_key_here|your_super_secure_jwt_secret_key_here/g, jwtSecret);
    console.log(`${colors.green}✅ Generated new JWT secret${colors.reset}`);
  }
  
  fs.writeFileSync(outputPath, content);
  console.log(`${colors.green}✅ Created ${outputFile} in ${directory}${colors.reset}`);
  return true;
}

async function configureEmail() {
  console.log(`${colors.blue}${colors.bold}\n📧 Email Configuration${colors.reset}`);
  console.log('Choose an email service for sending notifications:');
  console.log('1. Gmail (Recommended for development)');
  console.log('2. SendGrid (Recommended for production)');
  console.log('3. Skip email configuration');
  
  const choice = await question('Enter your choice (1-3): ');
  
  switch (choice) {
    case '1':
      console.log(`${colors.yellow}\n📝 Gmail Setup Instructions:${colors.reset}`);
      console.log('1. Enable 2-Factor Authentication on your Gmail account');
      console.log('2. Go to Google Account Settings > Security > App Passwords');
      console.log('3. Generate an app password for "Mail"');
      console.log('4. Use your Gmail address and the generated app password');
      
      const gmailUser = await question('\nEnter your Gmail address: ');
      const gmailPass = await question('Enter your Gmail app password: ');
      
      return {
        EMAIL_SERVICE: 'gmail',
        EMAIL_USER: gmailUser,
        EMAIL_PASS: gmailPass,
        EMAIL_HOST: 'smtp.gmail.com',
        EMAIL_PORT: '587'
      };
      
    case '2':
      console.log(`${colors.yellow}\n📝 SendGrid Setup Instructions:${colors.reset}`);
      console.log('1. Sign up for a free SendGrid account');
      console.log('2. Create an API key with "Full Access" permissions');
      console.log('3. Verify your sender email address');
      
      const sendgridKey = await question('\nEnter your SendGrid API key: ');
      const sendgridEmail = await question('Enter your verified sender email: ');
      
      return {
        EMAIL_SERVICE: 'sendgrid',
        SENDGRID_API_KEY: sendgridKey,
        SENDGRID_FROM_EMAIL: sendgridEmail
      };
      
    case '3':
      console.log(`${colors.yellow}⚠️  Email configuration skipped. Email features will be disabled.${colors.reset}`);
      return {};
      
    default:
      console.log(`${colors.red}Invalid choice. Skipping email configuration.${colors.reset}`);
      return {};
  }
}

async function configureDatabase() {
  console.log(`${colors.blue}${colors.bold}\n💾 Database Configuration${colors.reset}`);
  console.log('Choose a database setup:');
  console.log('1. Local MongoDB (mongodb://localhost:27017/subtrackr)');
  console.log('2. MongoDB Atlas (cloud)');
  console.log('3. Custom MongoDB URI');
  
  const choice = await question('Enter your choice (1-3): ');
  
  switch (choice) {
    case '1':
      console.log(`${colors.green}✅ Using local MongoDB${colors.reset}`);
      return { MONGODB_URI: 'mongodb://localhost:27017/subtrackr' };
      
    case '2':
      console.log(`${colors.yellow}\n📝 MongoDB Atlas Setup Instructions:${colors.reset}`);
      console.log('1. Create a free account at https://mongodb.com/atlas');
      console.log('2. Create a new cluster');
      console.log('3. Create a database user');
      console.log('4. Whitelist your IP address');
      console.log('5. Get the connection string');
      
      const atlasUri = await question('\nEnter your MongoDB Atlas connection string: ');
      return { MONGODB_URI: atlasUri };
      
    case '3':
      const customUri = await question('Enter your MongoDB URI: ');
      return { MONGODB_URI: customUri };
      
    default:
      console.log(`${colors.yellow}Using default local MongoDB URI${colors.reset}`);
      return { MONGODB_URI: 'mongodb://localhost:27017/subtrackr' };
  }
}

async function updateEnvFiles(emailConfig, dbConfig) {
  const envFiles = [
    { dir: 'Back/server', file: '.env' },
    { dir: 'API', file: '.env' }
  ];
  
  for (const { dir, file } of envFiles) {
    const envPath = path.join(dir, file);
    if (fs.existsSync(envPath)) {
      let content = fs.readFileSync(envPath, 'utf8');
      
      // Update database URI
      if (dbConfig.MONGODB_URI) {
        content = content.replace(/MONGODB_URI=.*/, `MONGODB_URI=${dbConfig.MONGODB_URI}`);
      }
      
      // Update email configuration
      Object.entries(emailConfig).forEach(([key, value]) => {
        const regex = new RegExp(`${key}=.*`, 'g');
        if (content.includes(`${key}=`)) {
          content = content.replace(regex, `${key}=${value}`);
        } else {
          content += `\n${key}=${value}`;
        }
      });
      
      fs.writeFileSync(envPath, content);
      console.log(`${colors.green}✅ Updated ${envPath}${colors.reset}`);
    }
  }
}

async function main() {
  console.log(`${colors.blue}${colors.bold}🚀 SubTrackr Environment Setup${colors.reset}`);
  console.log(`${colors.blue}This script will help you configure your development environment.${colors.reset}\n`);
  
  try {
    // Create .env files from templates
    console.log(`${colors.blue}${colors.bold}📋 Creating Environment Files${colors.reset}`);
    
    await createEnvFile('Back/server', '.env.example', '.env');
    await createEnvFile('API', '.env.example', '.env');
    
    // Configure email
    const emailConfig = await configureEmail();
    
    // Configure database
    const dbConfig = await configureDatabase();
    
    // Update .env files with user configuration
    if (Object.keys(emailConfig).length > 0 || Object.keys(dbConfig).length > 0) {
      console.log(`${colors.blue}${colors.bold}\n🔧 Updating Configuration Files${colors.reset}`);
      await updateEnvFiles(emailConfig, dbConfig);
    }
    
    // Installation recommendations
    console.log(`${colors.blue}${colors.bold}\n📦 Next Steps${colors.reset}`);
    console.log(`${colors.green}1. Install dependencies: npm run install:all${colors.reset}`);
    console.log(`${colors.green}2. Start the development servers: npm run dev${colors.reset}`);
    console.log(`${colors.green}3. Test the integration: npm run test:integration${colors.reset}`);
    
    if (dbConfig.MONGODB_URI && dbConfig.MONGODB_URI.includes('localhost')) {
      console.log(`${colors.yellow}\n⚠️  Make sure MongoDB is running locally before starting the servers.${colors.reset}`);
    }
    
    console.log(`${colors.blue}\n🎉 Setup complete! Your SubTrackr environment is ready.${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}${colors.bold}❌ Setup failed:${colors.reset}`, error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = { createEnvFile, configureEmail, configureDatabase, main };
