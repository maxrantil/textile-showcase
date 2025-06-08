# Ida Romme - Contemporary Textile Design Portfolio

A high-performance, SEO-optimized Next.js 14 portfolio website showcasing contemporary textile designs with a focus on sustainability and craftsmanship.

## 🚀 Performance Optimizations

This website has been optimized for maximum performance, accessibility, and SEO:

### Image Optimization

- **Next.js Image Component**: Automatic WebP/AVIF conversion, lazy loading, and responsive images
- **Sanity Image URLs**: Optimized image delivery with dynamic resizing and quality adjustment
- **Blur Placeholders**: Generated blur data URLs for smooth loading experiences
- **Preloading**: Strategic preloading of critical images and adjacent carousel images

### Performance Features

- **ISR (Incremental Static Regeneration)**: 1-hour revalidation for optimal balance of performance and freshness
- **Memoization**: React.memo and useMemo for preventing unnecessary re-renders
- **Code Splitting**: Automatic code splitting with dynamic imports
- **Bundle Optimization**: Tree shaking and dead code elimination
- **Caching Strategy**: Multi-layered caching with TTL and cleanup

### SEO Optimization

- **Structured Data**: JSON-LD markup for better search engine understanding
- **Meta Tags**: Comprehensive OpenGraph, Twitter Cards, and meta descriptions
- **Sitemap**: Dynamic sitemap generation including all project pages
- **Robots.txt**: Proper crawling instructions
- **Canonical URLs**: Prevent duplicate content issues

## 🏗️ Architecture

### Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + CSS-in-JS for responsive design
- **Content Management**: Sanity CMS
- **Image Optimization**: Sanity Image URLs + Next.js Image
- **Type Safety**: TypeScript throughout
- **Performance Monitoring**: Built-in Web Vitals tracking

### Key Components

```
src/
├── app/                    # App Router pages
├── components/            # Reusable UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configurations
├── types/                # TypeScript type definitions
└── utils/                # Helper functions
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+
- npm or yarn
- Sanity account and project

### Installation

1. **Clone the repository**

   ```bash
   git clone [repository-url]
   cd ida-romme-portfolio
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env.local
   ```

   Fill in your environment variables:

   ```env
   NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
   NEXT_PUBLIC_SANITY_DATASET=production
   RESEND_API_KEY=your_resend_key
   CONTACT_EMAIL=your@email.com
   ```

4. **Sanity Setup**

   ```bash
   # Install Sanity CLI if you haven't
   npm install -g @sanity/cli

   # Setup your Sanity project
   sanity init
   ```

5. **Development**
   ```bash
   npm run dev
   ```

## 📱 Features

### User Experience

- **Horizontal Gallery**: Smooth scrolling with snap points
- **Keyboard Navigation**: Full keyboard support (arrows, escape, enter)
- **Touch Gestures**: Mobile-optimized touch interactions
- **Loading States**: Elegant loading animations and skeletons
- **Error Boundaries**: Graceful error handling with fallback UI

### Accessibility

- **ARIA Labels**: Comprehensive screen reader support
- **Focus Management**: Proper focus indicators and keyboard navigation
- **Color Contrast**: WCAG AA compliant color combinations
- **Skip Links**: Skip to main content functionality
- **Semantic HTML**: Proper heading hierarchy and landmark elements

### Performance Monitoring

```javascript
// Built-in performance tracking
import { perf } from '@/utils/performance'

// Measure component render time
perf.measure('gallery-render', () => {
  // Component logic
})

// Monitor memory usage
const memory = getMemoryUsage()
```

## 🎨 Customization

### Styling System

The site uses a design system with CSS variables:

```css
:root {
  --color-primary: #333;
  --color-secondary: #666;
  --font-size-base: 16px;
  --spacing-md: 16px;
  --transition-normal: 0.3s ease;
}
```

### Content Management

All content is managed through Sanity CMS:

```javascript
// Query example
const designs = await resilientFetch(
  `*[_type == "textileDesign"] | order(_createdAt desc)`,
  {},
  { retries: 3, cache: true }
)
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Manual Deployment

```bash
npm run build
npm run start
```

### Docker Deployment

```bash
docker build -t ida-romme-portfolio .
docker run -p 3000:3000 ida-romme-portfolio
```

## 📊 Performance Metrics

Target performance scores:

- **Lighthouse Performance**: 95+
- **First Contentful Paint**: <1.5s
- **Largest Contentful Paint**: <2s
- **Cumulative Layout Shift**: <0.1

### Monitoring

```javascript
// Web Vitals reporting
export function reportWebVitals(metric) {
  // Send to analytics
  gtag('event', metric.name, {
    value: Math.round(metric.value),
    event_category: 'Web Vitals',
  })
}
```

## 🔧 Advanced Configuration

### Image Optimization Settings

```javascript
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        pathname: '/images/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
}
```

### Caching Strategy

```javascript
// lib/sanity.ts
export async function resilientFetch(query, params, options) {
  // Multi-tier caching with TTL
  // Retry logic with exponential backoff
  // Error handling with fallbacks
}
```

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build verification
npm run build

# Run all tests once
npm test

# Run tests in watch mode (re-runs when files change)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- Button.test.tsx

# Run tests matching a pattern
npm test -- --testNamePattern="validation"
```

## 📈 SEO Features

- **Dynamic Meta Tags**: Generated based on content
- **Structured Data**: Rich snippets for better SERP appearance
- **XML Sitemap**: Auto-generated from CMS content
- **Canonical URLs**: Prevent duplicate content penalties
- **Open Graph**: Social media sharing optimization

## 🔒 Security

- **Content Security Policy**: XSS protection
- **HTTPS Enforcement**: Secure connections only
- **API Rate Limiting**: Prevent abuse
- **Input Validation**: Contact form protection
- **Error Handling**: No sensitive data in error messages

## 📞 Support

For questions about implementation or customization:

- Review the comprehensive inline documentation
- Check the error boundaries and fallback components
- Monitor performance with built-in tracking tools

## 📄 License

This project structure and optimizations can be used as a reference for similar portfolio websites. The specific content and designs are proprietary to Ida Romme.

---

Built with ❤️ and attention to performance, accessibility, and user experience.
