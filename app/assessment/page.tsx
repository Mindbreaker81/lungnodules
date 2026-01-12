import WizardContainer from "@components/wizard/WizardContainer";

export default function AssessmentPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm text-slate-500">Wizard • Context → Risk/Scan → Nodule → Results</p>
        <h1 className="text-2xl font-semibold text-primary">Assessment Wizard</h1>
        <p className="text-slate-700">Ingresa los datos clínicos y del nódulo para obtener la recomendación.</p>
      </header>
      <WizardContainer />
    </section>
  );
}
