"use client";

import { Context, createContext, ReactNode, useEffect, useState } from "react";
import { UsersDataProvider } from "./getData";
import { UserPublic } from "@/types/user";

interface Props {
  initializing: boolean;
  users: UserPublic[];
  getUser: (id: string) => UserPublic | undefined;
  getEmail: (id: string) => string | undefined;
}

const UsersContext: Context<Props> = createContext<Props>({
  initializing: false,
  users: [],
  getUser: () => undefined,
  getEmail: () => undefined
});

interface ProviderProps {
  children: ReactNode;
}

const UsersProvider: React.FC<ProviderProps> = ({ children }) => {
  const [initializing, setInitializing] = useState(true);
  const [users, setUsers] = useState<UserPublic[]>([]);
  const dataProxy = UsersDataProvider.Instance;


  // TODO turbut reiketu padaryti kad uzloadintu tik visus users kurie yra organizacijose kurios priklauso useriui
  useEffect(() => {
    setUsers(dataProxy.data);
    if (dataProxy.data?.length > 0) {
      setInitializing(false);
    }

    dataProxy.GetData().then((d) => {
      setUsers(d);
      setInitializing(false);
    });
  }, [dataProxy]);

  const getUser = (id: string) => {
    return users.find((u) => u.id === id);
  }

  const getEmail = (id: string) => {
    const user = getUser(id);
    return user?.email;
  }

  return (
    <UsersContext.Provider
      value={{
        initializing,
        users,
        getUser,
        getEmail
      }}
    >
      {children}
    </UsersContext.Provider>
  );
};

export default UsersProvider;
export { UsersContext };
