import { useEffect, useState } from 'react';

import { useRouter } from 'next/router';

const useUrlState = <T extends string>(paramName: string, defaultValue: T) => {
  const router = useRouter();
  const [state, setState] = useState<T>(() => {
    // Get the initial state from URL parameters or use the default value
    const paramValue = router.query[paramName];
    return Array.isArray(paramValue)
      ? (paramValue[0] as T)
      : (paramValue as T) || defaultValue;
  });

  // Sync state with URL parameters
  useEffect(() => {
    const urlParam = router.query[paramName];
    const paramValue = Array.isArray(urlParam) ? urlParam[0] : urlParam;
    if (paramValue !== state) {
      setState((paramValue as T) || defaultValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query]);

  // Sync URL parameters with state
  useEffect(() => {
    const currentParamValue = router.query[paramName];
    const shouldUpdateUrl =
      currentParamValue !== state && (state || defaultValue);

    if (shouldUpdateUrl) {
      const newQuery = { ...router.query, [paramName]: state };
      router.replace(
        {
          pathname: router.pathname,
          query: newQuery,
          hash: '#',
        },
        undefined,
        { shallow: true },
      ); // shallow routing, to avoid re-fetching data not related to the query change
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return [state, setState] as const;
};

export default useUrlState;
