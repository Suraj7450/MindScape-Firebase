/**
 * Error boundary to catch and log serialization errors
 */
'use client';

import React from 'react';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class SerializationErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        console.error('🔴 Serialization Error Caught:', error);
        console.error('🔴 Error Stack:', error.stack);
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('🔴 Component Stack:', errorInfo.componentStack);

        // Check if it's a Firestore Timestamp error
        if (error.message.includes('toJSON') || error.message.includes('plain objects')) {
            console.error('🔴 This is a Firestore Timestamp serialization error!');
            console.error('🔴 Check for Timestamp objects being passed to server actions or router state');
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 bg-red-950/20 border border-red-500 rounded-lg">
                    <h2 className="text-xl font-bold text-red-400 mb-4">Serialization Error Detected</h2>
                    <p className="text-red-300 mb-4">
                        A Firestore Timestamp object is being passed where it shouldn't be.
                    </p>
                    <details className="text-sm text-red-200">
                        <summary className="cursor-pointer font-semibold mb-2">Error Details</summary>
                        <pre className="bg-black/50 p-4 rounded overflow-auto">
                            {this.state.error?.message}
                            {'\n\n'}
                            {this.state.error?.stack}
                        </pre>
                    </details>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
