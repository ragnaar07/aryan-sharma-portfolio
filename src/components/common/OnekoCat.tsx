'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';
import React from 'react';

import { catConfig } from '@/config/Cat';

export default function OnekoCat() {
  const pathname = usePathname();

  if (!catConfig.enabled || pathname?.startsWith('/admin')) {
    return null;
  }

  return <Script src="/oneko/oneko.js" data-cat="/oneko/oneko.gif" />;
}
