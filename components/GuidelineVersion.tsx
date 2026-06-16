'use client';

import { GUIDELINE_VERSIONS, APP_VERSION } from '@config/guidelines';

interface GuidelineVersionProps {
  guideline: 'fleischner-2017' | 'lung-rads-2022';
  showCitation?: boolean;
  compact?: boolean;
  showLabel?: boolean;
}

export default function GuidelineVersion({
  guideline,
  showCitation = false,
  compact = false,
  showLabel = true,
}: GuidelineVersionProps) {
  const info = guideline === 'fleischner-2017' 
    ? GUIDELINE_VERSIONS.fleischner 
    : GUIDELINE_VERSIONS.lungRads;

  if (compact) {
    const label = showLabel ? `${info.label} (v${info.version})` : `v${info.version}`;
    return (
      <span className="text-xs text-muted-foreground">
        {label}
      </span>
    );
  }

  return (
    <div className="rounded-md border border-border bg-muted p-3 text-xs text-foreground">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-foreground">{info.label}</p>
          <p>Versión: {info.version}</p>
          {showCitation && (
            <p className="mt-1 text-muted-foreground">
              {info.citation}
              {'doi' in info && info.doi && (
                <span className="ml-1">DOI: {info.doi}</span>
              )}
              {'url' in info && info.url && (
                <a 
                  href={info.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-1 text-primary hover:underline"
                >
                  Referencia
                </a>
              )}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-muted-foreground">Tool v{APP_VERSION}</p>
        </div>
      </div>
    </div>
  );
}
