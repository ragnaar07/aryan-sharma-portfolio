'use client';

import React, { useState } from 'react';

interface SetupCopyButtonProps {
  text: string;
}

export function SetupCopyButton({ text }: SetupCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text to clipboard:', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-muted-foreground hover:text-primary cursor-pointer text-xs transition-colors"
      aria-label={
        copied ? 'Copied settings.json' : 'Copy settings.json to clipboard'
      }
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}
