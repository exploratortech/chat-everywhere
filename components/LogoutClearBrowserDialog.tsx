import { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

import Spinner from './Spinner';
import HomeContext from './home/home.context';

export function LogoutClearBrowserDialog({
  logoutCallback,
  logoutAndClearCallback,
  open,
  setOpen,
}: {
  logoutCallback: () => void;
  logoutAndClearCallback: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const { t } = useTranslation('model');
  const {
    state: { isRequestingLogout },
    dispatch: homeDispatch,
  } = useContext(HomeContext);
  const hasRequestedLogout = useMemo(
    () => isRequestingLogout !== null,
    [isRequestingLogout],
  );

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-max">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            {t('Sign out option')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('You can choose to clear your chat history or just sign out.')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-between">
          <AlertDialogCancel
            className="text-white"
            disabled={hasRequestedLogout}
          >
            {t('Cancel')}
          </AlertDialogCancel>
          <div className="flex gap-2 mobile:flex-col">
            <Button
              className="grow"
              variant="destructive"
              onClick={logoutAndClearCallback}
              disabled={hasRequestedLogout}
              data-cy="sign-out-and-clear-button"
            >
              <div className="flex items-center gap-2">
                {hasRequestedLogout && <Spinner />}
                {t('Clear Browser Chat History and Sign out')}
              </div>
            </Button>
            <Button
              className="grow"
              onClick={logoutCallback}
              disabled={hasRequestedLogout}
              data-cy="sign-out-button"
            >
              <div className="flex items-center gap-2">
                {hasRequestedLogout && <Spinner />}
                {t('Sign out')}
              </div>
            </Button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
