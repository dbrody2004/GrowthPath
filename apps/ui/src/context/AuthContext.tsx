import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { UserDto } from '@growthpath/shared';
import { setUnauthorizedHandler } from '../lib/api.js';
import {
  clearToken,
  getMeRequest,
  getToken,
  loginRequest,
  logoutRequest,
  setToken,
} from '../lib/auth.js';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: UserDto | null;
  token: string | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [status, setStatus] = useState<AuthStatus>(() => (getToken() ? 'loading' : 'unauthenticated'));
  const sessionGeneration = useRef(0);

  const markUnauthenticated = useCallback(() => {
    sessionGeneration.current += 1;
    clearToken();
    setTokenState(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(markUnauthenticated);
    return () => setUnauthorizedHandler(null);
  }, [markUnauthenticated]);

  useEffect(() => {
    const storedToken = getToken();
    if (!storedToken) {
      setStatus('unauthenticated');
      return;
    }

    let cancelled = false;
    const generation = sessionGeneration.current;

    getMeRequest()
      .then((response) => {
        if (cancelled || generation !== sessionGeneration.current) return;
        setUser(response.user);
        setTokenState(storedToken);
        setStatus('authenticated');
      })
      .catch(() => {
        if (cancelled || generation !== sessionGeneration.current) return;
        markUnauthenticated();
      });

    return () => {
      cancelled = true;
    };
  }, [markUnauthenticated]);

  const login = useCallback(async (email: string, password: string) => {
    sessionGeneration.current += 1;
    const generation = sessionGeneration.current;
    const response = await loginRequest(email, password);
    if (generation !== sessionGeneration.current) return;
    setToken(response.token);
    setTokenState(response.token);
    setUser(response.user);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    try {
      if (getToken()) {
        await logoutRequest();
      }
    } finally {
      markUnauthenticated();
    }
  }, [markUnauthenticated]);

  const value = useMemo(
    () => ({ user, token, status, login, logout }),
    [user, token, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
