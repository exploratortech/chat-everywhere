import React, { useContext } from 'react';

import HomeContext from '@/components/home/home.context';

export default function UserAccountBadge() {
  const {
    state: { user },
  } = useContext(HomeContext);
  if (user) {
    if (user.plan === 'ultra') {
      return (
        <span className="text-clip-transparent bg-gradient-ultra text-xs font-medium py-0.5 rounded mr-0 animate-background-gradient-slide bg-500%"
          data-cy="user-account-badge"
        >
          Ultra
        </span>
      );
    }

    if (user.plan === 'pro') {
      return (
        <span className="text-clip-transparent bg-gradient-pro text-xs font-medium py-0.5 rounded mr-0 animate-background-gradient-slide bg-500%"
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
