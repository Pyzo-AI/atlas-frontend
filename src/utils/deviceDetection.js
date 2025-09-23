export const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;

    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    );
};

export const isIOS = () => {
    if (typeof window === 'undefined') return false;

    return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isAndroid = () => {
    if (typeof window === 'undefined') return false;

    return /Android/i.test(navigator.userAgent);
};

export const isSafari = () => {
    if (typeof window === 'undefined') return false;

    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

export const isChrome = () => {
    if (typeof window === 'undefined') return false;

    return /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
};

export const canUseFullscreen = () => {
    if (typeof document === 'undefined') return false;

    return !!(
        document.fullscreenEnabled ||
        document.webkitFullscreenEnabled ||
        document.mozFullScreenEnabled ||
        document.msFullscreenEnabled
    );
};