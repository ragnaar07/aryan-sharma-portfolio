import { about } from '@/config/About';
import { certificates } from '@/config/Achievements';
import { contactConfig } from '@/config/Contact';
import { experiences } from '@/config/Experience';
import { heroConfig, socialLinks } from '@/config/Hero';
import { projects } from '@/config/Projects';
import { resumeConfig } from '@/config/Resume';

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function projectLink(project: (typeof projects)[number]) {
  return project.github ?? project.live ?? project.link;
}

function projectTech(project: (typeof projects)[number]) {
  return project.technologies.map((technology) => technology.name).join(', ');
}

function formatProject(project: (typeof projects)[number]) {
  return `- **${project.title}**: ${project.description} Tech: ${projectTech(
    project,
  )}. [Link](${projectLink(project)})`;
}

function getRelevantProjects(message: string) {
  const lower = message.toLowerCase();
  const ignoredWords = new Set([
    'project',
    'projects',
    'main',
    'show',
    'built',
    'using',
    'with',
    'tech',
  ]);

  return projects.filter((project) => {
    const title = project.title.toLowerCase();
    const description = project.description.toLowerCase();
    const technologies = project.technologies
      .map((technology) => technology.name.toLowerCase())
      .join(' ');

    return [...title.split(/\s+/), ...technologies.split(/\s+/)]
      .filter((word) => word.length > 2 && !ignoredWords.has(word))
      .some(
        (word) =>
          lower.includes(word) ||
          (word.length > 4 && description.includes(word) && lower.includes(word)),
      );
  });
}

export function getPortfolioKnowledgeContext() {
  const skills = heroConfig.skills.map((skill) => skill.name).join(', ');
  const education = `${about.education.degree} from ${about.education.institution} (${about.education.startYear} - ${about.education.graduationYear})`;
  const experienceText = experiences
    .map(
      (experience) =>
        `${experience.position} at ${experience.company}, ${experience.location} (${experience.startDate} - ${experience.endDate}): ${experience.description.join(
          ' ',
        )}`,
    )
    .join('\n- ');
  const projectText = projects
    .map(
      (project) =>
        `${project.title}: ${project.description} Tech: ${projectTech(
          project,
        )}. Link: ${projectLink(project)}`,
    )
    .join('\n- ');
  const certificateText = certificates
    .map(
      (certificate) =>
        `${certificate.title} - ${certificate.issuer} (${certificate.date})`,
    )
    .join('\n- ');
  const socialLinksText = socialLinks
    .map((link) => `${link.name}: ${link.href}`)
    .join('\n- ');

  return [
    `NAME: ${about.name}`,
    `TITLE: ${heroConfig.title}`,
    `ABOUT: ${about.description}`,
    `EDUCATION: ${education}`,
    `SKILLS: ${skills}`,
    `LOCATION: ${contactConfig.location}`,
    `AVAILABILITY: ${contactConfig.availability}`,
    `RESPONSE TIME: ${contactConfig.responseTime}`,
    `RESUME: ${resumeConfig.resumeUrl}`,
    `AI/ML CV: ${resumeConfig.cvUrl}`,
    `EXPERIENCE:\n- ${experienceText}`,
    `PROJECTS:\n- ${projectText}`,
    `CERTIFICATES:\n- ${certificateText}`,
    `SOCIAL LINKS:\n- ${socialLinksText}`,
  ].join('\n\n');
}

export function getPortfolioFallback(message: string) {
  const lower = message.toLowerCase();
  const skills = heroConfig.skills.map((skill) => skill.name).join(', ');
  const email = socialLinks.find((link) => link.name === 'Email')?.href ?? '';
  const github = socialLinks.find((link) => link.name === 'Github')?.href ?? '';
  const linkedIn =
    socialLinks.find((link) => link.name === 'LinkedIn')?.href ?? '';

  if (
    includesAny(lower, [
      'project',
      'projects',
      'github',
      'repo',
      'built',
      'portfolio',
    ])
  ) {
    const relevantProjects = getRelevantProjects(lower);
    const selectedProjects =
      relevantProjects.length > 0 ? relevantProjects : projects;

    return [
      relevantProjects.length > 0
        ? 'Relevant projects:'
        : 'My projects include:',
      selectedProjects.map(formatProject).join('\n'),
      '',
      `You can also review my GitHub here: [ragnaar07](${github}).`,
    ].join('\n');
  }

  if (
    includesAny(lower, [
      'everything',
      'overview',
      'summary',
      'about you',
      'about me',
      'who are you',
      'profile',
      'background',
    ])
  ) {
    return [
      `I'm **${about.name}**, an **${heroConfig.title}** based in **${contactConfig.location}**.`,
      `- **Education**: ${about.education.degree}, ${about.education.institution} (${about.education.startYear} - ${about.education.graduationYear}).`,
      `- **Core skills**: ${skills}.`,
      `- **Experience**: Industrial Software at Alstom, plus SCADA and grid automation training at SJVN.`,
      '- **Project focus**: predictive maintenance, RAG assistants, AI automation, C++ validation tooling, embedded logging, Python automation, security utilities, and power-system studies.',
      `- **Availability**: ${contactConfig.availability}.`,
    ].join('\n');
  }

  if (
    includesAny(lower, [
      'skill',
      'tech',
      'stack',
      'ai',
      'ml',
      'machine learning',
      'langchain',
      'python',
      'c++',
      'linux',
      'fastapi',
      'work with',
    ])
  ) {
    return [
      `I focus on AI/ML and production software. Core skills: **${skills}**.`,
      '- I use Python for ML, automation, data processing, and API workflows.',
      '- I use C++ and Linux for systems, middleware-style validation, and industrial software work.',
      '- I have GenAI/RAG experience with LangChain, FAISS/vector search, prompt templates, and Hugging Face/OpenAI-style workflows.',
    ].join('\n');
  }

  if (
    includesAny(lower, [
      'contact',
      'hire',
      'reach',
      'connect',
      'message',
      'call',
      'email',
      'work together',
      'available',
      'availability',
      'location',
    ])
  ) {
    return [
      `I'm based in **${contactConfig.location}** and **${contactConfig.availability.toLowerCase()}**.`,
      `- **Email**: [${contactConfig.email}](${email})`,
      `- **LinkedIn**: [aryansh7](${linkedIn})`,
      `- **GitHub**: [ragnaar07](${github})`,
      `- **Response time**: ${contactConfig.responseTime}.`,
      '',
      'For a useful first message, include the role/project, timeline, tech stack, and expected next step.',
    ].join('\n');
  }

  if (
    includesAny(lower, [
      'experience',
      'alstom',
      'sjvn',
      'job',
      'intern',
      'training',
      'trainee',
      'work history',
    ])
  ) {
    const experienceList = experiences
      .map(
        (experience) =>
          `- **${experience.position}** at **${experience.company}**, ${experience.location} (${experience.startDate} - ${experience.endDate}): ${experience.description[0]}`,
      )
      .join('\n');

    return `My experience:\n${experienceList}`;
  }

  if (
    includesAny(lower, [
      'education',
      'college',
      'university',
      'degree',
      'b.tech',
      'btech',
      'nit',
      'hamirpur',
      'graduation',
    ])
  ) {
    return `I studied **${about.education.degree}** at **${about.education.institution}**. I started in **${about.education.startYear}** and graduated in **${about.education.graduationYear}**.`;
  }

  if (
    includesAny(lower, [
      'certificate',
      'certification',
      'achievement',
      'course',
      'bootcamp',
    ])
  ) {
    const certificateList = certificates
      .map(
        (certificate) =>
          `- **${certificate.title}** from ${certificate.issuer} (${certificate.date})`,
      )
      .join('\n');

    return `My certificates and achievements include:\n${certificateList}`;
  }

  if (includesAny(lower, ['resume', 'cv'])) {
    return `You can view my systems resume and AI/ML CV on the [Resume page](/resume). Direct files: [Resume](${resumeConfig.resumeUrl}) and [AI/ML CV](${resumeConfig.cvUrl}).`;
  }

  return `${about.description} Ask me about my education, AI/ML skills, projects, work experience, certificates, resume, or contact details.`;
}

export function hasPortfolioIntent(message: string) {
  const lower = message.toLowerCase();

  return includesAny(lower, [
    'everything',
    'overview',
    'summary',
    'about you',
    'about me',
    'who are you',
    'profile',
    'background',
    'skill',
    'tech',
    'stack',
    'ai',
    'ml',
    'machine learning',
    'langchain',
    'python',
    'c++',
    'linux',
    'fastapi',
    'work with',
    'project',
    'github',
    'repo',
    'portfolio',
    'built',
    'experience',
    'alstom',
    'sjvn',
    'job',
    'intern',
    'training',
    'trainee',
    'work history',
    'education',
    'college',
    'university',
    'degree',
    'b.tech',
    'btech',
    'nit',
    'hamirpur',
    'graduation',
    'resume',
    'cv',
    'contact',
    'hire',
    'reach',
    'connect',
    'message',
    'call',
    'email',
    'work together',
    'available',
    'availability',
    'location',
    'certificate',
    'certification',
    'achievement',
    'course',
    'bootcamp',
  ]);
}
