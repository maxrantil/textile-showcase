// ABOUTME: Pins the image URLs urlFor() produces, so the @sanity/image-url v2 migration
// (default export → createImageUrlBuilder) is proven to generate identical URLs

jest.mock('../client', () => ({
  client: {
    config: () => ({ projectId: 'testproject', dataset: 'testdataset' }),
    clientConfig: { projectId: 'testproject', dataset: 'testdataset' },
  },
}))

import { urlFor } from '../imageHelpers'

const source = { _type: 'image', asset: { _ref: 'image-abc123-1200x900-jpg' } }

describe('urlFor', () => {
  it('builds the plain CDN URL for an asset reference', () => {
    expect(urlFor(source).url()).toBe(
      'https://cdn.sanity.io/images/testproject/testdataset/abc123-1200x900.jpg'
    )
  })

  it('applies width, quality and format parameters', () => {
    expect(urlFor(source).width(800).quality(80).format('webp').url()).toBe(
      'https://cdn.sanity.io/images/testproject/testdataset/abc123-1200x900.jpg?w=800&fm=webp&q=80'
    )
  })
})
