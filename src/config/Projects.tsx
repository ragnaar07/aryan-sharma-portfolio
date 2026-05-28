import CPlusPlus from '@/components/technologies/CPlusPlus';
import FastAPI from '@/components/technologies/FastAPI';
import Linux from '@/components/technologies/Linux';
import MachineLearning from '@/components/technologies/MachineLearning';
import OpenAI from '@/components/technologies/OpenAI';
import Python from '@/components/technologies/Python';
import STM32 from '@/components/technologies/STM32';
import { Project } from '@/types/project';

const resumeLink = '/resume';

export const projects: Project[] = [
  {
    title: 'Transformer Predictive Maintenance',
    description:
      'End-to-end ML pipeline for transformer health and maintenance priority prediction using XGBoost, Random Forest, SHAP explainability, and Streamlit deployment.',
    image: '/project/transformer-maintenance.svg',
    link: resumeLink,
    technologies: [
      { name: 'Python', icon: <Python key="python" /> },
      { name: 'Machine Learning', icon: <MachineLearning key="ml" /> },
      { name: 'Linux', icon: <Linux key="linux" /> },
    ],
    live: resumeLink,
    details: false,
    projectDetailsPageSlug: '/projects',
    isWorking: true,
  },
  {
    title: 'AI Chatbot with RAG',
    description:
      'Document Q&A assistant using LangChain, FAISS vector search, OpenAI API workflows, prompt templates, and REST-style downstream integration.',
    image: '/project/rag-chatbot.svg',
    link: resumeLink,
    technologies: [
      { name: 'Python', icon: <Python key="python" /> },
      { name: 'LangChain / GenAI', icon: <OpenAI key="genai" /> },
      { name: 'Machine Learning', icon: <MachineLearning key="ml" /> },
    ],
    live: resumeLink,
    details: false,
    projectDetailsPageSlug: '/projects',
    isWorking: true,
  },
  {
    title: 'AI Automation Pipeline',
    description:
      'FastAPI automation workflow that scrapes web content, chunks and embeds text, and generates summaries using Hugging Face transformer models.',
    image: '/project/ai-automation.svg',
    link: resumeLink,
    technologies: [
      { name: 'Python', icon: <Python key="python" /> },
      { name: 'FastAPI', icon: <FastAPI key="fastapi" /> },
      { name: 'GenAI', icon: <OpenAI key="genai" /> },
    ],
    live: resumeLink,
    details: false,
    projectDetailsPageSlug: '/projects',
    isWorking: true,
  },
  {
    title: 'Audio Processor',
    description:
      'Python audio-processing project from GitHub, demonstrating signal-processing and automation fundamentals useful for AI/ML data pipelines.',
    image: '/project/audio-processor.svg',
    link: 'https://github.com/ragnaar07/audio-processor',
    technologies: [
      { name: 'Python', icon: <Python key="python" /> },
      { name: 'Machine Learning', icon: <MachineLearning key="ml" /> },
      { name: 'Linux', icon: <Linux key="linux" /> },
    ],
    github: 'https://github.com/ragnaar07/audio-processor',
    live: 'https://github.com/ragnaar07/audio-processor',
    details: false,
    projectDetailsPageSlug: '/projects',
    isWorking: true,
  },
  {
    title: 'Middleware-Style C++ Rule Engine',
    description:
      'Plugin-style validation middleware with rule loading, evaluation, reporting, REST access, and concurrent rule execution for structured industrial data.',
    image: '/project/cpp-rule-engine.svg',
    link: resumeLink,
    technologies: [
      { name: 'C++11', icon: <CPlusPlus key="cpp" /> },
      { name: 'Linux', icon: <Linux key="linux" /> },
      { name: 'REST', icon: <FastAPI key="rest" /> },
    ],
    live: resumeLink,
    details: false,
    projectDetailsPageSlug: '/projects',
    isWorking: true,
  },
  {
    title: 'STM32 Sensor Data Logger',
    description:
      'Bare-metal C firmware for STM32 sensor sampling over SPI, I2C, and UART, paired with a Linux-side Python daemon for parsing and logging.',
    image: '/project/stm32-logger.svg',
    link: resumeLink,
    technologies: [
      { name: 'STM32', icon: <STM32 key="stm32" /> },
      { name: 'C++ / C', icon: <CPlusPlus key="cpp" /> },
      { name: 'Python', icon: <Python key="python" /> },
      { name: 'Linux', icon: <Linux key="linux" /> },
    ],
    live: resumeLink,
    details: false,
    projectDetailsPageSlug: '/projects',
    isWorking: true,
  },
  {
    title: 'File Finder Project',
    description:
      'Python automation utility from GitHub for locating files quickly, built around practical scripting and developer workflow improvement.',
    image: '/project/file-finder.svg',
    link: 'https://github.com/ragnaar07/file-finder-project',
    technologies: [
      { name: 'Python', icon: <Python key="python" /> },
      { name: 'Automation', icon: <FastAPI key="automation" /> },
      { name: 'Linux', icon: <Linux key="linux" /> },
    ],
    github: 'https://github.com/ragnaar07/file-finder-project',
    live: 'https://github.com/ragnaar07/file-finder-project',
    details: false,
    projectDetailsPageSlug: '/projects',
    isWorking: true,
  },
  {
    title: 'Password Security Checker',
    description:
      'Python security tool from GitHub for checking password strength and reinforcing secure input-validation practices.',
    image: '/project/password-security.svg',
    link: 'https://github.com/ragnaar07/password_security_checker',
    technologies: [
      { name: 'Python', icon: <Python key="python" /> },
      { name: 'Linux', icon: <Linux key="linux" /> },
    ],
    github: 'https://github.com/ragnaar07/password_security_checker',
    live: 'https://github.com/ragnaar07/password_security_checker',
    details: false,
    projectDetailsPageSlug: '/projects',
    isWorking: true,
  },
  {
    title: 'Load Flow Study',
    description:
      'MATLAB-based power-system analysis project from GitHub for load-flow study, connecting electrical engineering fundamentals with computational modeling.',
    image: '/project/load-flow.svg',
    link: 'https://github.com/ragnaar07/Load-Flow-Study',
    technologies: [
      { name: 'Systems Modeling', icon: <MachineLearning key="modeling" /> },
      { name: 'Engineering', icon: <STM32 key="systems" /> },
    ],
    github: 'https://github.com/ragnaar07/Load-Flow-Study',
    live: 'https://github.com/ragnaar07/Load-Flow-Study',
    details: false,
    projectDetailsPageSlug: '/projects',
    isWorking: true,
  },
  {
    title: 'Korn Reduction Technique',
    description:
      'MATLAB implementations from GitHub for power-system analysis methods, including network reduction techniques used in electrical systems studies.',
    image: '/project/korn-reduction.svg',
    link: 'https://github.com/ragnaar07/Korn-Reduction-Technique',
    technologies: [
      { name: 'Systems Modeling', icon: <MachineLearning key="modeling" /> },
      { name: 'Engineering', icon: <STM32 key="systems" /> },
    ],
    github: 'https://github.com/ragnaar07/Korn-Reduction-Technique',
    live: 'https://github.com/ragnaar07/Korn-Reduction-Technique',
    details: false,
    projectDetailsPageSlug: '/projects',
    isWorking: true,
  },
];
