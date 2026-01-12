export default function HomePage() {
  return (
    <section className="space-y-4">
      <header>
        <p className="text-sm text-slate-500">Fleischner 2017 / Lung-RADS v2022</p>
        <h1 className="text-3xl font-semibold text-primary">Lung Nodule Decision Support</h1>
      </header>
      <p className="text-slate-700">
        Herramienta clínica para estandarizar recomendaciones de seguimiento de nódulos pulmonares.
      </p>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Estado</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
          <li>Algoritmos base (Fleischner, Lung-RADS) implementados en <code>lib/algorithms</code>.</li>
          <li>Validaciones Zod en <code>lib/schemas</code>.</li>
          <li>Próximo: wizard de evaluación en <code>/assessment</code>.</li>
        </ul>
      </div>
    </section>
  );
}
