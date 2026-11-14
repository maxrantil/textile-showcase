// ABOUTME: Unit tests for the Umami event helpers in src/utils/analytics.ts
// A missing, broken or rejecting tracker must never throw into the caller (Issue #263)

import { trackEvent, UmamiEvents } from '@/utils/analytics'

describe('trackEvent', () => {
  afterEach(() => {
    delete window.umami
  })

  it('should forward the event to Umami when the tracker is loaded', () => {
    const track = jest.fn()
    window.umami = { track }

    trackEvent('project-view', { title: 'Composing Tones' })

    expect(track).toHaveBeenCalledWith('project-view', {
      title: 'Composing Tones',
    })
  })

  it('should do nothing when the tracker never loaded', () => {
    expect(() => trackEvent('project-view')).not.toThrow()
  })

  it('should not throw when the tracker throws', () => {
    window.umami = {
      track: () => {
        throw new Error('umami down')
      },
    }

    expect(() => trackEvent('project-view')).not.toThrow()
    expect(() => UmamiEvents.viewProject('Composing Tones', 2025)).not.toThrow()
    expect(() =>
      UmamiEvents.trackEvent('desktop-project-navigation', {
        direction: 'next',
      })
    ).not.toThrow()
  })

  it('should not throw when the tracker is not the expected shape', () => {
    window.umami = {} as unknown as Window['umami']

    expect(() => trackEvent('project-view')).not.toThrow()
  })

  it('should handle a rejected send so it is not an unhandled rejection', async () => {
    const rejection = Promise.reject(new Error('network down'))
    const catchSpy = jest.spyOn(rejection, 'catch')
    window.umami = { track: () => rejection }

    trackEvent('project-view')

    expect(catchSpy).toHaveBeenCalled()
    await expect(rejection).rejects.toThrow('network down')
  })
})
