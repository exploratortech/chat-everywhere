import { PlanString } from './SubscriptionPlan';

export enum PlanLevel {
  Free = 0,
  Basic = 1,
  Pro = 2,
  Edu = 3,
  Ultra = 4,
}

function getPlanLevel(plan: PlanString): PlanLevel {
  switch (plan) {
    case 'free':
      return PlanLevel.Free;
    case 'basic':
      return PlanLevel.Basic;
    case 'pro':
      return PlanLevel.Pro;
    case 'edu':
      return PlanLevel.Edu;
    case 'ultra':
      return PlanLevel.Ultra;
    default:
      return PlanLevel.Free; // Default to Free if plan is unrecognized
  }
}

export default getPlanLevel;
