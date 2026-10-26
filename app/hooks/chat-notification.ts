"use client";

// Utilitas notifikasi chat bersama (admin & customer):
// suara, notifikasi browser/OS lewat Service Worker (tetap muncul saat
// browser di-minimize atau berada di tab lain), dan penanda di judul tab.

let audio: HTMLAudioElement | null = null;
let judulAsli: string | null = null;
let jumlahBelumDibaca = 0;
let listenerJudulTerpasang = false;
let listenerIzinTerpasang = false;
let registrasiSW: Promise<ServiceWorkerRegistration | null> | null = null;

export interface DataNotifikasiChat {
  // Path halaman tujuan saat notifikasi diklik, mis. "/internal/dashboard"
  path: string;
  // URL lengkap untuk membuka tab baru jika tab tujuan sudah ditutup
  url: string;
  conversationId?: number;
}

export function halamanTidakDilihat(): boolean {
  if (typeof document === "undefined") return false;
  return document.hidden || !document.hasFocus();
}

function dukungNotifikasi(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

function daftarkanServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (registrasiSW) return registrasiSW;
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    registrasiSW = Promise.resolve(null);
    return registrasiSW;
  }
  registrasiSW = navigator.serviceWorker
    .register("/sw-notifikasi.js")
    .then(() => navigator.serviceWorker.ready)
    .catch(() => {
      return null;
    });
  return registrasiSW;
}

export async function mintaIzinNotifikasi(): Promise<NotificationPermission> {
  if (!dukungNotifikasi()) return "denied";
  if (Notification.permission === "default") {
    try {
      return await Notification.requestPermission();
    } catch {
      return Notification.permission;
    }
  }
  return Notification.permission;
}

// Siapkan notifikasi: daftarkan service worker & minta izin.
// Browser hanya menampilkan dialog izin setelah ada aksi pengguna,
// jadi permintaan izin diulang pada klik / ketikan pertama di halaman.
export function siapkanNotifikasi() {
  if (!dukungNotifikasi()) return;
  daftarkanServiceWorker();

  if (Notification.permission !== "default" || listenerIzinTerpasang) return;
  listenerIzinTerpasang = true;

  const mintaSaatAksi = () => {
    document.removeEventListener("click", mintaSaatAksi);
    document.removeEventListener("keydown", mintaSaatAksi);
    mintaIzinNotifikasi();
  };
  document.addEventListener("click", mintaSaatAksi);
  document.addEventListener("keydown", mintaSaatAksi);
}

// Dengarkan klik notifikasi yang diteruskan service worker ke tab ini
export function dengarKlikNotifikasi(
  callback: (data: DataNotifikasiChat) => void,
): () => void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return () => {};
  }
  const handler = (event: MessageEvent) => {
    if (event.data?.type === "notifikasi-chat-diklik") {
      callback(event.data.data as DataNotifikasiChat);
    }
  };
  navigator.serviceWorker.addEventListener("message", handler);
  navigator.serviceWorker.startMessages();
  return () => navigator.serviceWorker.removeEventListener("message", handler);
}

// Fallback beep menggunakan Web Audio API
function playBeepSound() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch {
    // Diabaikan (tidak ditampilkan di console browser)
  }
}

export function putarSuaraNotifikasi() {
  try {
    if (!audio) {
      audio = new Audio("/sounds/notification.mp3");
      audio.volume = 0.5;
      audio.preload = "auto";
    }
    audio.currentTime = 0;
    audio.play().catch(() => playBeepSound());
  } catch {
    playBeepSound();
  }
}

interface OpsiNotifikasiBrowser {
  judul: string;
  isi: string;
  tag: string;
  data: DataNotifikasiChat;
  // Dipakai hanya jika service worker tidak tersedia
  onClick?: () => void;
}

export async function tampilkanNotifikasiBrowser({
  judul,
  isi,
  tag,
  data,
  onClick,
}: OpsiNotifikasiBrowser) {
  if (!dukungNotifikasi() || Notification.permission !== "granted") return;

  // renotify: pesan berikutnya dengan tag yang sama tetap berbunyi/muncul
  const opsi: NotificationOptions & { renotify?: boolean } = {
    body: isi,
    icon: "/logoexpress.webp",
    badge: "/logoexpress.webp",
    tag,
    renotify: true,
    requireInteraction: false,
    data,
  };

  // Utama: lewat service worker (paling andal saat minimize / tab lain)
  const registrasi = await daftarkanServiceWorker();
  if (registrasi) {
    try {
      await registrasi.showNotification(judul, opsi);
      return;
    } catch {
      // Diabaikan (tidak ditampilkan di console browser)
    }
  }

  // Fallback: Notification API biasa
  try {
    const notification = new Notification(judul, opsi);
    notification.onclick = () => {
      window.focus();
      onClick?.();
      notification.close();
    };
  } catch {
    // Diabaikan (tidak ditampilkan di console browser)
  }
}

function pulihkanJudul() {
  if (halamanTidakDilihat()) return;
  jumlahBelumDibaca = 0;
  if (judulAsli !== null) {
    document.title = judulAsli;
    judulAsli = null;
  }
}

// Tampilkan "(n) Pesan Baru" di judul tab selama halaman tidak dilihat
export function tandaiJudulPesanBaru() {
  if (typeof document === "undefined" || !halamanTidakDilihat()) return;

  if (!listenerJudulTerpasang) {
    listenerJudulTerpasang = true;
    document.addEventListener("visibilitychange", pulihkanJudul);
    window.addEventListener("focus", pulihkanJudul);
  }

  if (judulAsli === null) judulAsli = document.title;
  jumlahBelumDibaca += 1;
  document.title = `(${jumlahBelumDibaca}) Pesan Baru - ${judulAsli}`;
}
