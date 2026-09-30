"use client";

import Tracking from "@/components/ui/Tracking";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

export default function TrackingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <Navbar />
      <main className="py-16 px-4">
        <Tracking />
      </main>
      <Footer />
    </div>
  );
}
