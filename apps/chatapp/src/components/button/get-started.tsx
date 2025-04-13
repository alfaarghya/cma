"use client";

import { useRouter } from "next/navigation";


const GetStartedButton = () => {
  const router = useRouter();
  const username = typeof window !== "undefined" ? localStorage.getItem("username") || "" : "";

  return (
    <button
      onClick={() => username === "" ? router.push("/signin") : router.push("/chat")}
      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg shadow-md transition duration-300"
    >
      Get Started
    </button>
  );
}

export default GetStartedButton;