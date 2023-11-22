import { trackEvent } from '@/utils/app/eventTracking';

import { UserProfile } from '@/types/user';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/v2Chat/ui/alert';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/v2Chat/ui/alert-dialog';
import { Button } from '@/components/v2Chat/ui/button';

import dayjs from 'dayjs';

export const PaymentDialog = ({
  userProfile,
  open,
  onOpenChange,
}: {
  userProfile: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const isPaidUser = userProfile.plan === 'pro';

  const upgradeLinkOnClick = () => {
    const paymentLink =
      process.env.NEXT_PUBLIC_ENV === 'production'
        ? 'https://buy.stripe.com/4gw9Ez6U2gt71NudRd'
        : 'https://buy.stripe.com/test_dR68y152Y7aWagUcMU';
    const userEmail = userProfile.email;
    const userId = userProfile.id;

    trackEvent('v2 Payment link clicked');

    window.open(
      `${paymentLink}?prefilled_email=${userEmail}&client_reference_id=${userId}`,
      '_blank',
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Select your plan</AlertDialogTitle>

          <Alert className="flex flex-row justify-between border-blue-300">
            <div className="flex flex-col justify-center">
              <AlertTitle>Weekly</AlertTitle>
              <AlertDescription>
                Unlimited usage for 7 days. <br />
              </AlertDescription>
            </div>
            <div className="flex flex-col justify-center">
              {isPaidUser ? (
                <>
                  <Button
                    variant={'outline'}
                    onClick={upgradeLinkOnClick}
                    disabled
                  >
                    Current plan
                  </Button>
                  <p className="text-xs mt-0.5 text-gray-500">
                    *Expires on{' '}
                    {dayjs(userProfile.proPlanExpirationDate).format(
                      'YYYY-MM-DD',
                    )}
                  </p>
                </>
              ) : (
                <>
                  <Button variant={'destructive'} onClick={upgradeLinkOnClick}>
                    TWD$80
                  </Button>
                  <p className="text-xs mt-0.5 text-gray-500">
                    *For limited time
                  </p>
                </>
              )}
            </div>
          </Alert>
        </AlertDialogHeader>
        {isPaidUser && (
          <AlertDialogFooter>
            <AlertDialogCancel>Done</AlertDialogCancel>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};
