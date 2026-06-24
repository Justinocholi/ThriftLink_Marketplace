import { useAuth } from '../context/AuthContext';

export function useAuthUser() {
  const { user } = useAuth();
  if (!user) throw new Error('useAuthUser called without authenticated user — must be inside ProtectedRoute');
  return user;
}
