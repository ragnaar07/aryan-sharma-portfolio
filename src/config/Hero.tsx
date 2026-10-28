/*
 * CUSTOMIZATION EXAMPLE
 *
 * Want to customize this portfolio for yourself? Here's how easy it is:
 *
 * 1. Update your personal info:
 *    name: "Your Name"
 *    title: "Your Professional Title"
 *    avatar: "/path/to/your/image.jpg"
 *
 * 2. Add your skills:
 *    skills: [
 *      { name: "Python", href: "https://python.org", component: "Python" }, // Note: You'd need to create Python component
 *      { name: "React", href: "https://react.dev", component: "ReactIcon" },
 *      { name: "Node.js", href: "https://nodejs.org", component: "NodeJs" },
 *    ]
 *
 * 3. Write your description using the template:
 *    template: "I'm a **passionate developer** who loves building apps with {skills:0} and {skills:1}. I specialize in **web development** and enjoy working with {skills:2}."
 *
 * 4. Update your social links:
 *    Just change the href values to your own social media profiles
 *
 * That's it! Your portfolio will automatically update with your information.
 */
import Github from '@/components/svgs/Github';
import LinkedIn from '@/components/svgs/LinkedIn';
import Mail from '@/components/svgs/Mail';
import CPlusPlus from '@/components/technologies/CPlusPlus';
import FastAPI from '@/components/technologies/FastAPI';
import Linux from '@/components/technologies/Linux';
import MachineLearning from '@/components/technologies/MachineLearning';
import OpenAI from '@/components/technologies/OpenAI';
import Python from '@/components/technologies/Python';

// Technology Components

// Component mapping for skills
export const skillComponents = {
  CPlusPlus: CPlusPlus,
  Python: Python,
  Linux: Linux,
  MachineLearning: MachineLearning,
  OpenAI: OpenAI,
  FastAPI: FastAPI,
};

export const heroConfig = {
  // Personal Information
  name: 'Aryan Sharma',
  title: 'Systems & Software Engineer | C++, Hardware & AI/ML',
  avatar: '/assets/profile-avatar.jpg',
  bannerImage: '/assets/dhauladhar.png',
  bannerAlt:
    'Panoramic view of the Dhauladhar mountain range in Himachal Pradesh',

  // Skills Configuration
  skills: [
    {
      name: 'C++',
      href: 'https://isocpp.org/',
      component: 'CPlusPlus',
    },
    {
      name: 'Python',
      href: 'https://www.python.org/',
      component: 'Python',
    },
    {
      name: 'Linux',
      href: 'https://www.kernel.org/',
      component: 'Linux',
    },
    {
      name: 'Machine Learning',
      href: 'https://scikit-learn.org/',
      component: 'MachineLearning',
    },
    {
      name: 'LangChain',
      href: 'https://www.langchain.com/',
      component: 'OpenAI',
    },
    {
      name: 'FastAPI',
      href: 'https://fastapi.tiangolo.com/',
      component: 'FastAPI',
    },
  ],

  // Description Configuration
  description: {
    template:
      'Raised in Himachal Pradesh, I build across the entire stack—from {skills:0} systems and {skills:2} automation to embedded hardware, {skills:1}, and {skills:3}. I care about building high-performance software and intelligent pipelines that connect cleanly to physical systems.',
  },

  // Buttons Configuration
  buttons: [
    {
      variant: 'outline',
      text: 'Resume / CV',
      href: '/resume',
      icon: 'CV',
    },
    {
      variant: 'default',
      text: 'Get in touch',
      href: '/contact',
      icon: 'Chat',
    },
  ],
};

// Social Links Configuration
export const socialLinks = [
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/in/aryansh7/',
    icon: <LinkedIn />,
  },
  {
    name: 'Github',
    href: 'https://github.com/ragnaar07',
    icon: <Github />,
  },
  {
    name: 'Email',
    href: 'mailto:aryan.engineer783@gmail.com',
    icon: <Mail />,
  },
];
