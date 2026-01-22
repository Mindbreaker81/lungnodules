# 🔒 Guía de Configuración: GitHub Security Advisories

Esta guía te lleva paso a paso para configurar GitHub Security Advisories en tu repositorio.

---

## 📋 Antes de Empezar

**Requisitos:**
- ✅ Tener permisos de admin en el repositorio
- ✅ El repositorio debe ser público (o planeas hacerlo público)
- ✅ Los archivos SECURITY.md y CONTRIBUTING.md ya están creados

**Tiempo estimado:** 5-10 minutos

---

## 🚀 Paso 1: Habilitar Security Tab

### 1.1 Navega a tu repositorio en GitHub

```
https://github.com/tu-usuario/lungnodules
```

### 1.2 Ve a Settings (Configuración)

1. Click en la pestaña **"Settings"** arriba a la derecha
2. En el menú lateral, busca la sección **"Security"**
   - Está hacia abajo, antes de "Monetization"

### 1.3 Configura las opciones de seguridad

Deberías ver varias opciones. Asegúrate de que estén así:

```
☑️  Security advisories
    Permite que usuarios reporten vulnerabilidades de forma privada

☑️  Dependabot alerts
    Alertas sobre vulnerabilidades en dependencias

☑️  Dependabot security updates
    Actualizaciones automáticas de dependencias vulnerables
```

**Click en "Enable" o "Save"** si no están habilitadas.

---

## 🔐 Paso 2: Configurar Política de Seguridad

### 2.1 En la misma sección de Security

Busca la opción que dice **"Security policy"**

### 2.2 Click en "Set up" o "Edit"

### 2.3 Elige el método:

**Opción A: Usar archivo existente** ✅ Recomendado
```
Seleccionar: "Use an existing security policy"
Archivo: SECURITY.md
Click: "Save"
```

**Opción B: Crear nueva en GitHub**
```
Seleccionar: "Create a new security policy"
Copiar contenido de SECURITY.md
Pegar en el editor
Click: "Save"
```

### 2.4 Verifica

Deberías ver un botón **"Security policy"** en la pestaña "Security" de tu repo.

---

## 👥 Paso 3: Habilitar Reportes de Vulnerabilidades

### 3.1 En la sección Security de Settings

Busca **"Vulnerability reports"**

### 3.2 Click en "Enable"

Aparecerá un mensaje de confirmación:
```
✅ Vulnerability reporting is now enabled

Users can now report vulnerabilities privately.
Reports will appear in the "Security advisories" section.
```

### 3.3 Verifica que funcionó

Ve a:
```
https://github.com/tu-usuario/lungnodules/security/advisories
```

Deberías ver un botón **"Report a vulnerability"** (tú como admin lo ves).
Los usuarios también verán este botón.

---

## 🧪 Paso 4: Probar el Flujo (Opcional pero Recomendado)

### 4.1 Crear un reporte de prueba

1. Click en **"Report a vulnerability"**
2. Llena el formulario con datos de prueba:
   ```
   Title: TEST - Prueba de reporte de vulnerabilidad
   Description: Esto es una prueba para verificar que el
                sistema de reporte funciona correctamente.
   Severity: Low
   ```
3. Click en **"Submit report"**

### 4.2 Gestionar el reporte de prueba

1. Verás que aparece en **"Draft security advisories"**
2. Ábrelo
3. Puedes:
   - Añadir comentarios
   - Cambiar severidad
   - Añadir CWE (Common Weakness Enumeration)
   - Asignar CVE (si aplica)

### 4.3 Descartar la prueba

1. Click en **"Delete draft advisory"**
2. Confirma
3. ¡Listo!

---

## ✅ Paso 5: Verificar Configuración Completa

### Checklist de verificación:

- [ ] Security tab aparece en el repositorio
- [ ] Política de seguridad configurada (SECURITY.md)
- [ ] Botón "Report a vulnerability" visible en `/security/advisories`
- [ ] Dependabot alerts habilitado
- [ ] README.md tiene badge/enlace a SECURITY.md
- [ ] CONTRIBUTING.md menciona reporte de vulnerabilidades

### Cómo verificar que usuarios lo ven:

1. Abre una ventana de incógnito
2. Navega a: `https://github.com/tu-usuario/lungnodules`
3. Click en la pestaña **"Security"**
4. Deberías ver:
   - Botón "Security policy"
   - Botón "Report a vulnerability"

---

## 📊 Paso 6: Configurar Alertas Adicionales (Opcional)

### Dependabot Alerts

**¿Qué hace?**
- Escanea dependencias por vulnerabilidades conocidas
- Te alerta cuando hay una vulnerabilidad en `package.json`
- Sugiere actualizaciones

**Ya debería estar habilitado** si habilitaste "Dependabot alerts" en Paso 1.

### Code Scanning (Opcional)

**¿Qué hace?**
- Escanea el código buscando vulnerabilidades
- Usa GitHub Advanced Security
- Requiere licencia (gratis para repos públicos)

**Para habilitar:**
1. En Settings → Security
2. Buscar **"Code security"**
3. Click en **"Set up"** en "Code scanning"
4. Elegir **"Default setup"**
5. Click en **"Enable"**

---

## 🎯 Paso 7: Documentar para Contribuidores

### Añadir al README (Ya hecho ✅)

Ya añadimos badges y enlaces a SECURITY.md en el README.

### Añadir a PULL_REQUEST_TEMPLATE.md (Opcional)

Si quieres un template para PRs, puedes crear:

```markdown
## Security Considerations

- [ ] This change does not introduce security vulnerabilities
- [ ] Sensitive data handling reviewed (if applicable)
- [ ] Dependencies updated and audited (if applicable)
```

---

## 📝 Resumen Visual

```
Tu Repositorio
├── README.md (con badges de seguridad)
├── SECURITY.md (política completa)
├── CONTRIBUTING.md (guía de contribución)
├── MEDICAL_DISCLAIMER.md
└── SETUP_SECURITY_ADVISORIES.md (este archivo)

GitHub Interface
├── Settings → Security
│   ├── ☑️ Security advisories (habilitado)
│   ├── ☑️ Dependabot alerts (habilitado)
│   ├── ☑️ Vulnerability reports (habilitado)
│   └── Security policy (configurado)
│
└── Pestaña "Security"
    ├── Security policy (visible)
    └── Report a vulnerability (visible)
```

---

## 🎉 ¡Felicidades!

Has configurado GitHub Security Advisories correctamente.

### Lo que lograste:

✅ **Reportes privados** - Los usuarios pueden reportar vulnerabilidades sin hacerlas públicas

✅ **Gestión centralizada** - Todos los reports de seguridad van a un solo lugar

✅ **Alertas automáticas** - GitHub notifica a usuarios de tu repo sobre vulnerabilidades

✅ **CVEs automáticos** - GitHub puede solicitar números CVE oficiales

✅ **Profesionalismo** - Muestra que tomas la seguridad en serio

---

## 📚 Recursos Adicionales

- [GitHub Security Advisories Documentation](https://docs.github.com/en/code-security/repository-security-advisories/about-repository-security-advisories)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Securing Your Repository](https://docs.github.com/en/code-security/securing-your-repository)

---

## ❓ Preguntas Frecuentes

**Q: ¿Los reports son públicos?**
A: No, son privados hasta que tú decides publicar el advisory.

**Q: ¿Cuánto cuesta?**
A: Es gratis para repos públicos.

**Q: ¿Puedo deshabilitarlo después?**
A: Sí, pero no es recomendable si el repo es público.

**Q: ¿Qué pasa si nadie reporta nada?**
A: No pasa nada, pero la opción está ahí si alguien encuentra algo.

**Q: ¿Debo usar esto para software médico?**
A: **Altamente recomendado** - Es estándar de la industria.

---

**Configuración completada:** [Fecha]
**Configurado por:** [Tu nombre]

¡Tu repositorio está listo para ser público con gestión de seguridad profesional! 🔒
