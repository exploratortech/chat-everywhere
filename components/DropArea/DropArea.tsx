interface Props {
  index: number;
  onDrop: (e: any, index: number) => void;
}

const DropArea = ({ index, onDrop }: Props) => {
  const handleDrop = (e: any) => {
    onDrop(e, index);
    removeHighlight(e);
  };

  const onDragEnter = (e: any) => {
    if (e.dataTransfer && e.dataTransfer.getData('folder')) {
      e.target.parentNode.style.background = '#343541';
    }
  };

  const handleDragLeave = (e: any) => {
    removeHighlight(e);
  };

  const allowDrop = (e: any) => {
    e.preventDefault(); // Ensures drop event occurs
  };

  const removeHighlight = (e: any) => {
    e.target.parentNode.style.background = 'none';
  }

  return (
    <div
      className="relative pt-1 rounded-lg"
    >
      <div
        className="absolute top-0 left-0 right-0 py-4 -translate-y-1/2 z-50"
        onDrop={handleDrop}
        onDragEnter={onDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={allowDrop}
      />
    </div>
  );
};

export default DropArea;
