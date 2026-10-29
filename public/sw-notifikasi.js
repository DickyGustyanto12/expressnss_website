self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const path = data.path || "/";
  const urlTujuan = new URL(data.url || path, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const semuaTab = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      const tab = semuaTab.find(
        (c) => new URL(c.url).pathname === path,
      );

      if (tab) {
        await tab.focus();
        tab.postMessage({ type: "notifikasi-chat-diklik", data });
        return;
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(urlTujuan);
      }
    })(),
  );
});
