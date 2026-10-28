import CPlusPlus from '@/components/technologies/CPlusPlus';
import FastAPI from '@/components/technologies/FastAPI';
import Linux from '@/components/technologies/Linux';
import MachineLearning from '@/components/technologies/MachineLearning';
import OpenAI from '@/components/technologies/OpenAI';
import Python from '@/components/technologies/Python';
import STM32 from '@/components/technologies/STM32';

export const mySkills = [
  <CPlusPlus key="cpp" />,
  <Python key="python" />,
  <Linux key="linux" />,
  <MachineLearning key="machine-learning" />,
  <OpenAI key="genai" />,
  <FastAPI key="fastapi" />,
  <STM32 key="stm32" />,
];

export const about = {
  name: 'Aryan Sharma',
  description: `I grew up in Bangana, Himachal Pradesh, and graduated in Electrical Engineering from NIT Hamirpur.

My background bridges three distinct areas: physical hardware, low-level systems, and applied machine learning.

On the hardware and physics side, I like working from first principles—exploring semiconductor physics, analog circuit design, PCB layouts, and microcontroller systems with Arduino and STM32.

On the software side, I write modular C++ middleware (like my railway validation work at Alstom), automate Linux workflows, and build deep learning and transformer pipelines in Python.

Outside of work, I spend my time in the mountains—trekking high-altitude Himalayan trails like Spiti, Buran Ghati, and Chanshal—or keeping up a morning lifting routine. I value discipline, depth over hype, and understanding engineering from the silicon layer on up.`,
  education: {
    degree: 'B.Tech in Electrical Engineering',
    institution: 'NIT Hamirpur',
    startYear: '2021',
    graduationYear: '2025',
    schooling: 'DAV Public School Lathiani (Class X: 90.8%, Class XII: 95.6%)',
    awards: 'Children Science Congress Fair Winner',
  },
};
