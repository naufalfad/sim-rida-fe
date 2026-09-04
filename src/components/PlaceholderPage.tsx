import React from 'react';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-850 rounded-lg p-8 text-center shadow-sm max-w-2xl mx-auto my-6 font-sans">
      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-full text-blue-600 dark:text-blue-400 mb-4 shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mb-6 leading-relaxed">{description}</p>
      <div className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 font-semibold text-2xs rounded-full border border-blue-200 dark:border-blue-800">
        Modul ini akan tersedia pada fase pengembangan berikutnya.
      </div>
    </div>
  );
}
