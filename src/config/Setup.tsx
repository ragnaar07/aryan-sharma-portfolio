import { Download, Settings, Terminal } from 'lucide-react';

export const steps = [
  {
    id: 1,
    title: 'Install macOS development tools',
    icon: <Download className="size-4" />,
    content: [
      {
        type: 'instruction',
        text: 'Install the Xcode Command Line Tools if they are not already installed.',
      },
      {
        type: 'prompt',
        text: 'xcode-select --install',
      },
      {
        type: 'link',
        name: 'Install Homebrew',
        description: 'Use the official macOS package manager instructions.',
        href: 'https://brew.sh/',
      },
      {
        type: 'link',
        name: 'Install Visual Studio Code',
        description: 'Download the macOS version of VS Code.',
        href: 'https://code.visualstudio.com/download',
      },
      {
        type: 'instruction',
        text: 'Open Terminal (zsh) and install the command-line tools used in my C++, Python, and systems workflows.',
      },
      {
        type: 'prompt',
        text: 'brew install git python cmake',
      },
    ],
  },
  {
    id: 2,
    title: 'Install VS Code extensions',
    icon: <Terminal className="size-4" />,
    content: [
      {
        type: 'download',
        name: 'vsc-extensions.txt',
        description: 'Save the extension list to your Downloads folder.',
        href: '/setup/vsc-extensions.txt',
      },
      {
        type: 'instruction',
        text: "In VS Code, open the Command Palette and run “Shell Command: Install 'code' command in PATH”.",
      },
      {
        type: 'instruction',
        text: 'Open Terminal, then run this command to install the extensions from the downloaded list.',
      },
      {
        type: 'prompt',
        text: 'cd ~/Downloads && xargs -n 1 code --install-extension < vsc-extensions.txt',
      },
    ],
  },
  {
    id: 3,
    title: 'Configure VS Code for macOS and zsh',
    icon: <Settings className="size-4" />,
    content: [
      {
        type: 'instruction',
        text: 'Open the Command Palette.',
      },
      {
        type: 'shortcut',
        text: '⌘ + ⇧ + P',
      },
      {
        type: 'instruction',
        text: 'Run “Preferences: Open User Settings (JSON)”.',
      },
      {
        type: 'prompt',
        text: 'Preferences: Open User Settings (JSON)',
      },
      {
        type: 'instruction',
        text: 'Copy the settings below into your user settings. Review any existing preferences before replacing them.',
      },
    ],
  },
];

export const settingsJson = `{
  "editor.fontFamily": "'SF Mono', Menlo, Monaco, monospace",
  "editor.fontSize": 14,
  "editor.fontLigatures": true,
  "editor.formatOnSave": true,
  "editor.minimap.enabled": false,
  "editor.rulers": [88],
  "editor.tabSize": 4,
  "files.autoSave": "afterDelay",
  "git.autofetch": true,
  "terminal.integrated.defaultProfile.osx": "zsh",
  "terminal.integrated.fontFamily": "'SF Mono', Menlo, Monaco, monospace",
  "workbench.colorTheme": "Night Owl",
  "workbench.iconTheme": "material-icon-theme",
  "workbench.startupEditor": "none",
  "python.defaultInterpreterPath": "\${workspaceFolder}/.venv/bin/python",
  "python.terminal.activateEnvironment": true,
  "cmake.configureOnOpen": true,
  "[c]": {
    "editor.defaultFormatter": "ms-vscode.cpptools"
  },
  "[cpp]": {
    "editor.defaultFormatter": "ms-vscode.cpptools"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.tabSize": 2
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.tabSize": 2
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[jsonc]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.tabSize": 2
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.tabSize": 2
  }
}`;
