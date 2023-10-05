import dayjs from 'dayjs';
import voucher_codes from 'voucher-code-generator';

export type CodeGenerationPayloadType = {
  code: string;
  expiresAt: string;
};

export const generateReferralCodeAndExpirationDate =
  (): CodeGenerationPayloadType => {
    const expirationDateCount = parseInt(
      process.env.NEXT_PUBLIC_REFERRAL_TRIAL_DAYS || '3',
    );
    const newReferralCode = voucher_codes
      .generate({ length: 8, count: 1 })
      .pop()
      ?.toUpperCase();

    if (!newReferralCode) throw new Error('Failed to generate referral code');

    return {
      code: newReferralCode,
      expiresAt: dayjs().add(expirationDateCount, 'day').toISOString(),
    };
  };
