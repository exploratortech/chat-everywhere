import { Dispatch, createContext } from 'react';
import { LoadingBarRef } from 'react-top-loading-bar';

import { portalState } from './teacher-portal.state';

export interface ShowingChangeAction {
  field: 'showing';
  value: typeof portalState.showing;
}
interface PortalState {
  state: typeof portalState;
  dispatch: Dispatch<ShowingChangeAction>;
  startLoading: () => void;
  completeLoading: () => void;
}
export const TeacherPortalContext = createContext<PortalState>(undefined!);
