// ABOUTME: Test suite for MobileProjectDetails - Component displaying project metadata with conditional field rendering

import React from 'react'
import { render, screen } from '@testing-library/react'
import { MobileProjectDetails } from '../MobileProjectDetails'
import { TextileDesign } from '@/types/textile'

describe('MobileProjectDetails', () => {
  const baseProject: TextileDesign = {
    _id: 'test-id',
    title: 'Test Textile Project',
    slug: { current: 'test-project' },
    image: {
      _type: 'image',
      asset: { _ref: 'image-ref', _type: 'reference' },
    },
  }

  describe('Header Rendering', () => {
    it('should_render_project_title_in_h1', () => {
      render(<MobileProjectDetails project={baseProject} />)

      const title = screen.getByRole('heading', { level: 1 })
      expect(title).toHaveTextContent('Test Textile Project')
    })

    it('should_render_project_year_when_available', () => {
      const projectWithYear = { ...baseProject, year: 2024 }

      render(<MobileProjectDetails project={projectWithYear} />)

      expect(screen.getByText('2024')).toBeInTheDocument()
    })

    it('should_not_render_year_when_undefined', () => {
      render(<MobileProjectDetails project={baseProject} />)

      const yearElement = document.querySelector('.mobile-project-year')
      expect(yearElement).not.toBeInTheDocument()
    })

    it('should_apply_correct_header_classes', () => {
      const { container } = render(
        <MobileProjectDetails project={baseProject} />
      )

      const header = container.querySelector('.mobile-project-header')
      expect(header).toBeInTheDocument()

      const title = container.querySelector('.mobile-project-title')
      expect(title).toBeInTheDocument()
    })
  })

  describe('Description Section', () => {
    it('should_render_description_when_available', () => {
      const projectWithDescription = {
        ...baseProject,
        description: 'This is a beautiful textile design.',
      }

      render(<MobileProjectDetails project={projectWithDescription} />)

      expect(
        screen.getByText('This is a beautiful textile design.')
      ).toBeInTheDocument()
    })

    it('should_not_render_description_section_when_undefined', () => {
      render(<MobileProjectDetails project={baseProject} />)

      const description = document.querySelector('.mobile-project-description')
      expect(description).not.toBeInTheDocument()
    })

    it('should_render_detailed_description_in_separate_section', () => {
      const projectWithDetailedDescription = {
        ...baseProject,
        detailedDescription:
          'This piece was created using traditional Nordic weaving techniques...',
      }

      render(<MobileProjectDetails project={projectWithDetailedDescription} />)

      expect(screen.getByText('About This Piece')).toBeInTheDocument()
      expect(
        screen.getByText(/traditional Nordic weaving techniques/)
      ).toBeInTheDocument()
    })
  })

  describe('Technical Details', () => {
    it('should_render_materials_when_available', () => {
      const projectWithMaterials = {
        ...baseProject,
        materials: ['Wool', 'Linen'],
      }

      render(<MobileProjectDetails project={projectWithMaterials} />)

      expect(screen.getByText('Materials')).toBeInTheDocument()
      expect(screen.getByText('Wool, Linen')).toBeInTheDocument()
    })

    it('should_render_technique_when_available', () => {
      const projectWithTechnique = {
        ...baseProject,
        technique: 'Hand-woven',
      }

      render(<MobileProjectDetails project={projectWithTechnique} />)

      expect(screen.getByText('Technique')).toBeInTheDocument()
      expect(screen.getByText('Hand-woven')).toBeInTheDocument()
    })

    it('should_render_dimensions_when_available', () => {
      const projectWithDimensions = {
        ...baseProject,
        dimensions: '100cm × 150cm',
      }

      render(<MobileProjectDetails project={projectWithDimensions} />)

      expect(screen.getByText('Dimensions')).toBeInTheDocument()
      expect(screen.getByText('100cm × 150cm')).toBeInTheDocument()
    })

    it('should_join_array_materials_with_comma', () => {
      const projectWithArrayMaterials = {
        ...baseProject,
        materials: ['Wool', 'Linen', 'Cotton'],
      }

      render(<MobileProjectDetails project={projectWithArrayMaterials} />)

      expect(screen.getByText('Wool, Linen, Cotton')).toBeInTheDocument()
    })

    it('should_format_dimensions_object_correctly', () => {
      const projectWithDimensionsObject = {
        ...baseProject,
        dimensions: {
          width: 100,
          height: 150,
          unit: 'cm',
        },
      }

      render(<MobileProjectDetails project={projectWithDimensionsObject} />)

      expect(screen.getByText('100cm × 150cm')).toBeInTheDocument()
    })

    it('should_not_render_details_section_when_all_fields_empty', () => {
      render(<MobileProjectDetails project={baseProject} />)

      // Details section should not exist
      expect(screen.queryByText('Details')).not.toBeInTheDocument()
    })
  })

  describe('Additional Information', () => {
    it('should_render_exhibitions_when_available', () => {
      const projectWithExhibitions = {
        ...baseProject,
        exhibitions: 'Shown at Nordic Textile Fair 2023',
      }

      render(<MobileProjectDetails project={projectWithExhibitions} />)

      expect(screen.getByText('Exhibition History')).toBeInTheDocument()
      expect(
        screen.getByText('Shown at Nordic Textile Fair 2023')
      ).toBeInTheDocument()
    })

    it('should_render_credits_when_available', () => {
      const projectWithCredits = {
        ...baseProject,
        credits: 'Photography by Jane Doe',
      }

      render(<MobileProjectDetails project={projectWithCredits} />)

      expect(screen.getByText('Credits')).toBeInTheDocument()
      expect(screen.getByText('Photography by Jane Doe')).toBeInTheDocument()
    })

    it('should_render_availability_when_available', () => {
      const projectWithAvailability = {
        ...baseProject,
        availability: 'Available for purchase',
      }

      render(<MobileProjectDetails project={projectWithAvailability} />)

      expect(screen.getByText('Availability')).toBeInTheDocument()
      expect(screen.getByText('Available for purchase')).toBeInTheDocument()
    })

    it('should_not_render_additional_info_section_when_all_empty', () => {
      render(<MobileProjectDetails project={baseProject} />)

      expect(
        screen.queryByText('Additional Information')
      ).not.toBeInTheDocument()
    })

    it('should_render_section_with_correct_heading', () => {
      const projectWithExhibitions = {
        ...baseProject,
        exhibitions: 'Test Exhibition',
      }

      render(<MobileProjectDetails project={projectWithExhibitions} />)

      const heading = screen.getByText('Additional Information')
      expect(heading.tagName).toBe('H2')
    })
  })

  describe('Care Instructions', () => {
    it('should_render_care_instructions_when_available', () => {
      const projectWithCareInstructions = {
        ...baseProject,
        careInstructions: 'Hand wash only in cold water',
      }

      render(<MobileProjectDetails project={projectWithCareInstructions} />)

      expect(screen.getByText('Care Instructions')).toBeInTheDocument()
      expect(
        screen.getByText('Hand wash only in cold water')
      ).toBeInTheDocument()
    })

    it('should_not_render_care_section_when_undefined', () => {
      render(<MobileProjectDetails project={baseProject} />)

      expect(screen.queryByText('Care Instructions')).not.toBeInTheDocument()
    })
  })

  describe('Semantic HTML', () => {
    it('should_use_section_elements_for_main_sections', () => {
      const fullProject = {
        ...baseProject,
        description: 'Test description',
        materials: ['Wool'],
        detailedDescription: 'Detailed info',
        exhibitions: 'Test exhibition',
        careInstructions: 'Care info',
      }

      const { container } = render(
        <MobileProjectDetails project={fullProject} />
      )

      const sections = container.querySelectorAll('section')
      expect(sections.length).toBeGreaterThan(0)
    })

    it('should_use_h2_for_section_titles', () => {
      const projectWithDetails = {
        ...baseProject,
        materials: ['Wool'],
      }

      render(<MobileProjectDetails project={projectWithDetails} />)

      const detailsHeading = screen.getByText('Details')
      expect(detailsHeading.tagName).toBe('H2')
    })

    it('should_use_h3_for_detail_item_headings', () => {
      const projectWithMaterials = {
        ...baseProject,
        materials: ['Wool'],
      }

      render(<MobileProjectDetails project={projectWithMaterials} />)

      const materialsHeading = screen.getByText('Materials')
      expect(materialsHeading.tagName).toBe('H3')
    })

    it('should_use_proper_heading_hierarchy', () => {
      const fullProject = {
        ...baseProject,
        materials: ['Wool'],
        technique: 'Weaving',
      }

      const { container } = render(
        <MobileProjectDetails project={fullProject} />
      )

      // Should have h1 (title)
      const h1 = container.querySelector('h1')
      expect(h1).toBeInTheDocument()

      // Should have h2 (section titles)
      const h2Elements = container.querySelectorAll('h2')
      expect(h2Elements.length).toBeGreaterThan(0)

      // Should have h3 (detail item headings)
      const h3Elements = container.querySelectorAll('h3')
      expect(h3Elements.length).toBeGreaterThan(0)
    })
  })
})
