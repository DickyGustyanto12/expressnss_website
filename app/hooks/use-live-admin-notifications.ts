"use client";

import { useState } from "react";
import { useLiveChatSocket } from "./use-live-chat-socket";
import { useNotification } from "@/app/internal/dashboard/components/NotificationContext";
import { mintaIzinNotifikasi } from "./chat-notification";

export const useAdminNotification = (adminId: number) => {
  const { unreadCount, resetUnreadCount } = useNotification();
  const { status } = useLiveChatSocket(null, null, true, adminId);
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default",
  );

  const requestNotificationPermission = async () => {
    const hasil = await mintaIzinNotifikasi();
    setPermission(hasil);
    return hasil;
  };

  return {
    unreadCount,
    permission,
    socketStatus: status,
    resetUnreadCount,
    requestNotificationPermission,
  };
};
