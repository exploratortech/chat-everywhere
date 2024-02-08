import dayjs from 'dayjs';
import voucher_codes from 'voucher-code-generator';

export type CodeGenerationPayloadType = {
  code: string;
  expiresAt: string;
};

export const generateOneCodeAndExpirationDate =
  (): CodeGenerationPayloadType => {
    const expirationInSeconds = parseInt(
      process.env.NEXT_PUBLIC_TEAMS_ONE_TIME_CODE_EXPIRY || '3600',
    );
    const newOneTimeCode = voucher_codes
      .generate({ length: 6, count: 1, charset: '0123456789' })
      .pop();

    if (!newOneTimeCode) throw new Error('Failed to generate referral code');

    return {
      code: newOneTimeCode,
      expiresAt: dayjs().add(expirationInSeconds, 'seconds').toISOString(),
    };
  };

export const generateReferralCodeAndExpirationDate =
  (): CodeGenerationPayloadType => {
    const expirationDateCount = parseInt(
      process.env.NEXT_PUBLIC_REFERRAL_TRIAL_DAYS || '3',
    );
    const newReferralCode = voucher_codes
      .generate({ length: 8, count: 1 })
      .pop();

    if (!newReferralCode) throw new Error('Failed to generate referral code');

    return {
      code: newReferralCode,
      expiresAt: dayjs().add(expirationDateCount, 'day').toISOString(),
    };
  };
