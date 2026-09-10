'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, File, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface MultiFileUploadProps {
  label?: string;
  helperText?: string;
  accept?: string;
  maxSizeMB?: number;
  value: File[];
  onChange: (files: File[]) => void;
  error?: string;
  className?: string;
}

export const MultiFileUpload: React.FC<MultiFileUploadProps> = ({
  label,
  helperText = 'PDF, DOC, DOCX, atau Gambar s.d. 10MB',
  accept = '.pdf,.doc,.docx,.png,.jpg,.jpeg',
  maxSizeMB = 10,
  value = [],
  onChange,
  error,
  className,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const processFiles = (fileList: FileList) => {
    const validFiles: File[] = [...value];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        alert(`File ${file.name} melebihi batas ukuran ${maxSizeMB}MB`);
        continue;
      }
      // Avoid duplicates by name
      if (!validFiles.some(f => f.name === file.name && f.size === file.size)) {
        validFiles.push(file);
      }
    }
    
    onChange(validFiles);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  const handleRemove = (indexToRemove: number) => {
    const updated = value.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        accept={accept}
        onChange={handleChange}
      />

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={cn(
          'flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-6 bg-slate-50/50 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/30 dark:hover:bg-slate-900/50 cursor-pointer transition-all mb-4',
          {
            'border-blue-500 bg-blue-50/30 dark:border-blue-500 dark:bg-blue-950/20': isDragActive,
            'border-black dark:border-white': !!error,
          }
        )}
      >
        <UploadCloud className="h-10 w-10 text-slate-400 mb-3" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Seret & taruh file di sini, atau <span className="text-blue-600 dark:text-blue-400 underline font-semibold">pilih file</span>
        </p>
        <p className="text-xs text-slate-450 dark:text-slate-500 mt-1">
          {helperText} (Bisa pilih beberapa file sekaligus)
        </p>
      </div>

      {value.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {value.map((file, idx) => (
            <div 
              key={`${file.name}-${idx}`} 
              className="flex items-center justify-between p-3 border border-black dark:border-white rounded-xl bg-slate-50 dark:bg-slate-900 animate-fade-in"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                  <File className="h-5 w-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-250 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-450 dark:text-slate-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(idx);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-1 text-xs text-slate-900 dark:text-slate-200 font-medium">{error}</p>
      )}
    </div>
  );
};
