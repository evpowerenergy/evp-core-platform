/**
 * useMobile Hook
 * 
 * Hook สำหรับตรวจสอบว่าผู้ใช้อยู่บน mobile device หรือไม่
 * ใช้ media query เพื่อ detect screen size
 * 
 * ทำไมใช้ camelCase (useMobile.tsx)?
 * 1. Consistency: ใช้ camelCase ให้เหมือน hooks อื่นๆ (useAuth, useLeads, etc.)
 * 2. Standard convention: React hooks มักใช้ camelCase
 * 3. Better imports: import { useIsMobile } from '@/hooks/useMobile' สะดวกกว่า
 */

import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

