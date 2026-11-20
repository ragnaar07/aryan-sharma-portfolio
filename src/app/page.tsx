import React from 'react';

import Container from '@/components/common/Container';
import About from '@/components/landing/About';
import Blog from '@/components/landing/Blog';
import CTA from '@/components/landing/CTA';
import Experience from '@/components/landing/Experience';
import Github from '@/components/landing/Github';
import Hero from '@/components/landing/Hero';
import Journey from '@/components/landing/Journey';
import LifeOuttakes from '@/components/landing/LifeOuttakes';
import Work from '@/components/landing/Projects';

export default function page() {
  return (
    <Container className="min-h-screen py-16">
      <Hero />
      <Experience />
      <Work />
      <About />
      <Github />
      <Blog />
      <LifeOuttakes />
      <CTA />
      <Journey />
    </Container>
  );
}
