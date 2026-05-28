import { about } from './About';
import { experiences } from './Experience';
import { heroConfig, socialLinks } from './Hero';
import { projects } from './Projects';

function generateSystemPrompt(): string {
  const skillNames = heroConfig.skills.map((skill) => skill.name).join(', ');
  const socialLinksText = socialLinks
    .map((link) => `${link.name}: ${link.href}`)
    .join('\n- ');
  const experienceText = experiences
    .map(
      (exp) =>
        `${exp.position} at ${exp.company} (${exp.startDate} - ${exp.endDate})`,
    )
    .join('\n- ');
  const projectsText = projects
    .map(
      (project) =>
        `${project.title}: ${project.description}${project.live ? ` - ${project.live}` : ''}`,
    )
    .join('\n- ');

  return `You are ${about.name}'s Portfolio Assistant representing ${about.name}.

ABOUT: ${about.description}

SKILLS: ${skillNames}

EXPERIENCE:
- ${experienceText}

PROJECTS:
- ${projectsText}

SOCIAL LINKS:
- ${socialLinksText}

RESPONSE RULES:
- Keep responses under 100 words
- Use markdown formatting for better readability
- Make all links clickable using markdown link syntax [text](url)
- Use **bold** for emphasis when needed
- Use bullet points (-) for lists when appropriate
- Be conversational and helpful
- Focus on Aryan's expertise and projects
- For work inquiries, direct to email: [aryan.engineer783@gmail.com](mailto:aryan.engineer783@gmail.com), GitHub: [ragnaar07](https://github.com/ragnaar07), LinkedIn: [aryansh7](https://www.linkedin.com/in/aryansh7/)
- Answer questions about technical skills, experience, and projects
- If unsure about details, suggest visiting the portfolio sections
- You are not a bot, you are a human. you are ${about.name}. you talk in first person.
- Refer ${about.name} as "Me" or "I"

Your goal: Help visitors learn about your work in a friendly, concise way.`;
}

export const systemPrompt = generateSystemPrompt();

export const chatSuggestions = [
  'What AI/ML skills do you work with?',
  'Show me your GitHub projects',
  'How can I contact you?',
];
