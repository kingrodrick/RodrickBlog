import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { checkCredentials, clearSession, loadSession, saveSession } from './authService';

type Status = 'loading' | 'signedOut' | 'signedIn';

type AuthValue = {
  status: Status;
  username: string | null;
  signIn: (username: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [username, setUsername] = useState<string | null>(null);

  // Mở app: đọc Keychain để tự đăng nhập lại.
  useEffect(() => {
    loadSession()
      .then(saved => {
        setUsername(saved);
        setStatus(saved ? 'signedIn' : 'signedOut');
      })
      .catch(() => setStatus('signedOut'));
  }, []);

  const signIn = useCallback(async (user: string, pass: string) => {
    if (!checkCredentials(user, pass)) {
      return false;
    }
    await saveSession(user.trim()); // ghi nhớ đăng nhập
    setUsername(user.trim());
    setStatus('signedIn');
    return true;
  }, []);

  const signOut = useCallback(async () => {
    await clearSession();
    setUsername(null);
    setStatus('signedOut');
  }, []);

  const value = useMemo(
    () => ({ status, username, signIn, signOut }),
    [status, username, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth phải nằm trong AuthProvider');
  }
  return ctx;
}