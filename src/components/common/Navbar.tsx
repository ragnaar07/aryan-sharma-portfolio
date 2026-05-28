import { navbarConfig } from '@/config/Navbar';
import { Link } from 'next-view-transitions';
import Image from 'next/image';
import React from 'react';

import Container from './Container';
import { ThemeToggleButton } from './ThemeSwitch';

export default function Navbar() {
  return (
    <Container className="sticky top-0 z-20 rounded-md py-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 px-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/">
            <Image
              className="h-11 w-11 rounded-md border border-gray-200 object-cover transition-all duration-300 ease-in-out hover:scale-90 sm:h-12 sm:w-12"
              src={navbarConfig.logo.src}
              alt={navbarConfig.logo.alt}
              width={navbarConfig.logo.width}
              height={navbarConfig.logo.height}
            />
          </Link>
          <div className="flex min-w-0 items-center justify-center gap-3 text-sm sm:gap-4 sm:text-base">
            {navbarConfig.navItems.map((item) => (
              <Link
                className="transition-all duration-300 ease-in-out hover:underline hover:decoration-2 hover:underline-offset-4"
                key={item.label}
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggleButton variant="circle" start="top-right" blur />
        </div>
      </div>
    </Container>
  );
}
