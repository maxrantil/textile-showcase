import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GalleryItem } from '../../gallery/GalleryItem'
import { TextileDesign } from '@/types/sanity'

const mockDesign: TextileDesign = {
  _id: '1',
  title: 'Test Textile',
  slug: { current: 'test-textile' },
  image: { asset: { _id: 'image1' } },
  year: 2024,
}

describe('GalleryItem Component', () => {
  it('renders design title and year', () => {
    render(
      <GalleryItem 
        design={mockDesign} 
        index={0} 
        onClick={jest.fn()} 
      />
    )
    
    expect(screen.getByText('Test Textile')).toBeInTheDocument()
    expect(screen.getByText('2024')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()
    
    render(
      <GalleryItem 
        design={mockDesign} 
        index={0} 
        onClick={handleClick} 
      />
    )
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies hover effects on mouse enter', () => {
    render(
      <GalleryItem 
        design={mockDesign} 
        index={0} 
        onClick={jest.fn()} 
      />
    )
    
    const container = screen.getByRole('button')
    fireEvent.mouseEnter(container)
    
    expect(container).toHaveStyle({ transform: 'scale(1.02)' })
  })
})
