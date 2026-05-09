'use client';

import { useRef, useState, useEffect, forwardRef, ReactNode } from 'react';
// @ts-ignore - react-pageflip không có types built-in
import HTMLFlipBook from 'react-pageflip';
import { useRouter } from 'next/navigation';

type Props = {
  pages: ReactNode[];
  title?: string;
  subtitle?: string;
};

const Page = forwardRef<HTMLDivElement, { children: ReactNode; number: number; total: number }>(
  ({ children, number, total }, ref) => {
    const isLeft = number % 2 === 0;
    return (
      <div
        ref={ref}
        className="page"
        style={{
          background: '#FFFFFF',
          fontFamily: 'Times New Roman, serif',
          fontSize: '12.5pt',
          lineHeight: 1.5,
          color: '#0F172A',
          padding: '14mm 18mm',
          boxSizing: 'border-box',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Bóng mép gáy: trang chẵn (trái) đổ bóng phải, trang lẻ (phải) đổ bóng trái */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: 14,
            ...(isLeft ? { right: 0 } : { left: 0 }),
            background: isLeft
              ? 'linear-gradient(270deg, rgba(0,0,0,0.18), transparent)'
              : 'linear-gradient(90deg, rgba(0,0,0,0.18), transparent)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ height: '100%', overflow: 'hidden', position: 'relative' }}>
          {children}
          <div
            style={{
              position: 'absolute',
              bottom: -4,
              ...(isLeft ? { left: 8 } : { right: 8 }),
              fontSize: '10pt',
              color: '#9CA3AF',
              fontStyle: 'italic',
            }}
          >
            {number}
          </div>
        </div>
      </div>
    );
  },
);
Page.displayName = 'Page';

export default function BookViewer({ pages, title, subtitle }: Props) {
  const bookRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [dim, setDim] = useState({ w: 600, h: 848 });
  const [showTOC, setShowTOC] = useState(false);
  const [isFs, setIsFs] = useState(false);
  const total = pages.length;

  useEffect(() => {
    const calc = () => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      // Trừ topbar 56 + bottombar 56 + padding 32
      const targetH = Math.max(440, Math.min(vh - 144, 1100));
      const targetW = Math.round(targetH / Math.SQRT2);
      const maxWByWidth = Math.floor((vw - 160) / 2); // 80px arrow space mỗi bên
      const finalW = Math.max(280, Math.min(targetW, maxWByWidth));
      const finalH = Math.round(finalW * Math.SQRT2);
      setDim({ w: finalW, h: finalH });
    };
    calc();
    setIsReady(true);
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') bookRef.current?.pageFlip()?.flipNext();
      if (e.key === 'ArrowLeft') bookRef.current?.pageFlip()?.flipPrev();
      if (e.key === 'Escape') {
        if (document.fullscreenElement) document.exitFullscreen();
        else router.back();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);

  useEffect(() => {
    const onFsChange = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const next = () => bookRef.current?.pageFlip()?.flipNext();
  const prev = () => bookRef.current?.pageFlip()?.flipPrev();
  const first = () => bookRef.current?.pageFlip()?.flip(0);
  const last = () => bookRef.current?.pageFlip()?.flip(total - 1);
  const goTo = (n: number) => bookRef.current?.pageFlip()?.flip(n);
  const toggleFs = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else containerRef.current?.requestFullscreen();
  };

  const pageRangeLabel =
    currentPage + 1 === total
      ? `${total}`
      : `${currentPage + 1} - ${Math.min(currentPage + 2, total)}`;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-white"
    >
      {/* TOP BAR */}
      <div className="h-14 bg-slate-800 text-white flex items-center justify-between px-3 md:px-5 flex-shrink-0 border-b border-slate-700">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded hover:bg-white/10 transition"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M6 6l12 12M18 6l-12 12" strokeLinecap="round" />
          </svg>
          <span className="font-medium text-sm hidden sm:inline">Thoát</span>
        </button>

        <div className="text-center flex-1 mx-2 min-w-0">
          <div className="font-semibold text-sm md:text-base truncate">{title || 'Sổ Khám Sức Khỏe Định Kỳ'}</div>
          {subtitle && <div className="text-[11px] text-slate-300 truncate hidden sm:block">{subtitle}</div>}
        </div>

        <button
          onClick={() => alert('Bấm/kéo góc trang để lật • ← → chuyển trang • F11 hoặc nút ⛶ để toàn màn hình • Esc để thoát')}
          className="w-9 h-9 rounded-full hover:bg-white/10 transition flex items-center justify-center"
          title="Trợ giúp"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* BOOK AREA */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-white">
        {/* Side arrows */}
        <button
          onClick={prev}
          disabled={currentPage === 0}
          className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-20 md:w-14 md:h-24 bg-white/80 hover:bg-white shadow-lg rounded-full flex items-center justify-center text-slate-600 hover:text-brand-600 transition disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200 backdrop-blur"
          title="Trang trước (←)"
          aria-label="Trang trước"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button
          onClick={next}
          disabled={currentPage >= total - 1}
          className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-20 md:w-14 md:h-24 bg-white/80 hover:bg-white shadow-lg rounded-full flex items-center justify-center text-slate-600 hover:text-brand-600 transition disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200 backdrop-blur"
          title="Trang sau (→)"
          aria-label="Trang sau"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* The book */}
        <div
          className={`transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'} relative`}
          style={{
            filter: 'drop-shadow(0 25px 50px rgba(15,23,42,0.25)) drop-shadow(0 4px 8px rgba(15,23,42,0.1))',
          }}
          key={`${dim.w}-${dim.h}`}
        >
          {/* Center spine shadow */}
          <div
            className="absolute top-0 bottom-0 left-1/2 w-[10px] -translate-x-1/2 pointer-events-none z-10"
            style={{
              background: 'linear-gradient(90deg, rgba(0,0,0,0.0), rgba(0,0,0,0.20) 50%, rgba(0,0,0,0.0))',
            }}
          />
          {/* @ts-ignore */}
          <HTMLFlipBook
            ref={bookRef}
            width={dim.w}
            height={dim.h}
            size="fixed"
            minWidth={280}
            maxWidth={900}
            minHeight={400}
            maxHeight={1300}
            drawShadow
            flippingTime={650}
            usePortrait={false}
            showCover={false}
            mobileScrollSupport
            onFlip={(e: any) => setCurrentPage(e.data)}
            className="book-flip"
            style={{}}
            startPage={0}
            maxShadowOpacity={0.4}
            autoSize={false}
            showPageCorners
            disableFlipByClick={false}
          >
            {pages.map((content, i) => (
              <Page key={i} number={i + 1} total={total}>
                {content}
              </Page>
            ))}
          </HTMLFlipBook>
        </div>
      </div>

      {/* TOC drawer */}
      {showTOC && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowTOC(false)} />
          <div className="fixed left-0 top-14 bottom-14 w-72 bg-white z-50 shadow-2xl overflow-y-auto">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Mục lục</h3>
              <button onClick={() => setShowTOC(false)} className="text-slate-400 hover:text-slate-700">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6l-12 12" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="p-2">
              {pages.map((_, i) => {
                const active = i === currentPage || i === currentPage + 1;
                return (
                  <button
                    key={i}
                    onClick={() => { goTo(i); setShowTOC(false); }}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition ${
                      active ? 'bg-brand-100 text-brand-700 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Trang {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* BOTTOM BAR */}
      <div className="h-14 bg-slate-800 text-white flex items-center justify-between px-2 md:px-5 flex-shrink-0">
        <button
          onClick={() => setShowTOC(true)}
          className="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded hover:bg-white/10 transition"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round"/></svg>
          <span className="text-sm font-medium hidden sm:inline">Mục lục</span>
        </button>

        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <button onClick={first} disabled={currentPage === 0}
            className="w-9 h-9 flex items-center justify-center rounded hover:bg-white/10 disabled:opacity-30 transition" title="Trang đầu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 18l-6-6 6-6M19 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button onClick={prev} disabled={currentPage === 0}
            className="w-9 h-9 flex items-center justify-center rounded hover:bg-white/10 disabled:opacity-30 transition" title="Trang trước">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="px-3 md:px-4 py-1.5 mx-1 bg-white/10 rounded text-sm font-medium min-w-[80px] text-center">
            {pageRangeLabel}
          </div>
          <button onClick={next} disabled={currentPage >= total - 1}
            className="w-9 h-9 flex items-center justify-center rounded hover:bg-white/10 disabled:opacity-30 transition" title="Trang sau">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button onClick={last} disabled={currentPage >= total - 1}
            className="w-9 h-9 flex items-center justify-center rounded hover:bg-white/10 disabled:opacity-30 transition" title="Trang cuối">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M13 18l6-6-6-6M5 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <button
          onClick={toggleFs}
          className="w-9 h-9 flex items-center justify-center rounded hover:bg-white/10 transition"
          title={isFs ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
        >
          {isFs ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 9V4H4M15 9h5V4M9 15H4v5M15 15h5v5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
