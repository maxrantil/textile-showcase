// scripts/test-mobile-images.js
/**
 * Manual test script to verify mobile image loading
 * Run with: node scripts/test-mobile-images.js
 */

const scenarios = [
  {
    name: 'iOS Safari',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    expectedFormat: 'jpg',
  },
  {
    name: 'Android Chrome',
    userAgent:
      'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
    expectedFormat: 'webp',
  },
  {
    name: 'Desktop Safari',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Safari/605.1.15',
    expectedFormat: 'jpg',
  },
  {
    name: 'Desktop Chrome',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    expectedFormat: 'webp',
  },
]

console.log('🧪 Mobile Image Loading Test Scenarios\n')

scenarios.forEach((scenario) => {
  console.log(`📱 ${scenario.name}:`)
  console.log(`   User Agent: ${scenario.userAgent}`)
  console.log(`   Expected Format: ${scenario.expectedFormat}`)
  console.log(`   ✅ Test: Visit gallery page with this user agent`)
  console.log(
    `   ✅ Verify: Images load with .${scenario.expectedFormat} extension`
  )
  console.log(`   ✅ Verify: No network errors in dev tools`)
  console.log(`   ✅ Verify: Fallback works if primary fails\n`)
})

console.log('🔍 Manual Testing Checklist:')
console.log('□ Test on actual iOS device with lockdown mode')
console.log('□ Test on slow 3G connection')
console.log('□ Test with network throttling')
console.log('□ Test with ad blockers enabled')
console.log('□ Verify error states show properly')
console.log('□ Verify retry functionality works')
console.log('□ Check console for any errors')
console.log('□ Verify images load quickly on first visit')
console.log('□ Verify images load from cache on second visit')
