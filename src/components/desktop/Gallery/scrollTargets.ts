// ABOUTME: Scroll positions of the desktop gallery - first image on the left margin, last on the right, the rest centred
// Shared by the gallery's scrolling, current-item tracking and scroll restoration so they agree with the CSS snap points

/**
 * Where the track rests for an item: unscrolled for the first, fully scrolled
 * for the last, and with the item centred (as far as the track allows) otherwise.
 * Mirrors the scroll-snap-align rules in styles/desktop/gallery.css.
 */
export function getScrollTarget(
  track: HTMLElement,
  index: number
): number | null {
  const item = track.children[index] as HTMLElement | undefined
  if (!item) return null

  const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth)
  if (index === 0) return 0
  if (index === track.children.length - 1) return maxScroll

  const centred = item.offsetLeft + item.offsetWidth / 2 - track.clientWidth / 2
  return Math.min(maxScroll, Math.max(0, centred))
}

/**
 * The item the track is resting on, or nearest to. Several items can share a
 * scroll target at the ends of the track. The current one wins such a tie, so
 * that stepping through them with the keyboard is not undone by a scroll
 * event; otherwise it is the last item at the end and the first one elsewhere.
 */
export function getIndexAtScroll(
  track: HTMLElement,
  currentIndex: number
): number {
  const distances: number[] = []
  for (let i = 0; i < track.children.length; i++) {
    const target = getScrollTarget(track, i)
    distances.push(
      target === null ? Infinity : Math.abs(target - track.scrollLeft)
    )
  }
  if (distances.length === 0) return 0

  // Scroll positions are fractional, so targets within a pixel count as shared
  const closest = Math.min(...distances)
  const nearest = distances.flatMap((distance, i) =>
    distance <= closest + 1 ? [i] : []
  )
  if (nearest.includes(currentIndex)) return currentIndex

  const maxScroll = track.scrollWidth - track.clientWidth
  const atEnd = maxScroll > 0 && track.scrollLeft >= maxScroll - 1
  return atEnd ? nearest[nearest.length - 1] : nearest[0]
}
