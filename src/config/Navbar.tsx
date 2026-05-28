export interface NavItem {
  label: string;
  href: string;
}

export const navbarConfig = {
  logo: {
    src: '/assets/profile-avatar.jpg',
    alt: 'Aryan Sharma',
    width: 100,
    height: 100,
  },
  navItems: [
    {
      label: 'Work',
      href: '/work-experience',
    },
    {
      label: 'Projects',
      href: '/projects',
    },
    {
      label: 'Contact',
      href: '/contact',
    },
  ] as NavItem[],
};
