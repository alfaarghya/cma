const Footer = () => {
  return (
    <footer className="w-full bg-gray-900 text-white p-6 text-center shadow-inner">
      <p>&copy; 2024 ChatApp. All rights reserved.</p>
      <div className="flex justify-center gap-6 mt-3">
        <a href="#" className="hover:text-blue-400 transition duration-300">GitHub</a>
        <a href="#" className="hover:text-blue-400 transition duration-300">LinkedIn</a>
        <a href="#" className="hover:text-blue-400 transition duration-300">Instagram</a>
      </div>
    </footer>
  );
}

export default Footer;