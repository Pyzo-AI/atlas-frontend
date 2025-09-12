'use client'
import { useDeviceType } from '@/hooks/useDeviceType'
import { usePortraitMode } from '@/hooks/usePortraitMode'

const ResponsiveContainer = ({ children }) => {
  const { isDesktop } = useDeviceType()
  const isPortrait = usePortraitMode()
  
  const shouldShowPadding = isDesktop || (!isDesktop && isPortrait)
  
  return (
    <div className={`min-h-screen ${shouldShowPadding ? 'pt-[52px]' : ''}`}>
      {children}
    </div>
  )
}

export default ResponsiveContainer