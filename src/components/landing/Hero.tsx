import { Link } from 'next-view-transitions';
import Image from 'next/image';
import React from 'react';

import { heroConfig, skillComponents, socialLinks } from '@/config/Hero';
import { parseTemplate } from '@/lib/hero';
import { cn } from '@/lib/utils';

import Container from '../common/Container';
import Skill from '../common/Skill';
import CV from '../svgs/CV';
import Chat from '../svgs/Chat';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

const buttonIcons = {
  CV: CV,
  Chat: Chat,
};

export default function Hero() {
  const {
    name,
    title,
    avatar,
    bannerImage,
    bannerAlt,
    skills,
    description,
    buttons,
  } = heroConfig;

  const renderDescription = () => {
    const parts = parseTemplate(description.template, skills);

    return parts.map((part) => {
      if (part.type === 'skill' && 'skill' in part && part.skill) {
        const SkillComponent =
          skillComponents[part.skill.component as keyof typeof skillComponents];
        return (
          <Skill key={part.key} name={part.skill.name} href={part.skill.href}>
            <SkillComponent />
          </Skill>
        );
      } else if (part.type === 'bold' && 'text' in part) {
        return (
          <b key={part.key} className="text-primary font-semibold">
            {part.text}
          </b>
        );
      } else if (part.type === 'text' && 'text' in part) {
        return <span key={part.key}>{part.text}</span>;
      }
      return null;
    });
  };

  return (
    <Container className="mx-auto max-w-7xl">
      {/* Hero Panoramic Banner */}
      <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-100 shadow-sm sm:h-64 md:h-72 lg:h-80 dark:border-neutral-800/80 dark:bg-neutral-900">
        <Image
          src={bannerImage || avatar}
          alt={bannerAlt || 'Hero banner'}
          fill
          priority
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
          className="object-cover object-center"
        />
      </div>

      {/* Text Area */}
      <div className="mt-8 flex flex-col gap-2">
        <h1 className="text-4xl font-bold">
          Hi, I&apos;m {name} — <span className="text-secondary">{title}</span>
        </h1>

        <p className="mt-4 text-base leading-relaxed text-neutral-500 md:text-lg">
          {renderDescription()}
        </p>
      </div>

      {/* Buttons */}
      <div className="mt-8 flex gap-4">
        {buttons.map((button, index) => {
          const IconComponent =
            buttonIcons[button.icon as keyof typeof buttonIcons];
          return (
            <Button
              key={index}
              asChild
              variant={button.variant as 'outline' | 'default'}
              className={cn(
                button.variant === 'outline' && 'inset-shadow-indigo-500',
                button.variant === 'default' && 'inset-shadow-indigo-500',
              )}
            >
              <Link href={button.href}>
                {IconComponent && <IconComponent />}
                <span>{button.text}</span>
              </Link>
            </Button>
          );
        })}
      </div>

      {/* Social Links */}
      <div className="mt-8 flex gap-2">
        {socialLinks.map((link) => (
          <Tooltip key={link.name} delayDuration={0}>
            <TooltipTrigger asChild>
              <Link
                href={link.href}
                key={link.name}
                aria-label={link.name}
                className="text-secondary flex items-center gap-2"
              >
                <span className="size-6">{link.icon}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>{link.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </Container>
  );
}
