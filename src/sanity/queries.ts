// src/sanity/queries.ts

/**
 * Base fragments for reusable query parts
 */
const fragments = {
    // Image with metadata
    imageWithMetadata: `
      asset-> {
        _id,
        metadata {
          dimensions
        }
      }
    `,
    
    // Gallery image with caption
    galleryImage: `
      _key,
      asset-> {
        _id,
        metadata {
          dimensions
        }
      },
      caption
    `,
    
    // Basic textile design fields
    basicTextileDesign: `
      _id,
      title,
      slug,
      year,
      featured,
      order,
      _createdAt
    `
  }
  
  /**
   * Home page gallery queries
   */
  export const homeQueries = {
    // Get designs for home page with proper sorting
    getDesignsForHome: `
      *[_type == "textileDesign"] {
        ${fragments.basicTextileDesign},
        image {
          ${fragments.imageWithMetadata}
        }
      } | order(
        order asc,      // First, sort by manual order field (ascending - 0, 1, 2, etc.)
        featured desc,  // Then by featured status (featured items first)
        _createdAt desc // Finally by creation date (newest first)
      )[0...20]
    `,
  
    // Get featured designs only
    getFeaturedDesigns: `
      *[_type == "textileDesign" && featured == true] {
        ${fragments.basicTextileDesign},
        image {
          ${fragments.imageWithMetadata}
        }
      } | order(order asc, _createdAt desc)[0...10]
    `
  }
  
  /**
   * Project page queries
   */
  export const projectQueries = {
    // Get single project by slug with all details
    getProjectBySlug: `
      *[_type == "textileDesign" && (slug.current == $slug || _id == $slug)][0] {
        ${fragments.basicTextileDesign},
        image {
          ${fragments.imageWithMetadata}
        },
        gallery[] {
          ${fragments.galleryImage}
        },
        description,
        detailedDescription,
        materials,
        dimensions,
        technique
      }
    `,
  
    // Get project navigation (previous/next)
    getProjectNavigation: `
      {
        "current": *[_type == "textileDesign" && slug.current == $slug][0] {
          _id,
          title,
          slug,
          order
        },
        "previous": *[_type == "textileDesign" && order < *[_type == "textileDesign" && slug.current == $slug][0].order] | order(order desc)[0] {
          _id,
          title,
          slug
        },
        "next": *[_type == "textileDesign" && order > *[_type == "textileDesign" && slug.current == $slug][0].order] | order(order asc)[0] {
          _id,
          title,
          slug
        }
      }
    `
  }
  
  /**
   * Sitemap and SEO queries
   */
  export const seoQueries = {
    // Get all slugs for sitemap generation
    getAllSlugs: `
      *[_type == "textileDesign" && defined(slug.current)] {
        "slug": slug.current,
        _updatedAt
      }
    `,
  
    // Get metadata for all projects
    getAllMetadata: `
      *[_type == "textileDesign"] {
        _id,
        title,
        slug,
        description,
        year,
        _updatedAt,
        image {
          ${fragments.imageWithMetadata}
        }
      } | order(order asc, _createdAt desc)
    `
  }
  
  /**
   * Admin and management queries
   */
  export const adminQueries = {
    // Get all designs with full details for admin
    getAllDesignsAdmin: `
      *[_type == "textileDesign"] {
        ${fragments.basicTextileDesign},
        image {
          ${fragments.imageWithMetadata}
        },
        description,
        detailedDescription,
        materials,
        dimensions,
        technique,
        _updatedAt
      } | order(order asc, _createdAt desc)
    `,
  
    // Get design count and statistics
    getDesignStats: `
      {
        "total": count(*[_type == "textileDesign"]),
        "featured": count(*[_type == "textileDesign" && featured == true]),
        "published": count(*[_type == "textileDesign" && defined(slug.current)]),
        "lastUpdated": *[_type == "textileDesign"] | order(_updatedAt desc)[0]._updatedAt
      }
    `
  }
  
  /**
   * All queries combined for easy import
   */
  export const queries = {
    // Home page
    getDesignsForHome: homeQueries.getDesignsForHome,
    getFeaturedDesigns: homeQueries.getFeaturedDesigns,
    
    // Project pages
    getProjectBySlug: projectQueries.getProjectBySlug,
    getProjectNavigation: projectQueries.getProjectNavigation,
    
    // SEO and sitemap
    getAllSlugs: seoQueries.getAllSlugs,
    getAllMetadata: seoQueries.getAllMetadata,
    
    // Admin
    getAllDesignsAdmin: adminQueries.getAllDesignsAdmin,
    getDesignStats: adminQueries.getDesignStats
  }
  
  /**
   * Query parameter validation helpers
   */
  export const queryParams = {
    validateSlug: (slug: string): boolean => {
      return typeof slug === 'string' && slug.length > 0 && slug.length < 200
    },
    
    validateLimit: (limit: number): boolean => {
      return Number.isInteger(limit) && limit > 0 && limit <= 100
    },
    
    validateOffset: (offset: number): boolean => {
      return Number.isInteger(offset) && offset >= 0
    }
  }
