"use client";

import { useContext } from "react";
import { NotificationContext } from "@/app/internal/dashboard/components/NotificationContext";

export const useGlobalNotification = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    return {
      toasts: [],
      unreadCount: 0,
      addToast: () => {},
      removeToast: () => {},
      clearToasts: () => {},
      showSuccess: () => {},
      showError: () => {},
      showWarning: () => {},
      showMessage: () => {},
    };
  }

  const showSuccess = (message: string) => {
    context.addToast("System", message, 0, "success");
  };

  const showError = (message: string) => {
    context.addToast("System", message, 0, "error");
  };

  const showWarning = (message: string) => {
    context.addToast("System", message, 0, "warning");
  };

  const showMessage = (customerName: string, message: string) => {
    context.addToast(customerName, message, 0, "message");
  };

  return {
    ...context,
    showSuccess,
    showError,
    showWarning,
    showMessage,
  };
};
