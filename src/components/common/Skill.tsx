import { Link } from 'next-view-transitions';
import React from 'react';

interface SkillProps {
  name: string;
  href: string;
  children: React.ReactNode;
}

export default function Skill({ name, href, children }: SkillProps) {
  return (
    <Link
      href={href ?? ''}
      target="_blank"
      rel="noopener noreferrer"
      className="skill-inner-shadow inline-flex items-center rounded-md border border-dashed border-black/20 bg-black/5 px-1.5 py-0.5 align-middle text-sm text-black dark:border-white/30 dark:bg-white/15 dark:text-white"
    >
      <span className="inline-flex size-4 flex-shrink-0 items-center justify-center">
        {children}
      </span>
      <span className="ml-1 text-sm font-bold">{name}</span>
    </Link>
  );
}
