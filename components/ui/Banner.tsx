"use client";

import { useState, useEffect, useRef } from "react";

interface HeroBannerItem {
  id: number;
  judul: string;
  deskripsi: string;
  gambar_url: string;
  badge_text: string;
  button_text: string;
  button_link: string;
  is_active: number;
  urutan: number;
}

interface BannerProps {
  onBukaChat?: () => void;
}

const Banner = ({ onBukaChat }: BannerProps) => {
  const [slides, setSlides] = useState<HeroBannerItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const preloadRef = useRef<HTMLImageElement[]>([]);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch("/api/hero-banner");
        const data = await res.json();
        if (res.ok) {
          const activeBanners = data
            .filter((b: HeroBannerItem) => b.is_active === 1)
            .sort(
              (a: HeroBannerItem, b: HeroBannerItem) => a.urutan - b.urutan,
            );
          setSlides(activeBanners);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Gagal memuat hero banner:", error);
        setIsLoading(false);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;

    slides.forEach((slide, index) => {
      const img = new Image();
      img.src = slide.gambar_url;
      img.onload = () => {
        setLoadedImages((prev) => {
          const newSet = new Set(prev);
          newSet.add(index);
          return newSet;
        });
      };
      preloadRef.current[index] = img;
    });
  }, [slides]);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? slides.length - 1 : prevIndex - 1,
    );
  };

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [currentIndex, slides.length]);

  if (isLoading || slides.length === 0) {
    return (
      <div className="relative w-full h-[520px] sm:h-[600px] md:h-[800px] lg:h-[750px] bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-sm font-semibold">Memuat banner...</p>
        </div>
      </div>
    );
  }

  const currentSlide = slides[currentIndex];

  return (
    <div className="relative w-full h-[520px] sm:h-[600px] md:h-[800px] lg:h-[750px] overflow-hidden group">
      <style>
        {`
            @keyframes slideInFromRight {
                0% { opacity: 0; transform: translateX(100px); }
                100% { opacity: 1; transform: translateX(0); }
            }
            .animate-slide-right {
                animation: slideInFromRight 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
            }
            
            @keyframes fillProgress {
                0% { width: 0%; }
                100% { width: 100%; }
            }
            .animate-progress {
                animation: fillProgress 3s linear forwards; 
            }
            `}
      </style>

      {slides.map((slide, index) => (
        <img
          key={slide.id}
          src={slide.gambar_url}
          alt={`Hero Banner ${index + 1}`}
          loading={index === 0 ? "eager" : "lazy"}
          fetchPriority={index === 0 ? "high" : "auto"}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? "opacity-100 z-0" : "opacity-0 -z-10"
          }`}
        />
      ))}

      {/* PERBAIKAN: Overlay lebih terang - gambar terlihat jelas */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/25 to-transparent z-10"></div>

      {/* Gradient bawah untuk transisi halus */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/20 to-transparent z-10"></div>

      <button
        onClick={prevSlide}
        className="hidden md:block absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 p-2 md:p-3 bg-white/10 hover:bg-white/30 border border-white/20 text-white rounded-full backdrop-blur-md transition-all opacity-70 hover:opacity-100 cursor-pointer"
      >
        <svg
          className="w-6 h-6 md:w-8 md:h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <button
        onClick={nextSlide}
        className="hidden md:block absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 p-2 md:p-3 bg-white/10 hover:bg-white/30 border border-white/20 text-white rounded-full backdrop-blur-md transition-all opacity-70 hover:opacity-100 cursor-pointer"
      >
        <svg
          className="w-6 h-6 md:w-8 md:h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      <div className="absolute bottom-10 md:bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`relative h-2 rounded-full overflow-hidden transition-all duration-500 cursor-pointer ${
              index === currentIndex
                ? "w-16 bg-white/30"
                : "w-2 bg-white/50 hover:bg-white/80"
            }`}
          >
            {index === currentIndex && (
              <div
                key={currentIndex}
                className="absolute top-0 left-0 h-full bg-yellow-400 animate-progress"
              ></div>
            )}
          </button>
        ))}
      </div>

      <div className="absolute inset-0 flex flex-col justify-center lg:mx-20 px-5 sm:px-8 md:px-14 lg:px-24 z-20 w-full pointer-events-none">
        <div
          key={currentIndex}
          className="max-w-3xl animate-slide-right pointer-events-auto"
        >
          {currentSlide.badge_text && (
            <span className="inline-block py-1 px-2.5 md:py-2 md:px-3 rounded-sm bg-yellow-400 border border-blue-500/30 text-black text-[10px] sm:text-xs md:text-sm font-semibold tracking-wider mb-3 md:mb-6 backdrop-blur-sm shadow-lg">
              {currentSlide.badge_text}
            </span>
          )}

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight text-white mb-3 md:mb-6 leading-tight drop-shadow-2xl]">
            {currentSlide.judul}
          </h1>

          <p className="text-sm sm:text-base md:text-xl lg:text-2xl text-white lg:font-extralight leading-relaxed mb-6 md:mb-10 font-light max-w-2xl drop-shadow-2xl ]">
            {currentSlide.deskripsi}
          </p>

          {currentSlide.button_text && (
            <div className="flex flex-col sm:flex-row gap-3 md:gap-5">
              <a
                href={currentSlide.button_link || "#"}
                onClick={(e) => {
                  if (
                    currentSlide.button_link === "#kontak" ||
                    currentSlide.button_link === "#"
                  ) {
                    e.preventDefault();
                    onBukaChat?.();
                  }
                }}
                className="cursor-pointer group rounded-sm flex items-center justify-center gap-2 bg-white text-slate-900 font-extrabold px-5 w-fit py-2.5 text-sm md:px-8 md:py-4 md:text-lg transition-all duration-300 hover:bg-yellow-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(250,204,21,0.5)] shadow-xl"
              >
                <svg
                  className="w-4 h-4 md:w-5 md:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  ></path>
                </svg>
                <span>{currentSlide.button_text}</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Banner;
