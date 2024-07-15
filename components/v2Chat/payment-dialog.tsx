import { useState } from 'react';
import toast from 'react-hot-toast';

import { trackEvent } from '@/utils/app/eventTracking';

import type { UserProfile } from '@/types/user';

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
import { Input } from '@/components/v2Chat/ui/input';

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
  const [promoCode, setPromoCode] = useState<string>('');
  const [isPromoCodeValid, setIsPromoCodeValid] = useState<boolean | null>(
    null,
  );
  const [isPromoCodeProcessing, setIsPromoCodeProcessing] =
    useState<boolean>(false);

  const isPaidUser = userProfile.plan === 'pro';
  const userEmail = userProfile.email;
  const userId = userProfile.id;

  const upgradeLinkOnClick = () => {
    const paymentLink =
      process.env.NEXT_PUBLIC_ENV === 'production'
        ? 'https://buy.stripe.com/4gw9Ez6U2gt71NudRd'
        : 'https://buy.stripe.com/test_dR68y152Y7aWagUcMU';

    trackEvent('v2 Payment link clicked');

    window.open(
      `${paymentLink}?prefilled_email=${userEmail}&client_reference_id=${userId}`,
      '_blank',
    );
  };

  const promoCodeApplyOnClick = async () => {
    setIsPromoCodeProcessing(true);

    const response = await fetch('/api/referral/redeem-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-id': userId,
      },
      body: JSON.stringify({
        referralCode: promoCode,
      }),
    });

    if (response.status === 200) {
      setIsPromoCodeValid(true);
      setIsPromoCodeProcessing(false);

      setTimeout(() => {
        window.location.reload();
      }, 2000);
      return;
    }

    if (response.status === 400) {
      trackEvent('v2 Referral code redemption failed');
      setIsPromoCodeValid(false);
      setPromoCode('');
      setIsPromoCodeProcessing(false);
      return;
    }

    toast.error('Something went wrong, please try again later.');
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
                Unlimited usage for 7 days <br />
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
                  {userProfile.proPlanExpirationDate && (
                    <p className="mt-0.5 text-xs text-gray-500">
                      *Expires on{' '}
                      {dayjs(userProfile.proPlanExpirationDate).format(
                        'YYYY-MM-DD',
                      )}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <Button variant={'destructive'} onClick={upgradeLinkOnClick}>
                    TWD$80
                  </Button>
                  <p className="mt-0.5 text-xs text-gray-500">
                    *For limited time
                  </p>
                </>
              )}
            </div>
          </Alert>
          {!isPaidUser && (
            <div className="flex flex-col items-center">
              <div className="flex w-full justify-between">
                <Input
                  placeholder="Promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="w-1/2 outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      promoCodeApplyOnClick();
                    }
                  }}
                />
                <Button
                  variant={'outline'}
                  disabled={promoCode === '' || isPromoCodeProcessing}
                  onClick={promoCodeApplyOnClick}
                >
                  <span className="text-xs">
                    {isPromoCodeProcessing ? '...' : 'Apply'}
                  </span>
                </Button>
              </div>
              {isPromoCodeValid !== null && (
                <p
                  className={`mt-2 w-full text-xs ${
                    isPromoCodeValid ? 'text-gray-600' : 'text-red-500'
                  }`}
                >
                  {isPromoCodeValid
                    ? 'Promo code applied, refreshing in 2 seconds ...'
                    : 'Promo code is invalid'}
                </p>
              )}
            </div>
          )}
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
