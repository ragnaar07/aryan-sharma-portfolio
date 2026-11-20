import React from 'react';

interface SectionHeadingProps {
  subHeading: string;
  heading: string;
  headingId?: string;
}

export default function SectionHeading({
  subHeading,
  heading,
  headingId,
}: SectionHeadingProps) {
  return (
    <div>
      <p className="text-secondary text-sm">{subHeading}</p>
      <h2 id={headingId} className="text-2xl font-bold">
        {heading}
      </h2>
    </div>
  );
}
