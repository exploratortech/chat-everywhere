import { Dispatch, createContext } from 'react';

import { portalState } from './teacher-portal.state';

export interface ShowingChangeAction {
  field: 'showing';
  value: typeof portalState.showing;
}
interface PortalState {
  state: typeof portalState;
  dispatch: Dispatch<ShowingChangeAction>;
}
export const TeacherPortalContext = createContext<PortalState>(undefined!);
