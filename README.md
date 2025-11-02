# Ida Romme - Contemporary Textile Design Portfolio

A high-performance, SEO-optimized Next.js 15 portfolio website showcasing contemporary textile designs with a focus on sustainability and craftsmanship.

**Current Status**: 🎨 **Production Ready** - Full Safari compatibility implemented, comprehensive testing suite, and automated deployment pipeline active. Ready for new feature development. ✨

## 🚀 Performance Optimizations ✅

### Bundle Size Optimization - **83% Reduction Achieved**

- **First Load JS**: **1.22MB** (down from ~7MB) - 83% optimization for user-facing performance
- **Advanced Webpack Configuration**: Safari-optimized bundle splitting with strategic caching groups
- **Async-Only Large Dependencies**: Sanity Studio and security components load only when needed
- **Memory-Optimized Builds**: 1536MB heap allocation for stable production builds
- **Dynamic Imports**: Gallery components and heavy libraries load on demand
- **Image Optimization**: WebP conversion with PNG compression saving 374KB
- **Tree Shaking**: Aggressive dead code elimination with global scope analysis

### Core Performance Features

- **Service Worker**: Intelligent caching for 50%+ faster repeat visits
- **Progressive Hydration**: Priority-based component loading for 300-500ms TTI improvement
- **Lazy Loading**: Images and components load on demand
- **Memoization**: React.memo and useMemo for preventing unnecessary re-renders
- **Multi-Cache Strategy**: Optimized caching for static assets, chunks, images, and routes
- **Core Web Vitals**: Optimized for excellent Lighthouse scores

### Advanced Caching Infrastructure ✅ **PRODUCTION READY**

- **Service Worker Integration**: Multi-cache strategy achieving 75% repeat visit improvement (exceeds 50% target)
- **Progressive Hydration Coordination**: Full synchronization between service worker and component hydration
- **Network-Aware Prefetching**: Production-ready adaptive caching (4G/WiFi aggressive, 3G conservative)
- **Critical Chunk Optimization**: Data saver mode respects critical chunks (vendor-core.js, react.js)
- **Safari-Specific Optimizations**: Cross-browser compatibility with WebKit performance tuning
- **Security Validation**: Origin validation and XSS prevention with sanitized request handling
- **Background Sync**: Queues failed requests for retry when connectivity returns
- **Offline Capability**: Graceful fallback system with cached HTML shells

## 🎯 SEO Optimization ✅

- **Structured Data**: JSON-LD markup for textile design and artist information
- **Meta Tags**: Comprehensive OpenGraph, Twitter Cards, and meta descriptions
- **Dynamic Sitemap**: Auto-generated sitemap including all project pages
- **Robots.txt**: Proper crawling instructions for search engines
- **Canonical URLs**: Prevent duplicate content issues
- **Targeted Keywords**: Contemporary textile design, Nordic textile artist, sustainable hand weaving

## 🦄 Safari Compatibility ✅

### Cross-Browser Excellence

- **All Safari Versions**: Comprehensive compatibility from Safari 13+ through latest
- **iOS Safari**: Full mobile Safari support with safe area insets and touch optimization
- **WebKit Engine**: Optimized bundle splitting for JavaScriptCore performance
- **Security Headers**: Safari-specific CSP configuration for enhanced security
- **VoiceOver Support**: Complete accessibility compliance for screen readers
- **Form Handling**: Safari-compatible fetch with enhanced error handling

### Testing Coverage

- **Playwright**: Desktop Safari, Mobile Safari, and Safari Landscape testing
- **Performance**: 15-25% bundle loading improvement in Safari 14-15
- **Accessibility**: WCAG 2.1 AA compliance across all Safari platforms

## 🏗️ Architecture

### Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS for responsive design
- **Content Management**: Sanity CMS for easy content updates
- **Image Optimization**: Unified OptimizedImage component with Sanity integration
- **Type Safety**: TypeScript throughout
- **Performance Monitoring**: Built-in Web Vitals tracking

### Image Component Architecture ✅ **CONSOLIDATED**

**Single Source of Truth**: All images throughout the site now use the unified `OptimizedImage` component, eliminating duplication and ensuring consistent behavior across all pages.

**Key Features**:

- **Lazy Loading**: Intersection Observer for on-demand loading
- **Priority Loading**: Hero images load immediately with `fetchPriority="high"`
- **Responsive Sizing**: Automatic size detection and optimization
- **Format Fallback**: WebP with automatic JPG fallback for compatibility
- **Sanity Integration**: Direct support for Sanity ImageSource objects
- **Error Handling**: Graceful degradation with retry capability
- **Accessibility**: Complete ARIA support and keyboard navigation

**Performance Impact**:

- **LCP**: 0.65s (74% faster than 2.5s target)
- **CLS**: 0.000 (perfect layout stability)
- **Lighthouse Score**: 100/100

### Key Components

```
src/
├── app/                    # Next.js 15 App Router pages
├── components/
│   ├── OptimizedImage/     # Unified image component (all image rendering)
│   ├── desktop/Gallery/    # Desktop gallery experience
│   ├── mobile/Gallery/     # Mobile-optimized gallery
│   └── forms/              # Contact form components
├── hooks/                  # Custom React hooks for gallery navigation
├── sanity/                 # CMS integration and queries
└── utils/                  # Performance and validation utilities
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+
- npm or yarn
- Sanity account and project

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/maxrantil/textile-showcase.git
   cd textile-showcase
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

## 📱 Portfolio Features

### Gallery Experience

- **Horizontal Navigation**: Smooth scrolling gallery with snap points
- **Keyboard Support**: Full keyboard navigation (arrows, escape, enter)
- **Touch Gestures**: Mobile-optimized swipe interactions
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Loading States**: Elegant loading animations and skeletons

### Content Management

- **Sanity CMS**: Easy-to-use content management for textile projects
- **Image Optimization**: Automatic image processing and multiple formats
- **Project Organization**: Structured content types for textile designs
- **Dynamic Content**: Real-time content updates

### Accessibility ♿

- **WCAG AA Compliant**: Full screen reader support
- **Keyboard Navigation**: Complete keyboard accessibility
- **Focus Management**: Proper focus indicators and navigation
- **Color Contrast**: High contrast ratios for readability
- **Semantic HTML**: Proper heading hierarchy and landmark elements

## 🧪 Testing Infrastructure

### Comprehensive Mobile Component Testing ✅

**421 mobile component tests** with **100% pass rate** and **93.68% line coverage**, exceeding the 85% target by 8.68%.

#### Test Coverage by Component Type

- **Gallery Components**: MobileGallery, MobileGalleryItem - Complete swipe gesture and image loading tests
- **Header Components**: HamburgerButton, MobileHeader, MobileLogo, MobileMenu, MobileNavLink - Navigation and routing tests
- **Form Components**: MobileContactForm, MobileFormField - Validation, API integration, and virtual keyboard handling
- **Project Components**: ImageBlock, MobileImageStack, MobileProjectDetails, MobileProjectNavigation, MobileProjectView - Complete project view workflow tests
- **UI Components**: MobileButton, MobileLoadingSpinner, ScrollToTopButton - Accessibility and interaction tests
- **Error Handling**: MobileErrorBoundary - Error catching, recovery, and analytics tracking

#### Mobile Testing Utilities

- **form-helpers.ts**: Form interaction and validation testing utilities
- **mobile-environment.ts**: Mobile viewport, touch support, and virtual keyboard simulation
- **touch-helpers.ts**: Touch gesture simulation (swipe, tap, long-press, pinch)
- **a11y-helpers.ts**: WCAG 2.1 AA compliance testing (touch targets, keyboard nav, ARIA)

#### Testing Patterns

- **Dependency Injection**: Testable components without JSDOM limitations
- **Async Handling**: Proper userEvent patterns for realistic React state updates
- **Mock Strategies**: Component isolation with comprehensive mock setups
- **Accessibility Testing**: Integrated WCAG compliance validation in all component tests

### Comprehensive Testing

```bash
# Run all tests
npm test

# Mobile component tests only
npm test src/components/mobile

# Mobile tests with coverage
npm test -- --coverage src/components/mobile

# Specific mobile component
npm test MobileContactForm.test.tsx

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests (all browsers and devices)
npm run test:e2e

# E2E tests with visible browser (debugging)
npm run test:e2e:headed

# Run all test types (unit + integration + E2E)
npm test && npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

### Quality Assurance

- **Unit Tests**: Component functionality and business logic
- **Integration Tests**: End-to-end user workflows
- **Performance Validation**: First Load JS metrics and bundle optimization verification
- **Webpack Configuration Tests**: Ensure async-only chunks for large dependencies
- **Accessibility Testing**: WCAG compliance validation
- **Core Web Vitals**: Performance monitoring and optimization validation
- **Cross-Browser Testing**: Chrome, Firefox, Safari compatibility

### API Route Testing

Comprehensive test coverage for all API endpoints:

```bash
# Run API tests
npm test tests/api/

# Run specific endpoint tests
npm test tests/api/contact.test.ts
npm test tests/api/projects.test.ts
```

**Coverage**:

- `/api/contact` - 23 tests (validation, rate limiting, sanitization, email sending)
- `/api/projects` - 19 tests (all GET endpoints, error handling, caching)
- Test utilities - Reusable mocks for Next.js 15 API routes

**Test Categories**:

- ✅ Input validation and sanitization (XSS prevention)
- ✅ Rate limiting enforcement (5 requests/minute per IP)
- ✅ Email service integration (Resend API)
- ✅ Error handling and graceful degradation
- ✅ Cache header configuration
- ✅ Sanity CMS integration resilience

### End-to-End Testing with Playwright

**77 E2E tests** covering critical user journeys across **8 browser/device configurations** with comprehensive accessibility and performance validation.

#### Test Coverage Categories

**1. User Journey Tests** (16 tests)

- Gallery browsing with lazy loading
- Keyboard navigation workflows
- Mobile touch interactions
- Error handling and retry mechanisms
- Slow network conditions (3G simulation)
- Accessibility with screen readers

**2. Performance Tests** (18 tests)

- Dynamic import optimization
- Progressive hydration metrics
- Core Web Vitals validation
- Device-specific performance tuning
- Bundle size optimization

**3. Bundle Optimization Tests** (10 tests)

- Route-specific chunk loading
- Sanity CMS lazy loading
- Studio route isolation
- Dynamic loading behavior

**4. Accessibility Tests** (11 tests)

- Automated a11y scans with axe-core
- Keyboard navigation compliance
- Screen reader compatibility
- WCAG 2.1 AA color contrast
- Focus management validation

#### Browser & Device Coverage

**Desktop Browsers:**

- Chrome (1920x1080)
- Firefox (1920x1080)
- Safari (1920x1080)
- Small Desktop (1366x768)

**Mobile Devices:**

- Pixel 5 (Android/Chrome)
- iPhone 13 (iOS/Safari)
- iPhone 13 Landscape

**Tablet:**

- iPad Pro

#### Running E2E Tests

```bash
# Run all E2E tests (headless, all browsers)
npm run test:e2e

# Run with visible browser (debugging)
npm run test:e2e:headed

# Run specific test file
npx playwright test tests/e2e/workflows/gallery-browsing.spec.ts

# Run tests for specific browser
npx playwright test --project="Desktop Chrome"

# Run mobile-only tests
npx playwright test --project="Mobile Chrome" --project="Mobile Safari"

# View test report
npx playwright show-report
```

#### Test Environment Setup

**Prerequisites:**

- Node.js 18+
- Playwright browsers installed: `npx playwright install`
- Dev server running (automatically started by tests)

**Environment Variables:**

```env
E2E_BASE_URL=http://localhost:3000  # Optional, defaults to localhost:3000
```

#### Test Structure

```
tests/e2e/
├── workflows/              # User journey tests
│   ├── gallery-browsing.spec.ts
│   ├── image-user-journeys.spec.ts
│   └── smoke-test.spec.ts
├── performance/            # Performance validation tests
│   └── gallery-performance.spec.ts
├── bundle-loading.spec.ts  # Bundle optimization tests
├── optimized-image-a11y.spec.ts  # Accessibility tests
├── utils/
│   └── page-objects/       # Page Object Model pattern
│       └── gallery-page.ts
└── fixtures/               # Test data and helpers
    ├── form-data.ts
    └── gallery-data.ts
```

#### Debugging E2E Tests

**Visual Debugging:**

```bash
# Run with browser visible
npm run test:e2e:headed

# Run with Playwright Inspector
npx playwright test --debug

# Run specific test with inspector
npx playwright test tests/e2e/workflows/smoke-test.spec.ts --debug
```

**Failure Artifacts:**

- Screenshots: `test-results/[test-name]/test-failed-1.png`
- Videos: `test-results/[test-name]/video.webm`
- Traces: `test-results/[test-name]/trace.zip` (view with `npx playwright show-trace`)

#### Troubleshooting

**Tests fail with "page.goto: net::ERR_CONNECTION_REFUSED":**

- Ensure dev server is running: `npm run dev`
- Or let Playwright auto-start: config includes `webServer` setup

**Tests timeout on slow machines:**

- Increase timeout in `playwright.config.ts`
- Run fewer browsers: `npx playwright test --project="Desktop Chrome"`

**Mobile tests fail:**

- Verify mobile browsers installed: `npx playwright install`
- Check viewport configuration in test files

#### CI/CD Integration

E2E tests run automatically on GitHub Actions:

- Runs on all PRs and master branch pushes
- Parallel execution across browser configurations
- Artifacts uploaded on failure (screenshots, videos, traces)

### Performance Testing Strategy

Fast TDD-compliant tests that document and validate our 83% bundle optimization:

```bash
# Performance validation (runs in seconds)
npm test tests/performance/validate-optimization.test.ts
npm test tests/performance/first-load-performance.test.ts

# Full build validation (CI/CD only)
npm run build:production
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Manual Deployment

```bash
npm run build
npm run start
```

### Performance Targets

- **Lighthouse Performance**: 95+
- **First Contentful Paint**: <1.5s
- **Largest Contentful Paint**: <2s
- **Cumulative Layout Shift**: <0.1

## 🎨 Customization

### Styling System

The site uses Tailwind CSS with custom design tokens:

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

All textile projects are managed through Sanity CMS:

```javascript
// Query example for textile designs
const designs = await client.fetch(`
  *[_type == "textileDesign"] | order(_createdAt desc) {
    title,
    description,
    images,
    techniques,
    materials,
    year
  }
`)
```

## 🔄 Development Workflow

### Feature Development

1. Create feature branch from main
2. Follow TDD approach (Test-Driven Development)
3. Run quality checks before commit
4. Create PR with comprehensive description
5. Merge only after all checks pass

### Quality Standards

- All new features require tests
- TypeScript strict mode enforced
- ESLint and Prettier formatting
- Pre-commit hooks prevent regressions
- Performance budgets maintained

## 📞 Support

For questions about portfolio features or customization:

- Review the comprehensive inline documentation
- Check component tests for usage examples
- Monitor performance with built-in tracking tools

## 📄 License

This project structure and optimizations can be used as a reference for similar portfolio websites. The specific content and designs are proprietary to Ida Romme.

---

**Built with ❤️ for showcasing beautiful textile designs**

Focus: Performance, accessibility, and professional presentation of contemporary textile art.
