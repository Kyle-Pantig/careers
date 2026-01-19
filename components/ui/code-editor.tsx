'use client';

import CodeEditor from '@uiw/react-textarea-code-editor';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minHeight?: string;
}

export function HtmlCodeEditor({
  value,
  onChange,
  language = 'html',
  placeholder = 'Enter code here...',
  disabled = false,
  className,
  minHeight = '400px',
}: CodeEditorProps) {
  return (
    <div
      className={cn(
        'rounded-md border overflow-hidden',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      data-color-mode="light"
    >
      <CodeEditor
        value={value}
        language={language}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        padding={16}
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          fontSize: 13,
          lineHeight: 1.6,
          minHeight,
          backgroundColor: '#fafafa',
        }}
        className="w-full"
      />
    </div>
  );
}
