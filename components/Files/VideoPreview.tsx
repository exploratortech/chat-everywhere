import { useState } from 'react';

const VideoPreview = ({ objectPath }: { objectPath: string }) => {
  const [error, setError] = useState<string | null>(null);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="video-preview">
      {objectPath && (
        <video
          controls
          width="100%"
          height="auto"
          onError={() => setError('Failed to load video')}
        >
          <source src={objectPath} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
};

export default VideoPreview;
