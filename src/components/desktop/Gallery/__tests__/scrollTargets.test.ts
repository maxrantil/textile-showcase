// ABOUTME: Test suite for the desktop gallery's scroll positions - first image left, last image right, the rest centred
// Covers the scroll target of each item and which item counts as current at a given scroll position

import { getScrollTarget, getIndexAtScroll } from '../scrollTargets'

/** A track 1440 wide with a 24px margin, 70px gaps and items of the given widths. */
function makeTrack(widths: number[], scrollLeft = 0): HTMLElement {
  const track = document.createElement('div')
  let left = 24
  for (const width of widths) {
    const item = document.createElement('a')
    Object.defineProperty(item, 'offsetLeft', { value: left })
    Object.defineProperty(item, 'offsetWidth', { value: width })
    track.appendChild(item)
    left += width + 70
  }
  Object.defineProperty(track, 'clientWidth', { value: 1440 })
  Object.defineProperty(track, 'scrollWidth', { value: left - 70 + 24 })
  track.scrollLeft = scrollLeft
  return track
}

// Items start at 24, 557, 1522, 2012 and 2457; the track is 2901 wide, so it scrolls 0 to 1461
const WIDTHS = [463, 895, 420, 375, 420]

describe('getScrollTarget', () => {
  it('leaves the track unscrolled for the first item', () => {
    expect(getScrollTarget(makeTrack(WIDTHS), 0)).toBe(0)
  })

  it('centres an item in the middle of the track', () => {
    // centre of item 1 is 557 + 895 / 2 = 1004.5; half the window is 720
    expect(getScrollTarget(makeTrack(WIDTHS), 1)).toBe(284.5)
  })

  it('scrolls to the end for the last item', () => {
    expect(getScrollTarget(makeTrack(WIDTHS), 4)).toBe(1461)
  })

  it('stops at the end for an item too near it to be centred', () => {
    // centring item 3 would need 2012 + 187.5 - 720 = 1479.5
    expect(getScrollTarget(makeTrack(WIDTHS), 3)).toBe(1461)
  })

  it('keeps a first item wider than the window on the left margin', () => {
    expect(getScrollTarget(makeTrack([1600, 400, 400]), 0)).toBe(0)
  })

  it('returns null for an index outside the track', () => {
    expect(getScrollTarget(makeTrack(WIDTHS), 5)).toBeNull()
    expect(getScrollTarget(makeTrack(WIDTHS), -1)).toBeNull()
  })
})

describe('getIndexAtScroll', () => {
  it('is the first item when the track is unscrolled', () => {
    expect(getIndexAtScroll(makeTrack(WIDTHS, 0), 0)).toBe(0)
  })

  it('is the item whose scroll target is nearest', () => {
    expect(getIndexAtScroll(makeTrack(WIDTHS, 284.5), 0)).toBe(1)
    expect(getIndexAtScroll(makeTrack(WIDTHS, 1000), 1)).toBe(2)
  })

  it('is the last item at the end of the track', () => {
    expect(getIndexAtScroll(makeTrack(WIDTHS, 1461), 2)).toBe(4)
  })

  it('keeps the current item when it shares the nearest scroll target', () => {
    // items 3 and 4 both rest at the end of the track
    expect(getIndexAtScroll(makeTrack(WIDTHS, 1461), 3)).toBe(3)
  })
})
