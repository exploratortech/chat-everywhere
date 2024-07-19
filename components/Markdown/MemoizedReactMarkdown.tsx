import type { FC } from 'react';
import { memo } from 'react';
import type { Options } from 'react-markdown';
import ReactMarkdown from 'react-markdown';

export const MemoizedReactMarkdown: FC<Options> = memo(ReactMarkdown);
