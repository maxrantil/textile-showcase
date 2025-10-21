// ABOUTME: Test suite for MobileImageStack - Image stack component that combines main and gallery images with memoization

import React from 'react'
import { render } from '@testing-library/react'
import { MobileImageStack } from '../MobileImageStack'
import type { ImageSource } from '@/types/textile'

// Mock ImageBlock component
jest.mock('../ImageBlock', () => ({
  ImageBlock: ({ image, index, isFirst, projectTitle }: any) => (
    <div
      data-testid="image-block"
      data-index={index}
      data-is-first={isFirst}
      data-is-main-image={image.isMainImage}
      data-key={image._key}
      data-caption={image.caption}
      data-project-title={projectTitle}
    >
      Image Block {index}
    </div>
  ),
}))

describe('MobileImageStack', () => {
  const mockMainImage: ImageSource = {
    _type: 'image',
    asset: {
      _ref: 'image-main-ref',
      _type: 'reference',
    },
  }

  const mockGalleryImages = [
    {
      _key: 'gallery-1',
      asset: {
        _type: 'image',
        asset: {
          _ref: 'image-gallery-1-ref',
          _type: 'reference',
        },
      },
      caption: 'Gallery Image 1',
    },
    {
      _key: 'gallery-2',
      asset: {
        _type: 'image',
        asset: {
          _ref: 'image-gallery-2-ref',
          _type: 'reference',
        },
      },
      caption: 'Gallery Image 2',
    },
  ]

  const mockProjectTitle = 'Test Project'

  describe('Rendering', () => {
    it('should_render_main_image_as_first_image_block', () => {
      const { getAllByTestId } = render(
        <MobileImageStack
          mainImage={mockMainImage}
          projectTitle={mockProjectTitle}
        />
      )

      const imageBlocks = getAllByTestId('image-block')
      expect(imageBlocks.length).toBeGreaterThan(0)

      // First block should be main image
      expect(imageBlocks[0]).toHaveAttribute('data-is-main-image', 'true')
      expect(imageBlocks[0]).toHaveAttribute('data-index', '0')
    })

    it('should_render_all_gallery_images_as_image_blocks', () => {
      const { getAllByTestId } = render(
        <MobileImageStack
          mainImage={mockMainImage}
          images={mockGalleryImages}
          projectTitle={mockProjectTitle}
        />
      )

      const imageBlocks = getAllByTestId('image-block')

      // Should have 1 main + 2 gallery = 3 total
      expect(imageBlocks).toHaveLength(3)

      // Second and third should be gallery images
      expect(imageBlocks[1]).toHaveAttribute('data-is-main-image', 'false')
      expect(imageBlocks[2]).toHaveAttribute('data-is-main-image', 'false')
    })

    it('should_render_correct_total_number_of_image_blocks', () => {
      const { getAllByTestId } = render(
        <MobileImageStack
          mainImage={mockMainImage}
          images={mockGalleryImages}
          projectTitle={mockProjectTitle}
        />
      )

      const imageBlocks = getAllByTestId('image-block')
      expect(imageBlocks).toHaveLength(1 + mockGalleryImages.length)
    })

    it('should_apply_mobile_image_stack_container_class', () => {
      const { container } = render(
        <MobileImageStack
          mainImage={mockMainImage}
          projectTitle={mockProjectTitle}
        />
      )

      const stackContainer = container.querySelector('.mobile-image-stack')
      expect(stackContainer).toBeInTheDocument()
    })

    it('should_render_empty_stack_when_no_images', () => {
      const { getAllByTestId } = render(
        <MobileImageStack
          mainImage={mockMainImage}
          images={[]}
          projectTitle={mockProjectTitle}
        />
      )

      const imageBlocks = getAllByTestId('image-block')

      // Should only have main image
      expect(imageBlocks).toHaveLength(1)
    })
  })

  describe('Image Processing', () => {
    it('should_mark_main_image_with_isMainImage_true', () => {
      const { getAllByTestId } = render(
        <MobileImageStack
          mainImage={mockMainImage}
          projectTitle={mockProjectTitle}
        />
      )

      const imageBlocks = getAllByTestId('image-block')
      expect(imageBlocks[0]).toHaveAttribute('data-is-main-image', 'true')
    })

    it('should_mark_gallery_images_with_isMainImage_false', () => {
      const { getAllByTestId } = render(
        <MobileImageStack
          mainImage={mockMainImage}
          images={mockGalleryImages}
          projectTitle={mockProjectTitle}
        />
      )

      const imageBlocks = getAllByTestId('image-block')

      // Gallery images should have isMainImage: false
      expect(imageBlocks[1]).toHaveAttribute('data-is-main-image', 'false')
      expect(imageBlocks[2]).toHaveAttribute('data-is-main-image', 'false')
    })

    it('should_pass_correct_index_to_each_image_block', () => {
      const { getAllByTestId } = render(
        <MobileImageStack
          mainImage={mockMainImage}
          images={mockGalleryImages}
          projectTitle={mockProjectTitle}
        />
      )

      const imageBlocks = getAllByTestId('image-block')

      expect(imageBlocks[0]).toHaveAttribute('data-index', '0')
      expect(imageBlocks[1]).toHaveAttribute('data-index', '1')
      expect(imageBlocks[2]).toHaveAttribute('data-index', '2')
    })

    it('should_mark_first_image_with_isFirst_true', () => {
      const { getAllByTestId } = render(
        <MobileImageStack
          mainImage={mockMainImage}
          images={mockGalleryImages}
          projectTitle={mockProjectTitle}
        />
      )

      const imageBlocks = getAllByTestId('image-block')

      expect(imageBlocks[0]).toHaveAttribute('data-is-first', 'true')
      expect(imageBlocks[1]).toHaveAttribute('data-is-first', 'false')
      expect(imageBlocks[2]).toHaveAttribute('data-is-first', 'false')
    })

    it('should_preserve_gallery_image_captions', () => {
      const { getAllByTestId } = render(
        <MobileImageStack
          mainImage={mockMainImage}
          images={mockGalleryImages}
          projectTitle={mockProjectTitle}
        />
      )

      const imageBlocks = getAllByTestId('image-block')

      // Gallery images should preserve their captions
      expect(imageBlocks[1]).toHaveAttribute('data-caption', 'Gallery Image 1')
      expect(imageBlocks[2]).toHaveAttribute('data-caption', 'Gallery Image 2')
    })

    it('should_generate_unique_keys_for_each_image', () => {
      const { getAllByTestId } = render(
        <MobileImageStack
          mainImage={mockMainImage}
          images={mockGalleryImages}
          projectTitle={mockProjectTitle}
        />
      )

      const imageBlocks = getAllByTestId('image-block')

      // Main image should have 'main-image' key
      expect(imageBlocks[0]).toHaveAttribute('data-key', 'main-image')

      // Gallery images should preserve their _key
      expect(imageBlocks[1]).toHaveAttribute('data-key', 'gallery-1')
      expect(imageBlocks[2]).toHaveAttribute('data-key', 'gallery-2')
    })
  })

  describe('Memoization', () => {
    it('should_memoize_allImages_array', () => {
      const { rerender, getAllByTestId } = render(
        <MobileImageStack
          mainImage={mockMainImage}
          images={mockGalleryImages}
          projectTitle={mockProjectTitle}
        />
      )

      const firstRenderBlocks = getAllByTestId('image-block')

      // Rerender with same props
      rerender(
        <MobileImageStack
          mainImage={mockMainImage}
          images={mockGalleryImages}
          projectTitle={mockProjectTitle}
        />
      )

      const secondRenderBlocks = getAllByTestId('image-block')

      // Should render same number of blocks
      expect(secondRenderBlocks).toHaveLength(firstRenderBlocks.length)
    })

    it('should_recompute_when_images_prop_changes', () => {
      const { rerender, getAllByTestId } = render(
        <MobileImageStack
          mainImage={mockMainImage}
          images={mockGalleryImages}
          projectTitle={mockProjectTitle}
        />
      )

      const firstRenderBlocks = getAllByTestId('image-block')
      expect(firstRenderBlocks).toHaveLength(3)

      // Rerender with different images
      const newGalleryImages = [mockGalleryImages[0]]

      rerender(
        <MobileImageStack
          mainImage={mockMainImage}
          images={newGalleryImages}
          projectTitle={mockProjectTitle}
        />
      )

      const secondRenderBlocks = getAllByTestId('image-block')
      expect(secondRenderBlocks).toHaveLength(2) // 1 main + 1 gallery
    })

    it('should_recompute_when_mainImage_prop_changes', () => {
      const { rerender, getAllByTestId } = render(
        <MobileImageStack
          mainImage={mockMainImage}
          images={mockGalleryImages}
          projectTitle={mockProjectTitle}
        />
      )

      getAllByTestId('image-block')

      // Rerender with different main image
      const newMainImage: ImageSource = {
        _type: 'image',
        asset: {
          _ref: 'image-new-main-ref',
          _type: 'reference',
        },
      }

      rerender(
        <MobileImageStack
          mainImage={newMainImage}
          images={mockGalleryImages}
          projectTitle={mockProjectTitle}
        />
      )

      const secondRenderBlocks = getAllByTestId('image-block')
      expect(secondRenderBlocks).toHaveLength(3) // Should still have 3 images
    })
  })

  describe('Edge Cases', () => {
    it('should_handle_undefined_gallery_images', () => {
      const { getAllByTestId } = render(
        <MobileImageStack
          mainImage={mockMainImage}
          projectTitle={mockProjectTitle}
        />
      )

      const imageBlocks = getAllByTestId('image-block')

      // Should only render main image
      expect(imageBlocks).toHaveLength(1)
      expect(imageBlocks[0]).toHaveAttribute('data-is-main-image', 'true')
    })

    it('should_handle_empty_gallery_array', () => {
      const { getAllByTestId } = render(
        <MobileImageStack
          mainImage={mockMainImage}
          images={[]}
          projectTitle={mockProjectTitle}
        />
      )

      const imageBlocks = getAllByTestId('image-block')

      // Should only render main image
      expect(imageBlocks).toHaveLength(1)
    })

    it('should_handle_missing_image_keys_gracefully', () => {
      const imagesWithoutKeys = [
        {
          _key: '',
          asset: {
            _type: 'image' as const,
            asset: {
              _ref: 'image-no-key-ref',
              _type: 'reference' as const,
            },
          },
        },
      ]

      const { getAllByTestId } = render(
        <MobileImageStack
          mainImage={mockMainImage}
          images={imagesWithoutKeys}
          projectTitle={mockProjectTitle}
        />
      )

      const imageBlocks = getAllByTestId('image-block')

      // Should still render all images
      expect(imageBlocks).toHaveLength(2) // 1 main + 1 gallery
    })
  })
})
