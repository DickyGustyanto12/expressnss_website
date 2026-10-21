"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NotificationProvider } from "./components/NotificationContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sudahLogin, setSudahLogin] = useState(false);
  const [adminId, setAdminId] = useState<number>(1);

  useEffect(() => {
    const statusLogin = localStorage.getItem("isLoggedIn");
    const storedUser = localStorage.getItem("user");

    if (!statusLogin) {
      router.push("/internal");
    } else {
      setSudahLogin(true);
      try {
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        if (parsedUser?.id) {
          setAdminId(Number(parsedUser.id));
        }
      } catch {
        // abaikan data user yang rusak, tetap pakai default
      }
    }
  }, [router]);

  if (!sudahLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-600 font-medium">
        Memeriksa autentikasi...
      </div>
    );
  }

  return (
    <NotificationProvider adminId={adminId}>{children}</NotificationProvider>
  );
}
