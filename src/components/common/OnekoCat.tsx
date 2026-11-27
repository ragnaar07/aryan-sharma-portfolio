'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { catConfig } from '@/config/Cat';

export default function OnekoCat() {
  const pathname = usePathname();

  useEffect(() => {
    if (!catConfig.enabled) {
      return;
    }

    const isAdmin = pathname?.startsWith('/admin');
    const mode = isAdmin ? 'hidden' : pathname === '/' ? 'follow' : 'corner';

    const dispatchMode = () => {
      window.dispatchEvent(
        new CustomEvent('oneko:mode', {
          detail: {
            mode,
            corner: catConfig.corner,
          },
        }),
      );
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-oneko-cat]',
    );

    if (existingScript) {
      dispatchMode();
      return;
    }

    const script = document.createElement('script');
    script.src = '/oneko/oneko.js';
    script.dataset.onekoCat = 'true';
    script.dataset.cat = '/oneko/oneko.gif';
    script.addEventListener('load', dispatchMode);
    document.head.appendChild(script);

    return () => {
      if (isAdmin) {
        dispatchMode();
      }
    };
  }, [pathname]);

  return null;
}
