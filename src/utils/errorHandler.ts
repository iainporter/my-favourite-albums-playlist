export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export const handleApiError = (error: any) => {
  // Check if it's an authentication error
  if (error.status === 401 || error.message?.includes('auth')) {
    // For auth errors, we don't log the full error to prevent sensitive data exposure
    console.log('Authentication error occurred');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/api/auth/login';
    }
    throw new AuthError('Authentication required');
  }
  
  // For other errors, we can log them but should still be careful about exposure
  console.error('API Error:', error.message);
  throw error;
};