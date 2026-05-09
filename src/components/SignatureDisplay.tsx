type Props = {
  signatureDataUrl?: string | null;
  name?: string | null;
  title?: string | null;
  signedAt?: string | Date | null;
  compact?: boolean;
};

/** Tách signatureDataUrl thành ảnh + thông tin CA. Format mới: "CA:<hash>|||IMG:<dataUrl>"
 *  hoặc legacy: "CA:<hash>" (chỉ CA, không ảnh) hoặc "data:image/..." (chỉ ảnh canvas).
 */
function parseSignature(raw?: string | null): { image: string | null; caHash: string | null } {
  if (!raw) return { image: null, caHash: null };
  if (raw.startsWith('CA:')) {
    const sep = raw.indexOf('|||IMG:');
    if (sep > 0) {
      return { caHash: raw.slice(3, sep), image: raw.slice(sep + 7) };
    }
    return { caHash: raw.slice(3), image: null };
  }
  return { caHash: null, image: raw };
}

export default function SignatureDisplay({ signatureDataUrl, name, title, signedAt, compact }: Props) {
  const { image, caHash } = parseSignature(signatureDataUrl);

  if (!signatureDataUrl && !name) {
    return <div className="text-xs text-slate-400 italic">Chưa ký</div>;
  }

  const time = signedAt ? new Date(signedAt) : null;
  const timeStr = time
    ? `${time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${time.toLocaleDateString('vi-VN')}`
    : '';

  const CABadge = ({ small }: { small?: boolean }) => (
    <span
      className={`inline-block bg-green-50 border border-green-500 rounded text-green-800 font-semibold ${
        small ? 'text-[8px] px-1 py-0' : 'text-[10px] px-1.5 py-0.5'
      }`}
      title={`Ký số VNPT SmartCA — Hash: ${caHash}`}
    >
      ✓ SmartCA
    </span>
  );

  if (compact) {
    return (
      <div className="text-xs text-slate-600 flex items-center gap-1.5 flex-wrap">
        {image && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={image} alt="" className="inline-block align-middle" style={{ maxHeight: 28 }} />
        )}
        {caHash && <CABadge small />}
        <span>{name}{title && ` (${title})`}{timeStr && ` — ${timeStr}`}</span>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="italic text-xs text-slate-600 mb-1">
        {time && `Ký lúc ${timeStr}`}
      </div>
      <div style={{ minHeight: 60 }} className="flex flex-col items-center justify-center gap-1">
        {image && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={image} alt="" style={{ maxHeight: 60, maxWidth: 200 }} />
        )}
        {caHash && (
          <div className="border border-green-600 bg-green-50 rounded px-2 py-0.5 text-[10px] text-green-800 font-semibold">
            ✓ Đã ký số VNPT SmartCA
            <span className="font-mono text-[8px] block opacity-70">#{caHash.slice(0, 16)}…</span>
          </div>
        )}
        {!image && !caHash && (
          <div className="text-xs text-slate-400">(chưa có chữ ký)</div>
        )}
      </div>
      <div className="font-semibold text-sm">{name}</div>
      {title && <div className="text-xs text-slate-600 italic">{title}</div>}
    </div>
  );
}
