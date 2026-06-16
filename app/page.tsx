import Link from 'next/link';
import Image from 'next/image';
import { GUIDELINE_VERSIONS, APP_VERSION } from '@config/guidelines';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@components/ui/card";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center space-y-12 py-12 text-center">
      {/* Hero con imagen de fondo */}
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-card/80">
        <div className="absolute inset-0">
          <Image
            src="/icons/fondo.jpg"
            alt=""
            fill
            className="object-cover opacity-40"
            sizes="(max-width: 768px) 100vw, 896px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background/80" aria-hidden />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-6 px-6 py-10 sm:py-12">
          <Image
            src="/icons/icon.svg"
            alt=""
            className="h-14 w-14 shrink-0 sm:h-16 sm:w-16"
            width={64}
            height={64}
          />
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20">
              Support Tool v{APP_VERSION}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-card-foreground sm:text-4xl lg:text-5xl">
              Lung Nodule Decision Support
            </h1>
          </div>
        </div>
      </div>

      {/* Development notice */}
      <div
        className="w-full max-w-2xl rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-center text-sm text-foreground/95"
        role="status"
        aria-live="polite"
      >
        <span className="font-medium">Aplicación en proceso de desarrollo.</span>
        {' '}
        La funcionalidad puede cambiar. Utilice siempre criterio clínico y guías oficiales.
      </div>

      {/* Hero text + CTA */}
      <div className="max-w-3xl space-y-6">
        <p className="text-xl text-muted-foreground">
          Asistente clínico inteligente para el seguimiento de nódulos pulmonares basado en guías internacionales estandarizadas.
        </p>
        <p className="text-sm text-muted-foreground">
          Calcule elegibilidad para cribado (riesgo a 6 años) o evalúe un nódulo ya detectado (Fleischner / Lung-RADS).
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link
            href="/eligibility"
            className="inline-flex items-center justify-center rounded-2xl border-2 border-primary/60 bg-primary/10 px-6 py-3.5 text-base font-bold text-primary transition-all hover:bg-primary/20 hover:border-primary active:scale-95"
          >
            Elegibilidad para cribado
            <span className="material-symbols-outlined ml-2">person_search</span>
          </Link>
          <Link
            href="/assessment"
            className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground transition-all hover:bg-accent hover:shadow-lg active:scale-95 shadow-xl"
          >
            Evaluar nódulo
            <span className="material-symbols-outlined ml-2">arrow_forward</span>
          </Link>
        </div>
      </div>

      {/* Guidelines Section */}
      <div className="grid w-full grid-cols-1 gap-6 text-left sm:grid-cols-2">
        <Card className="group transition-all hover:border-primary/50 hover:shadow-xl bg-card border-border">
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <span className="material-symbols-outlined">description</span>
            </div>
            <CardTitle className="text-xl font-bold text-card-foreground">{GUIDELINE_VERSIONS.fleischner.label}</CardTitle>
            <CardDescription className="mt-2 leading-relaxed text-sm">
              Criterios para el manejo de nódulos incidentales en pacientes {'>'}35 años. Clasificación por nivel de riesgo y morfología.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-mono text-muted-foreground">
              {GUIDELINE_VERSIONS.fleischner.citation}
            </div>
          </CardContent>
        </Card>

        <Card className="group transition-all hover:border-primary/50 hover:shadow-xl bg-card border-border">
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <span className="material-symbols-outlined">manage_search</span>
            </div>
            <CardTitle className="text-xl font-bold text-card-foreground">{GUIDELINE_VERSIONS.lungRads.label}</CardTitle>
            <CardDescription className="mt-2 leading-relaxed text-sm">
              Sistema de datos y reporte para el cribado de cáncer de pulmón. Clasificación estandarizada y recomendaciones de seguimiento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-mono text-muted-foreground">
              {GUIDELINE_VERSIONS.lungRads.citation}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security/Privacy Note */}
      <p className="text-sm text-muted-foreground max-w-lg">
        Toda la lógica de procesamiento es local. Los datos del paciente no se envían a ningún servidor ni se almacenan de forma persistente.
      </p>

      {/* Footer */}
      <footer className="w-full border-t border-border pt-8 mt-12">
        <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <p>© 2026 Lung Nodule Tracker v{APP_VERSION}</p>
          <p className="text-xs">Desarrollado por <a href="https://github.com/mindbreaker81" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">mindbreaker81</a></p>
        </div>
      </footer>
    </div>
  );
}
