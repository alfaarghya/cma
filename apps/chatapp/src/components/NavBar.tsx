import Title from "./button/title";
import LoginLogoutButton from "./button/login-logout";

const Navbar = () => {

  return (
    <nav className="bg-gray-800 text-white p-5 flex justify-between items-center shadow-lg fixed w-full top-0 z-50">
      <Title />
      <LoginLogoutButton />
    </nav>
  );
};

export default Navbar;
