import { SubscriptionPlan } from '@/types/user';

enum PlanLevel {
  Free = 0,
  Basic = 1,
  Pro = 2,
  Edu = 3,
  Ultra = 4,
}

type PlanString = string | SubscriptionPlan;

class UserPlanFeatures {
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

  isPaidUser(): boolean {
    return this.planLevel > PlanLevel.Free;
  }
  // ----------------- Limits -----------------
  hasChatLimit(): boolean {
    return this.planLevel === PlanLevel.Free;
  }

  // ----------------- Features -----------------
  canUseSpeechBtn(): boolean {
    return this.planLevel > PlanLevel.Basic;
  }

  canUseGPT3_5_16KModel(): boolean {
    return this.planLevel > PlanLevel.Free;
  }
  canUseGPT4_Model(): boolean {
    return this.planLevel > PlanLevel.Free;
  }

  canUseOnlineMode(): boolean {
    return this.planLevel > PlanLevel.Free;
  }
  canUseMQTT(): boolean {
    return this.planLevel > PlanLevel.Free;
  }
  canUseAiImage(): boolean {
    return this.planLevel > PlanLevel.Free;
  }
  canUseCloudSync(): boolean {
    return this.planLevel > PlanLevel.Basic;
  }
}

export default UserPlanFeatures;
