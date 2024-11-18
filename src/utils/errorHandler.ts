export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export const handleApiError = (error: any) => {
  console.error('API Error:', error);
  
  // Check if it's an authentication error
  if (error.status === 401 || error.message?.includes('auth')) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/api/auth/login';
    }
    throw new AuthError('Authentication failed');
  }
  
  throw error;
};