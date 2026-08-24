import { useState, useEffect } from 'react';

export const useMobile = (breakpoint = 900) => {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkBreakpoint = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    checkBreakpoint();

    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handleMqlChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    if (mql.addEventListener) {
      mql.addEventListener('change', handleMqlChange);
    } else if ('addListener' in mql) {
      (mql as any).addListener(handleMqlChange);
    }

    window.addEventListener('resize', checkBreakpoint);
    window.addEventListener('orientationchange', checkBreakpoint);

    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handleMqlChange);
      } else if ('removeListener' in mql) {
        (mql as any).removeListener(handleMqlChange);
      }
      window.removeEventListener('resize', checkBreakpoint);
      window.removeEventListener('orientationchange', checkBreakpoint);
    };
  }, [breakpoint]);

  return isMobile;
};

