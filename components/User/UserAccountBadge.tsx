import React, { useContext } from 'react';

import HomeContext from '@/pages/api/home/home.context';

export default function UserAccountBadge() {
  const {
    state: { user },
  } = useContext(HomeContext);
  if (user) {
    if (user.plan === 'pro') {
      return (
        <span className="bg-indigo-100 text-indigo-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-indigo-400 border border-indigo-400">
          Pro
        </span>
      );
    } else if (user.plan === 'edu') {
      return (
        <span className="text-xs font-medium mr-2 px-2.5 py-0.5 rounded bg-gray-700 text-green-400 border border-green-400">
          Edu
        </span>
      );
    } else {
      return (
        <span className="bg-gray-100 text-gray-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-400 border border-gray-500">
          Free
        </span>
      );
    }
  } else {
    return (
      <span></span>
    );
  }
}
