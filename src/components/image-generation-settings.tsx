'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { ModelSelector } from '@/components/model-selector';
import { saveUserApiKey, getUserImageSettings, deleteUserApiKey } from '@/lib/firestore-helpers';
import { Eye, EyeOff, ExternalLink, Trash2, Save, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ImageGenerationSettings() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [apiKey, setApiKey] = useState('');
    const [preferredModel, setPreferredModel] = useState('klein-large');
    const [showApiKey, setShowApiKey] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasExistingKey, setHasExistingKey] = useState(false);

    // Load existing settings
    useEffect(() => {
        if (!user || !firestore) return;

        const loadSettings = async () => {
            setIsLoading(true);
            try {
                const settings = await getUserImageSettings(firestore, user.uid);
                if (settings) {
                    if (settings.pollinationsApiKey) {
                        setApiKey(settings.pollinationsApiKey);
                        setHasExistingKey(true);
                    }
                    if (settings.preferredModel) {
                        setPreferredModel(settings.preferredModel);
                    }
                }
            } catch (error) {
                console.error('Error loading settings:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadSettings();
    }, [user, firestore]);

    const handleSave = async () => {
        if (!user || !firestore) {
            toast({
                variant: 'destructive',
                title: 'Not Authenticated',
                description: 'Please sign in to save your settings.'
            });
            return;
        }

        if (!apiKey.trim()) {
            toast({
                variant: 'destructive',
                title: 'API Key Required',
                description: 'Please enter your Pollinations API key.'
            });
            return;
        }

        setIsSaving(true);
        try {
            await saveUserApiKey(firestore, user.uid, apiKey.trim(), preferredModel);
            setHasExistingKey(true);
            toast({
                title: 'Settings Saved!',
                description: 'Your image generation settings have been updated.'
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Save Failed',
                description: error.message || 'Failed to save settings. Please try again.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!user || !firestore) return;

        setIsSaving(true);
        try {
            await deleteUserApiKey(firestore, user.uid);
            setApiKey('');
            setHasExistingKey(false);
            toast({
                title: 'API Key Removed',
                description: 'Your API key has been deleted. The app will use the server key.'
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Delete Failed',
                description: error.message || 'Failed to delete API key.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>🎨 Image Generation API</CardTitle>
                    <CardDescription>
                        Sign in to manage your Pollinations API key
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <AlertDescription>
                            Please sign in to configure your image generation settings.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>🎨 Image Generation API</CardTitle>
                    <CardDescription>Loading settings...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    🎨 Image Generation API
                    {hasExistingKey && (
                        <Badge variant="secondary">Configured</Badge>
                    )}
                </CardTitle>
                <CardDescription>
                    Manage your Pollinations.ai API key for AI-powered image generation
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Info Alert */}
                <Alert>
                    <AlertDescription>
                        Using your own API key gives you full control over image generation costs and usage.
                        If no key is provided, the app will use the server's API key.
                    </AlertDescription>
                </Alert>

                {/* API Key Input */}
                <div className="space-y-2">
                    <Label htmlFor="apiKey">Pollinations API Key</Label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Input
                                id="apiKey"
                                type={showApiKey ? 'text' : 'password'}
                                placeholder="sk_..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowApiKey(!showApiKey)}
                            >
                                {showApiKey ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                        {hasExistingKey && (
                            <Button
                                variant="destructive"
                                size="icon"
                                onClick={handleDelete}
                                disabled={isSaving}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Get your API key at{' '}
                        <a
                            href="https://enter.pollinations.ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                            enter.pollinations.ai
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    </p>
                </div>

                {/* Model Preference */}
                <div className="space-y-2">
                    <Label htmlFor="model">Preferred Model</Label>
                    <ModelSelector
                        value={preferredModel}
                        onChange={setPreferredModel}
                        className="w-full"
                    />
                    <p className="text-sm text-muted-foreground">
                        This model will be used by default for all image generation
                    </p>
                </div>

                {/* Save Button */}
                <Button
                    onClick={handleSave}
                    disabled={isSaving || !apiKey.trim()}
                    className="w-full"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Settings
                        </>
                    )}
                </Button>

                {/* Model Information */}
                <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Available Models</h4>
                    <div className="grid gap-2 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Flux Schnell</span>
                            <Badge variant="outline">0.0002/img</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">FLUX.2 Klein 4B</span>
                            <Badge variant="outline">0.0067/img</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">FLUX.2 Klein 9B</span>
                            <Badge variant="outline">0.0118/img</Badge>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
