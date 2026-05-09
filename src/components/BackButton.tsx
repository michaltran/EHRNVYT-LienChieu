'use client';

import { useRouter } from 'next/navigation';

export default function BackButton({ label = 'Quay lại' }: { label?: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="group inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-brand-50 hover:border-brand-400 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300 transition-all shadow-sm hover:shadow-md"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="group-hover:-translate-x-0.5 transition-transform"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      <span>{label}</span>
    </button>
  );
}
