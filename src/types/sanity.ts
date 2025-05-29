export interface TextileDesign {
  _id: string
  title: string
  slug?: { current: string }
  image: any
  gallery?: Array<{
    _key: string
    asset: any
    caption?: string
  }>
  description?: string
  detailedDescription?: string
  year?: number
  materials?: string
  dimensions?: string
  technique?: string
  featured?: boolean
}
