import toast from 'react-hot-toast';
import CustomToast from '@/components/common/CustomToast';

const TOAST_DURATION_MS = 4000;

// react-hot-toast's own default `removeDelay` is 1000ms — it marks a toast
// dismissed (visible: false, triggering CustomToast's exit animation) at
// `duration`, then waits this long before actually removing it from the DOM.
// Left at the default, that's an extra second sitting there after the exit
// transition (and the countdown bar) has already finished. 200ms is just
// enough for the exit animation itself (see CustomToast.jsx's duration-200).
const TOAST_REMOVE_DELAY_MS = 200;

export const showToast = {
  success: (title, description) => {
    toast.custom((t) => (
      <CustomToast t={t} title={title} description={description} type="success" duration={TOAST_DURATION_MS} />
    ), {
      duration: TOAST_DURATION_MS,
      removeDelay: TOAST_REMOVE_DELAY_MS,
      position: 'bottom-right',
    });
  },
  error: (title, description) => {
    toast.custom((t) => (
      <CustomToast t={t} title={title} description={description} type="error" duration={TOAST_DURATION_MS} />
    ), {
      duration: TOAST_DURATION_MS,
      removeDelay: TOAST_REMOVE_DELAY_MS,
      position: 'bottom-right',
    });
  },
  info: (title, description) => {
    toast.custom((t) => (
      <CustomToast t={t} title={title} description={description} type="info" duration={TOAST_DURATION_MS} />
    ), {
      duration: TOAST_DURATION_MS,
      removeDelay: TOAST_REMOVE_DELAY_MS,
      position: 'bottom-right',
    });
  },
  warning: (title, description) => {
    toast.custom((t) => (
      <CustomToast t={t} title={title} description={description} type="warning" duration={TOAST_DURATION_MS} />
    ), {
      duration: TOAST_DURATION_MS,
      removeDelay: TOAST_REMOVE_DELAY_MS,
      position: 'bottom-right',
    });
  },
};

export default showToast;
