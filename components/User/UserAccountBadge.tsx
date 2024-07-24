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
          className="text-clip-transparent mr-0 animate-background-gradient-slide rounded bg-gradient-ultra bg-500% py-0.5 text-xs font-medium"
          data-cy="user-account-badge"
        >
          Ultra
        </span>
      );
    }

    if (user.plan === 'pro') {
      return (
        <span
          className="text-clip-transparent mr-0 animate-background-gradient-slide rounded bg-gradient-pro bg-500% py-0.5 text-xs font-medium"
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
