"use client";

import Title from "./button/title";
import LoginLogoutButton from "./button/login-logout";
import SearchInput from "./input/search-input";
import { useUsername } from "../hooks/useUsername";

const Navbar = () => {
  const { username } = useUsername();

  return (
    <nav className="bg-gray-800 text-white p-5 flex justify-between items-center shadow-lg fixed w-full top-0 z-50">
      <Title />
      {username && (
        <div className="flex-1 mx-10">
          <SearchInput />
        </div>
      )}
      <LoginLogoutButton />
    </nav>
  );
};

export default Navbar;
