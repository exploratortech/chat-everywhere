import { SubscriptionPlan } from '@/types/user';

enum PlanLevel {
  Free = 0,
  Basic = 1,
  Pro = 2,
  Edu = 3,
  Ultra = 4,
}

type PlanString = string | SubscriptionPlan;

class UserPlan {
  planLevel: PlanLevel;

  constructor(plan: PlanString) {
    this.planLevel = this.getPlanLevel(plan);
  }

  private getPlanLevel(plan: PlanString): PlanLevel {
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

  canUseProFeatures(): boolean {
    return this.planLevel >= PlanLevel.Pro;
  }

  canUseEduFeatures(): boolean {
    return this.planLevel >= PlanLevel.Edu;
  }

  canUseUltraFeatures(): boolean {
    return this.planLevel >= PlanLevel.Ultra;
  }

  // Add more methods as needed for different features
}

export default UserPlan;
