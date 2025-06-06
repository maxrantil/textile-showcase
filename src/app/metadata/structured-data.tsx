export const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Ida Romme Studio",
    "url": "https://idaromme.dk",
    "logo": "https://idaromme.dk/icon-512x512.png",
    "founder": {
      "@type": "Person",
      "name": "Ida Romme"
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Stockholm",
      "addressCountry": "DK"
    },
    "sameAs": [
      "https://instagram.com/idaromme"
    ]
  }
  
  export function generateStructuredDataScript(data: object) {
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(data)
        }}
      />
    )
  }
