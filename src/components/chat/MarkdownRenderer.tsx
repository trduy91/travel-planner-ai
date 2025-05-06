import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Typography } from '@mui/material';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    const components: Components = {
        p: ({ node, ...props }) => <Typography paragraph {...props} />,
        h1: ({ node, ...props }) => <Typography variant="h4" gutterBottom {...props} />,
        h2: ({ node, ...props }) => <Typography variant="h5" gutterBottom {...props} />,
        h3: ({ node, ...props }) => <Typography variant="h6" gutterBottom {...props} />,
        ul: ({ node, ...props }) => <Typography component="ul" sx={{ pl: 4 }} {...props} />,
        ol: ({ node, ...props }) => <Typography component="ol" sx={{ pl: 4 }} {...props} />,
        li: ({ node, ...props }) => <Typography component="li" {...props} />,
        // code({ node, className, children, ...props }) {
        //   const isInline = !className;
        //   if (!isInline) {
        //     return (
        //       <pre 
        //         style={{ 
        //           backgroundColor: '#f6f8fa', // A light background for the code block
        //           padding: '16px', 
        //           borderRadius: '6px', 
        //           overflowX: 'auto', // Handle long lines
        //           fontSize: '0.9em',
        //         }}
        //       >
        //         <code className={className} {...props}>
        //           {String(children).replace(/\n$/, '')}
        //         </code>
        //       </pre>
        //     );
        //   }
        //   // For inline code
        //   return (
        //     <code className={className} style={{ backgroundColor: 'rgba(27,31,35,.05)', padding: '0.2em 0.4em', margin: 0, fontSize: '85%', borderRadius: '3px', fontFamily: 'monospace' }} {...props}>
        //       {children}
        //     </code>
        //   );
        // },
    };
    return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={components}
        >
          {content}
        </ReactMarkdown>
      );
};

export default MarkdownRenderer;