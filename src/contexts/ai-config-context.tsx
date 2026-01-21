'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { AIProvider } from '@/ai/client-dispatcher';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

interface AIConfig {
    provider: AIProvider;
    apiKey: string;
    pollinationsApiKey: string;
    temperature: number;
    topP: number;
    pollinationsModel?: string;
}

interface AIConfigContextType {
    config: AIConfig;
    updateConfig: (updates: Partial<AIConfig>) => void;
    resetConfig: () => void;
}

const DEFAULT_CONFIG: AIConfig = {
    provider: 'pollinations',
    apiKey: '',
    pollinationsApiKey: '',
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

    // Track if we're currently syncing from Firestore to prevent loops
    const isSyncingFromFirestore = React.useRef(false);
    const lastStoredConfigRef = React.useRef<string>('');
    const configRef = React.useRef<AIConfig>(DEFAULT_CONFIG);

    // Keep configRef in sync with config state
    React.useEffect(() => {
        configRef.current = config;
    }, [config]);

    // Sync state with local storage on mount and when storage changes
    useEffect(() => {
        // Only sync from localStorage if the change didn't come from Firestore
        if (!isSyncingFromFirestore.current && storedConfig) {
            const storedConfigStr = JSON.stringify(storedConfig);
            if (storedConfigStr !== lastStoredConfigRef.current) {
                lastStoredConfigRef.current = storedConfigStr;
                setConfig(storedConfig);
            }
        }
        // Reset the flag after processing
        isSyncingFromFirestore.current = false;
    }, [storedConfig]);

    // Sync with Firestore on user login - REAL-TIME LISTENER
    useEffect(() => {
        if (!user || !firestore) return;

        console.log('🔄 Setting up AI config listener for user:', user.uid);

        // Set up real-time listener for apiSettings
        const userRef = doc(firestore, 'users', user.uid);
        const unsubscribe = onSnapshot(userRef, (snap) => {
            if (snap.exists() && snap.data().apiSettings) {
                const settings = snap.data().apiSettings;
                const remoteConfig: Partial<AIConfig> = {};

                if (settings.provider) remoteConfig.provider = settings.provider;
                if (settings.apiKey) remoteConfig.apiKey = settings.apiKey;
                if (settings.pollinationsApiKey) remoteConfig.pollinationsApiKey = settings.pollinationsApiKey;
                if (settings.pollinationsModel) remoteConfig.pollinationsModel = settings.pollinationsModel;

                if (Object.keys(remoteConfig).length > 0) {
                    // Use configRef to get the latest config value
                    const newC = { ...configRef.current, ...remoteConfig };
                    const newConfigStr = JSON.stringify(newC);

                    // Only update if the config actually changed
                    if (newConfigStr !== lastStoredConfigRef.current) {
                        lastStoredConfigRef.current = newConfigStr;
                        isSyncingFromFirestore.current = true;
                        setConfig(newC);
                        setStoredConfig(newC); // Update local storage too
                        console.log('✅ AI Config synced from Firestore:', newC.provider);
                    }
                }
            }
            setHydrated(true);
        }, (error) => {
            console.error("Failed to sync AI config from Firestore", error);
            setHydrated(true);
        });

        return () => {
            console.log('🔄 Cleaning up AI config listener');
            unsubscribe();
        };
    }, [user, firestore, setStoredConfig]);

    const updateConfig = useCallback((updates: Partial<AIConfig>) => {
        setConfig(current => {
            const newConfig = { ...current, ...updates };
            setStoredConfig(newConfig);
            return newConfig;
        });
    }, [setStoredConfig]);

    const resetConfig = useCallback(() => {
        setConfig(DEFAULT_CONFIG);
        setStoredConfig(DEFAULT_CONFIG);
    }, [setStoredConfig]);

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
