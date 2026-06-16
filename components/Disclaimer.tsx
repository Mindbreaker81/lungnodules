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
      <div className="rounded-md border border-border bg-muted p-3 text-xs text-foreground">
        <div className="flex items-start gap-2">
          <span className="text-warning">⚠️</span>
          <div className="flex-1">
            <p className="whitespace-pre-line">{disclaimerText}</p>
            {showExportButton && (
              <button
                onClick={handleExport}
                className="mt-2 text-primary hover:underline"
              >
                Exportar disclaimer
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Disclaimer Médico</h3>
            <p className="mt-2 whitespace-pre-line text-sm text-foreground">{disclaimerText}</p>
            {showExportButton && (
              <button
                onClick={handleExport}
                className="mt-3 rounded-md bg-warning/20 px-3 py-1 text-sm text-foreground hover:bg-warning/30"
              >
                Exportar como archivo de texto
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Modal variant - collapsible
  return (
    <div className="rounded-md border border-border bg-muted">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-3 text-left text-xs text-foreground hover:bg-muted/80"
      >
        <span className="flex items-center gap-2">
          <span className="text-warning">⚠️</span>
          <span className="font-medium">Disclaimer Médico</span>
        </span>
        <span className="text-muted-foreground">{isExpanded ? '▼' : '▶'}</span>
      </button>
      {isExpanded && (
        <div className="border-t border-border p-3 text-xs text-foreground">
          <p className="whitespace-pre-line">{disclaimerText}</p>
          {showExportButton && (
            <button
              onClick={handleExport}
              className="mt-2 text-primary hover:underline"
            >
              Exportar disclaimer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
