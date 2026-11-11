"use client";

import {
  Search,
  X,
  Clock,
  User,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Phone,
  Mail,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReCaptcha from "@/components/ui/ReCaptcha";

const Tracking = () => {
  const [kataKunci, setKataKunci] = useState("");

  const [modalBuka, setModalBuka] = useState(false);
  const [hasilTracking, setHasilTracking] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isModalLoading, setIsModalLoading] = useState(false);

  const [showCaptchaModal, setShowCaptchaModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [captchaError, setCaptchaError] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);

  // State untuk animasi tombol salin AWB
  const [isCopied, setIsCopied] = useState(false);

  const handleSalinAwb = (awbText: string) => {
    navigator.clipboard.writeText(awbText);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const handleCari = (e: React.FormEvent) => {
    e.preventDefault();
    const keyword = kataKunci.trim();

    setHasilTracking(null);
    setErrorMsg("");

    if (!keyword) {
      setErrorMsg("Masukkan nomor resi terlebih dahulu.");
      setModalBuka(true);
      setIsModalLoading(false);
      return;
    }

    setCaptchaError("");
    setIsVerifying(false);
    setShowCaptchaModal(true);
  };

  const handleCaptchaVerified = async (token: string | null) => {
    if (!token) {
      setCaptchaError("Verifikasi kedaluwarsa. Silakan centang ulang.");
      return;
    }
    if (isVerifying) return;

    setIsVerifying(true);
    setCaptchaError("");

    try {
      const response = await fetch("/api/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: kataKunci.trim(),
          recaptchaToken: token,
        }),
      });

      if (response.status === 403) {
        throw new Error("Verifikasi reCAPTCHA gagal. Silakan coba lagi.");
      }

      if (!response.ok) {
        throw new Error(
          "Server pelacakan bermasalah. Silakan coba beberapa saat lagi.",
        );
      }

      const data = await response.json();

      setShowCaptchaModal(false);
      setIsVerifying(false);
      setCaptchaKey((k) => k + 1);

      setModalBuka(true);
      setIsModalLoading(false);

      if (data && data.Detail && data.Detail.length > 0) {
        const dataMaster =
          data.Master && data.Master.length > 0 ? data.Master[0] : null;

        const dataSudahAda = new Set();
        let sudahAdaKirim = false;

        const parsedRiwayat = data.Detail.reduce(
          (acc: any[], item: any, index: number) => {
            const aktData = String(
              item.Aktdata || item.aktdata || "",
            ).toLowerCase();
            const aktType = String(
              item.Akttype || item.akttype || "",
            ).toLowerCase();

            const ketAsli = item.Keterangan
              ? String(item.Keterangan).trim()
              : "";

            if (
              aktData.includes("isi_bensin") ||
              aktType.includes("isi_bensin") ||
              ketAsli.toLowerCase().includes("isi_bensin")
            ) {
              return acc;
            }

            if (ketAsli.toLowerCase() === "kirim") {
              return acc;
            }

            let keteranganText = "";
            let rank = 0;
            let isValid = true;

            if (aktData === "jual" || aktType === "jual") {
              keteranganText = "Resi telah di terbitkan.";
              rank = 1;
            } else if (aktData === "pstjl" || aktData === "603") {
              keteranganText = "barang sedang disiapkan";
              rank = 2;
            } else if (
              aktData === "trmexp2" ||
              aktData === "trmepxp2" ||
              aktData === "458" ||
              aktData === "470"
            ) {
              keteranganText = ketAsli || "Barang sedang disortir";
              rank = 3;
            } else if (
              aktData === "tpenugasan" ||
              aktData === "472" ||
              aktData === "460"
            ) {
              if (ketAsli.toLowerCase().includes("kirim")) {
                keteranganText =
                  "Paket sedang diperjalanan menuju ke alamat penerima.";
              } else {
                keteranganText = ketAsli || "Barang dalam proses penugasan";
              }
              rank = 4;
            } else if (
              aktData === "kirim" ||
              aktData === "473" ||
              aktData === "461"
            ) {
              if (sudahAdaKirim) {
                return acc;
              }
              sudahAdaKirim = true;
              keteranganText = ketAsli || "Barang dalam proses pengiriman";
              rank = 5;
            } else if (aktData === "pod") {
              keteranganText = ketAsli || "Bukti pengiriman (POD) dicatat";
              rank = 6;
            } else if (aktData === "balik") {
              keteranganText = ketAsli || "Pengiriman mengalami kendala";
              rank = 7;
            } else {
              isValid = false;
            }

            if (keteranganText) {
              keteranganText = keteranganText.toUpperCase();
            }

            const tanggal = item.Tanggal || "";
            const jam = item.Jam || "";

            let kunciUnik = `${keteranganText}-${tanggal}-${jam}`;
            if (aktData === "pod") {
              const teksNormal = keteranganText.replace(/[^A-Z0-9]/g, "");
              kunciUnik = `POD-${teksNormal}`;
            }

            if (isValid && !dataSudahAda.has(kunciUnik)) {
              dataSudahAda.add(kunciUnik);
              acc.push({
                tanggal: tanggal,
                jam: jam,
                keterangan: keteranganText,
                _rank: rank,
                _originalIndex: index,
              });
            }

            return acc;
          },
          [],
        );

        parsedRiwayat.sort((a: any, b: any) => {
          const waktuA = new Date(`${a.tanggal}T${a.jam}`).getTime();
          const waktuB = new Date(`${b.tanggal}T${b.jam}`).getTime();

          if (!isNaN(waktuA) && !isNaN(waktuB) && waktuA !== waktuB) {
            return waktuB - waktuA;
          }

          if (a._originalIndex !== b._originalIndex) {
            return b._originalIndex - a._originalIndex;
          }

          return b._rank - a._rank;
        });

        const statusKeseluruhan =
          parsedRiwayat.length > 0
            ? parsedRiwayat[0].keterangan
            : "RESI TELAH DITERBITKAN";

        setHasilTracking({
          awb: kataKunci.trim(),
          status: statusKeseluruhan,
          pengirim: {
            nama: dataMaster?.NamaPengirim || "Tidak Diketahui",
            alamat: dataMaster?.AlamatPengirim || "",
            noHp: dataMaster?.NoHpPengirim || "",
            email: dataMaster?.EmailPengirim || "",
          },
          penerima: {
            nama: dataMaster?.NamaPenerima || "-",
            alamat: dataMaster?.AlamatPenerima || "",
            noHp: dataMaster?.NoHpPenerima || "",
            email: dataMaster?.EmailPenerima || "",
          },
          riwayat: parsedRiwayat,
        });
        setErrorMsg("");
      } else {
        setHasilTracking(null);
        setErrorMsg(
          "Nomor resi tidak ditemukan. Silakan periksa kembali nomor resi Anda.",
        );
      }
    } catch (err: any) {
      setIsVerifying(false);
      setCaptchaError(
        err?.message || "Gagal memverifikasi. Silakan coba lagi.",
      );
      setCaptchaKey((k) => k + 1);
    }
  };

  const handleTutupCaptcha = () => {
    setShowCaptchaModal(false);
    setIsVerifying(false);
    setCaptchaError("");
    setCaptchaKey((k) => k + 1);
  };

  return (
    <div className="bg-gray-50 text-center py-20 px-4">
      <span className="bg-[#FFCC00] text-black font-bold py-1 px-3 rounded-sm text-sm mb-4 inline-block">
        # Lacak Paket
      </span>
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mt-2 mb-3">
        Lacak Paket Anda
      </h2>
      <p className="text-gray-600 mt-1 max-w-lg mx-auto">
        Masukkan nomor resi Anda untuk melacak paket secara real-time.
      </p>

      <form onSubmit={handleCari} className="lg:max-w-2xl mx-auto mt-8">
        <div className="flex w-full bg-white rounded-sm shadow-md border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-black transition-all">
          <div className="pl-5 flex items-center justify-center text-gray-400">
            <Search size={22} />
          </div>
          <input
            type="text"
            value={kataKunci}
            onChange={(e) => setKataKunci(e.target.value)}
            placeholder="Masukkan nomor AWB..."
            className="w-full px-4 py-4 focus:outline-none text-gray-800 text-sm md:text-base font-medium"
          />
          <button
            type="submit"
            className="bg-black hover:bg-gray-800 text-white px-8 py-4 transition-colors cursor-pointer text-sm font-extrabold tracking-wide"
          >
            Cari
          </button>
        </div>
      </form>

      <AnimatePresence>
        {showCaptchaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60] backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-6 relative"
            >
              {!isVerifying && (
                <button
                  onClick={handleTutupCaptcha}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1.5 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}

              <div className="text-center mb-5">
                <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="text-base font-extrabold text-gray-900 mb-1">
                  Verifikasi Keamanan
                </h3>
                <p className="text-xs text-gray-500">
                  Centang kotak di bawah untuk melanjutkan pelacakan.
                </p>
              </div>

              <div className="relative flex justify-center mb-3 min-h-[78px]">
                <ReCaptcha key={captchaKey} onChange={handleCaptchaVerified} />
                {isVerifying && (
                  <div className="absolute inset-0 bg-white/85 flex flex-col items-center justify-center gap-2 rounded-md z-10">
                    <Loader2
                      size={22}
                      className="animate-spin text-[#FFCC00]"
                    />
                    <p className="text-xs text-gray-600 font-medium">
                      Memproses pelacakan...
                    </p>
                  </div>
                )}
              </div>

              {captchaError && !isVerifying && (
                <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2 flex items-start gap-2 mt-3">
                  <AlertCircle
                    size={14}
                    className="text-red-600 shrink-0 mt-0.5"
                  />
                  <p className="text-xs text-red-700 font-medium">
                    {captchaError}
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalBuka && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-white rounded-sm max-w-3xl w-full p-8 text-left shadow-2xl relative max-h-[85vh] overflow-y-auto"
            >
              <button
                onClick={() => setModalBuka(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-black p-2 bg-gray-100 hover:bg-gray-200 rounded-sm transition-colors cursor-pointer z-10"
              >
                <X size={20} />
              </button>

              {isModalLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 size={45} className="animate-spin text-[#FFCC00]" />
                  <p className="text-base font-bold text-gray-700">
                    Sedang memuat data pelacakan...
                  </p>
                </div>
              ) : hasilTracking ? (
                <div>
                  {/* PERBAIKAN: Menambahkan tombol salin di sebelah badge AWB */}
                  <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                    <div className="inline-flex items-center bg-[#FFCC00] text-gray-950 font-extrabold text-sm rounded-sm shadow-xs overflow-hidden">
                      <span className="px-3.5 py-1.5">
                        AWB: {hasilTracking.awb}
                      </span>
                      <button
                        onClick={() => handleSalinAwb(hasilTracking.awb)}
                        title="Salin AWB"
                        className="bg-yellow-500 hover:bg-yellow-600 text-gray-950 px-2.5 py-1.5 transition-colors cursor-pointer flex items-center justify-center border-l border-yellow-400"
                      >
                        {isCopied ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-extrabold text-gray-900 mb-4">
                    Informasi Pengiriman
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                    {/* Kotak Pengirim */}
                    <div className="bg-gray-50 p-5 rounded-sm border border-gray-200 shadow-xs flex items-start gap-4 h-full">
                      <div className="w-12 h-12 bg-yellow-100 text-yellow-800 rounded-sm flex items-center justify-center shrink-0 mt-1">
                        <User size={22} />
                      </div>
                      <div className="w-full">
                        <span className="text-xs font-extrabold text-gray-700 uppercase tracking-wider block mb-1">
                          PENGIRIM
                        </span>
                        <span className="text-sm font-extrabold text-gray-950 block">
                          {hasilTracking.pengirim.nama}
                        </span>

                        {hasilTracking.pengirim.alamat && (
                          <span
                            className="text-xs text-gray-800 font-semibold mt-1.5 block pr-2 leading-relaxed"
                            title={hasilTracking.pengirim.alamat}
                          >
                            {hasilTracking.pengirim.alamat}
                          </span>
                        )}

                        {(hasilTracking.pengirim.noHp ||
                          (hasilTracking.pengirim.email &&
                            hasilTracking.pengirim.email !== "000000")) && (
                          <div className="mt-3 pt-3 border-t border-gray-200 space-y-1.5">
                            {hasilTracking.pengirim.noHp &&
                              hasilTracking.pengirim.noHp !== "-" && (
                                <div className="flex items-center gap-2 text-xs text-gray-900 font-extrabold">
                                  <Phone
                                    size={14}
                                    className="text-gray-700 shrink-0"
                                  />
                                  <span>{hasilTracking.pengirim.noHp}</span>
                                </div>
                              )}
                            {hasilTracking.pengirim.email &&
                              hasilTracking.pengirim.email !== "-" &&
                              hasilTracking.pengirim.email !== "000000" && (
                                <div className="flex items-center gap-2 text-xs text-gray-900 font-extrabold">
                                  <Mail
                                    size={14}
                                    className="text-gray-700 shrink-0"
                                  />
                                  <span className="truncate">
                                    {hasilTracking.pengirim.email}
                                  </span>
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Kotak Penerima */}
                    <div className="bg-gray-50 p-5 rounded-sm border border-gray-200 shadow-xs flex items-start gap-4 h-full">
                      <div className="w-12 h-12 bg-blue-100 text-blue-800 rounded-sm flex items-center justify-center shrink-0 mt-1">
                        <User size={22} />
                      </div>
                      <div className="w-full">
                        <span className="text-xs font-extrabold text-gray-700 uppercase tracking-wider block mb-1">
                          PENERIMA
                        </span>
                        <span className="text-sm font-extrabold text-gray-950 block">
                          {hasilTracking.penerima.nama}
                        </span>

                        {hasilTracking.penerima.alamat && (
                          <span
                            className="text-xs text-gray-800 font-semibold mt-1.5 block pr-2 leading-relaxed"
                            title={hasilTracking.penerima.alamat}
                          >
                            {hasilTracking.penerima.alamat}
                          </span>
                        )}

                        {(hasilTracking.penerima.noHp ||
                          (hasilTracking.penerima.email &&
                            hasilTracking.penerima.email !== "000000")) && (
                          <div className="mt-3 pt-3 border-t border-gray-200 space-y-1.5">
                            {hasilTracking.penerima.noHp &&
                              hasilTracking.penerima.noHp !== "-" && (
                                <div className="flex items-center gap-2 text-xs text-gray-900 font-extrabold">
                                  <Phone
                                    size={14}
                                    className="text-gray-700 shrink-0"
                                  />
                                  <span>{hasilTracking.penerima.noHp}</span>
                                </div>
                              )}
                            {hasilTracking.penerima.email &&
                              hasilTracking.penerima.email !== "-" &&
                              hasilTracking.penerima.email !== "000000" && (
                                <div className="flex items-center gap-2 text-xs text-gray-900 font-extrabold">
                                  <Mail
                                    size={14}
                                    className="text-gray-700 shrink-0"
                                  />
                                  <span className="truncate">
                                    {hasilTracking.penerima.email}
                                  </span>
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <h4 className="text-base font-extrabold text-gray-900 mb-4 uppercase tracking-wider">
                    LACAK PAKET
                  </h4>

                  {hasilTracking.riwayat.length > 0 ? (
                    <div className="space-y-6 border-l-2 border-yellow-400 pl-6 ml-3 my-4">
                      {hasilTracking.riwayat.map((item: any, idx: number) => {
                        const isTerbaru = idx === 0;

                        return (
                          <div key={idx} className="relative">
                            <div className="absolute -left-[31px] top-1 w-4 h-4 bg-[#FFCC00] rounded-sm border-4 border-white shadow-md"></div>

                            <div className="text-xs text-gray-500 font-semibold flex items-center gap-2 mb-1">
                              <span>{item.tanggal}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-gray-600 font-bold">
                                <Clock size={13} /> {item.jam}
                              </span>
                            </div>

                            {/* PERBAIKAN: Status terbaru bold pekat, status terlewati menggunakan text-gray-700 agar tetap jelas terlihat */}
                            <div
                              className={`text-base ${
                                isTerbaru
                                  ? "font-black text-gray-950"
                                  : "font-medium text-gray-700"
                              }`}
                            >
                              {item.keterangan}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-gray-300 rounded-sm bg-gray-50">
                      <span className="text-sm font-semibold text-gray-500">
                        Belum ada pembaruan status pengiriman
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => setModalBuka(false)}
                    className="w-full bg-black hover:bg-gray-800 text-white font-extrabold py-3.5 rounded-sm text-base transition-colors mt-8 cursor-pointer shadow-md"
                  >
                    Tutup
                  </button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-red-600 font-extrabold text-lg mb-2">
                    Resi Tidak Ditemukan
                  </div>
                  <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
                    {errorMsg}
                  </p>
                  <button
                    onClick={() => setModalBuka(false)}
                    className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-sm text-sm font-bold cursor-pointer shadow-md"
                  >
                    Coba Lagi
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tracking;
