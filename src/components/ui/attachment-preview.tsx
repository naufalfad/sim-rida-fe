'use client';

import React, { useState } from 'react';
import { FileText, Image, ExternalLink, Download, Eye, File, X } from 'lucide-react';

interface AttachmentPreviewProps {
  files?: string[];
  className?: string;
}

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  files = [],
  className,
}) => {
  const [activePreview, setActivePreview] = useState<string | null>(null);

  if (!files || files.length === 0) {
    return (
      <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border border-dashed border-slate-350 dark:border-slate-800 text-center text-xs text-slate-500">
        Tidak ada dokumen pendukung yang dilampirkan.
      </div>
    );
  }

  const getFileUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    const serverRoot = apiUrl.replace(/\/api\/v1\/?$/, '');
    return `${serverRoot}${path}`;
  };

  const getFileMeta = (path: string) => {
    const parts = path.split('/');
    const fullName = parts[parts.length - 1] || 'document.pdf';
    
    // Clean Multer random suffix for display (e.g. attachments-xxxx-timestamp.ext -> original_name)
    // multer format: attachments-id-date.ext
    let displayName = fullName;
    const cleanMatch = fullName.match(/^attachments-[^-]+-[^-]+\.(.+)$/);
    if (cleanMatch) {
      displayName = `Dokumen Pendukung.${cleanMatch[1]}`;
    }

    const ext = fullName.split('.').pop()?.toLowerCase() || '';
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    const isPdf = ext === 'pdf';
    
    return {
      displayName,
      fullName,
      ext: ext.toUpperCase(),
      isImage,
      isPdf,
      url: getFileUrl(path),
    };
  };

  return (
    <div className={className}>
      <div className="grid gap-3 sm:grid-cols-2">
        {files.map((file, idx) => {
          const meta = getFileMeta(file);
          return (
            <div 
              key={idx}
              className="flex flex-col justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/30 shadow-sm hover:shadow transition-all group"
            >
              <div className="flex items-start gap-3 overflow-hidden">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                  {meta.isImage ? (
                    <Image className="h-5 w-5" />
                  ) : meta.isPdf ? (
                    <FileText className="h-5 w-5 text-red-500" />
                  ) : (
                    <File className="h-5 w-5" />
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-350 truncate">
                    {meta.displayName}
                  </p>
                  <p className="text-[10px] text-slate-450 mt-0.5 uppercase font-mono">
                    Tipe: {meta.ext}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-900 mt-3 pt-3">
                {/* Download */}
                <a
                  href={meta.url}
                  download={meta.fullName}
                  className="flex flex-1 items-center justify-center gap-1.5 px-2.5 py-1.5 text-2xs font-semibold text-slate-655 dark:text-slate-400 hover:text-blue-650 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg border border-slate-250 dark:border-slate-800 transition"
                  title="Unduh File"
                >
                  <Download className="h-3 w-3" />
                  <span>Unduh</span>
                </a>

                {/* Inline Preview (only images/pdfs) */}
                {(meta.isImage || meta.isPdf) ? (
                  <button
                    type="button"
                    onClick={() => setActivePreview(meta.url)}
                    className="flex flex-1 items-center justify-center gap-1.5 px-2.5 py-1.5 text-2xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 dark:text-blue-400 rounded-lg transition"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Pratinjau</span>
                  </button>
                ) : (
                  <a
                    href={meta.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-1.5 px-2.5 py-1.5 text-2xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-400 rounded-lg transition"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Buka</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Modal */}
      {activePreview && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setActivePreview(null)}
        >
          <div 
            className="relative w-full max-w-4xl h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-slate-800">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Pratinjau Dokumen Pendukung
              </span>
              <button
                type="button"
                onClick={() => setActivePreview(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 flex items-center justify-center overflow-auto p-4">
              {activePreview.toLowerCase().endsWith('.pdf') ? (
                <iframe 
                  src={`${activePreview}#toolbar=0`}
                  className="w-full h-full border-none rounded-xl"
                  title="PDF Preview"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img 
                  src={activePreview} 
                  alt="Preview" 
                  className="max-w-full max-h-full object-contain rounded-lg shadow"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
