'use client'
import { useDeviceType } from '@/hooks/useDeviceType'
import { usePortraitMode } from '@/hooks/usePortraitMode'
import { usePathname } from 'next/navigation'

const ResponsiveContainer = ({ children }) => {
  const { isDesktop } = useDeviceType()
  const isPortrait = usePortraitMode()
  const pathname = usePathname()
  const containLecture = pathname.includes('/lectures/')

  const shouldShowPadding =
    isDesktop || (!isDesktop && isPortrait) || !containLecture

  return (
    <div className={`min-h-screen ${shouldShowPadding ? 'pt-[52px]' : ''}`}>
      {children}
    </div>
  )
}

export default ResponsiveContainer
