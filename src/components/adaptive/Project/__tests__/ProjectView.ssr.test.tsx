// ABOUTME: Tests the project view's server-rendered HTML follows the server's device guess
// Phones must get the mobile view (and its LCP image) in the initial HTML, not after hydration

import { renderToString } from 'react-dom/server'
import ProjectView from '../index'
import type { TextileDesign } from '@/types/textile'

jest.mock('@/components/mobile/Project', () => ({
  MobileProjectView: () => <div data-view="mobile" />,
}))
jest.mock('@/components/desktop/Project', () => ({
  DesktopProjectView: () => <div data-view="desktop" />,
}))

const project = {
  _id: 'p',
  title: 'Salt',
  slug: { current: 'salt' },
} as TextileDesign

describe('ProjectView server render', () => {
  it('renders the mobile view when the server guessed mobile', () => {
    const html = renderToString(
      <ProjectView project={project} initialDeviceType="mobile" />
    )
    expect(html).toContain('data-view="mobile"')
    expect(html).not.toContain('data-view="desktop"')
  })

  it('renders the desktop view by default', () => {
    const html = renderToString(<ProjectView project={project} />)
    expect(html).toContain('data-view="desktop"')
  })
})
