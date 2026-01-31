import Link from 'next/link';
import { GUIDELINE_VERSIONS, APP_VERSION } from '@config/guidelines';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center space-y-12 py-12 text-center">
      {/* Hero Section */}
      <div className="max-w-3xl space-y-6">
        <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20">
          Support Tool v{APP_VERSION}
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Lung Nodule Decision Support
        </h1>
        <p className="text-xl text-slate-400">
          Asistente clínico inteligente para el seguimiento de nódulos pulmonares basado en guías internacionales estandarizadas.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link
            href="/assessment"
            className="inline-flex items-center justify-center rounded-2xl bg-primary px-8 py-4 text-lg font-bold text-white transition-all hover:bg-accent hover:shadow-lg active:scale-95 shadow-primary/20 shadow-xl"
          >
            Comenzar Valoración
            <span className="material-symbols-outlined ml-2">arrow_forward</span>
          </Link>
        </div>
      </div>

      {/* Guidelines Section */}
      <div className="grid w-full grid-cols-1 gap-6 text-left sm:grid-cols-2">
        <div className="group rounded-xl border border-slate-800 bg-surface p-6 transition-all hover:border-primary/50 hover:shadow-xl">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl text-primary transition-colors group-hover:bg-primary group-hover:text-white">
            <span className="material-symbols-outlined">description</span>
          </div>
          <h2 className="text-xl font-bold text-white">{GUIDELINE_VERSIONS.fleischner.label}</h2>
          <p className="mt-2 text-slate-400 leading-relaxed text-sm">
            Criterios para el manejo de nódulos incidentales en pacientes {'>'}35 años. Clasificación por nivel de riesgo y morfología.
          </p>
          <div className="mt-4 text-xs font-mono text-slate-500">
            {GUIDELINE_VERSIONS.fleischner.citation}
          </div>
        </div>

        <div className="group rounded-xl border border-slate-800 bg-surface p-6 transition-all hover:border-primary/50 hover:shadow-xl">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl text-primary transition-colors group-hover:bg-primary group-hover:text-white">
            <span className="material-symbols-outlined">manage_search</span>
          </div>
          <h2 className="text-xl font-bold text-white">{GUIDELINE_VERSIONS.lungRads.label}</h2>
          <p className="mt-2 text-slate-400 leading-relaxed text-sm">
            Sistema de datos y reporte para el cribado de cáncer de pulmón. Clasificación estandarizada y recomendaciones de seguimiento.
          </p>
          <div className="mt-4 text-xs font-mono text-slate-500">
            {GUIDELINE_VERSIONS.lungRads.citation}
          </div>
        </div>
      </div>

      {/* Security/Privacy Note */}
      <p className="text-sm text-slate-500 max-w-lg">
        Toda la lógica de procesamiento es local. Los datos del paciente no se envían a ningún servidor ni se almacenan de forma persistente.
      </p>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/50 pt-8 mt-12">
        <div className="flex flex-col items-center justify-center gap-2 text-sm text-slate-500">
          <p>© 2026 Lung Nodule Tracker v{APP_VERSION}</p>
          <p className="text-xs">Desarrollado por <a href="https://github.com/mindbreaker81" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">mindbreaker81</a></p>
        </div>
      </footer>
    </div>
  );
}
