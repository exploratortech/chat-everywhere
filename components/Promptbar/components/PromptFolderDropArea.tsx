interface Props {
  index: number;
  handleDrop: (e: any, index: number) => void;
}

const PromptFolderDropArea = ({ index, handleDrop }: Props) => {
  const highlightDropArea = (e: any) => {
    if (e.dataTransfer && e.dataTransfer.getData('folder')) {
      e.target.parentNode.style.background = '#343541';
    }
  };

  const removeHighlight = (e: any) => {
    e.target.parentNode.style.background = 'none';
  };

  return (
    <div
      className="relative pt-1 rounded-lg"
    >
      <div
        className="absolute top-0 left-0 right-0 py-4 -translate-y-1/2 z-50"
        onDrop={(e) => handleDrop(e, index)}
        onDragEnter={highlightDropArea}
        onDragLeave={removeHighlight}
      />
    </div>
  );
};

export default PromptFolderDropArea;
