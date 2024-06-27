import { IconX } from '@tabler/icons-react';
import toast, { ToastBar, Toaster } from 'react-hot-toast';

const DefaultToaster = () => {
  return (
    <Toaster>
      {(t) => (
        <ToastBar toast={t}>
          {({ icon, message }) => (
            <>
              {icon}
              {message}
              {t.className?.includes('toast-with-close-button') && (
                <button onClick={() => toast.dismiss(t.id)}>
                  <IconX />
                </button>
              )}
            </>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
};
export default DefaultToaster;
