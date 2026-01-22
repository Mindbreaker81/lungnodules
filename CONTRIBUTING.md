# Contribuyendo a Lung Nodule Follow-Up Decision Support Tool

¡Gracias por tu interés en contribuir a este proyecto! Dado que es una herramienta de soporte a decisiones clínicas, tenemos requisitos especiales para contribuciones.

## :rotating_light: Importante: Consideraciones Clínicas

Este proyecto implementa guías clínicas médicas (Fleischner 2017 y Lung-RADS v2022). **La precisión clínica es crítica.**

### Tipos de Contribuciones

#### :bug: Reportes de Bugs

**Bugs de algoritmo (CRÍTICO):**
- Cualquier discrepancy con las guías publicadas
- Errores en cálculos de categorización
- Edge cases no cubiertos correctamente

**Cómo reportar:**
1. Verifica el caso contra las guías oficiales
2. Proporciona datos específicos del caso (tamaño, tipo, contexto)
3. Incluye la recomendación correcta según la guía
4. Referencia la sección específica de la guía

**Bugs de UI/UX:**
- Problemas de usabilidad
- Errores de validación
- Issues de accesibilidad

#### :sparkles: Nuevas Características

Antes de proponer nuevas características:

1. **Verifica que está dentro del alcance:**
   - ¿Es apropiado para una herramienta de soporte clínico?
   - ¿Se basa en guías clínicas establecidas?
   - ¿No expande el alcance más allá de lo definido en el PRD?

2. **Considera:**
   - Complejidad vs. beneficio clínico
   - Impacto en la usabilidad
   - Mantenibilidad a largo plazo

#### :books: Documentación

- Mejoras en claridad de guías clínicas
- Traducciones adicionales
- Ejemplos de uso clínico

## :hammer: Proceso de Desarrollo

### 1. Fork y Branch

```bash
git clone https://github.com/tu-usuario/lungnodules.git
cd lungnodules
git checkout -b feature/tu-caracteristica
```

### 2. Desarrollo

**Requisitos:**
- TypeScript obligatorio
- Tests para nueva funcionalidad
- Actualizar documentación relevante
- Seguir estructura de código existente

**Para cambios en algoritmos:**
- Añadir tests que verifiquen casos contra guías
- Documentar referencias a secciones específicas de guías
- Incluir casos edge en tests

### 3. Tests

```bash
# Ejecutar tests
npm test

# Ejecutar linting
npm run lint

# Build para verificar
npm run build
```

**Requisitos:**
- ✅ Todos los tests deben pasar
- ✅ Sin errores de TypeScript
- ✅ Sin warnings de ESLint (o justificación clara)

### 4. Pull Request

**Tu PR debe incluir:**

- **Descripción clara** del cambio y por qué es necesario
- **Referencias** a guías clínicas si aplica el cambio
- **Screenshots** si afecta UI
- **Tests** que demuestren funcionamiento correcto
- **Documentación** actualizada si necesario

**Template de PR:**

```markdown
## Tipo de cambio
- [ ] Bug fix
- [ ] Nueva característica
- [ ] Cambio de breaking
- [ ] Actualización de documentación

## Descripción
Descripción clara del cambio...

## Casos de prueba
Descripción de cómo se probó...

## Referencias clínicas (si aplica)
- Fleischner 2017: sección X
- Lung-RADS v2022: categoría Y

## Checklist
- [ ] Tests añadidos/actualizados
- [ ] Documentación actualizada
- [ ] Sin nuevos warnings de linting
- [ ] Build exitoso
```

## :rotating_light: Seguridad

### Vulnerabilidades de Seguridad

**⚠️ NO reports vulnerabilidades mediante issues públicos.**

Para reportar vulnerabilidades de seguridad:

1. **Revisa** [SECURITY.md](SECURITY.md)
2. **Usa** GitHub Security Advisories (privado)
3. **O envía email** a: security@[tu-email]

### Cambios que Requieren Revisión Extra

- Cambios en validación de inputs
- Modificaciones a lógica de algoritmos
- Cambios en headers de seguridad
- Actualizaciones de dependencias con implicaciones de seguridad

## :memo: Estilo de Código

### TypeScript

- Usar tipos estrictos
- Interfaces para estructuras de datos
- Evitar `any` cuando sea posible
- Documentar funciones complejas

### Nomenclatura

- **Archivos:** `kebab-case.ts` o `kebab-case.tsx`
- **Componentes:** `PascalCase.tsx`
- **Funciones/variables:** `camelCase`
- **Constantes:** `UPPER_SNAKE_CASE`
- **Tipos/interfaces:** `PascalCase`

### Comentarios

```typescript
/**
 * Calcula categoría según Fleischner 2017
 * @param input - Datos del nódulo y paciente
 * @returns Categoría y recomendación de seguimiento
 * @see Fleischner 2017, Tabla 3
 */
function assessFleischner(input: AssessmentInput): AssessmentResult {
  // ...
}
```

## :test_tube: Testing

### Tests de Algoritmos

```typescript
test('TC-F-XXX: Descripción del caso clínico', () => {
  const result = assessFleischner({
    // caso específico
  });

  // Verificar resultado contra guía
  expect(result.category).toBe('X');
  expect(result.recommendation).toMatch(/recomendación específica/i);
});
```

### Tests de UI

- Usar React Testing Library
- Probar flujos de usuario reales
- Verificar accesibilidad

## :globe: Traducciones

Este proyecto está principalmente en español. Para añadir idiomas:

1. No traducir términos médicos técnicos
2. Mantener precisión de significado clínico
3. Consultar con hablantes nativos si no lo eres

## :heartbeat: Comunidad

### Código de Conducta

- Ser respetuoso y constructivo
- Aceptar críticas técnicas
- Priorizar precisión clínica sobre ego
- Aprender de expertos clínicos

### Discusiones

- GitHub Issues para preguntas/features
- GitHub Discussions para temas generales
- Respetar que este es software médico

## :rocket: Consejos para Contribuciones Exitosas

1. **Empieza pequeño:** Fix bugs, mejora docs
2. **Estudia el código:** Entiende la arquitectura primero
3. **Pregunta primero:** Abre issue para discutir cambios grandes
4. **Sé paciente:** La precisión clínica requiere tiempo
5. **Aprende:** Este es un buen lugar para aprender sobre guías pulmonares

## :books: Recursos

- [PRD](PRD-LungNoduleTracker.md) - Requisitos del producto
- [SECURITY.md](SECURITY.md) - Política de seguridad
- [MEDICAL_DISCLAIMER.md](MEDICAL_DISCLAIMER.md) - Disclaimer médico

---

**De nuevo, ¡gracias por contribuir!** Tu ayuda mejora la atención clínica de pacientes con nódulos pulmonares.
