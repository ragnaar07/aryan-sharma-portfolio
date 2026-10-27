'use client';

import React, { useState } from 'react';

import Copied from '../svgs/Copied';
import Copy from '../svgs/Copy';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface CodeCopyButtonProps {
  code: string;
}

export function CodeCopyButton({ code }: CodeCopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={copyToClipboard}
          className="absolute top-3 right-3 rounded-md opacity-0 transition-all duration-200 group-hover:opacity-100 hover:cursor-pointer"
          title={isCopied ? 'Copied!' : 'Copy code'}
          aria-label={isCopied ? 'Copied!' : 'Copy code'}
        >
          {isCopied ? (
            <Copied className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="text-secondary h-4 w-4" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {isCopied ? 'Copied to clipboard!' : 'Copy to clipboard'}
      </TooltipContent>
    </Tooltip>
  );
}
