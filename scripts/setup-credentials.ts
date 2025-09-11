#!/usr/bin/env ts-node
/**
 * ABOUTME: Interactive setup script for GPG credential management system
 * Helps users configure GPG keys, encrypt credentials, and test the system
 */

import { promises as fs } from 'fs'
import { spawn } from 'child_process'
import * as readline from 'readline'
import { GPGCredentialManager } from '../src/lib/security/credential-manager'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

function questionHidden(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(prompt)
    process.stdin.setRawMode(true)
    
    let input = ''
    const onData = (char: Buffer) => {
      const c = char.toString()
      if (c === '\r' || c === '\n') {
        process.stdin.setRawMode(false)
        process.stdin.removeListener('data', onData)
        process.stdout.write('\n')
        resolve(input)
      } else if (c === '\u0003') {
        // Ctrl+C
        process.exit(1)
      } else if (c === '\u007f') {
        // Backspace
        if (input.length > 0) {
          input = input.slice(0, -1)
          process.stdout.write('\b \b')
        }
      } else {
        input += c
        process.stdout.write('*')
      }
    }
    
    process.stdin.on('data', onData)
  })
}

async function checkGPGInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    const gpg = spawn('gpg', ['--version'])
    gpg.on('close', (code) => resolve(code === 0))
    gpg.on('error', () => resolve(false))
  })
}

async function listGPGKeys(): Promise<string[]> {
  return new Promise((resolve) => {
    const gpg = spawn('gpg', ['--list-secret-keys', '--keyid-format=long'])
    let output = ''
    
    gpg.stdout.on('data', (data) => output += data)
    gpg.on('close', () => {
      const keys = []
      const lines = output.split('\n')
      
      for (const line of lines) {
        const match = line.match(/sec\s+\S+\/([A-F0-9]+)\s/)
        if (match) {
          keys.push(match[1])
        }
      }
      
      resolve(keys)
    })
    gpg.on('error', () => resolve([]))
  })
}

async function generateGPGKey(name: string, email: string): Promise<string | null> {
  const keyParams = `
Key-Type: RSA
Key-Length: 4096
Subkey-Type: RSA
Subkey-Length: 4096
Name-Real: ${name}
Name-Email: ${email}
Expire-Date: 2y
%commit
%echo done
`

  return new Promise((resolve) => {
    console.log('⏳ Generating GPG key pair (this may take a while)...')
    
    const gpg = spawn('gpg', ['--batch', '--full-generate-key'])
    let output = ''
    
    gpg.stdout.on('data', (data) => output += data)
    gpg.stderr.on('data', (data) => output += data)
    
    gpg.on('close', async (code) => {
      if (code === 0) {
        // Extract key ID from output
        const keys = await listGPGKeys()
        resolve(keys[keys.length - 1] || null)
      } else {
        console.error('Failed to generate GPG key:', output)
        resolve(null)
      }
    })

    gpg.stdin.write(keyParams)
    gpg.stdin.end()
  })
}

async function setupDirectories(): Promise<void> {
  const dirs = ['./credentials', './logs']
  
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true })
      console.log(`✅ Created directory: ${dir}`)
    } catch (error) {
      console.warn(`⚠️ Directory ${dir} already exists or failed to create`)
    }
  }
}

async function createCredentialConfig(apiKey: string, keyId: string): Promise<void> {
  const config = {
    apiKey,
    environment: process.env.NODE_ENV || 'development',
    rotationSchedule: 'monthly',
    lastRotated: new Date(),
  }

  const manager = new GPGCredentialManager(keyId, './credentials/encrypted.gpg')
  await manager.storeCredentials(config)
  
  console.log('✅ Credentials encrypted and stored successfully')
}

async function testSetup(keyId: string): Promise<boolean> {
  try {
    const manager = new GPGCredentialManager(keyId, './credentials/encrypted.gpg')
    
    console.log('🧪 Testing GPG key functionality...')
    const testResult = await manager.testEncryptionDecryption()
    if (!testResult) {
      console.error('❌ GPG encryption/decryption test failed')
      return false
    }

    console.log('🧪 Testing credential loading...')
    const credentials = await manager.loadCredentials({ useCache: false })
    
    if (!credentials.RESEND_API_KEY || credentials.RESEND_API_KEY === 'dummy_key_for_build') {
      console.error('❌ Credential loading test failed')
      return false
    }

    console.log('✅ All tests passed!')
    return true
  } catch (error) {
    console.error('❌ Setup test failed:', error instanceof Error ? error.message : error)
    return false
  }
}

async function updateEnvironmentFile(keyId: string): Promise<void> {
  const envPath = './.env.local'
  
  try {
    let content = await fs.readFile(envPath, 'utf8')
    
    // Update or add GPG_KEY_ID
    if (content.includes('GPG_KEY_ID=')) {
      content = content.replace(/GPG_KEY_ID=.*/, `GPG_KEY_ID=${keyId}`)
    } else {
      content += `\n# GPG Credential Management\nGPG_KEY_ID=${keyId}\n`
    }
    
    // Update or add CREDENTIAL_PATH
    if (!content.includes('CREDENTIAL_PATH=')) {
      content += `CREDENTIAL_PATH=./credentials/encrypted.gpg\n`
    }
    
    // Remove or comment out dummy API key
    content = content.replace(/^RESEND_API_KEY=dummy_key_for_build/, '# RESEND_API_KEY=dummy_key_for_build # Replaced by GPG credential system')
    
    await fs.writeFile(envPath, content, 'utf8')
    console.log('✅ Updated .env.local with GPG configuration')
  } catch (error) {
    console.error('⚠️ Failed to update .env.local:', error)
  }
}

async function main(): Promise<void> {
  console.log('🔐 GPG Credential Management Setup')
  console.log('==================================\n')

  // Check GPG installation
  console.log('1. Checking GPG installation...')
  const gpgInstalled = await checkGPGInstalled()
  if (!gpgInstalled) {
    console.error('❌ GPG is not installed or not in PATH')
    console.log('Please install GPG first:')
    console.log('  - Ubuntu/Debian: sudo apt install gnupg')
    console.log('  - macOS: brew install gnupg')
    console.log('  - Windows: https://gpg4win.org/')
    process.exit(1)
  }
  console.log('✅ GPG is installed\n')

  // Check for existing keys
  console.log('2. Checking existing GPG keys...')
  const existingKeys = await listGPGKeys()
  
  let keyId: string

  if (existingKeys.length > 0) {
    console.log('Found existing GPG keys:')
    existingKeys.forEach((key, index) => {
      console.log(`  ${index + 1}. ${key}`)
    })

    const useExisting = await question('Use an existing key? (y/n): ')
    
    if (useExisting.toLowerCase() === 'y') {
      if (existingKeys.length === 1) {
        keyId = existingKeys[0]
        console.log(`Using key: ${keyId}`)
      } else {
        const keyIndex = parseInt(await question('Enter key number: ')) - 1
        if (keyIndex >= 0 && keyIndex < existingKeys.length) {
          keyId = existingKeys[keyIndex]
        } else {
          console.error('Invalid key selection')
          process.exit(1)
        }
      }
    } else {
      const name = await question('Enter your name: ')
      const email = await question('Enter your email: ')
      
      const newKey = await generateGPGKey(name, email)
      if (!newKey) {
        console.error('❌ Failed to generate GPG key')
        process.exit(1)
      }
      
      keyId = newKey
      console.log(`✅ Generated new GPG key: ${keyId}`)
    }
  } else {
    console.log('No GPG keys found. Creating a new one...')
    
    const name = await question('Enter your name: ')
    const email = await question('Enter your email: ')
    
    const newKey = await generateGPGKey(name, email)
    if (!newKey) {
      console.error('❌ Failed to generate GPG key')
      process.exit(1)
    }
    
    keyId = newKey
    console.log(`✅ Generated new GPG key: ${keyId}`)
  }

  // Setup directories
  console.log('\n3. Setting up directories...')
  await setupDirectories()

  // Get API credentials
  console.log('\n4. Setting up credentials...')
  console.log('Please enter your Resend API key.')
  console.log('You can get one from: https://resend.com/api-keys')
  
  const apiKey = await questionHidden('Enter Resend API key: ')
  
  if (!apiKey || apiKey === 'dummy_key_for_build' || !apiKey.startsWith('re_')) {
    console.error('❌ Invalid Resend API key. Must start with "re_"')
    process.exit(1)
  }

  // Create encrypted credentials
  console.log('\n5. Encrypting and storing credentials...')
  await createCredentialConfig(apiKey, keyId)

  // Update environment file
  console.log('\n6. Updating environment configuration...')
  await updateEnvironmentFile(keyId)

  // Test the setup
  console.log('\n7. Testing setup...')
  const testPassed = await testSetup(keyId)
  
  if (testPassed) {
    console.log('\n🎉 Setup completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Make sure to backup your GPG private key')
    console.log('2. Add credentials/encrypted.gpg to your git repository')
    console.log('3. Share your GPG public key with team members')
    console.log('4. Test the contact form functionality')
    console.log('\nYour application will now use encrypted credentials!')
  } else {
    console.error('\n❌ Setup test failed. Please check the configuration.')
    process.exit(1)
  }

  rl.close()
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Setup failed:', error)
    process.exit(1)
  })
}