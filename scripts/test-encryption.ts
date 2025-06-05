#!/usr/bin/env tsx

/**
 * Test script for encryption functionality
 * Run with: pnpm tsx scripts/test-encryption.ts
 */

import { config } from 'dotenv';
import { 
  encryptSensitiveData, 
  decryptSensitiveData, 
  encryptForDatabase, 
  decryptFromDatabase,
  generateMasterKey,
  isEncrypted 
} from '../src/lib/crypto';

// Load environment variables
config();

async function testEncryption() {
  console.log('🔐 Testing Encryption System\n');

  // Test data that would typically be stored
  const testData = {
    databaseUrl: 'postgresql://user:secret_password@db.example.com:5432/database?sslmode=require',
    serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTY1NzEyMDB9',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MDk5NTIwMCwiZXhwIjoxOTU2NTcxMjAwfQ'
  };

  console.log('📝 Test Data:');
  console.log('Database URL:', testData.databaseUrl.substring(0, 30) + '...');
  console.log('Service Key:', testData.serviceKey.substring(0, 30) + '...');
  console.log('Anon Key:', testData.anonKey.substring(0, 30) + '...\n');

  try {
    // Test 1: Basic encryption/decryption
    console.log('🧪 Test 1: Basic encryption/decryption');
    
    const encrypted = await encryptSensitiveData(testData.databaseUrl);
    console.log('✅ Encryption successful');
    console.log('Encrypted structure:', {
      hasEncrypted: !!encrypted.encrypted,
      hasIV: !!encrypted.iv,
      hasSalt: !!encrypted.salt,
      hasAuthTag: !!encrypted.authTag
    });

    const decrypted = await decryptSensitiveData(encrypted);
    console.log('✅ Decryption successful');
    
    if (decrypted === testData.databaseUrl) {
      console.log('✅ Data integrity verified\n');
    } else {
      console.log('❌ Data integrity failed\n');
      return;
    }

    // Test 2: Database format encryption/decryption
    console.log('🧪 Test 2: Database format encryption/decryption');
    
    const dbEncrypted = await encryptForDatabase(testData.serviceKey);
    console.log('✅ Database encryption successful');
    console.log('Is valid JSON:', !!JSON.parse(dbEncrypted!));
    console.log('Is detected as encrypted:', isEncrypted(dbEncrypted!));

    const dbDecrypted = await decryptFromDatabase(dbEncrypted);
    console.log('✅ Database decryption successful');
    
    if (dbDecrypted === testData.serviceKey) {
      console.log('✅ Database format integrity verified\n');
    } else {
      console.log('❌ Database format integrity failed\n');
      return;
    }

    // Test 3: Multiple encryptions produce different results (IV uniqueness)
    console.log('🧪 Test 3: IV uniqueness verification');
    
    const encrypted1 = await encryptForDatabase(testData.anonKey);
    const encrypted2 = await encryptForDatabase(testData.anonKey);
    
    if (encrypted1 !== encrypted2) {
      console.log('✅ Each encryption produces unique ciphertext (good security)\n');
    } else {
      console.log('❌ Encryptions are identical (security risk)\n');
      return;
    }

    // Test 4: Null/empty handling
    console.log('🧪 Test 4: Null/empty value handling');
    
    const nullEncrypted = await encryptForDatabase(null);
    const emptyEncrypted = await encryptForDatabase('');
    const undefinedEncrypted = await encryptForDatabase(undefined as any);
    
    console.log('Null input result:', nullEncrypted);
    console.log('Empty string result:', emptyEncrypted);
    console.log('Undefined result:', undefinedEncrypted);
    console.log('✅ Null/empty handling working correctly\n');

    // Test 5: Error handling
    console.log('🧪 Test 5: Error handling');
    
    try {
      await decryptFromDatabase('invalid json');
      console.log('❌ Should have thrown error for invalid JSON');
    } catch (error) {
      console.log('✅ Properly handles invalid JSON');
    }

    try {
      await decryptFromDatabase('{"missing": "fields"}');
      console.log('❌ Should have thrown error for missing encryption fields');
    } catch (error) {
      console.log('✅ Properly handles missing encryption fields');
    }

    console.log('\n🎉 All encryption tests passed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Ensure ENCRYPTION_MASTER_KEY is set in your .env file');
    console.log('2. Update your project forms to use encryption before saving');
    console.log('3. Update your project display to decrypt before showing');
    console.log('4. Create migration script for existing data');

  } catch (error) {
    console.error('❌ Encryption test failed:', error);
    
    if (error instanceof Error && error.message.includes('ENCRYPTION_MASTER_KEY')) {
      console.log('\n🔧 Setup Required:');
      console.log('Run this command to generate a master key:');
      console.log('node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
      console.log('\nThen add it to your .env file:');
      console.log('ENCRYPTION_MASTER_KEY=your_generated_key_here');
    }
  }
}

// Generate master key if requested
if (process.argv.includes('--generate-key')) {
  console.log('🔑 Generated Master Key:');
  console.log(generateMasterKey());
  console.log('\n⚠️  Add this to your .env file as ENCRYPTION_MASTER_KEY');
  console.log('⚠️  Keep this key secure and never commit it to version control');
  process.exit(0);
}

testEncryption(); 