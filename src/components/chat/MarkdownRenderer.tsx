import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Typography, Link as MuiLink } from '@mui/material'; // Added MuiLink
import type { Components } from 'react-markdown';
import { ActiveAgentConfig } from '@/lib/AI';

interface MarkdownRendererProps {
  content: string;
  agentConfigs?: ActiveAgentConfig[];
  onTagClick?: (tag: string) => void;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, agentConfigs = [], onTagClick }) => {
  const validAliases = useMemo(() => agentConfigs.map(ac => ac.alias.toLowerCase()), [agentConfigs]);

  const renderTextWithClickableTags = (textNode: any) => {
    const text = typeof textNode === 'string' ? textNode : textNode?.props?.children?.toString() || '';
    if (!onTagClick || !text) {
      return textNode;
    }

    const tagRegex = /(@[\w.-]+)/g;
    const parts = text.split(tagRegex).filter((part: string) => part.length > 0);

    return parts.map((part: string, index: number) => {
      if (tagRegex.test(part)) {
        const individualTagRegex = /^(@[\w.-]+)$/g; 
        if (individualTagRegex.test(part)) { 
          const aliasOnly = part.substring(1).toLowerCase();
          if (validAliases.includes(aliasOnly)) {
            return (
              <MuiLink
                key={index}
                component="button" // Render as a button styled like a link
                onClick={() => onTagClick(part)}
                sx={{
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  // Inherit color or set explicitly
                  color: 'secondary.main', // Example
                  padding: 0,
                  border: 'none',
                  background: 'none',
                  font: 'inherit', // Inherit font styles from Typography
                }}
              >
                {part}
              </MuiLink>
            );
          }
        }
        
      }
      return part;
    });
  };
  // Helper to process children, ensuring we handle arrays of nodes and strings correctly
  const processChildrenForTags = (children: React.ReactNode): React.ReactNode => {
    if (Array.isArray(children)) {
      return children.map((child, i) => <React.Fragment key={i}>{processChildrenForTags(child)}</React.Fragment>);
    }
    if (typeof children === 'string') {
      return renderTextWithClickableTags(children);
    }
    // If it's a React element with props.children, recursively process its children if they exist
    if (React.isValidElement(children) && children.props) {
      // Check if the element's props have a 'children' property.
      // This is a common pattern, but not all elements will have it defined this way.
      // We cast to a more generic props type that includes children.
      const propsWithChildren = children.props as React.PropsWithChildren<unknown>;

      if (propsWithChildren.children) {
        // Clone the element, passing existing props and the processed children.
        // We need to ensure the type of 'children' in the new props object is compatible.
        // The 'as any' here is a concession if TypeScript still struggles with the exact type.
        return React.cloneElement(children, { ...children.props, children: processChildrenForTags(propsWithChildren.children) } as any);
      }
    }
    return children; 
  };
  const components: Components = {
    p: ({ node, ...props }) => <Typography paragraph {...props} children={processChildrenForTags(props.children)} />,
    h1: ({ node, ...props }) => <Typography variant="h4" gutterBottom {...props} />,
      h2: ({ node, ...props }) => <Typography variant="h5" gutterBottom {...props} />,
      h3: ({ node, ...props }) => <Typography variant="h6" gutterBottom {...props} />,
      ul: ({ node, ...props }) => <Typography component="ul" sx={{ pl: 4 }} {...props} />,
      ol: ({ node, ...props }) => <Typography component="ol" sx={{ pl: 4 }} {...props} />,
      li: ({ node, ...props }) => <Typography component="li" {...props} children={processChildrenForTags(props.children)} />,
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