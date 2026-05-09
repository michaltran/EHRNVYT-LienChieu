'use client';

import { useEffect } from 'react';

export default function PrintButton({ docTitle }: { docTitle?: string }) {
  // Set document.title để browser dùng làm tên file khi Save as PDF
  useEffect(() => {
    if (docTitle) document.title = docTitle;
  }, [docTitle]);

  return (
    <button
      onClick={() => {
        if (docTitle) document.title = docTitle;  // set lại lần nữa ngay trước khi print
        window.print();
      }}
      className="btn-primary"
    >
      🖨 In / Xuất PDF
    </button>
  );
}
