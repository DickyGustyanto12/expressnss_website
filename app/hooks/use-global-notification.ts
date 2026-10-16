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
    context.addToast("System", message, "success");
  };

  const showError = (message: string) => {
    context.addToast("System", message, "error");
  };

  const showWarning = (message: string) => {
    context.addToast("System", message, "warning");
  };

  const showMessage = (customerName: string, message: string) => {
    context.addToast(customerName, message, "message");
  };

  return {
    ...context,
    showSuccess,
    showError,
    showWarning,
    showMessage,
  };
};
