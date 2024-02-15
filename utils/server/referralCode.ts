import dayjs from 'dayjs';
import voucher_codes from 'voucher-code-generator';

export type CodeGenerationPayloadType = {
  code: string;
  expiresAt: string;
};

export const generateOneCodeAndExpirationDate = (
  durationSeconds: number = 86400, // 1 day
): CodeGenerationPayloadType => {
  const expirationInSeconds = durationSeconds;

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
