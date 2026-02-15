Qué es PLCOm2012 y para qué sirve (en tu app)

PLCOm2012 es un modelo de predicción de riesgo de incidencia de cáncer de pulmón a 6 años (probabilidad 0–1) diseñado para seleccionar candidatos a cribado con TC de baja dosis (LDCT) entre fumadores actuales o exfumadores (ever-smokers). Su uso típico es decidir “quién entra a cribado” (y, por tanto, quién debería someterse a un circuito Lung-RADS), no para decidir directamente el manejo de un nódulo ya detectado.  ￼

En una app que ya aplica Fleischner 2017 (nódulos incidentales) y Lung-RADS 2022 (cribado), PLCOm2012 encaja como módulo previo:
	•	Si el paciente no está en programa de cribado, PLCOm2012 ayuda a decidir si debería estarlo.
	•	Si el paciente ya está en cribado, la conducta del nódulo debe guiarse por Lung-RADS.
	•	Si el nódulo es incidental, el seguimiento lo define Fleischner, pero PLCOm2012 puede ayudarte a operacionalizar “alto vs bajo riesgo” (ver integración más abajo).

⸻

Variables del modelo (inputs)

La implementación publicada y ampliamente reutilizada del PLCOm2012 (ever-smokers) usa estos predictores:
	1.	Edad (años)
	2.	Raza/etnia (categorías; con ajuste por grupo)
	3.	Nivel educativo (ordinal 1–6)
	4.	IMC (kg/m²)
	5.	EPOC (sí/no)
	6.	Historia personal de cáncer (sí/no)
	7.	Historia familiar de cáncer de pulmón (sí/no)
	8.	Tabaquismo actual (actual=1, exfumador=0)
	9.	Intensidad (cigarrillos/día) con transformación no lineal
	10.	Duración del tabaquismo (años)
	11.	Tiempo desde abandono (años; si actual, 0)

Nota importante: en descripciones históricas aparece “radiografía de tórax en los últimos 3 años”, pero se reporta como predictor candidato que se excluyó del PLCOm2012 final (por tanto, no lo necesitas si implementas la versión estándar “m2012” para ever-smokers).  ￼

⸻

Cómo está construido (forma matemática + coeficientes listos para programar)

Es una regresión logística:

p = \frac{e^{LP}}{1 + e^{LP}}

donde el linear predictor (LP) es:

Base (grupo “White / American Indian / Alaskan Native” o equivalente):  ￼

\begin{aligned}
LP =\;& 0.0778868\cdot(age - 62) \\
&- 0.0812744\cdot(education - 4) \\
&- 0.0274194\cdot(bmi - 27) \\
&+ 0.3553063\cdot copd \\
&+ 0.4589971\cdot cancer\_hist \\
&+ 0.5871850\cdot family\_hist\_lung\_cancer \\
&+ 0.2597431\cdot smoking\_status \\
&- 1.822606\cdot\left(\left(\frac{smoking\_intensity}{10}\right)^{-1} - 0.4021541613\right) \\
&+ 0.0317321\cdot(duration\_smoking - 27) \\
&- 0.0308572\cdot(smoking\_quit\_time - 10) \\
&- 4.532506
\end{aligned}

Ajuste por raza/etnia (se suma al LP base):  ￼
	•	Black: + 0.3944778
	•	Hispanic: - 0.7434744
	•	Asian: - 0.466585
	•	Native Hawaiian / Pacific Islander: + 1.027152
	•	(White / American Indian / Alaskan Native): + 0

Codificación recomendada (coherente con el código de referencia):
	•	education: 1 (menos que secundaria) … 6 (postgrado)  ￼
	•	copd, cancer_hist, family_hist_lung_cancer: 0/1
	•	smoking_status: actual=1, ex=0
	•	smoking_quit_time: años desde dejarlo; si fumador actual, 0
	•	smoking_intensity: cigarrillos/día (ojo con 0; en ever-smokers debería ser >0 históricamente, pero exfumadores pueden tener 0 “actual”; usa su intensidad previa típica, o guarda “cigs/día cuando fumaba” para evitar división por 0)

La transformación de intensidad es crítica: usa exactamente
((smoking_intensity/10)^(-1) - 0.4021541613)  ￼

⸻

Indicaciones prácticas (cuándo usarlo) y umbrales habituales

Indicaciones (uso clínico típico)
	•	Selección de elegibilidad para cribado LDCT en ever-smokers, como alternativa/complento a criterios simples tipo pack-years + edad.  ￼
	•	Se ha usado en programas poblacionales (p.ej., NHS England ha utilizado modelos de riesgo como PLCOm2012/LLPv2 para elegibilidad).  ￼

Umbral “clásico” para decidir cribado

Un punto de corte muy utilizado es riesgo a 6 años ≥ 1.51% (0.0151), derivado de análisis en NLST/PLCO para identificar el rango donde el LDCT mostró beneficio neto y para comparar eficiencia vs criterios USPSTF.  ￼
(En UK y otros programas pueden usarse umbrales distintos según capacidad/objetivos; pero 1.51% es el más citado internacionalmente).  ￼

⸻

Cómo integrarlo sin “romper” Fleischner 2017 + Lung-RADS 2022

1) Árbol de decisión recomendado (alto nivel)
	1.	¿El TC es de cribado?
	•	Sí → Lung-RADS 2022 manda (PLCOm2012 no decide el manejo del nódulo; ya estás dentro del programa).
	•	No / incidental → ve a 2.
	2.	Incidental (Fleischner 2017):
	•	Fleischner separa “bajo vs alto riesgo” de forma clínica. Aquí PLCOm2012 puede ayudar a estandarizar:
	•	p.ej. define “alto riesgo” si PLCOm2012 ≥ 1.51% (u otro umbral configurable) y ever-smoker; o úsalo como variable adicional en la pantalla de “riesgo” (no como sustituto único).
	•	Luego aplica tablas/algoritmos Fleischner por tipo/tamaño de nódulo.
	3.	Salida adicional de la app (útil para clínico):
	•	Mostrar probabilidad PLCOm2012 (%), el umbral configurado, y un mensaje tipo:
“Este riesgo se usa para elegibilidad de cribado, no sustituye Fleischner/Lung-RADS para el manejo del nódulo.”

2) Por qué esto es importante

PLCOm2012 estima riesgo basal de desarrollar cáncer en 6 años. Fleischner/Lung-RADS gestionan riesgo condicionado a la presencia y morfología del nódulo (tamaño, atenuación, crecimiento, etc.). Mezclarlos sin separarlos lleva a sobreseguimiento o infraseguimiento.

⸻

Recomendaciones de implementación (app)
	•	Implementa PLCOm2012 como función pura: inputs → p.
	•	Añade validaciones:
	•	smoking_intensity > 0 cuando se use en la transformación (si exfumador con intensidad desconocida, obliga a introducir “cigs/día cuando fumaba”).
	•	rangos razonables para edad, IMC, años de duración/abandono.
	•	Guarda en tu modelo de datos:
	•	variables de tabaquismo separadas (intensidad, duración, abandono) y no solo pack-years.
	•	Umbral configurable por centro/programa (por defecto 1.51%).  ￼

⸻

Fuentes clave (para tu documentación técnica)
	•	Coeficientes y ecuación de referencia (implementación reproducible): paquete R / código fuente.  ￼
	•	Umbral 1.51% y racional de selección por beneficio: análisis en NLST/PLCO (PLOS Med 2014) + discusiones posteriores.  ￼
	•	Uso de modelos de riesgo (incl. PLCOm2012) en estrategias/programas y comparativas: revisiones/estudios UK/Europa y comparativas con criterios USPSTF.  ￼

Si quieres, puedo devolverte el módulo como función en TypeScript/Python con tests (incluyendo el ejemplo del repositorio que debe dar ~1.7509%).  ￼