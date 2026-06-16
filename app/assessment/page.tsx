import Link from "next/link";
import WizardContainer from "@components/wizard/WizardContainer";

export default function AssessmentPage() {
  return (
    <section className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Volver al inicio"
      >
        <span aria-hidden>←</span> Inicio
      </Link>
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">Asistente • Contexto → Riesgo/TC → Nódulo → Resultados</p>
        <h1 className="text-2xl font-semibold text-primary">Asistente de Evaluación</h1>
        <p className="text-muted-foreground">Ingresa los datos clínicos y del nódulo para obtener la recomendación.</p>
      </header>
      <WizardContainer />
    </section>
  );
}
