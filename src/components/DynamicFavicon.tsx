'use client';

import { useEffect, useState } from 'react';

export default function DynamicFavicon() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        updateFavicon();
    }, []);

    const updateFavicon = async () => {
        try {
            const res = await fetch('/api/settings', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;

                if (data.logoType === 'image' && data.appLogo && data.appLogo.startsWith('data:')) {
                    // Use uploaded image as favicon
                    if (favicon) {
                        favicon.href = data.appLogo;
                    } else {
                        const link = document.createElement('link');
                        link.rel = 'icon';
                        link.href = data.appLogo;
                        document.head.appendChild(link);
                    }
                } else if (data.appLogo) {
                    // Create emoji favicon
                    const emoji = data.appLogo;
                    const canvas = document.createElement('canvas');
                    canvas.width = 64;
                    canvas.height = 64;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.font = '56px serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(emoji, 32, 36);
                        const dataUrl = canvas.toDataURL('image/png');

                        if (favicon) {
                            favicon.href = dataUrl;
                        } else {
                            const link = document.createElement('link');
                            link.rel = 'icon';
                            link.href = dataUrl;
                            document.head.appendChild(link);
                        }
                    }
                }

                // Also update page title
                if (data.appName) {
                    document.title = data.appName;
                }
            }
        } catch (error) {
            console.error('Failed to update favicon:', error);
        }
    };

    // Listen for settings changes
    useEffect(() => {
        const handleSettingsChange = () => {
            updateFavicon();
        };

        window.addEventListener('appSettingsChanged', handleSettingsChange);
        return () => window.removeEventListener('appSettingsChanged', handleSettingsChange);
    }, []);

    return null;
}
