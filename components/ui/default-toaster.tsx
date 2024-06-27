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
                <button
                  className="self-start "
                  onClick={() => toast.dismiss(t.id)}
                >
                  <IconX size={18} />
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
