import voucher_codes from 'voucher-code-generator';

export function generateRandomReferralCode() {
  return voucher_codes.generate({ length: 8, count: 1 }).pop();
}
