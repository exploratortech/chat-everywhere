import { Adsense } from '@ctrl/react-adsense';
import React from 'react';

const AdMessage = ({ googleAdSenseId }: { googleAdSenseId: string }) => (
  <div
    className={`group px-4 flex justify-center`}
    style={{ overflowWrap: 'anywhere' }}
  >
    <Adsense
      client={googleAdSenseId}
      slot="8465173526"
      style={{ display: 'block' }}
      layout="in-article"
      format="fluid"
    />
  </div>
);

export default AdMessage;
