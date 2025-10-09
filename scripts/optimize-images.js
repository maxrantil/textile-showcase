// ABOUTME: Image optimization script to compress and convert images to WebP format
// Uses Sharp for high-performance image processing with minimal bundle impact

/* eslint-disable @typescript-eslint/no-require-imports */
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const publicDir = path.join(__dirname, '../public')
const imageFiles = [
  'apple-touch-icon.png',
  'icon-192x192.png',
  'icon-512x512.png',
  'icon-96x96.png',
]

async function optimizeImages() {
  console.log('🖼️ Starting image optimization...')

  let totalSavings = 0

  for (const filename of imageFiles) {
    const inputPath = path.join(publicDir, filename)
    const outputWebpPath = path.join(
      publicDir,
      filename.replace('.png', '.webp')
    )
    const outputOptimizedPath = path.join(publicDir, `optimized-${filename}`)

    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️ File not found: ${filename}`)
      continue
    }

    const originalSize = fs.statSync(inputPath).size
    console.log(
      `Processing ${filename} (${(originalSize / 1024).toFixed(1)}KB)...`
    )

    try {
      // Create optimized PNG
      await sharp(inputPath)
        .png({
          quality: 85,
          compressionLevel: 9,
          palette: true, // Use palette for smaller file size
        })
        .toFile(outputOptimizedPath)

      // Create WebP version
      await sharp(inputPath)
        .webp({
          quality: 85,
          effort: 6, // Higher effort for better compression
          lossless: false,
        })
        .toFile(outputWebpPath)

      const optimizedSize = fs.statSync(outputOptimizedPath).size
      const webpSize = fs.statSync(outputWebpPath).size

      const pngSavings = originalSize - optimizedSize
      const webpSavings = originalSize - webpSize
      totalSavings += Math.max(pngSavings, webpSavings)

      console.log(`✅ ${filename}:`)
      console.log(`   Original: ${(originalSize / 1024).toFixed(1)}KB`)
      console.log(
        `   Optimized PNG: ${(optimizedSize / 1024).toFixed(1)}KB (${(pngSavings / 1024).toFixed(1)}KB saved)`
      )
      console.log(
        `   WebP: ${(webpSize / 1024).toFixed(1)}KB (${(webpSavings / 1024).toFixed(1)}KB saved)`
      )

      // Replace original with optimized version if it's smaller
      if (optimizedSize < originalSize) {
        fs.renameSync(outputOptimizedPath, inputPath)
        console.log(`   ✅ Replaced original with optimized PNG`)
      } else {
        fs.unlinkSync(outputOptimizedPath)
        console.log(`   ℹ️ Original was already optimal`)
      }
    } catch (error) {
      console.error(`❌ Error processing ${filename}:`, error.message)
    }
  }

  console.log(
    `\n🎉 Total potential savings: ${(totalSavings / 1024).toFixed(1)}KB`
  )
  console.log('📁 WebP versions created for better browser support')
}

async function main() {
  try {
    await optimizeImages()

    console.log('\n🚀 Image optimization complete!')
    console.log(
      '💡 Remember to update your HTML to use WebP with PNG fallbacks'
    )
  } catch (error) {
    console.error('❌ Optimization failed:', error)
    process.exit(1)
  }
}

main()
