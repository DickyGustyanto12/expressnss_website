import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Send,
  Paperclip,
  Smile,
  CheckCheck,
  CheckCircle2,
  Phone,
  Calendar,
  History,
  ListOrdered,
  Play,
} from "lucide-react";

interface Pesan {
  id: number;
  pengirim: string;
  email: string;
  noHp: string;
  avatar: string;
  tanggal: string;
  waktu: string;
  statusChat: "antrian" | "selesai";
  statusBaca: "Baru" | "Dibaca";
  sudahDimulai: boolean;
  riwayatChat: {
    penulis: "pelanggan" | "admin";
    teks: string;
    waktu: string;
  }[];
}

const PesanMasuk = () => {
  const [daftarPesan, setDaftarPesan] = useState<Pesan[]>([
    {
      id: 1,
      pengirim: "Budi Santoso",
      email: "budi.s@gmail.com",
      noHp: "+62 812-3456-7890",
      avatar: "BS",
      tanggal: "23 Sep 2026",
      waktu: "10:45 AM",
      statusChat: "antrian",
      statusBaca: "Baru",
      sudahDimulai: false,
      riwayatChat: [
        {
          penulis: "pelanggan",
          teks: "Halo admin, saya mau tanya jadwal pengiriman kargo ke Semarang apakah ada kendala minggu ini?",
          waktu: "10:40 AM",
        },
        {
          penulis: "pelanggan",
          teks: "Baik, kalau estimasi sampainya berapa hari ya?",
          waktu: "10:45 AM",
        },
      ],
    },
    {
      id: 2,
      pengirim: "Siti Rahma",
      email: "siti.rahma@yahoo.com",
      noHp: "+62 857-9876-5432",
      avatar: "SR",
      tanggal: "23 Sep 2026",
      waktu: "09:20 AM",
      statusChat: "antrian",
      statusBaca: "Dibaca",
      sudahDimulai: false,
      riwayatChat: [
        {
          penulis: "pelanggan",
          teks: "Halo Kak, mau konfirmasi nomor resi pengiriman reguler #NSS-9921 atas nama paket saya.",
          waktu: "09:15 AM",
        },
        {
          penulis: "admin",
          teks: "Halo Kak Siti, setelah saya cek di sistem, paket sudah berada di kota tujuan dan dalam proses kurir pengantaran ya.",
          waktu: "09:20 AM",
        },
      ],
    },
    {
      id: 3,
      pengirim: "Ahmad Fauzi",
      email: "fauzi.logistik@gmail.com",
      noHp: "+62 813-1122-3344",
      avatar: "AF",
      tanggal: "22 Sep 2026",
      waktu: "02:10 PM",
      statusChat: "selesai",
      statusBaca: "Dibaca",
      sudahDimulai: true,
      riwayatChat: [
        {
          penulis: "pelanggan",
          teks: "Selamat siang, apakah bisa pickup barang di rumah untuk kapasitas besar?",
          waktu: "14:00 PM",
        },
        {
          penulis: "admin",
          teks: "Siang Pak Ahmad, tentu bisa. Silakan informasikan alamat lengkapnya.",
          waktu: "14:05 PM",
        },
      ],
    },
  ]);

  const [tabAktif, setTabAktif] = useState<"antrian" | "riwayat">("antrian");
  const [kontakAktifId, setKontakAktifId] = useState<number>(1);
  const [inputPesan, setInputPesan] = useState<string>("");
  const [pencarian, setPencarian] = useState<string>("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  const pesanTersaringTab = daftarPesan.filter(
    (item) => item.statusChat === tabAktif,
  );

  const kontakTersaring = pesanTersaringTab.filter(
    (item) =>
      item.pengirim.toLowerCase().includes(pencarian.toLowerCase()) ||
      item.email.toLowerCase().includes(pencarian.toLowerCase()) ||
      item.noHp.includes(pencarian),
  );

  const kontakAktifList = kontakTersaring.filter((item) => item.sudahDimulai);
  const kontakAntrianList = kontakTersaring.filter(
    (item) => !item.sudahDimulai,
  );

  const kontakAktif =
    daftarPesan.find(
      (item) => item.id === kontakAktifId && item.statusChat === tabAktif,
    ) ||
    kontakTersaring[0] ||
    null;

  useEffect(() => {
    if (kontakAktif) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [kontakAktif?.riwayatChat, kontakAktifId]);

  const handleMulaiChat = (id: number) => {
    setDaftarPesan((prevDaftar) => {
      const itemDitemukan = prevDaftar.find((item) => item.id === id);
      if (!itemDitemukan) return prevDaftar;

      const itemDiperbarui = {
        ...itemDitemukan,
        sudahDimulai: true,
        statusBaca: "Dibaca" as const,
      };

      const sisaItem = prevDaftar.filter((item) => item.id !== id);
      return [itemDiperbarui, ...sisaItem];
    });
    setKontakAktifId(id);
  };

  const handleKirimPesan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPesan.trim() || !kontakAktif || !kontakAktif.sudahDimulai) return;

    const waktuSekarang = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const daftarBaru = daftarPesan.map((item) => {
      if (item.id === kontakAktif.id) {
        return {
          ...item,
          statusBaca: "Dibaca" as const,
          riwayatChat: [
            ...item.riwayatChat,
            {
              penulis: "admin" as const,
              teks: inputPesan,
              waktu: waktuSekarang,
            },
          ],
        };
      }
      return item;
    });

    setDaftarPesan(daftarBaru);
    setInputPesan("");
  };

  const handleTandaiSelesai = (id: number) => {
    const daftarBaru = daftarPesan.map((item) => {
      if (item.id === id) {
        return { ...item, statusChat: "selesai" as const };
      }
      return item;
    });
    setDaftarPesan(daftarBaru);
    const sisaAntrian = daftarBaru.filter(
      (item) => item.statusChat === "antrian",
    );
    if (sisaAntrian.length > 0) {
      setKontakAktifId(sisaAntrian[0].id);
    }
  };

  return (
    <div className="space-y-2 h-full flex flex-col">
      <div className="bg-white px-5 py-3 rounded-sm shadow-sm border border-gray-200 border-t-4 border-t-[#FFCC00] shrink-0">
        <h2 className="text-xl font-extrabold text-gray-900 mb-1">
          Manajemen Pesan Masuk
        </h2>
        <p className="text-sm text-gray-500">
          Kelola antrian pesan dan riwayat percakapan pelanggan NSS Express.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex-1 min-h-0 flex">
        <div className="w-full md:w-5/12 lg:w-4/12 border-r border-gray-200 flex flex-col bg-white h-full overflow-hidden">
          <div className="grid grid-cols-2 bg-gray-100 p-1.5 border-b border-gray-200 gap-1 shrink-0">
            <button
              onClick={() => {
                setTabAktif("antrian");
                const first = daftarPesan.find(
                  (i) => i.statusChat === "antrian",
                );
                if (first) setKontakAktifId(first.id);
              }}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-extrabold rounded-md transition-all cursor-pointer ${
                tabAktif === "antrian"
                  ? "bg-white text-gray-950 shadow-xs border border-gray-200"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <ListOrdered size={16} />
              <span>
                Antrian (
                {daftarPesan.filter((i) => i.statusChat === "antrian").length})
              </span>
            </button>

            <button
              onClick={() => {
                setTabAktif("riwayat");
                const first = daftarPesan.find(
                  (i) => i.statusChat === "selesai",
                );
                if (first) setKontakAktifId(first.id);
              }}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-extrabold rounded-md transition-all cursor-pointer ${
                tabAktif === "riwayat"
                  ? "bg-white text-gray-950 shadow-xs border border-gray-200"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <History size={16} />
              <span>
                Riwayat (
                {daftarPesan.filter((i) => i.statusChat === "selesai").length})
              </span>
            </button>
          </div>

          <div className="p-2.5 bg-white border-b border-gray-100 shrink-0">
            <div className="flex items-center bg-gray-100 rounded-md px-3 py-2 border border-gray-200 focus-within:border-yellow-400 focus-within:bg-white transition-all">
              <Search size={16} className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Cari nama, email, atau no HP..."
                value={pencarian}
                onChange={(e) => setPencarian(e.target.value)}
                className="w-full bg-transparent text-xs focus:outline-none text-gray-800"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 min-h-0">
            {kontakTersaring.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-xs">
                Tidak ada data pada tab {tabAktif}.
              </div>
            ) : (
              <>
                {/* Section Sedang Ditangani (Sekarang ada nomor urutnya) */}
                {tabAktif === "antrian" && kontakAktifList.length > 0 && (
                  <div>
                    <div className="bg-gray-100 px-3 py-1.5 text-[11px] font-extrabold text-gray-700 uppercase tracking-wider border-y border-gray-200">
                      Sedang Ditangani ({kontakAktifList.length})
                    </div>
                    {kontakAktifList.map((kontak, index) => {
                      const pesanTerakhir =
                        kontak.riwayatChat[kontak.riwayatChat.length - 1];
                      const isAktif = kontak.id === kontakAktifId;

                      return (
                        <div
                          key={kontak.id}
                          onClick={() => setKontakAktifId(kontak.id)}
                          className={`flex items-start gap-3 p-3 cursor-pointer transition-colors ${
                            isAktif
                              ? "bg-yellow-50/80 border-l-4 border-l-[#FFCC00]"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gray-900 text-[#FFCC00] font-extrabold flex items-center justify-center text-xs shrink-0 shadow-xs">
                              {kontak.avatar}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                              <h4 className="font-bold text-gray-900 text-sm truncate">
                                {kontak.pengirim}
                              </h4>
                              <span className="text-xs text-gray-500 shrink-0">
                                {kontak.waktu}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 truncate mb-1">
                              {pesanTerakhir &&
                              pesanTerakhir.penulis === "admin"
                                ? "Anda: "
                                : ""}
                              {pesanTerakhir
                                ? pesanTerakhir.teks
                                : "Belum ada pesan"}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-sm">
                                Urutan #{index + 1}
                              </span>
                              <span className="bg-blue-100 text-blue-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                                Aktif
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Section Antrian */}
                {tabAktif === "antrian" && kontakAntrianList.length > 0 && (
                  <div>
                    <div className="bg-gray-100 px-3 py-1.5 text-[11px] font-extrabold text-gray-700 uppercase tracking-wider border-y border-gray-200">
                      Antrian ({kontakAntrianList.length})
                    </div>
                    {kontakAntrianList.map((kontak, index) => {
                      const pesanTerakhir =
                        kontak.riwayatChat[kontak.riwayatChat.length - 1];
                      const isAktif = kontak.id === kontakAktifId;

                      return (
                        <div
                          key={kontak.id}
                          onClick={() => setKontakAktifId(kontak.id)}
                          className={`flex items-start gap-3 p-3 cursor-pointer transition-colors ${
                            isAktif
                              ? "bg-yellow-50/80 border-l-4 border-l-[#FFCC00]"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gray-900 text-[#FFCC00] font-extrabold flex items-center justify-center text-xs shrink-0 shadow-xs">
                              {kontak.avatar}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                              <h4 className="font-bold text-gray-900 text-sm truncate">
                                {kontak.pengirim}
                              </h4>
                              <span className="text-xs text-gray-500 shrink-0">
                                {kontak.waktu}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 truncate mb-1">
                              {pesanTerakhir &&
                              pesanTerakhir.penulis === "admin"
                                ? "Anda: "
                                : ""}
                              {pesanTerakhir
                                ? pesanTerakhir.teks
                                : "Belum ada pesan"}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-sm">
                                Antrian #{index + 1}
                              </span>
                              <span className="bg-[#FFCC00] text-gray-950 font-black text-xs px-2 py-0.5 rounded-full">
                                Baru
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Tab Riwayat */}
                {tabAktif === "riwayat" &&
                  kontakTersaring.map((kontak) => {
                    const pesanTerakhir =
                      kontak.riwayatChat[kontak.riwayatChat.length - 1];
                    const isAktif = kontak.id === kontakAktifId;

                    return (
                      <div
                        key={kontak.id}
                        onClick={() => setKontakAktifId(kontak.id)}
                        className={`flex items-start gap-3 p-3 cursor-pointer transition-colors ${
                          isAktif
                            ? "bg-yellow-50/80 border-l-4 border-l-[#FFCC00]"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gray-900 text-[#FFCC00] font-extrabold flex items-center justify-center text-xs shrink-0 shadow-xs">
                            {kontak.avatar}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                            <h4 className="font-bold text-gray-900 text-sm truncate">
                              {kontak.pengirim}
                            </h4>
                            <span className="text-xs text-gray-500 shrink-0">
                              {kontak.waktu}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 truncate mb-1">
                            {pesanTerakhir
                              ? pesanTerakhir.teks
                              : "Belum ada pesan"}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="bg-green-100 text-green-800 font-bold text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 size={12} /> Selesai
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </>
            )}
          </div>
        </div>

        <div className="hidden md:flex flex-1 flex-col bg-[#f8f9fa] h-full overflow-hidden">
          {kontakAktif ? (
            <>
              <div className="px-5 py-3 bg-white border-b border-gray-200 flex items-center justify-between shadow-xs z-10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-900 text-[#FFCC00] font-bold flex items-center justify-center text-sm">
                    {kontakAktif.avatar}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-sm">
                      {kontakAktif.pengirim}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Phone size={13} /> {kontakAktif.noHp}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={13} /> {kontakAktif.tanggal} (
                        {kontakAktif.waktu})
                      </span>
                    </div>
                  </div>
                </div>

                {tabAktif === "antrian" && kontakAktif.sudahDimulai && (
                  <button
                    onClick={() => handleTandaiSelesai(kontakAktif.id)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-md text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 size={16} />
                    <span>Tandai Selesai</span>
                  </button>
                )}

                {tabAktif === "riwayat" && (
                  <span className="bg-gray-100 text-gray-700 font-bold px-3.5 py-1.5 rounded-md text-xs flex items-center gap-1 border border-gray-200">
                    <CheckCircle2 size={14} className="text-green-600" />{" "}
                    Selesai Ditangani
                  </span>
                )}
              </div>

              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-gradient-to-b from-gray-50 to-gray-100/50 min-h-0">
                {kontakAktif.riwayatChat.map((chat, index) => {
                  const dariAdmin = chat.penulis === "admin";

                  return (
                    <div
                      key={index}
                      className={`flex flex-col ${dariAdmin ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[75%] md:max-w-[65%] rounded-lg px-4 py-3 shadow-xs text-sm relative break-words whitespace-pre-wrap ${
                          dariAdmin
                            ? "bg-[#FFCC00] text-gray-950 rounded-tr-none font-medium"
                            : "bg-white text-gray-900 rounded-tl-none border border-gray-200 font-medium"
                        }`}
                      >
                        <p className="leading-relaxed">{chat.teks}</p>
                        <div
                          className={`flex items-center justify-end gap-1 mt-1 text-xs ${dariAdmin ? "text-gray-800 font-semibold" : "text-gray-400"}`}
                        >
                          <span>{chat.waktu}</span>
                          {dariAdmin && (
                            <CheckCheck size={14} className="text-gray-950" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              <div className="shrink-0">
                {tabAktif === "antrian" ? (
                  <div>
                    {!kontakAktif.sudahDimulai ? (
                      <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between">
                        <p className="text-xs text-gray-500 font-medium">
                          Tekan tombol Mulai untuk mulai menangani dan membalas
                          chat ini.
                        </p>
                        <button
                          onClick={() => handleMulaiChat(kontakAktif.id)}
                          className="bg-[#FFCC00] hover:bg-yellow-400 text-gray-950 font-extrabold px-5 py-2.5 rounded-md text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer hover:scale-105"
                        >
                          <Play size={16} fill="currentColor" />
                          <span>Mulai Chat</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-white border-t border-gray-200">
                        <form
                          onSubmit={handleKirimPesan}
                          className="flex items-center gap-3"
                        >
                          <button
                            type="button"
                            className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                            title="Kirim Emoji"
                          >
                            <Smile size={20} />
                          </button>
                          <button
                            type="button"
                            className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                            title="Lampirkan Berkas"
                          >
                            <Paperclip size={20} />
                          </button>

                          <input
                            type="text"
                            placeholder="Ketik balasan pesan..."
                            value={inputPesan}
                            onChange={(e) => setInputPesan(e.target.value)}
                            className="flex-1 bg-gray-100 border border-gray-300 focus:border-yellow-400 focus:bg-white rounded-md px-4 py-3 text-sm focus:outline-none transition-all"
                          />

                          <button
                            type="submit"
                            className="bg-gray-950 hover:bg-gray-900 text-[#FFCC00] font-bold px-5 py-3 rounded-md flex items-center gap-2 transition-colors shadow-sm cursor-pointer text-xs"
                          >
                            <Send size={16} />
                            <span className="hidden lg:inline">Kirim</span>
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border-t border-gray-200 text-center text-xs text-gray-500 font-medium">
                    Percakapan ini telah selesai. Kotak balasan ditutup.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Pilih salah satu kontak untuk melihat detail pesan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PesanMasuk;
