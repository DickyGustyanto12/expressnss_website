"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sudahLogin, setSudahLogin] = useState(false);

  useEffect(() => {
    const statusLogin = localStorage.getItem("isLoggedIn");
    if (!statusLogin) {
      router.push("/internal");
    } else {
      setSudahLogin(true);
    }
  }, [router]);

  if (!sudahLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-600 font-medium">
        Memeriksa autentikasi...
      </div>
    );
  }

  return <>{children}</>;
}
