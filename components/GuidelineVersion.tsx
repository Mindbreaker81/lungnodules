'use client';

import { GUIDELINE_VERSIONS, APP_VERSION } from '@config/guidelines';

interface GuidelineVersionProps {
  guideline: 'fleischner-2017' | 'lung-rads-2022';
  showCitation?: boolean;
  compact?: boolean;
}

export default function GuidelineVersion({ guideline, showCitation = false, compact = false }: GuidelineVersionProps) {
  const info = guideline === 'fleischner-2017' 
    ? GUIDELINE_VERSIONS.fleischner 
    : GUIDELINE_VERSIONS.lungRads;

  if (compact) {
    return (
      <span className="text-xs text-slate-500">
        {info.label} (v{info.version})
      </span>
    );
  }

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-slate-700">{info.label}</p>
          <p>Version: {info.version}</p>
          {showCitation && (
            <p className="mt-1 text-slate-500">
              {info.citation}
              {'doi' in info && info.doi && (
                <span className="ml-1">DOI: {info.doi}</span>
              )}
              {'url' in info && info.url && (
                <a 
                  href={info.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-1 text-blue-600 hover:underline"
                >
                  Reference
                </a>
              )}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-slate-500">Tool v{APP_VERSION}</p>
        </div>
      </div>
    </div>
  );
}
