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

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            {t('Sign out option')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('You can choose to clear your chat history or just sign out.')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-between">
          <AlertDialogCancel className="text-white">
            {t('Cancel')}
          </AlertDialogCancel>
          <div className="flex gap-2 mobile:flex-col">
            <Button
              className="grow"
              variant="destructive"
              onClick={logoutAndClearCallback}
            >
              {t('Clear Browser Chat History and Sign out')}
            </Button>
            <Button className="grow" onClick={logoutCallback}>
              {t('Sign out')}
            </Button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
