'use client';

import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

type MarkdownTextProps = {
  children: string;
  className?: string;
};

export function MarkdownText({ children, className = '' }: MarkdownTextProps) {
  return (
    <div className={`markdown-text text-sm text-gray-400 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          a: props => (
            <a
              {...props}
              className="text-indigo-300 underline underline-offset-2 hover:text-indigo-200"
              target="_blank"
              rel="noreferrer"
            />
          ),
          blockquote: props => (
            <blockquote
              {...props}
              className="border-l-2 border-indigo-400/50 pl-3 italic text-gray-500"
            />
          ),
          code: props => (
            <code
              {...props}
              className="rounded bg-white/10 px-1 py-0.5 text-xs text-indigo-200"
            />
          ),
          h1: props => <h1 {...props} className="mt-2 text-base font-semibold text-white" />,
          h2: props => <h2 {...props} className="mt-2 text-sm font-semibold text-white" />,
          h3: props => <h3 {...props} className="mt-2 text-sm font-semibold text-gray-200" />,
          li: props => <li {...props} className="ml-4 list-outside" />,
          ol: props => <ol {...props} className="my-1 list-decimal space-y-1" />,
          p: props => <p {...props} className="my-1 leading-relaxed" />,
          pre: props => (
            <pre
              {...props}
              className="my-2 overflow-x-auto rounded-lg bg-black/30 p-3 text-xs text-gray-200"
            />
          ),
          table: props => (
            <table
              {...props}
              className="my-2 w-full border-collapse overflow-hidden rounded-lg text-left text-xs"
            />
          ),
          td: props => <td {...props} className="border border-white/10 px-2 py-1" />,
          th: props => <th {...props} className="border border-white/10 px-2 py-1 text-gray-200" />,
          ul: props => <ul {...props} className="my-1 list-disc space-y-1" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
