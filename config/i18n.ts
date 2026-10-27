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
            disclaimer: 'Mayo/Brock estiman riesgo pre-PET. Si hay FDG-PET se muestra el modelo Herder 2005: regresión logística sobre la probabilidad Mayo (P_pre en fracción 0-1) más la captación FDG. Verifica aplicabilidad clínica.',
            probability: 'Probabilidad',
            preTest: 'Pre-test',
            missingFields: 'Campos requeridos:',
            howTitle: '¿Cómo se calcula?',
            explanations: {
                mayo: {
                    purpose: 'Estima la probabilidad de que un nódulo indeterminado hallado de forma incidental sea maligno. Se desarrolló en la Mayo Clinic con nódulos de 4–30 mm (Swensen 1997).',
                    variables: 'Edad, tabaquismo (actual o previo), cáncer extratorácico diagnosticado hace más de 5 años, diámetro medio, espiculación y localización en lóbulo superior.',
                    method: 'Regresión logística: cada variable suma un peso a una puntuación y la probabilidad es 1 / (1 + e^−puntuación).',
                    applicability: 'En la app se calcula en el contexto incidental. Requiere que se haya evaluado la espiculación. Se avisa si el nódulo mide menos de 4 mm, es múltiple o es subsólido. No se calcula con antecedente de cáncer de pulmón ni con cáncer extratorácico de menos de 5 años.',
                },
                brock: {
                    purpose: 'Estima la probabilidad de malignidad de un nódulo detectado en el primer TC de cribado. Se desarrolló en la cohorte PanCan y se validó en la de la BCCA (McWilliams 2013).',
                    variables: 'Edad, sexo, antecedente familiar de cáncer de pulmón, enfisema, diámetro máximo transversal, tipo de nódulo (sólido, semi-sólido o vidrio deslustrado), lóbulo superior, número de nódulos y espiculación.',
                    method: 'Regresión logística. El tamaño entra transformado como (diámetro/10)^−0,5, de modo que cada milímetro pesa más en la puntuación cuanto más pequeño es el nódulo. Si no se evaluó la espiculación se usa la variante sin ella (modelo 2a).',
                    applicability: 'En la app se calcula en el contexto de cribado y hasta 30 mm. Si no se indica el diámetro máximo se usa el medio, lo que puede infraestimar el riesgo. Se avisa si la edad queda fuera de 50–75 años, el TC es de seguimiento o el nódulo es perifisural. No se calcula con antecedente de cáncer de pulmón.',
                },
                herder: {
                    purpose: 'Actualiza el riesgo de Mayo con el resultado del PET-TC con FDG (Herder 2005).',
                    variables: 'Probabilidad de Mayo (pre-test) y captación de FDG en escala visual: ausente, débil, moderada o intensa.',
                    method: 'Regresión logística: −4,739 + 3,691 × probabilidad de Mayo (en fracción 0–1) + un peso según la captación (0 / 2,322 / 4,617 / 4,771).',
                    applicability: 'Requiere PET y todos los datos de Mayo, en cualquier contexto, con nódulos de 4–30 mm. En nódulos menores de 8 mm el PET es poco sensible, así que una captación ausente tranquiliza menos.',
                },
            },
            riskBands: 'Bandas de riesgo orientativas. Mayo y Brock (riesgo antes del PET): ACCP 2013, bajo <5 %, intermedio 5–65 %, alto >65 %, definidas para nódulos sólidos >8 mm. Herder (riesgo tras el PET): BTS 2015, bajo <10 %, intermedio 10–70 %, alto >70 %. Son probabilidades estimadas, no un diagnóstico.',
            labels: {
                purpose: 'Para qué sirve',
                variables: 'Qué datos usa',
                method: 'Cómo combina los datos',
                applicability: 'Cuándo se calcula',
            },
        },
        medicalDisclaimer: '⚠️ AVISO MÉDICO: Herramienta de apoyo. Verificar contra guías actuales. No aplica a <35 años, inmunocomprometidos o cáncer conocido.',
    },
} as const;
