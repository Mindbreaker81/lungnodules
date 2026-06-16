import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BIBLIOGRAPHY,
  REFERENCE_CATEGORIES,
  type ReferenceLinkKind,
} from '@config/references';
import { APP_VERSION } from '@config/guidelines';

export const metadata: Metadata = {
  title: 'Referencias bibliográficas | Lung Nodule Decision Support',
  description:
    'Artículos, guías y herramientas clínicas que sustentan los algoritmos y modelos predictivos de la aplicación.',
};

const LINK_KIND_LABELS: Record<ReferenceLinkKind, string> = {
  pubmed: 'PubMed',
  pmc: 'PMC',
  doi: 'DOI',
  web: 'Web',
};

export default function ReferencesPage() {
  return (
    <section className="space-y-8 pb-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Volver al inicio"
      >
        <span aria-hidden>←</span> Inicio
      </Link>

      <header className="space-y-3">
        <p className="text-sm text-muted-foreground">Documentación clínica</p>
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Referencias bibliográficas
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Fuentes utilizadas por esta herramienta (v{APP_VERSION}). Los enlaces apuntan a
          PubMed, PMC, DOI o sitios oficiales cuando están disponibles. La app no está
          afiliada con la Fleischner Society, el ACR ni la BTS.
        </p>
      </header>

      {REFERENCE_CATEGORIES.map((category) => {
        const entries = BIBLIOGRAPHY[category.id];
        return (
          <div
            key={category.id}
            className="rounded-xl border border-border bg-card p-4 sm:p-6"
          >
            <h2 className="text-lg font-semibold text-card-foreground">{category.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>

            <ul className="mt-5 space-y-5">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-lg border border-border bg-muted/40 p-4"
                >
                  <p className="text-sm leading-relaxed text-foreground">{entry.citation}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground">Uso en la app: </span>
                    {entry.usedInApp}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {entry.links.map((link) => (
                      <a
                        key={`${entry.id}-${link.href}`}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-primary transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                      >
                        {LINK_KIND_LABELS[link.kind]}
                        {link.kind === 'web' ? ` · ${link.label}` : ''}
                      </a>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      <p className="text-xs text-muted-foreground">
        Listado mantenido en{' '}
        <code className="rounded bg-muted px-1 py-0.5 text-foreground">config/references.ts</code>
        . Para trazabilidad técnica de coeficientes, ver también{' '}
        <code className="rounded bg-muted px-1 py-0.5 text-foreground">
          research/predictive_model/variables_y_coeficientes.md
        </code>
        .
      </p>
    </section>
  );
}
