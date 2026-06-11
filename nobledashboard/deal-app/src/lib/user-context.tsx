'use client';

import { createContext, useContext } from 'react';

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: 'sales' | 'manager';
};

const UserContext = createContext<CurrentUser | null>(null);

type UserProviderProps = {
  currentUser: CurrentUser;
  children: React.ReactNode;
};

export function UserProvider({ currentUser, children }: UserProviderProps) {
  return <UserContext.Provider value={currentUser}>{children}</UserContext.Provider>;
}

export function useCurrentUser() {
  const currentUser = useContext(UserContext);
  if (!currentUser) {
    throw new Error('useCurrentUser must be used within a UserProvider');
  }
  return currentUser;
}
