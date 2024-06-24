import React, { useContext } from 'react';

import HomeContext from '@/components/home/home.context';

export default function UserAccountBadge() {
  const {
    state: { user },
  } = useContext(HomeContext);
  if (user) {
    if (user.plan === 'ultra') {
      return (
        <span
          className="bg-gradient-to-r from-[#fd68a6] to-[#6c62f7] text-xs font-medium py-0.5 rounded bg-gray-700 text-indigo-400 mr-0"
          style={{
            color: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextStrokeWidth: '1px',
            WebkitTextStrokeColor: 'transparent',
          }}
          data-cy="user-account-badge"
        >
          Ultra
        </span>
      );
    }

    if (user.plan === 'pro') {
      return (
        <span
          className="bg-indigo-100 text-indigo-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-indigo-400 border border-indigo-400"
          data-cy="user-account-badge"
        >
          Pro
        </span>
      );
    }

    if (user.plan === 'edu') {
      return (
        <span
          className="text-xs font-medium mr-2 px-2.5 py-0.5 rounded bg-gray-700 text-green-400 border border-green-400"
          data-cy="user-account-badge"
        >
          Edu
        </span>
      );
    }

    return (
      <span
        className="bg-gray-100 text-gray-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-400 border border-gray-500"
        data-cy="user-account-badge"
      >
        Free
      </span>
    );
  } else {
    return <span></span>;
  }
}
