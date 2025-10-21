// ABOUTME: Mock navigation data for testing project navigation components

import { mockSingleDesign, mockMinimalDesign } from './designs'

export const mockNavigationProjects = {
  current: mockSingleDesign,
  next: {
    _id: 'next-project-id',
    slug: { current: 'next-project-slug' },
    title: 'Next Project Title',
    year: 2024,
  },
  previous: {
    _id: 'previous-project-id',
    slug: { current: 'previous-project-slug' },
    title: 'Previous Project Title',
    year: 2023,
  },
}

export const mockNavigationEdgeCases = {
  firstProject: {
    current: mockSingleDesign,
    next: mockNavigationProjects.next,
    previous: undefined,
  },
  lastProject: {
    current: mockSingleDesign,
    next: undefined,
    previous: mockNavigationProjects.previous,
  },
  singleProject: {
    current: mockSingleDesign,
    next: undefined,
    previous: undefined,
  },
}

export const mockNavigationWithoutSlugs = {
  current: mockMinimalDesign,
  next: {
    _id: 'next-no-slug',
    slug: undefined,
    title: 'Next Project (No Slug)',
  },
  previous: {
    _id: 'prev-no-slug',
    slug: undefined,
    title: 'Previous Project (No Slug)',
  },
}

export const mockProjectWithNavigation = {
  project: mockSingleDesign,
  nextProject: mockNavigationProjects.next,
  previousProject: mockNavigationProjects.previous,
}

export const mockCompleteProjectData = {
  project: {
    ...mockSingleDesign,
    gallery: [
      {
        _key: 'image-1',
        asset: { _ref: 'image-ref-1' },
        alt: 'Gallery image 1',
        caption: 'First gallery image',
      },
      {
        _key: 'image-2',
        asset: { _ref: 'image-ref-2' },
        alt: 'Gallery image 2',
        caption: 'Second gallery image',
      },
    ],
  },
  navigation: mockNavigationProjects,
}

export const mockNavigationAnalytics = {
  previous: {
    event: 'navigate_previous',
    slug: 'previous-project-slug',
    direction: 'previous',
  },
  next: {
    event: 'navigate_next',
    slug: 'next-project-slug',
    direction: 'next',
  },
  gallery: {
    event: 'navigate_to_gallery',
    from: 'project_view',
  },
}
