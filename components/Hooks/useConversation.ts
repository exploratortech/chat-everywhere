import { useContext, useEffect, useRef } from 'react';

import { useCognitiveService } from '../CognitiveService/CognitiveServiceProvider';
import HomeContext from '../home/home.context';

export const useConversation = () => {
  const {
    state: { selectedConversation, outputLanguage, messageIsStreaming },
  } = useContext(HomeContext);

  const { isConversing, currentSpeaker, queueMessage } = useCognitiveService();

  const pointer = useRef<number>(0);
  const segmenter = useRef<Intl.Segmenter>();

  useEffect(() => {
    segmenter.current = new Intl.Segmenter(outputLanguage || 'en', {
      granularity: 'sentence',
    });
  }, [outputLanguage]);

  useEffect(() => {
    if (currentSpeaker === 'model') pointer.current = 0;
  }, [currentSpeaker]);

  useEffect(() => {
    if (!isConversing) return;
    if (!selectedConversation || !selectedConversation.messages.length) return;
    if (!segmenter.current) return;

    const message =
      selectedConversation.messages[selectedConversation.messages.length - 1];
    if (message.role !== 'assistant') return;

    // Retrieve the portion of the content that hasn't been processed.
    const { content } = message;
    const subContent = content.substring(pointer.current);

    // This line prevents queuing the remaining content more than once.
    if (pointer.current >= content.length) return;

    const sentences = Array.from(segmenter.current.segment(subContent));

    if (!messageIsStreaming) {
      // Message is done streaming; queue the remaining content.
      pointer.current += subContent.length;
      queueMessage(subContent);
    } else {
      // Ensure that we have at least 1 complete sentence to process.
      if (sentences.length >= 2) {
        let message = '';

        for (let i = 0; i < sentences.length - 1; i++) {
          const { segment } = sentences[i];
          message += segment;
        }

        pointer.current += message.length;
        queueMessage(message);
      }
    }
  }, [messageIsStreaming, selectedConversation, isConversing, queueMessage]);
};
