"use client";

import React, { useEffect, useRef } from "react";

interface ReCaptchaProps {
  onChange: (token: string | null) => void;
}

declare global {
  interface Window {
    grecaptcha: any;
    recaptchaOnLoad: () => void;
  }
}

const ReCaptcha = ({ onChange }: ReCaptchaProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey) {
      console.warn("NEXT_PUBLIC_RECAPTCHA_SITE_KEY belum diisi di .env.local");
      return;
    }

    const render = () => {
      if (!containerRef.current || widgetIdRef.current !== null) return;
      widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onChangeRef.current(token),
        "expired-callback": () => onChangeRef.current(null),
      });
    };

    // Script sudah ada? Langsung render
    if (window.grecaptcha?.render) {
      render();
      return;
    }

    // Muat script reCAPTCHA sekali
    window.recaptchaOnLoad = render;
    const script = document.createElement("script");
    script.src =
      "https://www.google.com/recaptcha/api.js?onload=recaptchaOnLoad&render=explicit";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  return <div ref={containerRef} className="flex justify-start" />;
};

export default ReCaptcha;
