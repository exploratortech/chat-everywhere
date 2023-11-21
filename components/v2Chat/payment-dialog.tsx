import { useSupabaseClient } from '@supabase/auth-helpers-react';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/v2Chat/ui/alert';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/v2Chat/ui/alert-dialog';
import { Button } from '@/components/v2Chat/ui/button';

export const PaymentDialog = () => {
  const supabase = useSupabaseClient();

  return (
    <AlertDialog defaultOpen>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Select your plan</AlertDialogTitle>

          <Alert className="flex flex-row justify-between">
            <div className="flex flex-col justify-center">
              <AlertTitle>Weekly</AlertTitle>
              <AlertDescription>
                Unlimited usage for 7 days. <br />
              </AlertDescription>
            </div>
            <div className="flex flex-col justify-center">
              <Button variant={'destructive'}>TWD$80</Button>
              <p className="text-xs mt-0.5 text-gray-500">*For limited time</p>
            </div>
          </Alert>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
};
