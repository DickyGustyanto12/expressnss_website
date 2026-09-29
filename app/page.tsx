"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/ui/Navbar";
import Home from "@/components/ui/Home";
import Services from "@/components/ui/Services";
import ContactUs from "@/components/ui/ContactUs";
import AboutUs from "@/components/ui/AboutUs";
import Footer from "@/components/ui/Footer";
import ChatWidget from "@/components/ui/ChatWidget";
import Tracking from "@/components/ui/Tracking";
import CekOngkir from "@/components/ui/CekOngkir";

const Cabang = dynamic(() => import("@/components/ui/Cabang"), {
  ssr: false,
  loading: () => (
    <div className="py-20 text-center text-gray-600 font-medium">
      Memuat peta cabang...
    </div>
  ),
});

export default function HalamanUtama() {
  const [bukaChat, setBukaChat] = useState(false);

  return (
    <div className="bg-gray-50 relative">
      <Navbar />
      <Home onBukaChat={() => setBukaChat(true)} />

      <div className="w-full mx-auto">
        <div className="flex flex-col lg:flex-row justify-center">
          <div className="w-full lg:w-1/2 outline px-10 shadow-2xl rounded-lg">
            <Tracking />
          </div>
          <div className="w-full lg:w-1/2 px-10 bg-black shadow-2xl">
            <CekOngkir />
          </div>
        </div>
      </div>

      <div className="">
        <Services />
      </div>

      <div className="bg-gray-950">
        <AboutUs />
      </div>

      <div className="shadow-2xl">
        <Cabang />
      </div>

      <ContactUs onBukaChat={() => setBukaChat(true)} />
      <Footer />
      <ChatWidget bukaChat={bukaChat} setBukaChat={setBukaChat} />
    </div>
  );
}
