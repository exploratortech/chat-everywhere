export interface TempAccountProfiles {
  id: number;
  created_at: string;
  uniqueId: string;
}
export type OneTimeCodePayload = {
  code: string;
  expiresAt: string;
  tempAccountProfiles: TempAccountProfiles[];
};
