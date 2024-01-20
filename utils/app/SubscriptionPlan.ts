import { SubscriptionPlan as SubscriptionPlanType } from '@/types/user';

export enum PlanLevel {
  Free = 0,
  Basic = 1,
  Pro = 2,
  Edu = 3,
  Ultra = 4,
}

export type PlanString = string | SubscriptionPlanType;

class SubscriptionPlan {
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
  canUseCloudSync(): boolean {
    return this.planLevel > PlanLevel.Free;
  }
  canUseMQTT(): boolean {
    return this.planLevel > PlanLevel.Free;
  }
  canUseLineConnect(): boolean {
    return this.planLevel > PlanLevel.Free;
  }
  canUseSpeechBtn(): boolean {
    return this.planLevel > PlanLevel.Basic;
  }
  canUseAiImage(): boolean {
    return this.planLevel > PlanLevel.Basic;
  }
  canUseGPT4_Model(): boolean {
    return this.planLevel > PlanLevel.Basic;
  }

  canUseGPT3_5_16KModel(): boolean {
    return this.planLevel > PlanLevel.Basic;
  }
  canUseOnlineMode(): boolean {
    return this.planLevel > PlanLevel.Basic;
  }
}

export default SubscriptionPlan;
