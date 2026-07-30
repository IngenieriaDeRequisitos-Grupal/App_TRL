# Guía de Implementación UX/UI para Frontend

**Para:** Steven (Frontend Developer)
**De:** Sergi UX/UI Design
**Asunto:** Directrices de Interfaz, Experiencia de Usuario y Accesibilidad
**Estilo Requerido:** Minimalista, Corporativo, Formal ("Tipo apple minimalist" con la identidad institucional UTPL).
**Objetivo:** Reducir la carga cognitiva, garantizar la máxima accesibilidad (WCAG 2.1 AA) e implementar una UI perfectamente alineada con los endpoints de nuestro backend (NestJS).

Steven, a continuación te detallo las directrices exactas que necesitamos que apliques en el desarrollo del frontend. Es fundamental que el producto final transmita un alto nivel de profesionalismo, por lo que **queda estrictamente prohibido el uso de colores pastel o saturados** que no pertenezcan a la paleta aprobada.

---

## 1. Paleta de Colores Institucional (Variables CSS)

Por favor, configura estas variables en el `:root` de tus hojas de estilo globales y utilízalas estrictamente para todos los componentes, reutilizo la paleta de colores anteriormente implementada en el prototipo inicial:

```css
:root {
  /* Paleta "Institucional UTPL" */
  --primary: #084a96;       /* Azul Institucional UTPL (Botones de acción principal, Headers) */
  --primary-soft: #EEF2FF;  /* Azul muy claro (Fondos de tarjetas activas, hovers sutiles) */
  --utpl-yellow: #FDB913;   /* Amarillo UTPL (Llamados a la acción secundarios, badges) */
  --bg-body: #F8FAFC;       /* Gris perla (Fondo base general) */
  --bg-surface: #FFFFFF;    /* Blanco puro (Superficies: modales, contenedores de contenido, tarjetas) */
  --text-main: #0F172A;     /* Grafito oscuro (Títulos `h1`-`h6`, párrafos principales) */
  --text-muted: #64748B;    /* Gris medio (Textos secundarios, labels, placeholders) */
  --border: #E2E8F0;        /* Bordes ultra sutiles (Separadores de sección, contornos de inputs) */

  /* Colores Semánticos WCAG AA */
  --success: #059669;
  --success-bg: #ECFDF5;
  --warning: #D97706;
  --warning-bg: #FFFBEB;
  --danger: #DC2626;
  --danger-bg: #FEF2F2;
  --info: #0284C7;
}
```

---

## 2. Accesibilidad y Cumplimiento Normativo (ISO y WCAG)

Nuestro sistema debe ser accesible y usable para todos, sin excepciones. Necesito que asegures lo siguiente a nivel de código HTML y CSS:

### 2.1. Navegación por Teclado y Contraste (WCAG 2.1 Nivel AA)
- **Ratios de Contraste:** 
  - El contraste del texto normal sobre su fondo debe ser mínimo de **4.5:1** y para textos grandes (títulos) de **3:1**.
  - Si utilizas `--utpl-yellow` de fondo, el texto interior debe ser `--text-main` (oscuro) obligatoriamente. El texto blanco sobre amarillo no pasa la validación de contraste.
- **Navegación y Tabulación:**
  - Para botones, usa estrictamente las etiquetas `<button type="button">` o `<button type="submit">`. **No uses `<div onClick={...}>`, `<span>` o `<a>` simulando ser botones de acción**.
  - Para enlaces reales (cambios de URL), usa la etiqueta `<a>` con su atributo `href`.
  - El estado `:focus-visible` debe ser indudable en todos los elementos interactivos. Te sugiero un `outline: 2px solid var(--primary)` con un `outline-offset: 2px`.

### 2.2. Diseño Centrado en el Humano (ISO 9241-210 e ISO 9241-110)
- **Carga Cognitiva (Uso de Espacios):** Mantén la interfaz respirable. Usa márgenes (margin/padding) generosos. Si la información no es necesaria para la tarea actual del usuario, ocúltala o pásala a un nivel secundario.
- **Tolerancia a Errores:** Validemos los formularios antes del envío (onBlur u onChange). Si hay un error, coloca un texto explicativo `<span role="alert">` debajo del input usando `--danger`. Evita los modales bloqueantes (`alert()`) a toda costa.

### 2.3. Legibilidad y Pantallas Táctiles (ISO 9241-125)
- **Tipografía y Tamaños:**
  - Configura el tamaño base (`font-size`) a `16px` o `1rem`. No bajes de `14px` para textos secundarios.
  - El interlineado (`line-height`) mínimo debe ser `1.5` en párrafos.
- **Áreas Interactivas (*Touch Targets*):** Cualquier elemento interactivo (botones, iconos con acción, checkboxes) debe tener al menos un área de **44x44 CSS pixels** para garantizar precisión en tablets o dispositivos móviles.

### 2.4. Código de Buenas Prácticas TIC (ISO 30071-1)
- Cada vez que coloques un icono funcional sin texto visible (ej. un icono de "basurero" para eliminar), es obligatorio usar el atributo `aria-label="Eliminar"`. Los lectores de pantalla (Screen Readers) deben poder interpretar el 100% de la interfaz.

---

## 3. Especificaciones Técnicas por Componente (UI Kit)

Para estandarizar tu maquetado, implementa los componentes base de esta forma:

### Botonería (`<button>`)
- **Botón Primario:** 
  - CSS: `background-color: var(--primary); color: #FFFFFF;`
  - Interacción: Al hacer `:hover`, oscurecer sutilmente el fondo.
- **Botón Secundario (Outlined):** 
  - CSS: `background-color: transparent; border: 1px solid var(--border); color: var(--text-main);`
  - Interacción: Al hacer `:hover`, cambiar el fondo a `var(--bg-body)`.
- **Botón de Advertencia/Atención (Warning):** 
  - CSS: `background-color: var(--utpl-yellow); color: var(--text-main);`

### Tarjetas / Cards (`<article>`, `<section>`, o `<li>`)
- Usa etiquetas semánticas para encapsular información independiente (ej. listado de proyectos).
- **Estilos del contenedor:**
  - `background-color: var(--bg-surface);`
  - `border-radius: 8px` (máximo `12px`).
  - `border: 1px solid var(--border);`
  - `box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);` (Sombra extremadamente sutil, evita sombras pesadas o difuminadas gruesas).

### Formularios (`<form>`, `<fieldset>`, `<label>`, `<input>`, `<select>`)
- **Estructura base:**
  - Es mandatorio enlazar el `id` del `<input>` con el atributo `for` (o `htmlFor` si usas React/JSX) del `<label>`.
- **Estilos base de Inputs:**
  - `background-color: var(--bg-surface);`
  - `color: var(--text-main);`
  - `border: 1px solid var(--border);`
  - `:placeholder` debe usar `var(--text-muted);`
  - En estado `:focus`: `border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft);`

### Tablas de Datos (`<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`)
- Usa las etiquetas nativas HTML para estructurar datos (vital para los módulos de Auditoría y Evidencias). Nada de recrear tablas con *Divs* y *CSS Grid/Flexbox*.
- **Zebra-striping:** Alterna los fondos de las filas (`tr:nth-child(even)`) entre `var(--bg-surface)` y `var(--bg-body)` para que la lectura de lado a lado no se pierda.
- Encabezados (`<th>`): El texto debe ser `var(--text-muted)` con peso `font-weight: 500`.

---

## 4. Adaptación a los Módulos del Backend

Alinea esta presentación visual con la arquitectura que estamos manejando en NestJS:

1. **Módulo Auth & Users (`/auth`, `/users`):**
   - Vistas de login enfocadas y centradas en la pantalla sobre el fondo `--bg-body`. La tarjeta del formulario (fondo `--bg-surface`) debe verse inmaculada.
2. **Módulo Projects & Evaluations (`/projects`, `/evaluations`):**
   - Emplea *CSS Grid* para listar los proyectos en un layout de tarjetas.
   - Los estados que devuelva el backend (Aprobado, Pendiente, Rechazado) muéstralos como *badges* (elementos `<span>` con `border-radius: 16px`, `font-size: 12px` y `padding` horizontal) pintados con los colores semánticos (`--success`, `--warning`, `--danger`).
3. **Módulo Evidence & Consent (`/evidence`, `/consent`):**
   - Utiliza vistas tipo `<table>` con espacios holgados (`padding: 12px 16px` mínimo por celda) dada la carga de información legal/evidencia.
4. **Módulo Audit & Management (`/audit`, `/management`):**
   - Vistas con alto nivel analítico. Para presentar logs técnicos del sistema, te sugiero usar fuentes monoespaciadas que transmitan ese aire ingenieril y exacto.


