import { ExportFormatV4 } from './export';
import { PluginID } from './plugin';

export interface User extends UserProfile {
  email: string;
  token: string;
}

export type SubscriptionPlan = 'free' | 'pro' | 'edu';

export interface UserConversation {
  id: string;
  uid: string;
  conversations: ExportFormatV4;
}

export interface UserProfile {
  id: string;
  plan: SubscriptionPlan;
  referralCode: string | undefined;
  referralCodeExpirationDate: string | undefined;
  proPlanExpirationDate: string | undefined;
  hasReferee: boolean;
  hasReferrer: boolean;
}

export interface CreditUsage {
  [PluginID.GPT4]: {
    remainingCredits: number;
  };
  [PluginID.IMAGE_GEN]: {
    remainingCredits: number;
  };
}
