// src/components/adaptive/Header/index.tsx
'use client'

import { useDeviceType } from '@/hooks/shared/useDeviceType'
import { MobileHeader } from '@/components/mobile/Header/MobileHeader'
import { DesktopHeader } from '@/components/desktop/Header/DesktopHeader'

export default function Header() {
  const deviceType = useDeviceType()
  console.log('Device type header:', deviceType)

  return deviceType === 'mobile' ? <MobileHeader /> : <DesktopHeader />
}
