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
    'tell',
    'about',
    'what',
    'have',
    'done',
    'your',
    'some',
    'give',
    'list',
    'work',
  ]);

  const queryWords = lower
    .split(/[^a-z0-9+#_.-]+/)
    .filter((word) => word.length > 2 && !ignoredWords.has(word));

  return projects.filter((project) => {
    const title = project.title.toLowerCase();
    const description = project.description.toLowerCase();
    const techNames = project.technologies.map((technology) =>
      technology.name.toLowerCase(),
    );
    const technologies = techNames.join(' ');

    // Match explicit domain concepts
    if (
      (lower.includes('concurren') ||
        queryWords.some((w) => w.startsWith('concur'))) &&
      (title.includes('rule engine') || description.includes('concurrent'))
    ) {
      return true;
    }

    if (
      (lower.includes('predict') ||
        queryWords.some((w) => w.startsWith('predict'))) &&
      (title.includes('predictive') || description.includes('predict'))
    ) {
      return true;
    }

    if (
      (lower.includes('agent') || lower.includes('rag')) &&
      (title.includes('rag') ||
        title.includes('automation') ||
        description.includes('rag') ||
        description.includes('langchain'))
    ) {
      return true;
    }

    // Match query words in project fields (title, technologies, description)
    const matchesQueryWord = queryWords.some(
      (word) =>
        title.includes(word) ||
        technologies.includes(word) ||
        (word.length > 3 && description.includes(word)),
    );

    if (matchesQueryWord) return true;

    // Match project title or tech words in the user query
    const titleAndTechWords = [
      ...title.split(/[^a-z0-9+#_.-]+/),
      ...technologies.split(/[^a-z0-9+#_.-]+/),
    ].filter((word) => word.length > 2 && !ignoredWords.has(word));

    return titleAndTechWords.some((word) => lower.includes(word));
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
        )} Technologies: ${experience.technologies.map((t) => t.name).join(', ')}.`,
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
    `BLOG: Technical articles, tutorials, and architecture guides on the [Blog page](/blog).`,
    `SOCIAL LINKS:\n- ${socialLinksText}`,
  ].join('\n\n');
}

function getPortfolioFallbackAnswer(message: string) {
  const lower = message.toLowerCase();
  const skills = heroConfig.skills.map((skill) => skill.name).join(', ');
  const email = socialLinks.find((link) => link.name === 'Email')?.href ?? '';
  const github = socialLinks.find((link) => link.name === 'Github')?.href ?? '';
  const linkedIn =
    socialLinks.find((link) => link.name === 'LinkedIn')?.href ?? '';

  if (includesAny(lower, ['rag', 'agent', 'agentic'])) {
    const agentProjects = projects.filter(
      (p) =>
        p.title.toLowerCase().includes('rag') ||
        p.title.toLowerCase().includes('automation') ||
        p.description.toLowerCase().includes('langchain') ||
        p.description.toLowerCase().includes('rag'),
    );
    return [
      `${about.name}'s AI agent and RAG projects include:`,
      agentProjects.map(formatProject).join('\n'),
      '',
      `Visitors can also view the AI/ML CV on the [Resume page](/resume) or check GitHub: [ragnaar07](${github}).`,
    ].join('\n');
  }

  if (includesAny(lower, ['predictive', 'prediction'])) {
    const predictiveProjects = projects.filter(
      (p) =>
        p.title.toLowerCase().includes('predictive') ||
        p.description.toLowerCase().includes('predictive') ||
        p.description.toLowerCase().includes('prediction'),
    );
    return [
      `${about.name}'s predictive maintenance and ML modeling work includes:`,
      predictiveProjects.map(formatProject).join('\n'),
      '',
      'This project features an end-to-end ML pipeline with XGBoost, Random Forest, SHAP explainability, and Streamlit deployment.',
    ].join('\n');
  }

  if (includesAny(lower, ['concurrency', 'concurrent', 'multithreading'])) {
    const concurrencyProjects = projects.filter(
      (p) =>
        p.description.toLowerCase().includes('concurrent') ||
        p.title.toLowerCase().includes('rule engine'),
    );
    return [
      `${about.name}'s concurrency and high-performance systems work includes:`,
      concurrencyProjects.map(formatProject).join('\n'),
      '',
      `At Alstom, ${about.name} engineered multi-stage C++ data pipelines and Oat++ REST middleware with move semantics and thread safety for safety-critical railway control data.`,
    ].join('\n');
  }

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
        : `${about.name}'s projects include:`,
      selectedProjects.map(formatProject).join('\n'),
      '',
      `Visitors can also review the GitHub profile: [ragnaar07](${github}).`,
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
      `This portfolio belongs to **${about.name}**, an **${heroConfig.title}** based in **${contactConfig.location}**.`,
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
      'cpp',
      'linux',
      'fastapi',
      'work with',
      'hardware',
      'electronics',
      'embedded',
      'analog',
      'verilog',
      'dsp',
      'arduino',
      'stm32',
      'semiconductor',
    ])
  ) {
    return [
      `Aryan's work bridges hardware, C++ systems, and machine learning. Core skills: **${skills}**.`,
      '- **Low-Level & Systems**: C++ and Linux for modular middleware, safety-critical railway validation at Alstom, and system automation.',
      '- **Hardware & Electronics**: Analog circuit design, PCB layouts, semiconductor physics, Verilog, DSP, and microcontroller work with Arduino and STM32.',
      '- **Machine Learning & Python**: Deep learning, Transformers, predictive maintenance models, and Python data pipelines.',
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
      `Aryan is based in **${contactConfig.location}** and **${contactConfig.availability.toLowerCase()}**.`,
      `- **Email**: [${contactConfig.email}](${email})`,
      `- **LinkedIn**: [aryansh7](${linkedIn})`,
      `- **GitHub**: [ragnaar07](${github})`,
      `- **Response time**: ${contactConfig.responseTime}.`,
      '',
      'For a useful first message, include the role/project, timeline, tech stack, and expected next step.',
    ].join('\n');
  }

  if (lower.includes('alstom')) {
    const alstom = experiences.find((e) =>
      e.company.toLowerCase().includes('alstom'),
    );
    if (alstom) {
      return [
        `At **${alstom.company}** (${alstom.position}, ${alstom.startDate} - ${alstom.endDate}):`,
        ...alstom.description.map((item) => `- ${item}`),
        `- **Technologies**: ${alstom.technologies.map((t) => t.name).join(', ')}.`,
      ].join('\n');
    }
  }

  if (
    lower.includes('sjvn') ||
    includesAny(lower, ['scada', 'grid automation'])
  ) {
    const sjvn = experiences.find((e) =>
      e.company.toLowerCase().includes('sjvn'),
    );
    if (sjvn) {
      return [
        `At **${sjvn.company}** (${sjvn.position}, ${sjvn.startDate} - ${sjvn.endDate}):`,
        ...sjvn.description.map((item) => `- ${item}`),
        `- **Technologies**: ${sjvn.technologies.map((t) => t.name).join(', ')}.`,
      ].join('\n');
    }
  }

  if (
    includesAny(lower, [
      'experience',
      'job',
      'intern',
      'training',
      'trainee',
      'work history',
    ])
  ) {
    const experienceList = experiences
      .map((experience) => {
        const bullets = experience.description
          .map((item) => `  * ${item}`)
          .join('\n');
        const tech = experience.technologies.map((t) => t.name).join(', ');
        return `- **${experience.position}** at **${experience.company}**, ${experience.location} (${experience.startDate} - ${experience.endDate}):\n${bullets}\n  * **Technologies**: ${tech}`;
      })
      .join('\n\n');

    return `${about.name}'s experience:\n\n${experienceList}`;
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
      'school',
      'schooling',
      'marks',
      'science congress',
      'dav',
    ])
  ) {
    return [
      `Aryan graduated with a **${about.education.degree}** from **${about.education.institution}** (2021 - 2025).`,
      `- **Schooling**: DAV Public School Lathiani (Class X: 90.8%, Class XII: 95.6%).`,
      `- **Awards**: Winner at the Children's Science Congress Fair.`,
    ].join('\n');
  }

  if (
    includesAny(lower, [
      'hobbies',
      'hobby',
      'interest',
      'interests',
      'outside work',
      'free time',
      'himachal',
      'bangana',
      'mountain',
      'mountains',
      'trekking',
      'trek',
      'spiti',
      'buran ghati',
      'kareri lake',
      'manimahesh',
      'chandernahan',
      'fitness',
      'gym',
      'yoga',
      'meditation',
      'psychology',
      'brain',
      'vlsi',
      'semiconductor',
      'solid state',
      'verilog',
      'dsp',
      'energy sector',
      'sci-fi',
      'science fiction',
      'inception',
      'fight club',
      'solo leveling',
    ])
  ) {
    return [
      `Outside engineering, **${about.name}** enjoys a mix of outdoor adventure, learning, and personal growth:`,
      `- **Trekking & adventure**: Self-supported camping and Himalayan treks, including places such as Kareri Lake, Manimahesh Kailash, Buran Ghati, and Chandernahan.`,
      `- **Building & technology**: Experimenting with AI tools and making practical tools to simplify everyday work; exploring machine learning, digital signal processing, and AI in the energy sector.`,
      `- **Hardware & physics**: VLSI, semiconductors, solid-state device physics, and Verilog.`,
      `- **Fitness & wellbeing**: Gym training, building strength and muscle, yoga, meditation, and curiosity about human psychology and the brain.`,
      `- **Film & anime**: Mind-bending science fiction and thrillers such as *Inception* and *Fight Club*, plus anime such as *Solo Leveling*.`,
    ].join('\n');
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

    return `${about.name}'s certificates and achievements include:\n${certificateList}`;
  }

  if (includesAny(lower, ['resume', 'cv'])) {
    return `View Aryan's systems resume and AI/ML CV on the [Resume page](/resume). Direct files: [Resume](${resumeConfig.resumeUrl}) and [AI/ML CV](${resumeConfig.cvUrl}).`;
  }

  if (
    includesAny(lower, [
      'blog',
      'article',
      'articles',
      'post',
      'posts',
      'writing',
      'tutorial',
      'tutorials',
    ])
  ) {
    return 'Explore the technical articles and tutorials covering Next.js architecture, data fetching, and software engineering on the [Blog page](/blog).';
  }

  return `${about.description} The portfolio does not list a specific answer to that question. Ask about Aryan's education, AI/ML skills, projects, work experience, certificates, blog posts, resume, or contact details.`;
}

export function getPortfolioFallback(message: string) {
  return `Hmji ji, Aryan ke portfolio se yeh info mili:\n\n${getPortfolioFallbackAnswer(message)}`;
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
    'projects',
    'github',
    'repo',
    'portfolio',
    'built',
    'blog',
    'blogs',
    'article',
    'articles',
    'post',
    'posts',
    'writing',
    'tutorial',
    'tutorials',
    'experience',
    'alstom',
    'sjvn',
    'scada',
    'grid automation',
    'rag',
    'agent',
    'agentic',
    'predictive',
    'prediction',
    'concurrency',
    'concurrent',
    'multithreading',
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
    'hobbies',
    'hobby',
    'interest',
    'interests',
    'outside work',
    'free time',
    'himachal',
    'bangana',
    'mountain',
    'mountains',
    'trekking',
    'trek',
    'kareri lake',
    'manimahesh',
    'buran ghati',
    'chandernahan',
    'fitness',
    'gym',
    'yoga',
    'meditation',
    'psychology',
    'brain',
    'vlsi',
    'semiconductor',
    'solid state',
    'verilog',
    'dsp',
    'energy sector',
    'sci-fi',
    'science fiction',
    'inception',
    'fight club',
    'solo leveling',
    'certificate',
    'certification',
    'achievement',
    'course',
    'bootcamp',
  ]);
}
