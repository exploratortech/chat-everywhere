import { useContext, useEffect, useRef } from 'react';

import HomeContext from '../home/home.context';

export const useConversation = () => {
  const {
    state: {
      selectedConversation,
      outputLanguage,
      messageIsStreaming,
      isConversationModeActive,
    },
  } = useContext(HomeContext);

  const pointer = useRef<number>(0);
  const segmenter = useRef<Intl.Segmenter>();

  useEffect(() => {
    segmenter.current = new Intl.Segmenter(outputLanguage || 'en', {
      granularity: 'sentence',
    });
  }, [outputLanguage]);

  useEffect(() => {
    if (!isConversationModeActive) return;
    if (!selectedConversation || !selectedConversation.messages.length) return;
    if (!segmenter.current) return;

    // Retrieve the portion of the content that hasn't been processed.
    const { content } =
      selectedConversation.messages[selectedConversation.messages.length - 1];
    const subContent = content.substring(pointer.current);

    if (!messageIsStreaming) {
      // Message is done streaming. Queue the remaining content and reset pointer.
      if (pointer.current > 0) {
        // queueSpeech(subContent, 'conversation');
        pointer.current = 0;
      }
      return;
    }

    // Ensure that we have at least 1 complete sentence to process.
    const sentences = Array.from(segmenter.current.segment(subContent));

    if (sentences.length >= 2) {
      let text = '';

      for (let i = 0; i < sentences.length - 1; i++) {
        const { segment } = sentences[i];
        text += segment;
      }

      pointer.current += text.length;
      // queueSpeech(text, 'conversation');
    }
  }, [messageIsStreaming, isConversationModeActive, selectedConversation]);
};
