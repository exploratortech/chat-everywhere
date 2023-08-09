import React, { useEffect, useState } from 'react';

type AnimatedSlideProps = {
  direction: 'left' | 'right';
  children: React.ReactNode;
};

const AnimatedSlide: React.FC<AnimatedSlideProps> = ({
  direction,
  children,
}) => {
  const [animationClass, setAnimationClass] = useState('');
  const [previousChildren, setPreviousChildren] =
    useState<React.ReactNode>(children);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (mounted) {
      if (direction === 'left') {
        setAnimationClass('slide-out-right');
        setTimeout(() => {
          setPreviousChildren(children);
          setAnimationClass('slide-in-left');
        }, 500);
      } else if (direction === 'right') {
        setAnimationClass('slide-out-left');
        setTimeout(() => {
          setPreviousChildren(children);
          setAnimationClass('slide-in-right');
        }, 500);
      }
    } else {
      setMounted(true);
    }
  }, [direction, children, mounted]);

  return (
    <div className={`${animationClass}`}>
      <style jsx>{`
        .slide-in-right {
          animation: slide-in-right 0.5s forwards;
        }

        .slide-out-left {
          animation: slide-out-left 0.5s forwards;
        }

        .slide-in-left {
          animation: slide-in-left 0.5s forwards;
        }

        .slide-out-right {
          animation: slide-out-right 0.5s forwards;
        }

        @keyframes slide-in-right {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slide-out-left {
          0% {
            transform: translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateX(-100%);
            opacity: 0;
          }
        }

        @keyframes slide-in-left {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slide-out-right {
          0% {
            transform: translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
      {previousChildren}
    </div>
  );
};

export default AnimatedSlide;
