import Link from 'next/link';
import { GUIDELINE_VERSIONS } from '@config/guidelines';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center space-y-12 py-12 text-center">
      {/* Hero Section */}
      <div className="max-w-3xl space-y-6">
        <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-primary ring-1 ring-inset ring-blue-700/10">
          Support Tool v1.0
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
          Lung Nodule Decision Support
        </h1>
        <p className="text-xl text-slate-600">
          Asistente clínico inteligente para el seguimiento de nódulos pulmonares basado en guías internacionales estandarizadas.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link
            href="/assessment"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-4 text-lg font-bold text-white transition-all hover:bg-blue-700 hover:shadow-lg active:scale-95"
          >
            Comenzar Valoración
          </Link>
        </div>
      </div>

      {/* Guidelines Section */}
      <div className="grid w-full grid-cols-1 gap-6 text-left sm:grid-cols-2">
        <div className="group rounded-2xl border border-slate-200 bg-white p-8 transition-all hover:border-primary/20 hover:shadow-xl">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl text-primary transition-colors group-hover:bg-primary group-hover:text-white">
            📄
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{GUIDELINE_VERSIONS.fleischner.label}</h2>
          <p className="mt-2 text-slate-600 leading-relaxed text-sm">
            Criterios para el manejo de nódulos incidentales en pacientes {'>'}35 años. Clasificación por nivel de riesgo y morfología.
          </p>
          <div className="mt-4 text-xs font-mono text-slate-400">
            {GUIDELINE_VERSIONS.fleischner.citation}
          </div>
        </div>

        <div className="group rounded-2xl border border-slate-200 bg-white p-8 transition-all hover:border-primary/20 hover:shadow-xl">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
            🔍
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{GUIDELINE_VERSIONS.lungRads.label}</h2>
          <p className="mt-2 text-slate-600 leading-relaxed text-sm">
            Sistema de datos y reporte para el cribado de cáncer de pulmón. Clasificación estandarizada y recomendaciones de seguimiento.
          </p>
          <div className="mt-4 text-xs font-mono text-slate-400">
            {GUIDELINE_VERSIONS.lungRads.citation}
          </div>
        </div>
      </div>

      {/* Security/Privacy Note */}
      <p className="text-sm text-slate-400 max-w-lg">
        Toda la lógica de procesamiento es local. Los datos del paciente no se envían a ningún servidor ni se almacenan de forma persistente.
      </p>
    </div>
  );
}
