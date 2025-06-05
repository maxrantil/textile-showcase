// src/components/layout/Header/index.ts
export { NavLink } from './NavLink'
export { HamburgerButton } from './HamburgerButton'
export { MobileMenu } from './MobileMenu'
export { DesktopNavigation } from './DesktopNavigation'
export { HeaderLogo } from './HeaderLogo'
export { HeaderNavigation } from './HeaderNavigation'
export { default as ResponsiveHeader } from './ResponsiveHeader'

// Export hooks for potential reuse
export { useHeaderState } from './HeaderState'
export { useHeaderScrollEffects } from './HeaderScrollEffects'
export { useHeaderBreakpointLogic } from './HeaderBreakpointLogic'
export { useHeaderStyles } from './HeaderStyles'
