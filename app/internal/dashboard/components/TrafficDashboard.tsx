"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Inbox,
  Headphones,
  MessagesSquare,
  CheckCircle2,
  Timer,
  UserCheck,
  Reply,
  Hourglass,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Truck,
  MapPin,
  Image as ImageIcon,
  BookOpen,
  Newspaper,
  Table2,
  BarChart3,
} from "lucide-react";
import { useLiveChatSocket } from "@/app/hooks/use-live-chat-socket";

interface RataRata {
  rata: number | null;
  jumlah: number;
}

interface Statistik {
  diperbarui: string;
  mulai: number;
  saatIni: { menunggu: number; ditangani: number };
  hari: {
    chatBaru: number;
    lanjutKeCs: number;
    selesai: number;
    pesanCustomer: number;
    totalChat: number;
    totalSelesai: number;
  };
  leadtime: {
    balasanPertama: RataRata;
    tungguDiambil: RataRata;
    waktuBalas: RataRata;
    durasiSesi: RataRata;
    pesanPerSesi: {
      rata: number | null;
      customer: number | null;
      cs: number | null;
      ai: number | null;
      jumlah: number;
    };
  };
  perJam: { jam: number; chatBaru: number; selesai: number; pesan: number }[];
  tren: { tanggal: number; chatBaru: number; selesai: number }[];
  dataWebsite: {
    tarif: number;
    cabang: number;
    bannerAktif: number;
    knowledgeAktif: number;
    infoAktif: number;
  };
}

interface TrafficDashboardProps {
  adminId: number;
  onBukaMenu: (menu: string) => void;
}

const WARNA_CHAT_MASUK = "#C98500";
const WARNA_SELESAI = "#2A78D6";
const INTERVAL_REFRESH = 30_000;

const keInputTanggal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

const dariInputTanggal = (teks: string) => {
  const [y, m, d] = teks.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const geserHari = (teks: string, hari: number) => {
  const d = dariInputTanggal(teks);
  d.setDate(d.getDate() + hari);
  return keInputTanggal(d);
};

export function formatDurasi(detik: number | null): string {
  if (detik === null) return "—";
  if (detik < 60) return `${Math.round(detik)} dtk`;
  if (detik < 3600) {
    const m = Math.floor(detik / 60);
    const s = Math.round(detik % 60);
    return s ? `${m} mnt ${s} dtk` : `${m} mnt`;
  }
  if (detik < 86400) {
    const j = Math.floor(detik / 3600);
    const m = Math.round((detik % 3600) / 60);
    return m ? `${j} j ${m} mnt` : `${j} j`;
  }
  const h = Math.floor(detik / 86400);
  const j = Math.round((detik % 86400) / 3600);
  return j ? `${h} hr ${j} j` : `${h} hr`;
}

const formatAngka = (n: number | null) =>
  n === null ? "—" : n.toLocaleString("id-ID", { maximumFractionDigits: 1 });

function skalaY(nilaiMaks: number) {
  const kasar = Math.max(nilaiMaks, 1) / 4;
  const pangkat = Math.pow(10, Math.floor(Math.log10(kasar)));
  const n = kasar / pangkat;
  const langkah = Math.max(
    1,
    (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pangkat,
  );
  return { maks: langkah * 4, langkah };
}

function pathBatang(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h} Z`;
}

function useLebar<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [lebar, setLebar] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setLebar(Math.floor(entry.contentRect.width)),
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, lebar };
}

interface KartuProps {
  ikon: React.ReactNode;
  judul: string;
  nilai: string;
  keterangan: string;
  aksen?: "kuning" | "hijau" | "biru" | "merah" | "abu";
  onClick?: () => void;
}

const WARNA_AKSEN = {
  kuning: {
    garis: "border-t-[#FFCC00]",
    ikon: "bg-yellow-100 text-yellow-700",
  },
  hijau: { garis: "border-t-green-500", ikon: "bg-green-100 text-green-700" },
  biru: { garis: "border-t-blue-500", ikon: "bg-blue-100 text-blue-700" },
  merah: { garis: "border-t-red-500", ikon: "bg-red-100 text-red-700" },
  abu: { garis: "border-t-gray-800", ikon: "bg-gray-900 text-[#FFCC00]" },
};

const Kartu = ({
  ikon,
  judul,
  nilai,
  keterangan,
  aksen = "kuning",
  onClick,
}: KartuProps) => (
  <div
    onClick={onClick}
    className={`bg-white p-4 rounded-sm border border-gray-200 border-t-4 ${
      WARNA_AKSEN[aksen].garis
    } shadow-sm flex gap-3 ${
      onClick
        ? "cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
        : ""
    }`}
  >
    <div
      className={`w-10 h-10 rounded-sm flex items-center justify-center shrink-0 ${WARNA_AKSEN[aksen].ikon}`}
    >
      {ikon}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500 font-semibold leading-snug">
        {judul}
      </p>
      <p className="text-2xl font-extrabold text-gray-900 leading-tight mt-0.5 tabular-nums">
        {nilai}
      </p>
      <p className="text-[11px] text-gray-500 mt-1 leading-snug">
        {keterangan}
      </p>
    </div>
  </div>
);

const JudulSeksi = ({
  judul,
  keterangan,
}: {
  judul: string;
  keterangan?: string;
}) => (
  <div className="flex items-baseline gap-2 flex-wrap">
    <h3 className="text-base font-extrabold text-gray-900">{judul}</h3>
    {keterangan && <span className="text-xs text-gray-500">{keterangan}</span>}
  </div>
);

const Legenda = () => (
  <div className="flex items-center gap-4 text-[11px] text-gray-600 font-semibold">
    <span className="flex items-center gap-1.5">
      <span
        className="w-3 h-3 rounded-sm"
        style={{ background: WARNA_CHAT_MASUK }}
      ></span>
      Chat masuk
    </span>
    <span className="flex items-center gap-1.5">
      <span
        className="w-3 h-3 rounded-sm"
        style={{ background: WARNA_SELESAI }}
      ></span>
      Selesai
    </span>
  </div>
);

const GrafikPerJam = ({ data }: { data: Statistik["perJam"] }) => {
  const { ref, lebar } = useLebar<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const tinggi = 220;
  const kiri = 34;
  const bawah = 24;
  const atas = 10;
  const lebarPlot = Math.max(lebar - kiri - 8, 0);
  const tinggiPlot = tinggi - atas - bawah;
  const { maks, langkah } = skalaY(
    Math.max(...data.map((d) => Math.max(d.chatBaru, d.selesai))),
  );
  const lebarGrup = lebarPlot / 24;
  const lebarBatang = Math.max(2, (lebarGrup - 6) / 2);
  const y = (v: number) => atas + tinggiPlot - (v / maks) * tinggiPlot;

  const titikHover = hover !== null ? data[hover] : null;

  return (
    <div
      ref={ref}
      className="relative w-full"
      onMouseLeave={() => setHover(null)}
    >
      {lebar > 0 && (
        <svg
          width={lebar}
          height={tinggi}
          role="img"
          aria-label="Grafik chat masuk dan selesai per jam"
        >
          {Array.from({ length: 5 }, (_, i) => {
            const nilai = i * langkah;
            return (
              <g key={i}>
                <line
                  x1={kiri}
                  x2={kiri + lebarPlot}
                  y1={y(nilai)}
                  y2={y(nilai)}
                  stroke={i === 0 ? "#d1d5db" : "#f3f4f6"}
                />
                <text
                  x={kiri - 8}
                  y={y(nilai) + 4}
                  textAnchor="end"
                  fontSize={10}
                  fill="#6b7280"
                >
                  {nilai}
                </text>
              </g>
            );
          })}

          {data.map((d, i) => {
            const xGrup = kiri + i * lebarGrup;
            const xMasuk = xGrup + 2;
            const xSelesai = xMasuk + lebarBatang + 2;
            return (
              <g key={d.jam}>
                {hover === i && (
                  <rect
                    x={xGrup}
                    y={atas}
                    width={lebarGrup}
                    height={tinggiPlot}
                    fill="#fef9c3"
                    opacity={0.6}
                  />
                )}
                {d.chatBaru > 0 && (
                  <path
                    d={pathBatang(
                      xMasuk,
                      y(d.chatBaru),
                      lebarBatang,
                      y(0) - y(d.chatBaru),
                    )}
                    fill={WARNA_CHAT_MASUK}
                  />
                )}
                {d.selesai > 0 && (
                  <path
                    d={pathBatang(
                      xSelesai,
                      y(d.selesai),
                      lebarBatang,
                      y(0) - y(d.selesai),
                    )}
                    fill={WARNA_SELESAI}
                  />
                )}
                {i % 3 === 0 && (
                  <text
                    x={xGrup + lebarGrup / 2}
                    y={tinggi - 6}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#6b7280"
                  >
                    {String(d.jam).padStart(2, "0")}
                  </text>
                )}
                <rect
                  x={xGrup}
                  y={atas}
                  width={lebarGrup}
                  height={tinggiPlot + bawah}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                />
              </g>
            );
          })}
        </svg>
      )}

      {titikHover && hover !== null && (
        <div
          className="absolute z-10 pointer-events-none bg-gray-950 text-white rounded-sm shadow-lg px-3 py-2 text-[11px] min-w-36"
          style={{
            left: Math.min(
              Math.max(kiri + hover * lebarGrup + lebarGrup / 2 - 72, 0),
              Math.max(lebar - 150, 0),
            ),
            top: 0,
          }}
        >
          <p className="font-extrabold text-[#FFCC00] mb-1">
            Pukul {String(titikHover.jam).padStart(2, "0")}.00 –{" "}
            {String(titikHover.jam).padStart(2, "0")}.59
          </p>
          <p className="flex justify-between gap-3">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-sm"
                style={{ background: WARNA_CHAT_MASUK }}
              ></span>
              Chat masuk
            </span>
            <b>{titikHover.chatBaru}</b>
          </p>
          <p className="flex justify-between gap-3">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-sm"
                style={{ background: WARNA_SELESAI }}
              ></span>
              Selesai
            </span>
            <b>{titikHover.selesai}</b>
          </p>
          <p className="flex justify-between gap-3 text-gray-300">
            <span>Pesan customer</span>
            <b>{titikHover.pesan}</b>
          </p>
        </div>
      )}
    </div>
  );
};

const GrafikTren = ({ data }: { data: Statistik["tren"] }) => {
  const { ref, lebar } = useLebar<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const tinggi = 220;
  const kiri = 34;
  const kanan = 74;
  const bawah = 24;
  const atas = 12;
  const lebarPlot = Math.max(lebar - kiri - kanan, 0);
  const tinggiPlot = tinggi - atas - bawah;
  const { maks, langkah } = skalaY(
    Math.max(...data.map((d) => Math.max(d.chatBaru, d.selesai))),
  );
  const x = (i: number) =>
    kiri + (data.length > 1 ? (i / (data.length - 1)) * lebarPlot : 0);
  const y = (v: number) => atas + tinggiPlot - (v / maks) * tinggiPlot;

  const garis = (kunci: "chatBaru" | "selesai") =>
    data
      .map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d[kunci])}`)
      .join(" ");

  const terakhir = data[data.length - 1];
  let yLabelMasuk = y(terakhir.chatBaru) + 4;
  let yLabelSelesai = y(terakhir.selesai) + 4;
  if (Math.abs(yLabelMasuk - yLabelSelesai) < 13) {
    if (terakhir.chatBaru >= terakhir.selesai) yLabelSelesai = yLabelMasuk + 13;
    else yLabelMasuk = yLabelSelesai + 13;
  }

  const formatTanggal = (ms: number) =>
    new Date(ms).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });

  const titikHover = hover !== null ? data[hover] : null;

  return (
    <div
      ref={ref}
      className="relative w-full"
      onMouseLeave={() => setHover(null)}
    >
      {lebar > 0 && (
        <svg
          width={lebar}
          height={tinggi}
          role="img"
          aria-label="Grafik tren chat 14 hari terakhir"
        >
          {Array.from({ length: 5 }, (_, i) => {
            const nilai = i * langkah;
            return (
              <g key={i}>
                <line
                  x1={kiri}
                  x2={kiri + lebarPlot}
                  y1={y(nilai)}
                  y2={y(nilai)}
                  stroke={i === 0 ? "#d1d5db" : "#f3f4f6"}
                />
                <text
                  x={kiri - 8}
                  y={y(nilai) + 4}
                  textAnchor="end"
                  fontSize={10}
                  fill="#6b7280"
                >
                  {nilai}
                </text>
              </g>
            );
          })}

          {data.map((d, i) =>
            i % 2 === 1 || i === data.length - 1 ? (
              <text
                key={d.tanggal}
                x={x(i)}
                y={tinggi - 6}
                textAnchor="middle"
                fontSize={10}
                fill="#6b7280"
              >
                {formatTanggal(d.tanggal)}
              </text>
            ) : null,
          )}

          {hover !== null && (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={atas}
              y2={atas + tinggiPlot}
              stroke="#9ca3af"
              strokeDasharray="3 3"
            />
          )}

          <path
            d={garis("chatBaru")}
            fill="none"
            stroke={WARNA_CHAT_MASUK}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <path
            d={garis("selesai")}
            fill="none"
            stroke={WARNA_SELESAI}
            strokeWidth={2}
            strokeLinejoin="round"
          />

          {[data.length - 1, hover].map((i, k) =>
            i === null ? null : (
              <g key={k}>
                <circle
                  cx={x(i)}
                  cy={y(data[i].chatBaru)}
                  r={4.5}
                  fill={WARNA_CHAT_MASUK}
                  stroke="#fff"
                  strokeWidth={2}
                />
                <circle
                  cx={x(i)}
                  cy={y(data[i].selesai)}
                  r={4.5}
                  fill={WARNA_SELESAI}
                  stroke="#fff"
                  strokeWidth={2}
                />
              </g>
            ),
          )}

          <text
            x={x(data.length - 1) + 10}
            y={yLabelMasuk}
            fontSize={10}
            fontWeight={700}
            fill="#374151"
          >
            Chat masuk
          </text>
          <text
            x={x(data.length - 1) + 10}
            y={yLabelSelesai}
            fontSize={10}
            fontWeight={700}
            fill="#374151"
          >
            Selesai
          </text>

          {data.map((d, i) => {
            const lebarArea =
              data.length > 1 ? lebarPlot / (data.length - 1) : lebarPlot;
            return (
              <rect
                key={d.tanggal}
                x={x(i) - lebarArea / 2}
                y={atas}
                width={lebarArea}
                height={tinggiPlot + bawah}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
              />
            );
          })}
        </svg>
      )}

      {titikHover && hover !== null && (
        <div
          className="absolute z-10 pointer-events-none bg-gray-950 text-white rounded-sm shadow-lg px-3 py-2 text-[11px] min-w-36"
          style={{
            left: Math.min(
              Math.max(x(hover) - 72, 0),
              Math.max(lebar - 150, 0),
            ),
            top: 0,
          }}
        >
          <p className="font-extrabold text-[#FFCC00] mb-1">
            {new Date(titikHover.tanggal).toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <p className="flex justify-between gap-3">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-sm"
                style={{ background: WARNA_CHAT_MASUK }}
              ></span>
              Chat masuk
            </span>
            <b>{titikHover.chatBaru}</b>
          </p>
          <p className="flex justify-between gap-3">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-sm"
                style={{ background: WARNA_SELESAI }}
              ></span>
              Selesai
            </span>
            <b>{titikHover.selesai}</b>
          </p>
        </div>
      )}
    </div>
  );
};

const KotakGrafik = ({
  judul,
  keterangan,
  grafik,
  tabel,
}: {
  judul: string;
  keterangan: string;
  grafik: React.ReactNode;
  tabel: React.ReactNode;
}) => {
  const [modeTabel, setModeTabel] = useState(false);
  return (
    <div className="bg-white rounded-sm border border-gray-200 border-t-4 border-t-[#FFCC00] shadow-sm p-4 min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          <h4 className="font-extrabold text-gray-900 text-sm">{judul}</h4>
          <p className="text-[11px] text-gray-500">{keterangan}</p>
        </div>
        <div className="flex items-center gap-3">
          <Legenda />
          <button
            type="button"
            onClick={() => setModeTabel((v) => !v)}
            className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-sm cursor-pointer"
          >
            {modeTabel ? <BarChart3 size={12} /> : <Table2 size={12} />}
            {modeTabel ? "Grafik" : "Tabel"}
          </button>
        </div>
      </div>
      {modeTabel ? (
        <div className="max-h-56 overflow-y-auto border border-gray-100 rounded-sm">
          {tabel}
        </div>
      ) : (
        grafik
      )}
    </div>
  );
};

const TrafficDashboard = ({ adminId, onBukaMenu }: TrafficDashboardProps) => {
  const [tanggal, setTanggal] = useState(() => keInputTanggal(new Date()));
  const [data, setData] = useState<Statistik | null>(null);
  const [error, setError] = useState<string | null>(null);
  const permintaanRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hariIni = keInputTanggal(new Date());
  const adalahHariIni = tanggal === hariIni;
  const mulai = dariInputTanggal(tanggal).getTime();

  const { socket, status } = useLiveChatSocket(null, null, true, adminId);

  const muat = useCallback(async () => {
    const idPermintaan = ++permintaanRef.current;
    try {
      const res = await fetch(`/api/dashboard/statistik?mulai=${mulai}`, {
        cache: "no-store",
      });
      const hasil = await res.json();
      if (idPermintaan !== permintaanRef.current) return;
      if (!res.ok) throw new Error(hasil.error || "Gagal memuat statistik");
      setData(hasil);
      setError(null);
    } catch (err) {
      if (idPermintaan !== permintaanRef.current) return;
      setError(err instanceof Error ? err.message : "Gagal memuat statistik");
    }
  }, [mulai]);

  useEffect(() => {
    const awal = setTimeout(muat, 0);
    const timer = setInterval(muat, INTERVAL_REFRESH);
    const saatTerlihat = () => {
      if (document.visibilityState === "visible") muat();
    };
    document.addEventListener("visibilitychange", saatTerlihat);
    return () => {
      clearTimeout(awal);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", saatTerlihat);
    };
  }, [muat]);

  useEffect(() => {
    if (!socket || status !== "connected") return;
    const jadwalkan = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(muat, 800);
    };
    socket.on("message:new", jadwalkan);
    socket.on("conversation:updated", jadwalkan);
    return () => {
      socket.off("message:new", jadwalkan);
      socket.off("conversation:updated", jadwalkan);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [socket, status, muat]);

  const labelHari = adalahHariIni
    ? "hari ini"
    : dariInputTanggal(tanggal).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

  const lt = data?.leadtime;

  return (
    <div className="space-y-5">
      <div className="bg-white px-4 py-3 rounded-sm border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-yellow-600" />
          <span className="text-sm font-extrabold text-gray-900">
            Traffic Harian
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTanggal((t) => geserHari(t, -1))}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-sm text-gray-700 cursor-pointer"
            title="Hari sebelumnya"
          >
            <ChevronLeft size={14} />
          </button>
          <input
            type="date"
            value={tanggal}
            max={hariIni}
            onChange={(e) => e.target.value && setTanggal(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-sm text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <button
            type="button"
            onClick={() => setTanggal((t) => geserHari(t, 1))}
            disabled={adalahHariIni}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-sm text-gray-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Hari berikutnya"
          >
            <ChevronRight size={14} />
          </button>
          {!adalahHariIni && (
            <button
              type="button"
              onClick={() => setTanggal(hariIni)}
              className="px-3 py-1.5 bg-[#FFCC00] hover:bg-yellow-400 text-gray-950 font-extrabold rounded-sm text-xs cursor-pointer"
            >
              Hari Ini
            </button>
          )}
          <span
            className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-sm ${
              error
                ? "bg-red-50 text-red-700"
                : status === "connected"
                  ? "bg-green-50 text-green-700"
                  : "bg-orange-50 text-orange-700"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                error
                  ? "bg-red-500"
                  : status === "connected"
                    ? "bg-green-500 animate-pulse"
                    : "bg-orange-500"
              }`}
            ></span>
            {error
              ? "Gagal memuat"
              : data
                ? `Realtime · diperbarui ${new Date(data.diperbarui).toLocaleTimeString("id-ID")}`
                : "Memuat..."}
          </span>
        </div>
      </div>

      {error && !data && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm px-4 py-3">
          {error}
        </div>
      )}

      {data && lt && (
        <>
          <div className="space-y-2">
            <JudulSeksi judul="Live Chat" keterangan={`data ${labelHari}`} />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <Kartu
                ikon={<Inbox size={20} />}
                judul="Menunggu diambil"
                nilai={formatAngka(data.saatIni.menunggu)}
                keterangan={
                  data.saatIni.menunggu > 0
                    ? "Customer menunggu CS · saat ini"
                    : "Antrian kosong · saat ini"
                }
                aksen={data.saatIni.menunggu > 0 ? "merah" : "abu"}
                onClick={() => onBukaMenu("pesan")}
              />
              <Kartu
                ikon={<Headphones size={20} />}
                judul="Sedang ditangani"
                nilai={formatAngka(data.saatIni.ditangani)}
                keterangan="Chat aktif bersama CS · saat ini"
                aksen="kuning"
                onClick={() => onBukaMenu("pesan")}
              />
              <Kartu
                ikon={<MessagesSquare size={20} />}
                judul={`Chat baru · ${labelHari}`}
                nilai={formatAngka(data.hari.chatBaru)}
                keterangan={`${data.hari.lanjutKeCs} lanjut ke CS · ${formatAngka(
                  data.hari.totalChat,
                )} total`}
                aksen="kuning"
              />
              <Kartu
                ikon={<CheckCircle2 size={20} />}
                judul={`Selesai · ${labelHari}`}
                nilai={formatAngka(data.hari.selesai)}
                keterangan={`${formatAngka(data.hari.totalSelesai)} total selesai`}
                aksen="hijau"
              />
            </div>
          </div>

          <div className="space-y-2">
            <JudulSeksi
              judul="Leadtime"
              keterangan={`chat yang dimulai ${labelHari}`}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4">
              <Kartu
                ikon={<Timer size={20} />}
                judul="Rata-rata balasan pertama"
                nilai={formatDurasi(lt.balasanPertama.rata)}
                keterangan={
                  lt.balasanPertama.jumlah
                    ? `Dari ${lt.balasanPertama.jumlah} chat yang dibalas CS`
                    : "Belum ada chat yang dibalas CS"
                }
                aksen="abu"
              />
              <Kartu
                ikon={<UserCheck size={20} />}
                judul="Rata-rata tunggu diambil CS"
                nilai={formatDurasi(lt.tungguDiambil.rata)}
                keterangan={
                  lt.tungguDiambil.jumlah
                    ? `Dari ${lt.tungguDiambil.jumlah} chat yang diambil CS`
                    : "Belum ada chat yang diambil CS"
                }
                aksen="abu"
              />
              <Kartu
                ikon={<Reply size={20} />}
                judul="Rata-rata waktu balas CS"
                nilai={formatDurasi(lt.waktuBalas.rata)}
                keterangan={
                  lt.waktuBalas.jumlah
                    ? `Dari ${lt.waktuBalas.jumlah} balasan lanjutan`
                    : "Belum ada balasan lanjutan"
                }
                aksen="abu"
              />
              <Kartu
                ikon={<Hourglass size={20} />}
                judul="Rata-rata durasi sesi"
                nilai={formatDurasi(lt.durasiSesi.rata)}
                keterangan={
                  lt.durasiSesi.jumlah
                    ? `Dari ${lt.durasiSesi.jumlah} chat yang sudah ditutup`
                    : "Belum ada chat yang ditutup"
                }
                aksen="abu"
              />
              <Kartu
                ikon={<MessageCircle size={20} />}
                judul="Rata-rata pesan per sesi"
                nilai={formatAngka(lt.pesanPerSesi.rata)}
                keterangan={
                  lt.pesanPerSesi.jumlah
                    ? `Customer ${formatAngka(lt.pesanPerSesi.customer)} · CS ${formatAngka(
                        lt.pesanPerSesi.cs,
                      )} · AI ${formatAngka(lt.pesanPerSesi.ai)} — dari ${
                        lt.pesanPerSesi.jumlah
                      } chat`
                    : "Belum ada pesan"
                }
                aksen="abu"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <KotakGrafik
              judul={`Traffic per jam · ${labelHari}`}
              keterangan={`${data.hari.chatBaru} chat masuk · ${data.hari.selesai} selesai · ${data.hari.pesanCustomer} pesan customer`}
              grafik={<GrafikPerJam data={data.perJam} />}
              tabel={
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-700 sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Jam</th>
                      <th className="px-3 py-2 text-right">Chat masuk</th>
                      <th className="px-3 py-2 text-right">Selesai</th>
                      <th className="px-3 py-2 text-right">Pesan customer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.perJam.map((d) => (
                      <tr key={d.jam}>
                        <td className="px-3 py-1.5 text-gray-700">
                          {String(d.jam).padStart(2, "0")}.00
                        </td>
                        <td className="px-3 py-1.5 text-right font-bold text-gray-900">
                          {d.chatBaru}
                        </td>
                        <td className="px-3 py-1.5 text-right font-bold text-gray-900">
                          {d.selesai}
                        </td>
                        <td className="px-3 py-1.5 text-right text-gray-700">
                          {d.pesan}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              }
            />
            <KotakGrafik
              judul="Tren 14 hari"
              keterangan={`Chat masuk & selesai per hari, sampai ${labelHari}`}
              grafik={<GrafikTren data={data.tren} />}
              tabel={
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-700 sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Tanggal</th>
                      <th className="px-3 py-2 text-right">Chat masuk</th>
                      <th className="px-3 py-2 text-right">Selesai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[...data.tren].reverse().map((d) => (
                      <tr key={d.tanggal}>
                        <td className="px-3 py-1.5 text-gray-700">
                          {new Date(d.tanggal).toLocaleDateString("id-ID", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </td>
                        <td className="px-3 py-1.5 text-right font-bold text-gray-900">
                          {d.chatBaru}
                        </td>
                        <td className="px-3 py-1.5 text-right font-bold text-gray-900">
                          {d.selesai}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              }
            />
          </div>

          <div className="space-y-2">
            <JudulSeksi
              judul="Data Website"
              keterangan="jumlah data di database saat ini"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4">
              <Kartu
                ikon={<Truck size={20} />}
                judul="Tarif ongkir"
                nilai={formatAngka(data.dataWebsite.tarif)}
                keterangan="Rute tarif tersimpan"
                aksen="biru"
                onClick={() => onBukaMenu("ongkir")}
              />
              <Kartu
                ikon={<MapPin size={20} />}
                judul="Cabang"
                nilai={formatAngka(data.dataWebsite.cabang)}
                keterangan="Lokasi cabang di peta"
                aksen="merah"
                onClick={() => onBukaMenu("cabang")}
              />
              <Kartu
                ikon={<ImageIcon size={20} />}
                judul="Banner carousel aktif"
                nilai={formatAngka(data.dataWebsite.bannerAktif)}
                keterangan="Tampil di beranda"
                aksen="hijau"
                onClick={() => onBukaMenu("hero-banner")}
              />
              <Kartu
                ikon={<BookOpen size={20} />}
                judul="Knowledge AI aktif"
                nilai={formatAngka(data.dataWebsite.knowledgeAktif)}
                keterangan="Dipakai chatbot AI"
                aksen="kuning"
                onClick={() => onBukaMenu("knowledge")}
              />
              <Kartu
                ikon={<Newspaper size={20} />}
                judul="Info Express aktif"
                nilai={formatAngka(data.dataWebsite.infoAktif)}
                keterangan="Berita & promo tampil"
                aksen="abu"
                onClick={() => onBukaMenu("info-express")}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TrafficDashboard;
