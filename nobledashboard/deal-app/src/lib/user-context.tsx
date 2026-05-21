'use client';

import { createContext, useContext } from 'react';

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: 'sales' | 'manager';
};

const UserContext = createContext<CurrentUser | null>(null);

export function useCurrentUser() {
  const user = useContext(UserContext);
  if (!user) {
    throw new Error('useCurrentUser must be used within UserProvider');
  }
  return user;
}

export function UserProvider({
  children,
  currentUser,
}: {
  children: React.ReactNode;
  currentUser: CurrentUser;
}) {
  return <UserContext.Provider value={currentUser}>{children}</UserContext.Provider>;
}
