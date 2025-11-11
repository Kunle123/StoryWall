"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class EditorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Editor Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

function ErrorFallback({ error }: { error: Error | null }) {
  const router = useRouter();

  const handleReload = () => {
    // Clear localStorage to reset state
    try {
      localStorage.removeItem('timeline-editor-state');
    } catch {
      // Ignore errors
    }
    window.location.reload();
  };

  const handleGoHome = () => {
    try {
      localStorage.removeItem('timeline-editor-state');
    } catch {
      // Ignore errors
    }
    router.push('/discover');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="rounded-full bg-red-100 p-3">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">
              We encountered an error while loading the timeline editor. This might be due to corrupted saved data or a temporary issue.
            </p>
          </div>

          {error && process.env.NODE_ENV === 'development' && (
            <div className="w-full bg-gray-100 rounded p-3 text-left">
              <p className="text-xs font-mono text-gray-700 break-all">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              onClick={handleReload}
              className="flex-1"
              variant="default"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Page
            </Button>
            <Button
              onClick={handleGoHome}
              className="flex-1"
              variant="outline"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            If this problem persists, please try clearing your browser's cache or contact support.
          </p>
        </div>
      </Card>
    </div>
  );
}

