import { useEffect, useState } from "react";

export const useUsername = () => {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("username");
    setUsername(stored);

    const interval = setInterval(() => {
      const current = localStorage.getItem("username");
      if (current !== username) setUsername(current);
    }, 400); // small interval to check for changes in same tab

    return () => clearInterval(interval);
  }, [username]);

  const login = (name: string, userId: string) => {
    localStorage.setItem("username", name);
    localStorage.setItem("userId", userId);
    setUsername(name);
  };

  const logout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    setUsername(null);
    document.cookie = "token=; Max-Age=0; path=/";
  };

  return { username, login, logout };
};
