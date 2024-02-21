import { Dispatch, createContext } from 'react';

import { ActionType } from '@/hooks/useCreateReducer';

import { portalState } from './teacher-portal.state';

interface PortalState {
  state: typeof portalState;
  dispatch: Dispatch<ActionType<typeof portalState>>;
}
export const TeacherPortalContext = createContext<PortalState>(undefined!);
