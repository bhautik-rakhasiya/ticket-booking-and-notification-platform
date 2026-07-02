import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "../types";

interface UserContextValue {
  selectedUser: User | null;
  setSelectedUser: (user: User | null) => void;
  clearUser: () => void;
}

const UserContext = createContext<UserContextValue>({
  selectedUser: null,
  setSelectedUser: () => {},
  clearUser: () => {},
});

const STORAGE_KEY = "selectedUser";

export function UserProvider({ children }: { children: ReactNode }) {
  const [selectedUser, setSelectedUserState] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setSelectedUser = (user: User | null) => {
    setSelectedUserState(user);
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const clearUser = () => setSelectedUser(null);

  return (
    <UserContext.Provider value={{ selectedUser, setSelectedUser, clearUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

export default UserContext;
