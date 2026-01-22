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
            disclaimer: 'Modelos calculados con coeficientes publicados (Mayo/Brock/Herder). Verifica la aplicabilidad clínica y complementa con juicio médico.',
            probability: 'Probabilidad',
            preTest: 'Pre-test',
            missingFields: 'Campos requeridos:',
        },
        medicalDisclaimer: '⚠️ AVISO MÉDICO: Herramienta de apoyo. Verificar contra guías actuales. No aplica a <35 años, inmunocomprometidos o cáncer conocido.',
    },
} as const;
