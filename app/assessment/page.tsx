import Link from "next/link";
import WizardContainer from "@components/wizard/WizardContainer";

export default function AssessmentPage() {
  return (
    <section className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-300"
        aria-label="Volver al inicio"
      >
        <span aria-hidden>←</span> Inicio
      </Link>
      <header className="space-y-1">
        <p className="text-sm text-slate-500">Wizard • Context → Risk/Scan → Nodule → Results</p>
        <h1 className="text-2xl font-semibold text-primary">Assessment Wizard</h1>
        <p className="text-slate-700">Ingresa los datos clínicos y del nódulo para obtener la recomendación.</p>
      </header>
      <WizardContainer />
    </section>
  );
}
