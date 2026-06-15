export const UI_TEXTS = {
    wizard: {
        steps: {
            context: 'Contexto Clínico',
            nodule: 'Características del Nódulo',
            risk: 'Factores de Riesgo',
            results: 'Resultados',
        },
        navigation: {
            next: 'Siguiente',
            back: 'Atrás',
            finish: 'Ver Resultados',
        },
        validation: {
            required: 'Este campo es obligatorio',
            selectOption: 'Selecciona una opción',
        },
    },
    results: {
        copyButton: {
            idle: 'Copiar',
            copied: '✓ Copiado',
            error: 'Error',
        },
        predictiveModels: {
            title: 'Modelos predictivos (beta)',
            show: 'Ver',
            hide: 'Ocultar',
            disclaimer: 'Mayo/Brock estiman riesgo pre-PET. Si hay FDG-PET, Herder ajusta la probabilidad post-PET (como MDCalc con PET rellenado). Verifica aplicabilidad clínica.',
            probability: 'Probabilidad',
            preTest: 'Pre-test (Mayo/Brock)',
            missingFields: 'Campos requeridos:',
        },
        medicalDisclaimer: '⚠️ AVISO MÉDICO: Herramienta de apoyo. Verificar contra guías actuales. No aplica a <35 años, inmunocomprometidos o cáncer conocido.',
    },
} as const;
