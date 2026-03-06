export const isPreviewModeEnabled = () => {
    if (typeof window === 'undefined') {
        return false;
    }

    if (!import.meta.env.DEV) {
        return false;
    }

    const previewParam = new URLSearchParams(window.location.search).get('preview');
    if (previewParam === '1') {
        window.sessionStorage.setItem('mi-prometida-preview', '1');
    } else if (previewParam === '0') {
        window.sessionStorage.removeItem('mi-prometida-preview');
    }

    return window.sessionStorage.getItem('mi-prometida-preview') === '1';
};
