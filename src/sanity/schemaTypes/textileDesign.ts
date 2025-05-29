import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'textileDesign',
  type: 'document',
  title: 'Textile Design',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      options: {
        source: 'title',
        maxLength: 200
      }
    }),
    defineField({
      name: 'image',
      type: 'image',
      title: 'Main Image (for gallery)',
      description: 'This image shows in the main gallery',
      options: {
        hotspot: true
      },
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'gallery',
      type: 'array',
      title: 'Additional Images',
      description: 'Upload multiple images for the detailed project page',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true
          },
          fields: [
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
              description: 'Optional caption for this image'
            }
          ]
        }
      ]
    }),
    defineField({
      name: 'description',
      type: 'text',
      title: 'Description',
      rows: 3
    }),
    defineField({
      name: 'detailedDescription',
      type: 'text',
      title: 'Detailed Description',
      description: 'Longer description for the project page',
      rows: 6
    }),
    defineField({
      name: 'year',
      type: 'number',
      title: 'Year Created'
    }),
    defineField({
      name: 'materials',
      type: 'string',
      title: 'Materials Used'
    }),
    defineField({
      name: 'dimensions',
      type: 'string',
      title: 'Dimensions'
    }),
    defineField({
      name: 'technique',
      type: 'string',
      title: 'Technique',
      description: 'Weaving technique or method used'
    }),
    defineField({
      name: 'featured',
      type: 'boolean',
      title: 'Featured Design',
      description: 'Display prominently on homepage'
    })
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image'
    }
  }
})
