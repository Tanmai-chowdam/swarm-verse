import React, { useEffect, useRef } from 'react';
import katex from 'katex';

interface FormulaBlockProps {
  math: string;
  displayMode?: boolean;
  className?: string;
}

export const FormulaBlock: React.FC<FormulaBlockProps> = ({
  math,
  displayMode = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(math, containerRef.current, {
          displayMode,
          throwOnError: false,
        });
      } catch {
        containerRef.current.innerText = math;
      }
    }
  }, [math, displayMode]);

  return <span ref={containerRef} className={`font-mono ${className}`} />;
};
