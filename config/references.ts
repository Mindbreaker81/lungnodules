/**
 * Bibliografía utilizada por la aplicación. Enlaces verificados contra PubMed/PMC/DOI
 * o fuentes oficiales (ACR, BTS, NEJM). Ver `research/predictive_model/variables_y_coeficientes.md` §7.
 */

export type ReferenceCategoryId =
  | 'management-guidelines'
  | 'predictive-models'
  | 'screening-eligibility'
  | 'secondary-sources';

export type ReferenceLinkKind = 'pubmed' | 'pmc' | 'doi' | 'web';

export interface ReferenceLink {
  kind: ReferenceLinkKind;
  label: string;
  href: string;
}

export interface BibliographyEntry {
  id: string;
  citation: string;
  usedInApp: string;
  links: ReferenceLink[];
}

export interface ReferenceCategory {
  id: ReferenceCategoryId;
  title: string;
  description: string;
}

const pubmed = (pmid: string): ReferenceLink => ({
  kind: 'pubmed',
  label: `PubMed (${pmid})`,
  href: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
});

const pmc = (id: string): ReferenceLink => ({
  kind: 'pmc',
  label: `PMC (${id})`,
  href: `https://pmc.ncbi.nlm.nih.gov/articles/${id}/`,
});

const doi = (value: string): ReferenceLink => ({
  kind: 'doi',
  label: 'DOI',
  href: `https://doi.org/${value}`,
});

const web = (label: string, href: string): ReferenceLink => ({
  kind: 'web',
  label,
  href,
});

export const REFERENCE_CATEGORIES: ReferenceCategory[] = [
  {
    id: 'management-guidelines',
    title: 'Guías de manejo',
    description:
      'Árboles de decisión categóricos (sin coeficientes de regresión) que determinan categoría y seguimiento.',
  },
  {
    id: 'predictive-models',
    title: 'Modelos predictivos de malignidad',
    description:
      'Regresiones logísticas y ajuste bayesiano post-PET usados en la sección de modelos predictivos.',
  },
  {
    id: 'screening-eligibility',
    title: 'Elegibilidad para cribado',
    description: 'Modelo de riesgo a 6 años para selección de candidatos a cribado.',
  },
  {
    id: 'secondary-sources',
    title: 'Herramientas y fuentes de apoyo',
    description:
      'Calculadoras clínicas, meta-análisis y estudios de aplicación citados en documentación interna.',
  },
];

export const BIBLIOGRAPHY: Record<ReferenceCategoryId, BibliographyEntry[]> = {
  'management-guidelines': [
    {
      id: 'fleischner-2017',
      citation:
        'MacMahon H, Naidich DP, Goo JM, et al. Guidelines for management of incidental pulmonary nodules detected on CT images: from the Fleischner Society 2017. Radiology. 2017;284(1):228-243.',
      usedInApp: 'Algoritmo Fleischner 2017 (`lib/algorithms/fleischner.ts`) para nódulos incidentales.',
      links: [pubmed('28240562'), doi('10.1148/radiol.2017161659')],
    },
    {
      id: 'lung-rads-2022',
      citation:
        'American College of Radiology. Lung CT Screening Reporting and Data System (Lung-RADS), version 2022.',
      usedInApp: 'Algoritmo Lung-RADS v2022 (`lib/algorithms/lungRads.ts`) para cribado.',
      links: [
        web(
          'ACR Lung-RADS',
          'https://www.acr.org/Clinical-Resources/Reporting-and-Data-Systems/Lung-Rads',
        ),
        web(
          'Resumen Lung-RADS v2022 (PDF)',
          'https://cs.acr.org/-/media/ACR/Files/RADS/Lung-RADS/Lung-RADS-2022-Summary-_Final.pdf',
        ),
      ],
    },
  ],
  'predictive-models': [
    {
      id: 'mayo-swensen-1997',
      citation:
        'Swensen SJ, Silverstein MD, Ilstrup DM, Schleck CD, Edell ES. The probability of malignancy in solitary pulmonary nodules. Application to small radiologically indeterminate nodules. Arch Intern Med. 1997;157(8):849-855.',
      usedInApp: 'Modelo Mayo Clinic (pre-PET) en hallazgos incidentales (`id: "mayo"`).',
      links: [pubmed('9129544')],
    },
    {
      id: 'brock-mcwilliams-2013',
      citation:
        'McWilliams A, Tammemagi MC, Mayo JR, et al. Probability of cancer in pulmonary nodules detected on first screening CT. N Engl J Med. 2013;369(10):910-919.',
      usedInApp:
        'Modelo Brock/PanCan — variantes 2a y 2b en cribado (`id: "brock"`). Coeficientes verificados contra el artículo original.',
      links: [pubmed('24004118'), pmc('PMC3951177'), doi('10.1056/NEJMoa1214726')],
    },
    {
      id: 'herder-2005',
      citation:
        'Herder GJ, et al. Clinical prediction model to characterize pulmonary nodules: validation and added value of 18F-fluorodeoxyglucose positron emission tomography. Chest. 2005;128(4):2490-2496.',
      usedInApp:
        'Variante logística Herder 2005 (`id: "herder-logistic"`): x = −4.739 + 3.691·P_pre + βFDG.',
      links: [pubmed('16236914')],
    },
    {
      id: 'bts-2015',
      citation:
        'Callister MEJ, Baldwin DR, Akram AR, et al. British Thoracic Society guidelines for the investigation and management of pulmonary nodules: accredited by NICE. Thorax. 2015;70(Suppl 2):ii1-ii54.',
      usedInApp:
        'Variante Herder BTS por likelihood ratios de FDG-PET (`id: "herder"`); umbrales de manejo pre-test ≥10%.',
      links: [
        pubmed('26082159'),
        doi('10.1136/thoraxjnl-2015-207168'),
        web(
          'BTS — Guía de nódulos pulmonares',
          'https://www.brit-thoracic.org.uk/clinical-resources/guidelines/pulmonary-nodules/',
        ),
      ],
    },
    {
      id: 'mourato-2020',
      citation:
        'Mourato FA, Brito AET, Romão MSC, et al. Use of PET/CT to aid clinical decision-making in cases of solitary pulmonary nodule: a probabilistic approach. Radiol Bras. 2020;53(1):1-6.',
      usedInApp:
        'Estudio de aplicación clínica que reproduce la fórmula logística Herder; referencia de verificación secundaria.',
      links: [
        pubmed('32313329'),
        pmc('PMC7159041'),
        doi('10.1590/0100-3984.2019.0034'),
        web(
          'SciELO',
          'https://www.scielo.br/j/rb/a/87zRh5CYfS8vcSXRQFLmrCx/?lang=en',
        ),
      ],
    },
    {
      id: 'brock-meta-2025',
      citation:
        'Chen S, Lin WL, Liu WT, et al. Pulmonary nodule malignancy probability: a meta-analysis of the Brock model. Clin Radiol. 2025;82:106788.',
      usedInApp:
        'Meta-análisis citado en documentación interna para contrastar variantes del modelo Brock.',
      links: [pubmed('39842180'), doi('10.1016/j.crad.2024.106788')],
    },
  ],
  'screening-eligibility': [
    {
      id: 'plcom2012-2013',
      citation:
        'Tammemägi MC, Katki HA, Hocking WG, et al. Selection criteria for lung-cancer screening. N Engl J Med. 2013;368(8):728-736.',
      usedInApp: 'Modelo PLCOm2012 — riesgo de cáncer de pulmón a 6 años (`lib/eligibility/plcom2012.ts`).',
      links: [pubmed('23425165'), doi('10.1056/NEJMoa1211776')],
    },
  ],
  'secondary-sources': [
    {
      id: 'mdcalc-mayo',
      citation:
        'MDCalc. Solitary Pulmonary Nodule (SPN) Malignancy Risk Score (Mayo Clinic Model). Calculadora clínica en línea.',
      usedInApp:
        'Referencia de contraste para casos de regresión Mayo/Herder (documentación interna; no es fuente primaria de coeficientes).',
      links: [
        web(
          'MDCalc — Mayo + PET',
          'https://www.mdcalc.com/calc/4057/solitary-pulmonary-nodule-spn-malignancy-risk-score-mayo-clinic-model',
        ),
      ],
    },
    {
      id: 'bts-brock-calculator',
      citation:
        'British Thoracic Society. Pulmonary Nodules Risk Calculator (Brock model).',
      usedInApp: 'Calculadora oficial BTS para el modelo Brock en cribado.',
      links: [
        web(
          'BTS — Calculadora Brock',
          'https://www.brit-thoracic.org.uk/quality-improvement/guidelines/pulmonary-nodules/pn-risk-calculator/',
        ),
      ],
    },
  ],
};
