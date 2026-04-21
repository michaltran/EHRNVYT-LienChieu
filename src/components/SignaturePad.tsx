'use client';

import { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';

type Props = {
  value?: string | null;
  onChange: (dataUrl: string | null) => void;
  savedSignature?: string | null; // chữ ký đã lưu trong profile bác sĩ
};

export default function SignaturePad({ value, onChange, savedSignature }: Props) {
  const ref = useRef<SignatureCanvas>(null);
  const [useSaved, setUseSaved] = useState(!!value);

  useEffect(() => {
    if (value && ref.current && !useSaved) {
      ref.current.fromDataURL(value);
    }
  }, []);

  function clear() {
    ref.current?.clear();
    onChange(null);
    setUseSaved(false);
  }

  function save() {
    const dataUrl = ref.current?.toDataURL('image/png');
    if (dataUrl) onChange(dataUrl);
  }

  function applySaved() {
    if (savedSignature) {
      onChange(savedSignature);
      setUseSaved(true);
    }
  }

  return (
    <div className="space-y-2">
      {useSaved && value ? (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Chữ ký" className="h-24 bg-white border border-slate-300 rounded p-2" />
        </div>
      ) : (
        <SignatureCanvas
          ref={ref}
          canvasProps={{ className: 'sig-canvas', width: 500, height: 140 }}
          onEnd={save}
        />
      )}
      <div className="flex gap-2 text-xs">
        <button type="button" onClick={clear} className="btn-secondary py-1">Xóa</button>
        {savedSignature && !useSaved && (
          <button type="button" onClick={applySaved} className="btn-secondary py-1">
            Dùng chữ ký đã lưu
          </button>
        )}
        {useSaved && (
          <button type="button" onClick={() => { onChange(null); setUseSaved(false); }} className="btn-secondary py-1">
            Ký mới
          </button>
        )}
      </div>
    </div>
  );
}
