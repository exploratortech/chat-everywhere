import { memo, useMemo } from 'react';

import { Message } from '@/types/chat';
import { PluginID } from '@/types/plugin';

import AiPainter from '../components/AiPainter';
import AiPainterResult from '../components/AiPainterResult';
import ContinueChat from '../components/ContinueChat';
import { ImageGenerationComponent } from '../components/ImageGenerationComponent';
import MjImageComponentV2 from '../components/MjImageComponentV2';
import { CodeBlock } from '@/components/Markdown/CodeBlock';
import { MemoizedReactMarkdown } from '@/components/Markdown/MemoizedReactMarkdown';

import rehypeRaw from 'rehype-raw';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

const AssistantRespondMessage = memo(
  ({
    formattedMessage,
    messagePluginId,
    messageIndex,
    onContinue,
  }: {
    formattedMessage: string;
    messagePluginId: Message['pluginId'];
    messageIndex: number;
    onContinue: (lastWords: string) => void;
  }) => {
    const ImgComponent = useMemo(() => {
      const Component = ({
        src,
        title,
        alt,
        node,
      }: React.DetailedHTMLProps<
        React.ImgHTMLAttributes<HTMLImageElement> & { node?: any },
        HTMLImageElement
      >) => {
        const isValidUrl = (url: string) => {
          try {
            new URL(url);
            return true;
          } catch (e) {
            return false;
          }
        };

        if (!src) return <></>;
        if (!isValidUrl(src)) return <b>{`{InValid IMAGE URL}`}</b>;

        // NORMAL IMAGE
        if (
          messagePluginId !== PluginID.IMAGE_GEN &&
          messagePluginId !== PluginID.aiPainter
        ) {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              id={node?.properties?.id}
              src={src}
              alt=""
              className="w-full"
            />
          );
        }

        // AI PAINTER IMAGE (DALL-E) [Backward compatibility]
        if (messagePluginId === PluginID.aiPainter) {
          const imageAlt = node?.properties?.alt;

          return (
            // eslint-disable-next-line @next/next/no-img-element
            <AiPainter src={src} alt={imageAlt} />
          );
        }

        // MJ IMAGE
        const aiImageButtons =
          node?.properties?.dataAiImageButtons &&
          (node?.properties?.dataAiImageButtons).split(',');
        const aiImagePrompt =
          node?.properties?.dataAiImagePrompt &&
          (node?.properties?.dataAiImagePrompt).split(',');
        const aiImageButtonMessageId =
          node?.properties?.dataAiImageButtonMessageId;
        if (aiImageButtons) {
          return (
            <MjImageComponentV2
              src={src}
              buttons={aiImageButtons}
              buttonMessageId={aiImageButtonMessageId}
              prompt={aiImagePrompt}
            />
          );
        }

        return (
          <ImageGenerationComponent
            src={src}
            title={title}
            messageIndex={messageIndex}
            generationPrompt={alt || ''}
          />
        );
      };
      Component.displayName = 'ImgComponent';
      return Component;
    }, [messagePluginId, messageIndex]);

    const CodeComponent = useMemo(() => {
      const Component: React.FC<any> = ({
        node,
        inline,
        className,
        children,
        ...props
      }) => {
        const match = /language-(\w+)/.exec(className || '');
        return !inline ? (
          <CodeBlock
            key={messageIndex}
            language={(match && match[1]) || ''}
            value={String(children).replace(/\n$/, '')}
            {...props}
          />
        ) : (
          <code className={className} {...props} key={messageIndex}>
            {children}
          </code>
        );
      };
      Component.displayName = 'CodeComponent';
      return Component;
    }, [messageIndex]);

    return (
      <MemoizedReactMarkdown
        className="prose dark:prose-invert min-w-full"
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw]}
        components={{
          div: ({ node, children, ...props }) => {
            if (node?.properties?.id === 'chat-continue-button') {
              const lastWords =
                (node?.properties?.['dataLastWords'] as string) || '';
              return (
                <ContinueChat lastWords={lastWords} onContinue={onContinue} />
              );
            }
            if (node?.properties?.id === 'ai-painter-generated-image') {
              const imageTags = node?.children;
              if (!imageTags) return <>{children}</>;
              const result = imageTags
                .map((imageTag: any) => ({
                  url: imageTag.properties?.src,
                  prompt: imageTag.properties?.alt,
                  filename: imageTag.properties?.dataFilename,
                }))
                .filter((image: any) => image.url && image.prompt);

              return <AiPainterResult results={result} />;
            }
            return <div {...props}>{children}</div>;
          },
          a({ node, children, href, ...props }) {
            return (
              <a
                href={href}
                target={href && href[0] === '#' ? '_self' : '_blank'}
                rel="noreferrer noopener"
                {...props}
              >
                {children}
              </a>
            );
          },
          code: CodeComponent,
          table({ children }) {
            return (
              <table className="border-collapse border border-black px-3 py-1 dark:border-white">
                {children}
              </table>
            );
          },
          th({ children }) {
            return (
              <th className="break-words border border-black bg-gray-500 px-3 py-1 text-white dark:border-white">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="break-words border border-black px-3 py-1 dark:border-white">
                {children}
              </td>
            );
          },
          img: ImgComponent,
        }}
      >
        {formattedMessage}
      </MemoizedReactMarkdown>
    );
  },
  (prevProps, nextProps) =>
    prevProps.formattedMessage === nextProps.formattedMessage &&
    prevProps.messagePluginId === nextProps.messagePluginId &&
    prevProps.messageIndex === nextProps.messageIndex,
);
AssistantRespondMessage.displayName = 'AssistantRespondMessage';
export default AssistantRespondMessage;
