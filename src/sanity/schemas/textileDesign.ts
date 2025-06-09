// src/sanity/schemaTypes/textileDesign.ts - Updated schema

import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'textileDesign',
  type: 'document',
  title: 'Textile Design',
  orderings: [
    {
      title: 'Manual Order (Recommended)',
      name: 'manualOrder',
      by: [{ field: 'order', direction: 'asc' }],
    },
    {
      title: 'Featured First, then Manual Order',
      name: 'featuredThenOrder',
      by: [
        { field: 'featured', direction: 'desc' },
        { field: 'order', direction: 'asc' },
        { field: '_createdAt', direction: 'desc' },
      ],
    },
    {
      title: 'Newest First',
      name: 'createdDesc',
      by: [{ field: '_createdAt', direction: 'desc' }],
    },
    {
      title: 'Oldest First',
      name: 'createdAsc',
      by: [{ field: '_createdAt', direction: 'asc' }],
    },
    {
      title: 'Year (Newest)',
      name: 'yearDesc',
      by: [{ field: 'year', direction: 'desc' }],
    },
    {
      title: 'Year (Oldest)',
      name: 'yearAsc',
      by: [{ field: 'year', direction: 'asc' }],
    },
    {
      title: 'Title A-Z',
      name: 'titleAsc',
      by: [{ field: 'title', direction: 'asc' }],
    },
    {
      title: 'Featured First',
      name: 'featuredFirst',
      by: [
        { field: 'featured', direction: 'desc' },
        { field: '_createdAt', direction: 'desc' },
      ],
    },
  ],
  fields: [
    defineField({
      name: 'order',
      type: 'number',
      title: 'Display Order',
      description:
        'Lower numbers appear first (0, 1, 2, etc.). This controls the order in your gallery.',
      initialValue: 999, // Default to high number so new items appear at end
      validation: (Rule) =>
        Rule.min(0).integer().error('Order must be a positive integer'),
    }),
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      options: {
        source: 'title',
        maxLength: 200,
      },
    }),
    defineField({
      name: 'image',
      type: 'image',
      title: 'Main Image (for gallery)',
      description:
        'This image shows in the main gallery and as the first image in the project view',
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'gallery',
      type: 'array',
      title: 'Additional Images',
      description:
        'Upload additional images for the detailed project page. The main image will appear first, followed by these images.',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
              description: 'Optional caption for this image',
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'description',
      type: 'text',
      title: 'Description',
      rows: 3,
    }),
    defineField({
      name: 'detailedDescription',
      type: 'text',
      title: 'Detailed Description',
      description: 'Longer description for the project page',
      rows: 6,
    }),
    defineField({
      name: 'year',
      type: 'number',
      title: 'Year Created',
    }),
    defineField({
      name: 'materials',
      type: 'string',
      title: 'Materials Used',
    }),
    defineField({
      name: 'dimensions',
      type: 'string',
      title: 'Dimensions',
    }),
    defineField({
      name: 'technique',
      type: 'string',
      title: 'Technique',
      description: 'Weaving technique or method used',
    }),
    // In src/sanity/schemaTypes/textileDesign.ts, add these fields after the existing ones:

    defineField({
      name: 'credits',
      type: 'string',
      title: 'Credits/Collaborators',
      description:
        'Acknowledge any assistants, mentors, photographers, or collaborators',
    }),

    defineField({
      name: 'exhibitions',
      type: 'text',
      title: 'Exhibition History',
      description:
        'List where this piece has been shown (gallery, museum, year)',
      rows: 3,
    }),

    defineField({
      name: 'availability',
      type: 'string',
      title: 'Price/Availability',
      description:
        'e.g. "Available for purchase", "Sold", "$2,400", "Private collection"',
    }),

    defineField({
      name: 'processNotes',
      type: 'text',
      title: 'Process Notes',
      description:
        'Technical details, challenges, or interesting aspects of the creation process',
      rows: 4,
    }),

    defineField({
      name: 'careInstructions',
      type: 'string',
      title: 'Care Instructions',
      description:
        'How to properly care for this piece (cleaning, storage, display)',
    }),
    defineField({
      name: 'featured',
      type: 'boolean',
      title: 'Featured Design',
      description:
        'Featured designs get priority placement (after manual order)',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image',
      order: 'order',
      featured: 'featured',
    },
    prepare(selection) {
      const { title, media, order, featured } = selection
      return {
        title: title,
        subtitle: `Order: ${order}${featured ? ' • Featured' : ''}`,
        media: media,
      }
    },
  },
})
