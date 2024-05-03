import { createContext } from 'react';

interface PortalState {
  startLoading: () => void;
  completeLoading: () => void;
}
export const TeacherPortalContext = createContext<PortalState>(undefined!);
