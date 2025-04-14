"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@cma/types/clientTypes";
import api from "../../libs/axios";

const SearchInput = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const currentUsername = typeof window !== "undefined" ? localStorage.getItem("username") : null;

  useEffect(() => {
    const controller = new AbortController();
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      try {
        const res = await api.get(`/search/user?username=${query}`, { signal: controller.signal });

        //filter out
        let users: User[] = res.data.users;
        users = users.filter((u) => u.username !== currentUsername);

        setResults(users || []);
      } catch (err) {
        console.error("Search error:", err);
      }
    };

    const timeout = setTimeout(fetchResults, 300);
    return () => {
      clearTimeout(timeout);
      controller.abort(); // cancel if the query updates again quickly
    };
  }, [query, currentUsername]);

  const handleSelect = (userId: string) => {
    setQuery("");
    setResults([]);
    router.push(`/chat/inbox/${userId}`);
  };

  return (
    <div className="relative w-full max-w-md">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 150)}
        placeholder="Search by username..."
        className="w-full p-2 rounded-md bg-gray-700 text-white focus:outline-none"
      />
      {isFocused && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-md rounded mt-1 z-50">
          {results.length > 0 ? (
            results.map((user) => (
              <div
                key={user.id}
                onClick={() => handleSelect(user.id)}
                className="px-4 py-2 cursor-pointer hover:bg-gray-200 text-black"
              >
                {user.username}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-gray-600">No one found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchInput;
