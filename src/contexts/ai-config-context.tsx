'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { AIProvider } from '@/ai/client-dispatcher';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AIConfig {
    provider: AIProvider;
    apiKey: string;
    temperature: number;
    topP: number;
}

interface AIConfigContextType {
    config: AIConfig;
    updateConfig: (updates: Partial<AIConfig>) => void;
    resetConfig: () => void;
}

const DEFAULT_CONFIG: AIConfig = {
    provider: 'pollinations',
    apiKey: '',
    temperature: 0.7,
    topP: 0.9,
};

const AIConfigContext = createContext<AIConfigContextType | undefined>(undefined);

export function AIConfigProvider({ children }: { children: React.ReactNode }) {
    const [storedConfig, setStoredConfig] = useLocalStorage<AIConfig>('mindscape-ai-config', DEFAULT_CONFIG);
    const [config, setConfig] = useState<AIConfig>(DEFAULT_CONFIG);
    const { user } = useUser();
    const firestore = useFirestore();

    const [hydrated, setHydrated] = useState(false);

    // Sync state with local storage on mount and when storage changes
    useEffect(() => {
        if (storedConfig) {
            setConfig(storedConfig);
        }
    }, [storedConfig]);

    // Sync with Firestore on user login
    useEffect(() => {
        const fetchRemoteConfig = async () => {
            if (!user || !firestore || hydrated) return;
            try {
                const snap = await getDoc(doc(firestore, 'users', user.uid));
                if (snap.exists() && snap.data().apiSettings) {
                    const settings = snap.data().apiSettings;
                    // Merge remote settings with default/current
                    // Logic: Remote wins if present.
                    const remoteConfig: Partial<AIConfig> = {};
                    if (settings.provider) remoteConfig.provider = settings.provider;
                    if (settings.apiKey) remoteConfig.apiKey = settings.apiKey;

                    if (Object.keys(remoteConfig).length > 0) {
                        setConfig(prev => {
                            const newC = { ...prev, ...remoteConfig };
                            setStoredConfig(newC); // Update local storage too
                            return newC;
                        });
                    }
                }
            } catch (e) {
                console.error("Failed to sync AI config from Firestore", e);
            } finally {
                setHydrated(true);
            }
        };
        fetchRemoteConfig();
    }, [user, firestore, hydrated, setStoredConfig]);

    const updateConfig = (updates: Partial<AIConfig>) => {
        const newConfig = { ...config, ...updates };
        setConfig(newConfig);
        setStoredConfig(newConfig);
    };

    const resetConfig = () => {
        setConfig(DEFAULT_CONFIG);
        setStoredConfig(DEFAULT_CONFIG);
    };

    return (
        <AIConfigContext.Provider value={{ config, updateConfig, resetConfig }}>
            {children}
        </AIConfigContext.Provider>
    );
}

export function useAIConfig() {
    const context = useContext(AIConfigContext);
    if (context === undefined) {
        throw new Error('useAIConfig must be used within an AIConfigProvider');
    }
    return context;
}
