import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AuthError } from '../utils/errorHandler';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isAuthError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    isAuthError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true,
      isAuthError: error instanceof AuthError
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // Clear any stored tokens
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      // Redirect to login
      window.location.href = '/api/auth/login';
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">
              {this.state.isAuthError ? 'Authentication Required' : 'Something went wrong'}
            </h2>
            <p className="mb-4">
              {this.state.isAuthError 
                ? 'Your session has expired. Redirecting to login...'
                : 'An unexpected error occurred. Redirecting to login...'}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;