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
          className="mr-0 rounded bg-gray-700 bg-gradient-to-r from-[#fd68a6] to-[#6c62f7] py-0.5 text-xs font-medium text-indigo-400"
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
          className="mr-2 rounded border border-indigo-400 bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:bg-gray-700 dark:text-indigo-400"
          data-cy="user-account-badge"
        >
          Pro
        </span>
      );
    }

    if (user.plan === 'edu') {
      return (
        <span
          className="mr-2 rounded border border-green-400 bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-green-400"
          data-cy="user-account-badge"
        >
          Edu
        </span>
      );
    }

    return (
      <span
        className="mr-2 rounded border border-gray-500 bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-400"
        data-cy="user-account-badge"
      >
        Free
      </span>
    );
  } else {
    return <span></span>;
  }
}
