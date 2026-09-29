"use client";

import dynamic from "next/dynamic";

const CabangComponent = dynamic(() => import("@/components/ui/Cabang"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center text-gray-600 font-medium">
      Memuat peta cabang...
    </div>
  ),
});

export default function PageCabang() {
  return <CabangComponent />;
}
