# Ida Romme - Contemporary Textile Design Portfolio

A high-performance, SEO-optimized Next.js 15 portfolio website showcasing contemporary textile designs with a focus on sustainability and craftsmanship.

**Current Status**: 🎨 **Production Ready** - Full Safari compatibility implemented, comprehensive testing suite, and automated deployment pipeline active. Ready for new feature development. ✨

## 🚀 Performance Optimizations ✅

### Bundle Size Optimization

- **Webpack Bundle Splitting**: Vendor code separated from application code
- **Tree Shaking**: Eliminated unused code imports across the application
- **Strategic Dynamic Imports**: Better caching and loading performance
- **Image Optimization**: Next.js 15 Image component with WebP conversion (Safari compatible)

### Core Performance Features

- **Lazy Loading**: Images and components load on demand
- **Memoization**: React.memo and useMemo for preventing unnecessary re-renders
- **Caching Strategy**: Multi-layered caching for optimal performance
- **Core Web Vitals**: Optimized for excellent Lighthouse scores

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
- **Image Optimization**: Sanity Image URLs + Next.js Image component
- **Type Safety**: TypeScript throughout
- **Performance Monitoring**: Built-in Web Vitals tracking

### Key Components

```
src/
├── app/                    # Next.js 15 App Router pages
├── components/
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
   git clone [repository-url]
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

### Comprehensive Testing

```bash
# Run all tests
npm test

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

### Quality Assurance

- **Unit Tests**: Component functionality and business logic
- **Integration Tests**: End-to-end user workflows
- **Accessibility Testing**: WCAG compliance validation
- **Performance Testing**: Core Web Vitals monitoring
- **Cross-Browser Testing**: Chrome, Firefox, Safari compatibility

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
