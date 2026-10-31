import Headphones from '@/components/svgs/devices/Headphones';
import Keyboard from '@/components/svgs/devices/Keyboard';
import Laptop from '@/components/svgs/devices/Laptop';
import Mouse from '@/components/svgs/devices/Mouse';
import Phone from '@/components/svgs/devices/Phone';

export const devices = [
  {
    name: 'Mac with Apple M1 chip',
    icon: <Laptop className="size-4" />,
  },
  {
    name: 'ASUS Wireless Keyboard',
    icon: <Keyboard className="size-4" />,
  },
  {
    name: 'Portronics Wireless Mouse',
    icon: <Mouse className="size-4" />,
  },
  {
    name: 'JBL Tune 750BTNC',
    icon: <Headphones className="size-4" />,
  },
  {
    name: 'iPhone 14',
    icon: <Phone className="size-4" />,
  },
];

export const webExtensions = [
  { name: 'uBlock Origin', href: 'https://ublockorigin.com/' },
  {
    name: 'React Developer Tools',
    href: 'https://chromewebstore.google.com/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en',
  },
  { name: 'Wappalyzer', href: 'https://www.wappalyzer.com/' },
  { name: 'daily.dev', href: 'https://daily.dev/' },
];

export const software = [
  { name: 'Visual Studio Code', href: 'https://code.visualstudio.com/' },
  { name: 'Homebrew', href: 'https://brew.sh/' },
  { name: 'Python', href: 'https://www.python.org/' },
  { name: 'Git', href: 'https://git-scm.com/' },
  { name: 'CMake', href: 'https://cmake.org/' },
];
