import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { GalleryItem } from '@/components/gallery/GalleryItem'
import type { TextileDesign } from '@/sanity/types'

describe('GalleryItem', () => {
  const mockDesign: TextileDesign = {
    _id: 'test-id',
    title: 'Test Design',
    slug: { current: 'test-slug' },
    image: {
      asset: {
        _ref: 'image-test-id',
        _type: 'reference',
      },
    },
    year: 2024,
    description: 'Test description',
  }

  beforeEach(() => {
    // Mock window.innerWidth for responsive tests
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  it('renders with title and year when year is provided', () => {
    render(
      <GalleryItem
        design={mockDesign}
        index={0}
        isActive={false}
        onClick={() => {}}
      />
    )

    expect(screen.getByText('Test Design')).toBeInTheDocument()
    expect(screen.getByText('2024')).toBeInTheDocument()
  })

  it('renders without year when year is not provided', () => {
    const designWithoutYear = {
      ...mockDesign,
      year: undefined,
    }

    render(
      <GalleryItem
        design={designWithoutYear}
        index={0}
        isActive={false}
        onClick={() => {}}
      />
    )

    expect(screen.getByText('Test Design')).toBeInTheDocument()
    // Year should not be rendered
    expect(screen.queryByText('2024')).not.toBeInTheDocument()
  })

  it('renders with correct aria-label', () => {
    render(
      <GalleryItem
        design={mockDesign}
        index={0}
        isActive={false}
        onClick={() => {}}
      />
    )

    const button = screen.getByRole('button', {
      name: 'View Test Design project',
    })
    expect(button).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(
      <GalleryItem
        design={mockDesign}
        index={0}
        isActive={false}
        onClick={handleClick}
      />
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('calls onClick when Enter key is pressed', () => {
    const handleClick = jest.fn()
    render(
      <GalleryItem
        design={mockDesign}
        index={0}
        isActive={false}
        onClick={handleClick}
      />
    )

    const button = screen.getByRole('button')
    fireEvent.keyDown(button, { key: 'Enter' })

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('calls onClick when Space key is pressed', () => {
    const handleClick = jest.fn()
    render(
      <GalleryItem
        design={mockDesign}
        index={0}
        isActive={false}
        onClick={handleClick}
      />
    )

    const button = screen.getByRole('button')
    fireEvent.keyDown(button, { key: ' ' })

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies hover effect on mouse enter', () => {
    render(
      <GalleryItem
        design={mockDesign}
        index={0}
        isActive={false}
        onClick={() => {}}
      />
    )

    const button = screen.getByRole('button')
    fireEvent.mouseEnter(button)

    expect(button).toHaveStyle('transform: scale(1.02)')
  })

  it('removes hover effect on mouse leave', () => {
    render(
      <GalleryItem
        design={mockDesign}
        index={0}
        isActive={false}
        onClick={() => {}}
      />
    )

    const button = screen.getByRole('button')
    fireEvent.mouseEnter(button)
    fireEvent.mouseLeave(button)

    expect(button).toHaveStyle('transform: scale(1)')
  })

  it('renders with minimal image data', () => {
    const designWithMinimalImage: TextileDesign = {
      ...mockDesign,
      image: {
        asset: {
          _ref: 'minimal-image',
          _type: 'reference',
        },
        // No hotspot, crop, or alt
      },
    }

    render(
      <GalleryItem
        design={designWithMinimalImage}
        index={0}
        isActive={false}
        onClick={() => {}}
      />
    )

    expect(screen.getByText('Test Design')).toBeInTheDocument()
  })

  it('responds to mobile breakpoint', () => {
    // Set window width to mobile
    window.innerWidth = 500
    window.dispatchEvent(new Event('resize'))

    render(
      <GalleryItem
        design={mockDesign}
        index={0}
        isActive={false}
        onClick={() => {}}
      />
    )

    const button = screen.getByRole('button')
    // Check that mobile width is applied
    expect(button).toHaveStyle({
      width: 'clamp(280px, 85vw, 400px)',
      maxWidth: '90vw',
    })
  })
})
