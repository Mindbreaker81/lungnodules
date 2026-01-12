'use client';

import { useState } from 'react';
import { DISCLAIMERS } from '@config/guidelines';

interface DisclaimerProps {
  type?: 'general' | 'fleischner' | 'lungRads' | 'export';
  variant?: 'inline' | 'modal' | 'full';
  showExportButton?: boolean;
}

export default function Disclaimer({ 
  type = 'general', 
  variant = 'inline',
  showExportButton = false 
}: DisclaimerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const disclaimerText = DISCLAIMERS[type];

  const handleExport = () => {
    const blob = new Blob([disclaimerText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `disclaimer-${type}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (variant === 'inline') {
    return (
      <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        <div className="flex items-start gap-2">
          <span className="text-amber-500">⚠️</span>
          <div className="flex-1">
            <p className="whitespace-pre-line">{disclaimerText}</p>
            {showExportButton && (
              <button
                onClick={handleExport}
                className="mt-2 text-blue-600 hover:underline"
              >
                Export disclaimer
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900">Medical Disclaimer</h3>
            <p className="mt-2 whitespace-pre-line text-sm text-amber-800">{disclaimerText}</p>
            {showExportButton && (
              <button
                onClick={handleExport}
                className="mt-3 rounded-md bg-amber-100 px-3 py-1 text-sm text-amber-800 hover:bg-amber-200"
              >
                Export as text file
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Modal variant - collapsible
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-3 text-left text-xs text-slate-600 hover:bg-slate-100"
      >
        <span className="flex items-center gap-2">
          <span className="text-amber-500">⚠️</span>
          <span className="font-medium">Medical Disclaimer</span>
        </span>
        <span className="text-slate-400">{isExpanded ? '▼' : '▶'}</span>
      </button>
      {isExpanded && (
        <div className="border-t border-slate-200 p-3 text-xs text-slate-600">
          <p className="whitespace-pre-line">{disclaimerText}</p>
          {showExportButton && (
            <button
              onClick={handleExport}
              className="mt-2 text-blue-600 hover:underline"
            >
              Export disclaimer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
