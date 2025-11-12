'use client'
import { useDeviceType } from '@/hooks/useDeviceType'
import { usePortraitMode } from '@/hooks/usePortraitMode'
import { usePathname } from 'next/navigation'
import Header from './Header'
import { useSidebar } from './LayoutWrapper'

const ResponsiveContainer = ({ children }) => {
  const { isDesktop } = useDeviceType()
  const isPortrait = usePortraitMode()
  const pathname = usePathname()
  const containLecture = pathname.includes('/lectures/')
  const { toggleSidebar } = useSidebar()

  const shouldShowPadding =
    isDesktop || (!isDesktop && isPortrait) || !containLecture

  // Don't show header on login page
  const showHeader = pathname !== '/login'

  return (
    <>
      {showHeader && <Header onMenuClick={toggleSidebar} />}
      <div className={`min-h-screen ${shouldShowPadding ? 'pt-[52px]' : ''}`}>
        {children}
      </div>
    </>
  )
}

export default ResponsiveContainer
