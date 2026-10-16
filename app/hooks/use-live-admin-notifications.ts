"use client";

import { useEffect, useRef, useState } from "react";
import { useLiveChatSocket } from "./use-live-chat-socket";

interface NotificationState {
  unreadCount: number;
  latestMessage: {
    id: number;
    customerName: string;
    message: string;
    timestamp: string;
  } | null;
  permission: NotificationPermission;
}

export const useAdminNotification = (adminId: number) => {
  const [state, setState] = useState<NotificationState>({
    unreadCount: 0,
    latestMessage: null,
    permission: "granted", // PERBAIKAN: Default granted
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioReady, setAudioReady] = useState(false);

  const { socket, status } = useLiveChatSocket(null, null, true, adminId);

  // Minta izin notifikasi browser otomatis (jika belum)
  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          setState((prev) => ({ ...prev, permission }));
        });
      } else {
        setState((prev) => ({ ...prev, permission: Notification.permission }));
      }
    }
  }, []);

  // Setup audio dengan fallback Web Audio API
  useEffect(() => {
    try {
      const audio = new Audio("/sounds/notification.mp3");
      audio.volume = 0.5;
      audio.preload = "auto";

      audio.oncanplaythrough = () => {
        setAudioReady(true);
      };

      audio.onerror = () => {
        console.warn("Audio file tidak ditemukan, menggunakan fallback");
        setAudioReady(false);
      };

      audioRef.current = audio;
    } catch (error) {
      console.error("Gagal membuat audio:", error);
      setAudioReady(false);
    }
  }, []);

  // Play sound dengan fallback beep
  const playNotificationSound = () => {
    if (audioReady && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        playBeepSound();
      });
    } else {
      playBeepSound();
    }
  };

  // Fallback beep menggunakan Web Audio API
  const playBeepSound = () => {
    try {
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
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

      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc2.frequency.setValueAtTime(880, ctx.currentTime);
        gain2.gain.setValueAtTime(0.3, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.2);
      }, 150);
    } catch (err) {
      console.warn("Web Audio API gagal:", err);
    }
  };

  const showBrowserNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      const notification = new Notification(title, {
        body,
        icon: "/logo.png",
        badge: "/logo.png",
        tag: "new-message",
        requireInteraction: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setTimeout(() => notification.close(), 5000);
    }
  };

  useEffect(() => {
    if (!socket || status !== "connected") return;

    const handleMessageNew = (data: any) => {
      if (data.senderType === "customer") {
        const pesanBaru = {
          id: data.id || Date.now(),
          customerName: data.customerName || "Customer",
          message: data.message,
          timestamp: new Date(data.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        setState((prev) => {
          const newUnreadCount = prev.unreadCount + 1;
          const originalTitle = document.title;
          document.title = `(${newUnreadCount}) Pesan Baru - Admin Panel`;

          setTimeout(() => {
            document.title = originalTitle;
          }, 3000);

          return {
            unreadCount: newUnreadCount,
            latestMessage: pesanBaru,
            permission: prev.permission,
          };
        });

        // PERBAIKAN: Selalu jalankan notifikasi (tidak bisa disable)
        playNotificationSound();
        showBrowserNotification(
          `Pesan Baru dari ${pesanBaru.customerName}`,
          pesanBaru.message,
        );
      }
    };

    socket.on("message:new", handleMessageNew);

    return () => {
      socket.off("message:new", handleMessageNew);
    };
  }, [socket, status, audioReady]);

  const resetUnreadCount = () => {
    setState((prev) => ({
      ...prev,
      unreadCount: 0,
    }));
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission }));
      return permission;
    }
    return "granted";
  };

  return {
    ...state,
    socketStatus: status,
    resetUnreadCount,
    requestNotificationPermission,
  };
};
