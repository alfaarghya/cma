import Link from "next/link";
import "remixicon/fonts/remixicon.css";

const Title = () => {
  return (
    <Link href="/" className="text-2xl font-bold">
      <i className="ri-chat-1-fill"></i> Chat App
    </Link>
  );
};

export default Title;
