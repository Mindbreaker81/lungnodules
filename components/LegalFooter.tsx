'use client';

import { useState } from 'react';
import Link from 'next/link';
import { APP_VERSION } from '@config/guidelines';

export default function LegalFooter() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  return (
    <footer className="relative overflow-hidden border-t border-slate-800/50 bg-slate-950/50 backdrop-blur-sm">
      {/* Subtle animated background gradient */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0 animate-gradient-shift bg-gradient-to-br from-blue-600 via-slate-600 to-amber-600"
          style={{
            backgroundSize: '200% 200%',
            animationDuration: '20s',
          }}
        />
      </div>

      <div className="relative mx-auto w-full max-w-2xl px-4 pb-6 pt-4 lg:max-w-4xl">
        {/* Medical Warning Banner - Always Visible */}
        <div className="mb-4 rounded-lg border border-amber-900/30 bg-gradient-to-r from-amber-950/20 to-slate-950/20 p-3 backdrop-blur-sm transition-all hover:border-amber-800/50">
          <div className="flex items-start gap-3">
            {/* Animated warning icon */}
            <div className="relative mt-0.5 flex-shrink-0">
              <div className="absolute inset-0 animate-pulse rounded-full bg-amber-500/20" />
              <span
                className="relative text-lg"
                style={{
                  animation: 'subtle-glow 3s ease-in-out infinite',
                }}
              >
                ⚠️
              </span>
            </div>

            <div className="flex-1 text-xs">
              <p className="font-medium text-amber-200/90">
                Herramienta de Soporte de Decisión Clínica
              </p>
              <p className="mt-1 text-slate-400">
                Esta aplicación NO reemplaza el juicio médico profesional.
              </p>
            </div>

            <button
              onClick={() => setShowDisclaimer(!showDisclaimer)}
              className="group flex-shrink-0 rounded-md border border-slate-700 bg-slate-900/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-amber-700/50 hover:bg-amber-950/30 hover:text-amber-200"
              aria-label="Toggle disclaimer details"
            >
              <span className="flex items-center gap-1.5">
                {showDisclaimer ? (
                  <>
                    <span>Ocultar</span>
                    <span
                      className="transition-transform duration-300"
                      style={{
                        transform: showDisclaimer ? 'rotate(180deg)' : 'rotate(0)',
                      }}
                    >
                      ▼
                    </span>
                  </>
                ) : (
                  <>
                    <span>Leer más</span>
                    <span
                      className="transition-transform duration-300"
                      style={{
                        transform: showDisclaimer ? 'rotate(180deg)' : 'rotate(0)',
                      }}
                    >
                      ▼
                    </span>
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Expandable Disclaimer Details */}
          <div
            className={`overflow-hidden transition-all duration-500 ease-out ${
              showDisclaimer ? 'mt-3 max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="rounded-md border border-slate-800/50 bg-slate-950/50 p-3 text-[10px] leading-relaxed text-slate-400 backdrop-blur-sm">
              <div className="space-y-2">
                <p>
                  <strong className="text-slate-300">Limitación de responsabilidad:</strong>{' '}
                  Esta herramienta proporciona recomendaciones basadas en guías clínicas
                  (Fleischner 2017, Lung-RADS v2022). Los profesionales de la salud deben
                  verificar siempre las recomendaciones y aplicar su propio juicio clínico.
                </p>
                <p>
                  <strong className="text-slate-300">Privacidad de datos:</strong> No se
                  recopila, almacena ni transmite información de pacientes. Todos los
                  cálculos se realizan localmente en el navegador.
                </p>
                <p>
                  <strong className="text-slate-300">Uso profesional:</strong> Esta herramienta
                  está diseñada exclusivamente para profesionales de la salud cualificados.
                </p>
                <p className="pt-2">
                  <Link
                    href="/MEDICAL_DISCLAIMER.md"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-400 transition-colors hover:text-blue-300"
                  >
                    <span>Ver disclaimer completo</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright and Links */}
        <div className="flex flex-col items-center gap-2 border-t border-slate-800/50 pt-3 text-center text-[10px] text-slate-500 xs:flex-row xs:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-2 xs:justify-start">
            <span>© 2026</span>
            <a
              href="https://github.com/mindbreaker81"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-slate-300"
            >
              mindbreaker81
            </a>
            <span className="hidden text-slate-700 xs:inline">•</span>
            <span className="hidden xs:inline">v{APP_VERSION}</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-3 xs:justify-end" aria-label="Legal navigation">
            <Link
              href="/MEDICAL_DISCLAIMER.md"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-slate-300"
            >
              Disclaimer Médico
            </Link>
            <Link
              href="/LICENSE"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-slate-300"
            >
              Licencia MIT
            </Link>
            <a
              href="https://github.com/mindbreaker81/lungnodules"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-slate-300"
            >
              GitHub
            </a>
          </nav>
        </div>

        {/* Additional Attribution */}
        <p className="mt-3 text-center text-[9px] text-slate-600">
          No afiliado con la Fleischner Society ni el American College of Radiology.
        </p>
      </div>

      <style jsx>{`
        @keyframes gradient-shift {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes subtle-glow {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
      `}</style>
    </footer>
  );
}
