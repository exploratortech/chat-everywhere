import { SubscriptionPlan as SubscriptionPlanType } from '@/types/user';

import getPlanLevel, { PlanLevel } from './planLevel';

export type PlanString = string | SubscriptionPlanType;

class SubscriptionPlan {
  planLevel: PlanLevel;

  constructor(plan: PlanString) {
    this.planLevel = getPlanLevel(plan);
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
