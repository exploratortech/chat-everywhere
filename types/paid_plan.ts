export enum PaidPlan {
  ProMonthly = 'pro-monthly',
  ProOneTime = 'pro-one-time',
  ProYearly = 'pro-yearly',
  UltraMonthly = 'ultra-monthly',
  UltraOneTime = 'ultra-one-time',
  UltraYearly = 'ultra-yearly',
}

export enum TopUpRequest {
  ImageCredit = 'image-credit',
  GPT4Credit = 'gpt4-credit',
}
export type SubscriptionPlan = 'free' | 'pro' | 'ultra' | 'edu';
