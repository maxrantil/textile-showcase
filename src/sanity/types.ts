export interface TextileDesign {
  _id: string
  title: string
  slug?: { current: string }
  image: {
    asset: {
      _ref: string
      _type: 'reference'
    }
    hotspot?: {
      x: number
      y: number
      height: number
      width: number
    }
    crop?: {
      top: number
      bottom: number
      left: number
      right: number
    }
    alt?: string
  }
  gallery?: Array<{
    _key: string
    asset: {
      _ref: string
      _type: 'reference'
    }
    hotspot?: {
      x: number
      y: number
      height: number
      width: number
    }
    crop?: {
      top: number
      bottom: number
      left: number
      right: number
    }
    caption?: string
    alt?: string
  }>
  description?: string
  detailedDescription?: string
  year?: number
  materials?: string
  dimensions?: string
  technique?: string
  featured?: boolean
}
