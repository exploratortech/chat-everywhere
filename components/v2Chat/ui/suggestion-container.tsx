import React from 'react';

interface SuggestionContainerProps {
  suggestions: string[];
  isChatResponseLoading: boolean;
  onMessageSent: (message: { role: string; content: string }) => void;
}

export const SuggestionContainer: React.FC<SuggestionContainerProps> = ({
  suggestions,
  isChatResponseLoading,
  onMessageSent,
}) => {
  const suggestionOnClick = (suggestion: string) => {
    onMessageSent({
      role: 'user',
      content: suggestion,
    });
  };

  return (
    <>
      {suggestions.length > 0 && !isChatResponseLoading && (
        <div className="flex flex-wrap items-center justify-center">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="m-2 rounded-md bg-gray-100 px-4 py-2 hover:bg-gray-200"
              onClick={() => suggestionOnClick(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </>
  );
};
