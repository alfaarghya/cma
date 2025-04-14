import { ReactNode } from "react";
import Sidebar from "../../components/Sidebar";

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full h-screen">
      <Sidebar />
      <main className="flex-1 bg-white overflow-y-auto">{children}</main>
    </div>
  );
}
