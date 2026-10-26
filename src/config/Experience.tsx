import CPlusPlus from '@/components/technologies/CPlusPlus';
import FastAPI from '@/components/technologies/FastAPI';
import Linux from '@/components/technologies/Linux';
import Python from '@/components/technologies/Python';

export interface Technology {
  name: string;
  href: string;
  icon: React.ReactNode;
}

export interface Experience {
  company: string;
  position: string;
  location: string;
  image: string;
  description: string[];
  startDate: string;
  endDate: string;
  website: string;
  x?: string;
  linkedin?: string;
  github?: string;
  technologies: Technology[];
  isCurrent: boolean;
  isBlur?: boolean;
}

const cpp = {
  name: 'C++',
  href: 'https://isocpp.org/',
  icon: <CPlusPlus />,
};

const python = {
  name: 'Python',
  href: 'https://www.python.org/',
  icon: <Python />,
};

const linux = {
  name: 'Linux',
  href: 'https://www.kernel.org/',
  icon: <Linux />,
};

const fastApi = {
  name: 'FastAPI',
  href: 'https://fastapi.tiangolo.com/',
  icon: <FastAPI />,
};

export const experiences: Experience[] = [
  {
    isCurrent: false,
    company: 'Alstom Transport India Ltd.',
    position: 'Graduate Engineer Trainee | Industrial Software',
    location: 'Bangalore, India',
    image: '/company/alstom.svg',
    description: [
      'Independently designed and owned a *modular C++ middleware validation engine* using an Oat++ REST backend for safety-critical railway control data.',
      'Built multi-stage C++ data-processing pipelines for structured message parsing, rule evaluation, and error reporting using C++11 features including smart pointers, lambdas, and move semantics.',
      'Created Python regression automation integrated with Git-based CI/CD, reducing manual QA effort by *around 40%*.',
      'Worked daily in Linux development environments with shell scripting, process management, CMake builds, and GDB-based debugging.',
      'Collaborated with architecture, integration, and QA teams while tracking and resolving defects through JIRA.',
    ],
    startDate: 'August 2025',
    endDate: 'April 2026',
    technologies: [cpp, python, linux, fastApi],
    website: 'https://www.alstom.com/',
    linkedin: 'https://www.linkedin.com/company/alstom/',
  },
  {
    isCurrent: false,
    company: 'SJVN Ltd.',
    position: 'Industrial Trainee | SCADA & Grid Automation',
    location: 'Shimla, India',
    image: '/company/sjvn.svg',
    description: [
      'Studied real-time *SCADA monitoring* for a 1500 MW power station and analyzed industrial sensor data pipelines.',
      'Observed hardware-software integration patterns for grid automation systems, connecting power-system domain knowledge with industrial AI and IoT use cases.',
      'Built practical understanding of monitoring workflows, control-room operations, and fault-response processes in a production energy environment.',
    ],
    startDate: 'May 2024',
    endDate: 'June 2024',
    technologies: [python, linux],
    website: 'https://sjvn.nic.in/',
    linkedin: 'https://www.linkedin.com/company/sjvn-limited/',
  },
];
