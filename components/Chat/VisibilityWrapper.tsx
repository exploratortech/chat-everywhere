import { ReactElement, useState } from 'react';
import { InView } from 'react-intersection-observer';

interface Props {
  children: (inView: boolean) => ReactElement;
}

const VisibilityWrapper = ({ children }: Props) => {
  const [inView, setInView] = useState(false);
  return (
    <InView as="div" onChange={(inView, entry) => setInView(inView)}>
      {children(inView)}
    </InView>
  );
};

export default VisibilityWrapper;
