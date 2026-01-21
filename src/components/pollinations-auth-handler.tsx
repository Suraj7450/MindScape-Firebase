'use client';

import { useEffect } from 'react';
import { useAIConfig } from '@/contexts/ai-config-context';
import { useToast } from '@/hooks/use-toast';

/**
 * PollinationsAuthHandler component
 * Listen for Pollinations BYOP redirect with api_key in the hash
 */
export function PollinationsAuthHandler() {
    const { updateConfig } = useAIConfig();
    const { toast } = useToast();

    useEffect(() => {
        const handleHash = () => {
            const hash = window.location.hash.slice(1);
            if (!hash) return;

            const params = new URLSearchParams(hash);
            const apiKey = params.get('api_key');

            if (apiKey) {
                console.log('🌸 Pollinations API Key detected in hash');

                // Update the config
                updateConfig({ pollinationsApiKey: apiKey });

                // Clear the hash from the URL without refresh
                window.history.replaceState(null, '', window.location.pathname + window.location.search);

                // Show success toast
                toast({
                    title: 'Pollinations Connected! 🌸',
                    description: 'Your personal API key has been integrated and saved.',
                });
            }
        };

        // Check on mount
        handleHash();

        // Also listen for hash changes (just in case)
        window.addEventListener('hashchange', handleHash);
        return () => window.removeEventListener('hashchange', handleHash);
    }, [updateConfig, toast]);

    return null;
}
