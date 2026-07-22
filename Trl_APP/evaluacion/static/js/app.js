/**
 * @file Aplicación de una sola página para la evaluación de TRL.
 * @description Este archivo contiene toda la lógica de la interfaz de usuario,
 * la gestión del estado, la navegación y el renderizado de las diferentes
 * pantallas de la aplicación.
 */

// =================================================================================
// APP OBJECT (STATE, DATA)
// =================================================================================

const app = {
  state: {
    navStack: [],
    currentScreen: 'login',
    currentScreenArg: null,
    selectedRole: 'investigator',
    consentAccepted: false,
    critAnswers: {},
    evVerdicts: {},
    uploadedFiles: {},
    session: { authenticated: false, role: null, name: null },
  },
  data: {
    observations: {
      302: [
        { ref: 'RF-06-A', body: 'La demostración presentada corresponde a un entorno de pruebas simulado, no a condiciones operacionales reales. Repetir la prueba en producción y adjuntar nueva evidencia.' },
        { ref: 'RF-06-B', body: 'Las métricas de disponibilidad reportadas no cubren un periodo mínimo de dos semanas. Ampliar el periodo de monitoreo.' },
        { ref: 'RF-06-C', body: 'El manual de usuario final no incluye una sección de resolución de problemas. Completar esa sección y volver a adjuntar el documento.' }
      ]
    },
    STATUS_META: {
      borrador: { label: 'BORRADOR', cls: 'b-gray' },
      en_evaluacion: { label: 'EN EVALUACIÓN', cls: 'b-blue' },
      requiere_cambios: { label: 'REQUIERE CAMBIOS', cls: 'b-amber' },
      certificado: { label: 'CERTIFICADO', cls: 'b-green' },
      enviado: { label: 'ENVIADO', cls: 'b-blue' }
    },
    PROJECTS: [
      {
        id: 1,
        title: 'SENSOR IOT PARA MONITOREO HÍDRICO',
        team: 'Pedro Yépez, Rafaela Palacios',
        branch: 'HARDWARE / IOT',
        resumen: 'Sistema web de sensores para medir calidad y nivel de agua en cuencas hidrográficas del ámbito rural y urbano de la provincia de Loja.',
        solicitudes: [
          { id: 101, trlObj: 2, status: 'borrador', date: '15 jun 2026', obs: 0 }
        ]
      },
      {
        id: 2,
        title: 'ALGORITMO DE CLASIFICACIÓN DE CULTIVOS CON IA',
        team: 'Hansell Benavides, Jean Cuenca',
        branch: 'SOFTWARE / IA',
        resumen: 'Modelo web de visión por computadora para identificar enfermedades en cultivos agrícolas de zonas rurales y periurbanas.',
        solicitudes: [
          { id: 201, trlObj: 4, status: 'en_evaluacion', date: '05 jun 2026', obs: 2 }
        ]
      },
      {
        id: 3,
        title: 'PLATAFORMA WEB DE GESTIÓN TERRITORIAL',
        team: 'Sergi Montaño, Andy Veintimilla',
        branch: 'SOFTWARE / IA',
        resumen: 'Sistema web para la gestión y seguimiento de proyectos de innovación tecnológica en entornos rurales y urbanos.',
        solicitudes: [
          { id: 301, trlObj: 5, status: 'certificado', trlFinal: 5, date: '01 mar 2026', obs: 0 },
          { id: 302, trlObj: 6, status: 'requiere_cambios', date: '08 jun 2026', obs: 3 }
        ]
      }
    ],
    CRITERIA_SPEC: {
      'SOFTWARE / IA': {
        4: [
          { ref: 'RF-04-A', label: 'Prototipo funcional integrado en entorno web', hint: 'Módulos web probados y desplegados en servidor staging. Adjuntar enlace de demostración.' },
          { ref: 'RF-04-B', label: 'Dataset agrícola o rural representativo', hint: 'Datos tomados de zonas productivas rurales o centros asistenciales.' },
          { ref: 'RF-04-C', label: 'Arquitectura del sistema en la nube', hint: 'Diagrama del backend web, API REST y bases de datos relacionales.' }
        ],
        6: [
          { ref: 'RF-06-A', label: 'Demostración en entorno operacional rural y urbano', hint: 'El sistema opera con conectividad real e intermitente en campo.' },
          { ref: 'RF-06-B', label: 'Métricas de disponibilidad en producción web', hint: 'Uptime, tiempo de respuesta del servidor y concurrencia evaluadas.' }
        ]
      },
      'HARDWARE / IOT': {
        2: [
          { ref: 'RH-02-A', label: 'Diseño arquitectónico de telemetría', hint: 'Esquema general de transmisión de datos hacia la plataforma web central.' },
          { ref: 'RH-02-B', label: 'Aplicación en cuencas hidrográficas', hint: 'Identificar el sector rural o urbano de Loja donde se aplicará la medición hídrica.' }
        ]
      }
    }
  }
};

// =================================================================================
// RENDER FUNCTIONS (SCREENS)
// =================================================================================

/**
 * Renderiza la pantalla de inicio de sesión.
 * @returns {string} El HTML de la pantalla de inicio de sesión.
 */
function renderLogin() {
  return `
    <div class="auth-shell">
      <div class="hero-card">
        <div class="hero-badge">UTPL · Innovación y tecnología</div>
        <div class="hero-icon">🚀</div>
        <h2 class="hero-title">Portal institucional de evaluación TRL</h2>
        <p class="hero-subtitle">Gestione solicitudes, evidencias y dictámenes con una experiencia clara, segura y alineada con los estándares de la Universidad Técnica Particular de Loja.</p>

        <div class="role-switcher">
          <span class="chip act" onclick="selRole('investigator', this)">👨‍🔬 Investigador</span>
          <span class="chip" onclick="selRole('evaluator', this)">🧑‍⚖️ Evaluador</span>
          <span class="chip" onclick="selRole('manager', this)">📊 Gestor</span>
        </div>

        <div class="card" style="text-align: left; margin-bottom: 0; padding: 22px; border-radius: 18px; box-shadow: none;">
          <label style="font-size: 11px; font-weight: 800; color: var(--primary-dark); display: block; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.08em;">Correo institucional</label>
          <input class="inp" id="loginEmail" type="email" value="pedro.yepez@utpl.edu.ec" placeholder="usuario@utpl.edu.ec">
          <label style="font-size: 11px; font-weight: 800; color: var(--primary-dark); display: block; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.08em;">Contraseña</label>
          <input class="inp" type="password" value="dummy-password" placeholder="••••••••">
          <button class="btn" onclick="doLogin()" style="margin-top: 8px; width: 100%;">🔑 Ingresar al sistema</button>
        </div>
      </div>
    </div>
    <p style="font-size: 11px; text-align: center; color: var(--text-muted); margin-top: 16px;">
      Plataforma de Innovación UTPL · Todos los derechos reservados.
    </p>
  `;
}

/**
 * Renderiza el panel principal del investigador.
 * @returns {string} El HTML del panel del investigador.
 */
function renderInvHome() {
  let html = `
    <div style="padding: 10px 0;">
      <div class="card profile-card">
        <div class="profile-avatar">PY</div>
        <div style="flex: 1;">
          <p class="profile-name">PEDRO YEPEZ</p>
          <span class="profile-badge">👨‍🔬 Investigador UTPL</span>
          <p class="profile-caption">Gestión de portafolio y seguimiento de evaluación TRL.</p>
        </div>
        <span class="section-pill">Portafolio activo</span>
      </div>

      <div class="card-flat status-banner" style="cursor: pointer;" onclick="showScreen('privacy')">
        <div class="status-icon">🛡️</div>
        <div style="flex: 1;">
          <p style="font-size: 13px; font-weight: 800; color: var(--utpl-blue);">PRIVACIDAD LOPDP</p>
          <p style="font-size: 11px; color: var(--text-muted);">Gestión de derechos y tratamiento seguro de datos.</p>
        </div>
        <span style="font-size: 20px; color: var(--utpl-blue); font-weight: 700;">›</span>
      </div>

      <div class="section-head">
        <span class="section-label">Mi portafolio TRL</span>
        <span class="section-pill">3 iniciativas</span>
      </div>
  `;

  app.data.PROJECTS.forEach(p => {
    const lastSol = p.solicitudes[p.solicitudes.length - 1] || { status: 'borrador' };
    const sm = app.data.STATUS_META[lastSol.status] || app.data.STATUS_META.borrador;

    html += `
      <div class="card project-card" style="cursor: pointer;" onclick="showScreen('inv_proj_detail', ${p.id})">
        <div class="project-top">
          <span class="project-title">${p.title}</span>
          <span class="badge ${sm.cls}">${sm.label}</span>
        </div>
        <p style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 4px;">🔧 ${p.branch}</p>
        <p style="font-size: 12px; color: var(--text-dark);">👥 ${p.team}</p>
      </div>
    `;
  });

  html += `
      <div style="padding: 0 16px;">
        <button class="btn" onclick="requireConsent('inv_new_proj')" style="margin-top: 10px;">➕ REGISTRAR NUEVO PROYECTO WEB</button>
      </div>
    </div>
  `;
  return html;
}

/**
 * Renderiza la pantalla de gestión de privacidad y consentimiento.
 * @returns {string} El HTML de la pantalla de privacidad.
 */
function renderPrivacy() {
  return `
    <div class="page-shell" style="padding: 10px 0;">
      <div class="card panel-hero" style="text-align: left;">
        <div class="page-header">
          <div>
            <div class="eyebrow">Privacidad y protección de datos</div>
            <h2 class="page-title">Derechos LOPDP</h2>
          </div>
          <span class="section-pill">UTPL · Cumplimiento</span>
        </div>
        <p style="font-size: 13px; color: var(--text-muted); line-height: 1.6;">Gestiona tus derechos de acceso, rectificación, cancelación y oposición de manera segura y trazable desde la plataforma institucional.</p>
      </div>
      <div class="section-head">
        <span class="section-label">Estado del consentimiento</span>
        <span class="section-pill">${app.state.consentAccepted ? 'Consentimiento otorgado' : 'Pendiente de aprobación'}</span>
      </div>
      <div class="card info-card" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
        <div>
          <p style="font-size: 13px; font-weight: 800; color: var(--primary-dark);">Tratamiento cifrado</p>
          <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Tus datos se procesan con controles de confidencialidad y trazabilidad institucional.</p>
        </div>
        <span class="badge ${app.state.consentAccepted ? 'b-green' : 'b-amber'}">${app.state.consentAccepted ? 'OTORGADO' : 'PENDIENTE'}</span>
      </div>
      <div class="card action-card">
        <div class="help-callout" style="flex:1; min-width:240px;">
          <strong>Recomendación:</strong> conserva el consentimiento activo para garantizar continuidad en tus trámites institucionales.
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn-out" onclick="showToast('SOLICITUD DE DESCARGA ENVIADA')">📥 Solicitar copia de datos</button>
          <button class="btn-out" onclick="showToast('SOLICITUD DE REVOCACIÓN EN PROCESO')" style="color: var(--danger); border-color: var(--danger);">🗑️ Solicitar eliminación</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renderiza los detalles de un proyecto de investigación.
 * @param {number} id - El ID del proyecto.
 * @returns {string} El HTML de la pantalla de detalles del proyecto.
 */
function renderInvProjDetail(id) {
  const p = app.data.PROJECTS.find(x => x.id === id) || app.data.PROJECTS[0];
  const lastSol = p.solicitudes[p.solicitudes.length - 1] || { status: 'borrador' };
  const sm = app.data.STATUS_META[lastSol.status] || app.data.STATUS_META.borrador;

  let html = `
    <div class="page-shell" style="padding: 10px 0;">
      <div class="card panel-hero">
        <div class="page-header">
          <div>
            <div class="eyebrow">Expediente TRL</div>
            <h2 class="page-title">${p.title}</h2>
          </div>
          <span class="badge ${sm.cls}">${sm.label}</span>
        </div>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Equipo</span>
            <p>${p.team}</p>
          </div>
          <div class="detail-item">
            <span class="detail-label">Clasificación</span>
            <p>${p.branch}</p>
          </div>
          <div class="detail-item">
            <span class="detail-label">Última solicitud</span>
            <p>TRL ${lastSol.trlObj || 3} · ${lastSol.date || 'Sin fecha'}</p>
          </div>
        </div>
      </div>

      <div class="card action-card">
        <div class="help-callout" style="flex:1; min-width:260px;">
          <strong>Resumen:</strong> ${p.resumen}
        </div>
        <button class="btn" onclick="showScreen('inv_solicitud', {projId: ${p.id}, isNew: true})">📋 Iniciar evaluación TRL</button>
      </div>

      <div class="section-head">
        <span class="section-label">Historial de revisiones</span>
        <span class="section-pill">${p.solicitudes.length} registros</span>
      </div>
      <div class="timeline-card">
        <div class="timeline" style="margin-top: 8px; padding: 0 4px;">
  `;

  p.solicitudes.slice().reverse().forEach(s => {
    const sm = app.data.STATUS_META[s.status] || app.data.STATUS_META.borrador;
    const isCert = s.status === 'certificado';
    const isReq = s.status === 'requiere_cambios';
    const dotCls = isCert ? 'done' : isReq ? 'curr' : 'pend';

    html += `
      <div class="tl-item">
        <div class="tl-dot ${dotCls}">●</div>
        <div style="flex: 1; padding-top: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 13px; font-weight: 700; color: var(--utpl-blue);">TRL ${s.trlObj}</span>
            <span class="badge ${sm.cls}">${sm.label}</span>
          </div>
          <p style="font-size: 11px; color: var(--text-muted); font-weight: 700;">📅 ${s.date}${s.obs > 0 ? ' · ' + s.obs + ' OBSERVACIONES' : ''}</p>
          ${s.trlFinal ? `<p style="font-size: 12px; font-weight: 700; color: #059669; margin-top: 6px;">🏅 CERTIFICADO TRL ${s.trlFinal}</p>` : ''}
        </div>
        <button class="btn-sm" onclick="showScreen('inv_solicitud', {projId: ${p.id}, solId: ${s.id}})" style="margin-top: 4px;">REVISAR</button>
      </div>
    `;
  });

  html += '</div></div></div>';
  return html;
}

/**
 * Renderiza el formulario para registrar un nuevo proyecto.
 * @returns {string} El HTML del formulario de nuevo proyecto.
 */
function renderInvNewProj() {
  return `
    <div class="page-shell" style="padding: 10px 0;">
      <div class="card panel-hero">
        <div class="page-header">
          <div>
            <div class="eyebrow">Registro institucional</div>
            <h2 class="page-title">Ficha técnica web</h2>
          </div>
          <span class="section-pill">Alta de proyecto</span>
        </div>
        <p style="font-size: 13px; color: var(--text-muted); line-height: 1.6;">Complete los metadatos para iniciar el proceso de evaluación TRL con una trazabilidad clara y cumplimiento institucional.</p>
      </div>

      <div class="card">
        <div style="width: 44px; height: 44px; background: var(--utpl-blue-soft); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; margin-bottom: 14px;">📝</div>
        <p style="font-size: 15px; font-weight: 800; color: var(--primary-dark); margin-bottom: 6px;">Datos del proyecto</p>
        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 18px;">Ingrese los metadatos de la solución en los ámbitos rural y urbano.</p>

        <label style="font-size: 11px; font-weight: 800; color: var(--primary-dark); display: block; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.08em;">Título del proyecto</label>
        <input class="inp" id="newTitle" placeholder="Ej. Plataforma web agraria">

        <label style="font-size: 11px; font-weight: 800; color: var(--primary-dark); display: block; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.08em;">Resumen ejecutivo</label>
        <textarea class="inp" id="newResumen" rows="3" placeholder="Describa la solución web y los sectores impactados..."></textarea>

        <label style="font-size: 11px; font-weight: 800; color: var(--primary-dark); display: block; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.08em;">Equipo de desarrollo</label>
        <input class="inp" id="newTeam" placeholder="Nombres separados por comas">

        <label style="font-size: 11px; font-weight: 800; color: var(--primary-dark); display: block; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.08em;">Clasificación</label>
        <select class="inp" id="newBranch">
          <option value="SOFTWARE / IA">SOFTWARE / IA</option>
          <option value="HARDWARE / IOT">HARDWARE / IOT</option>
          <option value="BIOTECNOLOGÍA">BIOTECNOLOGÍA</option>
          <option value="ENERGÍA RENOVABLE">ENERGÍA RENOVABLE</option>
        </select>

        <button class="btn" onclick="saveNewProject()" style="margin-top: 14px;">💾 Guardar registro web</button>
      </div>
    </div>
  `;
}

/**
 * Renderiza la pantalla de solicitud de evaluación TRL.
 * @param {object} arg - Argumentos de la pantalla {projId, solId?, isNew?}.
 * @returns {string} El HTML de la pantalla de solicitud.
 */
function renderInvSolicitud(arg) {
  const proj = app.data.PROJECTS.find(x => x.id === arg.projId) || app.data.PROJECTS[0];
  let sol = null;
  if (arg.solId) {
    sol = proj.solicitudes.find(s => s.id === arg.solId);
  } else {
    sol = proj.solicitudes[proj.solicitudes.length - 1];
  }

  const trl = sol ? sol.trlObj : 4;
  const sm = sol ? app.data.STATUS_META[sol.status] : app.data.STATUS_META.borrador;
  const canEdit = sol && (sol.status === 'borrador' || sol.status === 'requiere_cambios');
  const criteria = getCriteria(proj.branch, trl);

  let html = `
    <div class="page-shell" style="padding: 10px 0;">
      <div class="card panel-hero">
        <div class="page-header">
          <div>
            <div class="eyebrow">Solicitud de evaluación</div>
            <h2 class="page-title">TRL ${trl} · ${proj.title}</h2>
          </div>
          <span class="badge ${sm.cls}">${sm.label}</span>
        </div>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Proyecto</span>
            <p>${proj.title}</p>
          </div>
          <div class="detail-item">
            <span class="detail-label">Clasificación</span>
            <p>${proj.branch}</p>
          </div>
          <div class="detail-item">
            <span class="detail-label">Criterios</span>
            <p>${criteria.length} elementos por validar</p>
          </div>
        </div>
      </div>

      ${sol && sol.status === 'requiere_cambios' ? `
        <div class="card help-callout">
          <strong>⚠️ Observaciones del evaluador:</strong> se detectaron brechas en la documentación de archivos estáticos y arquitectura. Actualiza la evidencia en servidor.
        </div>
      ` : ''}

      <div class="section-head">
        <span class="section-label">Matriz de evaluación TRL ${trl}</span>
        <span class="section-pill">${canEdit ? 'Edición habilitada' : 'Revisión cerrada'}</span>
      </div>
  `;

  criteria.forEach((c, idx) => {
    const key = `${proj.id}_${trl}_${c.ref}`;
    const curAns = app.state.critAnswers[key] || 'CUMPLE';
    const uploadedFile = app.state.uploadedFiles[key];

    html += `
      <div class="crit-row">
        <p class="crit-lbl">${idx + 1}. ${c.label}</p>
        <div class="crit-hint">💡 ${c.hint}</div>
        ${canEdit ? `
          <div class="crit-opts">
            <span class="crit-opt ${curAns === 'CUMPLE' ? 'sel' : ''}" onclick="setAnswer('${key}', 'CUMPLE', this)">✅ CUMPLE</span>
            <span class="crit-opt ${curAns === 'NO CUMPLE' ? 'sel-no' : ''}" onclick="setAnswer('${key}', 'NO CUMPLE', this)">❌ NO CUMPLE</span>
          </div>
          ${uploadedFile ? `
            <div class="upzone" style="background: var(--utpl-blue-soft); border-color: var(--utpl-blue); display: flex; align-items: center; justify-content: space-between; padding: 10px 12px;">
              <div style="display: flex; align-items: center; gap: 10px; flex: 1; overflow: hidden;">
                <span style="font-size: 18px;">📄</span>
                <div style="flex: 1; overflow: hidden;">
                  <p style="font-size: 12px; font-weight: 700; color: var(--utpl-blue); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${uploadedFile.name}</p>
                  <p style="font-size: 10px; color: var(--text-muted);">${(uploadedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button onclick="removeFile('${key}')" style="background: transparent; border: none; font-size: 18px; color: var(--danger); cursor: pointer; padding: 4px;">🗑️</button>
            </div>
          ` : `
            <div class="upzone" onclick="handleFileUpload('${key}')">
              <span style="font-size: 20px;">📎</span>
              <p style="font-size: 11px; font-weight: 700; color: var(--utpl-blue);">ADJUNTAR EVIDENCIA DOCUMENTAL</p>
              <span style="font-size: 10px; color: var(--text-muted);">PDF, ZIP, LOGS (MAX 15MB)</span>
            </div>
          `}
        ` : `
          <div style="padding: 10px; background: var(--bg-body); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: 700; color: var(--text-muted);">ESTADO RESPUESTA:</span>
            <span class="badge ${curAns === 'CUMPLE' ? 'b-green' : 'b-amber'}">${curAns}</span>
          </div>
        `}
      </div>
    `;
  });

  if (canEdit) {
    html += `
      <div style="padding: 0 16px; margin-top: 14px;">
        <button class="btn" onclick="sendToEval(${proj.id}, ${sol ? sol.id : null})">🚀 ENVIAR AL EVALUADOR</button>
      </div>
    `;
  } else {
    html += `
      <div class="card empty-card">
        <span style="font-size: 24px;">🔒</span>
        <p style="font-size: 13px; font-weight: 800; color: var(--primary-dark); margin-top: 10px;">Expediente en revisión</p>
        <p style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">El evaluador revisará la evidencia subida y emitirá el dictamen correspondiente.</p>
      </div>
    `;
  }

  html += '</div>';
  return html;
}

/**
 * Renderiza el panel principal del evaluador.
 * @returns {string} El HTML del panel del evaluador.
 */
function renderEvHome() {
  return `
    <div style="padding: 10px 0;">
      <div class="card profile-card">
        <div class="profile-avatar" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); color: #b45309;">AV</div>
        <div style="flex: 1;">
          <p class="profile-name">ANDY VEINTIMILLA</p>
          <span class="profile-badge">🧑‍⚖️ Evaluador UTPL</span>
          <p class="profile-caption">Revisión técnica, observaciones y dictámenes de madurez TRL.</p>
        </div>
        <span class="section-pill">Auditoría activa</span>
      </div>

      <div class="card-flat" style="background: var(--utpl-blue-soft); border-color: #BFDBFE; display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 18px;">🔐</span>
        <p style="font-size: 11px; font-weight: 700; color: var(--utpl-blue); line-height: 1.4;">AUDITORÍA DEL PORTAL WEB CIFRADA EN BITÁCORA.</p>
      </div>

      <div style="display: flex; gap: 12px; padding: 0 16px; margin-top: 14px;">
        <div class="card-flat" style="flex: 1; margin: 0; text-align: center;">
          <p style="font-size: 22px; font-weight: 700; color: var(--utpl-blue);">1</p>
          <p style="font-size: 10px; font-weight: 700; color: var(--text-muted); margin-top: 4px;">EN PROCESO</p>
        </div>
        <div class="card-flat" style="flex: 1; margin: 0; text-align: center; background: var(--utpl-gold); border-color: var(--utpl-gold);">
          <p style="font-size: 22px; font-weight: 700; color: var(--utpl-blue);">1</p>
          <p style="font-size: 10px; font-weight: 700; color: var(--utpl-blue); margin-top: 4px;">POR ASIGNAR</p>
        </div>
      </div>

      <div class="section-head">
        <span class="section-label">Auditorías en curso</span>
        <span class="section-pill">2 solicitudes</span>
      </div>
      <div class="card project-card" style="cursor: pointer;" onclick="showScreen('ev_review', 2)">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <span style="font-size: 13px; font-weight: 700; color: var(--utpl-blue); line-height: 1.3; flex: 1;">ALGORITMO DE CLASIFICACIÓN DE CULTIVOS CON IA</span>
          <span class="badge b-blue">TRL 4</span>
        </div>
        <p style="font-size: 11px; font-weight: 700; color: var(--text-dark); margin-bottom: 4px;">👤 Hansell Benavides</p>
        <p style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 12px;">🔧 SOFTWARE / IA</p>
        <div style="display: flex; gap: 14px; font-size: 11px; font-weight: 700; color: var(--text-muted);">
          <span>📎 4 DOCS</span>
          <span style="color: #D97706;">💬 2 OBS.</span>
        </div>
      </div>

      <div class="section-head">
        <span class="section-label">Bandeja de entrada</span>
        <span class="section-pill">1 pendiente</span>
      </div>
      <div class="card project-card" style="cursor: pointer;" onclick="showScreen('ev_review', 1)">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <span style="font-size: 13px; font-weight: 700; color: var(--utpl-blue); line-height: 1.3; flex: 1;">SENSOR IOT PARA MONITOREO HÍDRICO</span>
          <span class="badge b-blue">TRL 2</span>
        </div>
        <p style="font-size: 11px; font-weight: 700; color: var(--text-dark); margin-bottom: 4px;">👤 Pedro Yépez</p>
        <p style="font-size: 11px; font-weight: 700; color: var(--text-muted);">🔧 HARDWARE / IOT</p>
      </div>
    </div>
  `;
}

/**
 * Renderiza la pantalla de revisión de expediente para el evaluador.
 * @param {number} projId - El ID del proyecto a revisar.
 * @returns {string} El HTML de la pantalla de revisión.
 */
function renderEvReview(projId) {
  const proj = app.data.PROJECTS.find(x => x.id === projId) || app.data.PROJECTS[1];
  const trl = proj.id === 2 ? 4 : 2;
  const criteria = getCriteria(proj.branch, trl);

  let html = `
    <div class="page-shell" style="padding: 10px 0;">
      <div class="card panel-hero">
        <div class="page-header">
          <div>
            <div class="eyebrow">Revisión de expediente</div>
            <h2 class="page-title">${proj.title}</h2>
          </div>
          <span class="section-pill">TRL ${trl}</span>
        </div>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Equipo</span>
            <p>${proj.team}</p>
          </div>
          <div class="detail-item">
            <span class="detail-label">Clasificación</span>
            <p>${proj.branch}</p>
          </div>
          <div class="detail-item">
            <span class="detail-label">Objetivo</span>
            <p>Validar cumplimiento del nivel TRL ${trl}</p>
          </div>
        </div>
      </div>

      <div class="section-head">
        <span class="section-label">Verificación TRL ${trl}</span>
        <span class="section-pill">Checklist técnico</span>
      </div>
  `;

  criteria.forEach((c, idx) => {
    const key = `EV_${proj.id}_${c.ref}`;
    const ver = app.state.evVerdicts[key] || 'CUMPLE';

    html += `
      <div class="crit-row">
        <p class="crit-lbl">${idx + 1}. ${c.label}</p>
        <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-body); padding: 8px 10px; border-radius: 8px; margin-bottom: 10px;">
          <span style="font-size: 11px; font-weight: 700; color: var(--text-dark);">AUTOEVALUACIÓN:</span>
          <span class="badge b-green">CUMPLE</span>
        </div>
        <p style="font-size: 11px; font-weight: 700; color: var(--utpl-blue); margin-bottom: 6px;">DICTAMEN DEL AUDITOR:</p>
        <div class="crit-opts">
          <span class="crit-opt ${ver === 'CUMPLE' ? 'sel' : ''}" onclick="setVerdict('${key}', 'CUMPLE', this)">✅ APROBAR</span>
          <span class="crit-opt ${ver === 'OBSERVADO' ? 'sel-no' : ''}" onclick="setVerdict('${key}', 'OBSERVADO', this)">⚠️ OBSERVAR</span>
        </div>
        <button class="btn-sm" onclick="openObsModal(${proj.id}, '${c.ref}')" style="margin-top: 4px; width: 100%;">💬 LEVANTAR OBSERVACIÓN</button>
      </div>
    `;
  });

  html += `
      <div class="section-head">
        <span class="section-label">Resolución de auditoría</span>
        <span class="section-pill">Decisión final</span>
      </div>
      <div class="card action-card">
        <div class="help-callout" style="flex:1; min-width:220px;">
          <strong>Recomendación:</strong> documente el resultado con una justificación breve y precisa para la trazabilidad institucional.
        </div>
        <div style="display:flex; flex-direction:column; gap:10px; min-width:240px;">
          <button class="btn" onclick="dictaminar(${proj.id}, 'certificado', ${trl})" style="background: linear-gradient(135deg, #1e8f5a 0%, #117b46 100%); margin-bottom: 0;">🏅 Certificar TRL ${trl}</button>
          <button class="btn" onclick="dictaminar(${proj.id}, 'requiere_cambios', ${trl})" style="background: linear-gradient(135deg, #c97a00 0%, #a95f00 100%);">⚠️ Devolver (requiere cambios)</button>
          <button class="btn-out" onclick="dictaminar(${proj.id}, 'reclasificado', ${Math.max(1, trl - 1)})" style="color: var(--utpl-blue);">🔀 Reclasificar a TRL ${Math.max(1, trl - 1)}</button>
        </div>
      </div>
    </div>
  `;
  return html;
}

/**
 * Renderiza el dashboard del gestor I+D+i.
 * @returns {string} El HTML del dashboard del gestor.
 */
function renderMgrDash() {
  return `
    <div class="page-shell" style="padding: 10px 0;">
      <div class="card profile-card">
        <div class="profile-avatar">AC</div>
        <div style="flex: 1;">
          <p class="profile-name">ARMANDO CABRERA</p>
          <span class="profile-badge">📊 Gestor I+D+i UTPL</span>
          <p class="profile-caption">Trazabilidad, indicadores y seguimiento institucional.</p>
        </div>
        <span class="section-pill">Panel ejecutivo</span>
      </div>

      <div class="card-flat" style="display: flex; align-items: center; gap: 14px; cursor: pointer;" onclick="showScreen('audit')">
        <div style="width: 38px; height: 38px; background: var(--bg-body); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px;">🧾</div>
        <div style="flex: 1;">
          <p style="font-size: 13px; font-weight: 700; color: var(--utpl-blue);">TRAZABILIDAD TÉCNICA</p>
          <p style="font-size: 11px; color: var(--text-muted);">BITÁCORA ISO 27001 INMUTABLE</p>
        </div>
        <span style="font-size: 20px; color: var(--utpl-blue); font-weight: 700;">›</span>
      </div>

      <div class="section-head">
        <span class="section-label">KPIs institucionales</span>
        <span class="section-pill">Métrica de impacto</span>
      </div>
      <div class="metric-row">
        <div class="mc metric-card"><div class="mn">24</div><div class="ml">PORTAFOLIO ACTIVO</div></div>
        <div class="mc metric-card"><div class="mn" style="color: #059669;">8</div><div class="ml">TRL 7-9 CERTIFICADOS</div></div>
        <div class="mc metric-card"><div class="mn">4.6</div><div class="ml">TRL PROMEDIO</div></div>
        <div class="mc metric-card"><div class="mn" style="color: #D97706;">3</div><div class="ml">BRECHAS CRÍTICAS</div></div>
      </div>

      <div class="section-head">
        <span class="section-label">Distribución de madurez</span>
        <span class="section-pill">Mapa estratégico</span>
      </div>
      <div class="card">
        <div class="mini-wrap"><div class="mini-lbl"><span>TRL 1-2 (RESEARCH)</span><span>2</span></div><div class="tbar2"><div class="tfill" style="width: 15%; background: #EF4444;"></div></div></div>
        <div class="mini-wrap"><div class="mini-lbl"><span>TRL 3-4 (LABORATORIO)</span><span>8</span></div><div class="tbar2"><div class="tfill" style="width: 45%; background: #F59E0B;"></div></div></div>
        <div class="mini-wrap"><div class="mini-lbl"><span>TRL 5-6 (PROTOTIPO)</span><span>6</span></div><div class="tbar2"><div class="tfill" style="width: 35%; background: #3B82F6;"></div></div></div>
        <div class="mini-wrap"><div class="mini-lbl"><span>TRL 7-9 (DESPLIEGUE)</span><span>8</span></div><div class="tbar2"><div class="tfill" style="width: 50%; background: #10B981;"></div></div></div>
      </div>

      <div style="padding: 0 16px;">
        <button class="btn" onclick="showToast('SINTETIZANDO DATA ROOM EN PDF...')" style="margin-top: 10px;">📄 GENERAR DATA ROOM (PDF)</button>
      </div>
    </div>
  `;
}

/**
 * Renderiza la pantalla de la bitácora de auditoría.
 * @returns {string} El HTML de la pantalla de auditoría.
 */
function renderAudit() {
  return `
    <div class="page-shell" style="padding: 10px 0;">
      <div class="card panel-hero">
        <div class="page-header">
          <div>
            <div class="eyebrow">Trazabilidad institucional</div>
            <h2 class="page-title">Bitácora de auditoría</h2>
          </div>
          <span class="section-pill">ISO 27001</span>
        </div>
        <p style="font-size: 13px; color: var(--text-muted); line-height: 1.6;">Registro inmutable de eventos para soporte normativo, revisión documental y control de continuidad del proceso.</p>
      </div>

      <div class="section-head">
        <span class="section-label">Últimos eventos registrados</span>
        <span class="section-pill">Seguimiento activo</span>
      </div>
      <div class="card" style="padding: 0; overflow: hidden;">
        <div style="padding: 12px 14px; border-bottom: 1px solid var(--border);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span style="font-weight: 700; color: var(--utpl-blue); font-size: 12px;">EVALUACIÓN TRL 4 ENVIADA</span><span style="font-size: 10px; color: var(--text-muted);">09:41 AM</span></div>
          <p style="font-size: 11px; color: var(--text-dark);">👤 PEDRO YEPEZ · PROYECTO ID #2</p>
        </div>
        <div style="padding: 12px 14px; border-bottom: 1px solid var(--border);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span style="font-weight: 700; color: var(--utpl-blue); font-size: 12px;">CONSENTIMIENTO LOPDP OTORGADO</span><span style="font-size: 10px; color: var(--text-muted);">09:30 AM</span></div>
          <p style="font-size: 11px; color: var(--text-dark);">👤 PEDRO YEPEZ · BÓVEDA CIFRADA</p>
        </div>
        <div style="padding: 12px 14px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span style="font-weight: 700; color: var(--utpl-blue); font-size: 12px;">DICTAMEN EMITIDO: TRL 5</span><span style="font-size: 10px; color: var(--text-muted);">AYER</span></div>
          <p style="font-size: 11px; color: var(--text-dark);">👤 ANDY VEINTIMILLA · PROYECTO ID #3</p>
        </div>
      </div>

      <div style="padding: 0 16px; margin-top: 14px;">
        <button class="btn-out" onclick="showToast('DESCARGANDO TRAZABILIDAD...')">📥 DESCARGAR LOGS</button>
      </div>
    </div>
  `;
}

// =================================================================================
// SCREEN CONFIGURATION
// =================================================================================

const screenConfig = {
  'login': { title: 'PLATAFORMA WEB TRL UTPL', render: renderLogin },
  'inv_home': { title: 'PANEL INVESTIGADOR', render: renderInvHome },
  'ev_home': { title: 'PANEL DE AUDITORÍA', render: renderEvHome },
  'mgr_dash': { title: 'INTELIGENCIA I+D+I', render: renderMgrDash },
  'inv_proj_detail': { title: 'EXPEDIENTE TRL', render: renderInvProjDetail },
  'inv_new_proj': { title: 'ALTA DE PROYECTO', render: renderInvNewProj },
  'inv_solicitud': { title: 'AUDITORÍA TÉCNICA', render: renderInvSolicitud },
  'ev_review': { title: 'REVISIÓN EXPEDIENTE', render: renderEvReview },
  'privacy': { title: 'PRIVACIDAD LOPDP', render: renderPrivacy },
  'audit': { title: 'BITÁCORA ISO 27001', render: renderAudit },
};

// =================================================================================
// CORE UI & NAVIGATION
// =================================================================================

/**
 * Muestra una notificación temporal (toast).
 * @param {string} msg - El mensaje a mostrar.
 */
function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

/**
 * Cierra cualquier modal abierto.
 */
function closeModal() {
  const m = document.getElementById('modal');
  if (m) m.remove();
}

/**
 * Renderiza la navegación de la barra lateral (desktop) y la barra inferior (móvil).
 * @param {string} name - La pantalla actual.
 */
function renderNav(name) {
  const sidebarNav = document.getElementById('sidebarNav');
  const bottomNav = document.getElementById('bottomNav');
  
  if (!app.state.session.authenticated) {
    if (sidebarNav) sidebarNav.innerHTML = '';
    if (bottomNav) bottomNav.innerHTML = '';
    const sidebar = document.getElementById('sidebar');
    const bottomNavEl = document.getElementById('bottomNav');
    if(sidebar) sidebar.style.display = 'none';
    if(bottomNavEl) bottomNavEl.style.display = 'none';
    return;
  } else {
    const sidebar = document.getElementById('sidebar');
    const bottomNavEl = document.getElementById('bottomNav');
    if(sidebar) sidebar.style.display = 'flex';
    if(bottomNavEl) bottomNavEl.style.display = 'flex';
  }

  let links = [];
  if (app.state.session.role === 'investigator') {
    links = [
      { id: 'inv_home', icon: '🏠', text: 'Mi Portafolio' },
      { id: 'privacy', icon: '🛡️', text: 'Privacidad LOPDP' }
    ];
  } else if (app.state.session.role === 'evaluator') {
    links = [
      { id: 'ev_home', icon: '🧑‍⚖️', text: 'Auditorías' }
    ];
  } else {
    links = [
      { id: 'mgr_dash', icon: '📊', text: 'Panel I+D+i' },
      { id: 'audit', icon: '🧾', text: 'Bitácora' }
    ];
  }

  const sidebarHtml = links.map(l => `
    <a href="#" class="nav-link ${name === l.id ? 'act' : ''}" onclick="navTo('${l.id}')" aria-current="${name === l.id ? 'page' : 'false'}">
      <span aria-hidden="true" style="font-size: 1.25rem;">${l.icon}</span>
      <span>${l.text}</span>
    </a>
  `).join('');

  const bottomHtml = links.map(l => `
    <a href="#" class="bnav-item ${name === l.id ? 'act' : ''}" onclick="navTo('${l.id}')" aria-current="${name === l.id ? 'page' : 'false'}">
      <span class="bnav-icon" aria-hidden="true">${l.icon}</span>
      <span class="bnav-text">${l.text}</span>
    </a>
  `).join('');

  if (sidebarNav) sidebarNav.innerHTML = sidebarHtml;
  if (bottomNav) bottomNav.innerHTML = bottomHtml;
}

/**
 * Abre/cierra el sidebar en móviles
 */
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  if (sb) {
    sb.classList.toggle('open');
    const isExpanded = sb.classList.contains('open');
    document.getElementById('mobileMenuBtn').setAttribute('aria-expanded', isExpanded);
  }
}

/**
 * Redirige a la vista inicial según el rol
 */
function goHome() {
  if (!app.state.session.authenticated) return navTo('login');
  if (app.state.session.role === 'investigator') navTo('inv_home');
  else if (app.state.session.role === 'evaluator') navTo('ev_home');
  else navTo('mgr_dash');
}

/**
 * Renderiza una pantalla y actualiza la UI.
 * @private
 * @param {string} name - El nombre de la pantalla a renderizar.
 * @param {*} [arg] - Un argumento opcional para la función de renderizado.
 */
function _render(name, arg) {
  const config = screenConfig[name] || screenConfig.login;
  const mainScr = document.getElementById('mainScr');
  const tbarTitle = document.getElementById('tbarTitle');
  const logoutBtn = document.getElementById('logoutBtn');
  const bkBtn = document.getElementById('bkBtn');

  // Actualizar barra de herramientas
  if(tbarTitle) tbarTitle.textContent = config.title;
  if(logoutBtn) logoutBtn.style.display = (name === 'login') ? 'none' : 'flex';
  if(bkBtn) bkBtn.style.display = (app.state.navStack.length > 0) ? 'flex' : 'none';

  renderNav(name);

  // Renderizar contenido principal
  if(mainScr) {
    mainScr.innerHTML = config.render(arg);
    mainScr.scrollTop = 0;
  }
}

/**
 * Navega a una nueva pantalla, apilando la actual.
 * @param {string} name - El nombre de la pantalla de destino.
 * @param {*} [arg] - Un argumento opcional para la pantalla.
 */
function showScreen(name, arg) {
  app.state.navStack.push({ name: app.state.currentScreen, arg: app.state.currentScreenArg });
  app.state.currentScreen = name;
  app.state.currentScreenArg = arg;
  _render(name, arg);
}

/**
 * Vuelve a la pantalla anterior en la pila de navegación.
 */
function goBack() {
  if (app.state.navStack.length > 0) {
    const prev = app.state.navStack.pop();
    app.state.currentScreen = prev.name;
    app.state.currentScreenArg = prev.arg;
    _render(prev.name, app.state.currentScreenArg);
  }
}

/**
 * Navega a una pantalla, reseteando la pila de navegación.
 * @param {string} name - El nombre de la pantalla de destino.
 * @param {*} [arg] - Un argumento opcional para la pantalla.
 */
function navTo(name, arg) {
  app.state.navStack = [];
  app.state.currentScreen = name;
  app.state.currentScreenArg = arg;
  _render(name, arg);
}

// =================================================================================
// AUTHENTICATION & ROLES
// =================================================================================

/**
 * Cierra la sesión del usuario actual.
 */
function logout() {
  app.state.session = { authenticated: false, role: null, name: null };
  navTo('login');
  showToast('SESIÓN FINALIZADA CORRECTAMENTE');
}

/**
 * Selecciona un rol de usuario en la pantalla de login.
 * @param {string} role - El rol seleccionado ('investigator', 'evaluator', 'manager').
 * @param {HTMLElement} el - El elemento del chip de rol que fue clickeado.
 */
function selRole(role, el) {
  app.state.selectedRole = role;
  document.querySelectorAll('.chip').forEach(chip => chip.classList.remove('act'));
  el.classList.add('act');

  const emailInp = document.getElementById('loginEmail');
  if (emailInp) {
    if (role === 'investigator') emailInp.value = 'pedro.yepez@utpl.edu.ec';
    else if (role === 'evaluator') emailInp.value = 'andy.veintimilla@utpl.edu.ec';
    else emailInp.value = 'armando.cabrera@utpl.edu.ec';
  }
}

/**
 * Realiza el proceso de inicio de sesión (simulado).
 */
function doLogin() {
  app.state.session.authenticated = true;
  app.state.session.role = app.state.selectedRole;

  switch (app.state.selectedRole) {
    case 'investigator':
      app.state.session.name = 'PEDRO YEPEZ';
      navTo('inv_home');
      break;
    case 'evaluator':
      app.state.session.name = 'ANDY VEINTIMILLA';
      navTo('ev_home');
      break;
    default:
      app.state.session.name = 'ARMANDO CABRERA';
      navTo('mgr_dash');
      break;
  }
  showToast(`BIENVENIDO AL PORTAL, ${app.state.session.name}`);
}

// =================================================================================
// ACTION HANDLERS & LOGIC
// =================================================================================

/**
 * Verifica si se ha otorgado el consentimiento antes de navegar.
 * @param {string} targetScreen - La pantalla de destino si se otorga el consentimiento.
 */
function requireConsent(targetScreen) {
  if (app.state.consentAccepted) {
    showScreen(targetScreen);
  } else {
    openConsentModal(targetScreen);
  }
}

/**
 * Abre el modal de consentimiento LOPDP.
 * @param {string} targetScreen - La pantalla a la que se navegará tras aceptar.
 */
function openConsentModal(targetScreen) {
  const ov = document.createElement('div');
  ov.className = 'modal-ov';
  ov.id = 'modal';
  ov.innerHTML = `
    <div class="modal-bx" role="dialog" aria-labelledby="consentTitle" aria-modal="true">
      <div style="width: 2.75rem; height: 2.75rem; background: var(--utpl-blue-soft); border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; font-size: 1.375rem; margin: 0 auto 1rem;" aria-hidden="true">🛡️</div>
      <h3 class="modal-ttl" id="consentTitle" style="text-align: center;">CONSENTIMIENTO LOPDP</h3>
      <p class="modal-desc" style="text-align: center;">
        LA PLATAFORMA WEB ALMACENARÁ DE FORMA CIFRADA TUS DATOS DE IDENTIFICACIÓN Y EVIDENCIAS DE PROPIEDAD INTELECTUAL PARA AUDITORÍA TRL.
      </p>
      <label style="display: flex; align-items: flex-start; gap: 0.625rem; font-size: 0.875rem; font-weight: 700; color: var(--utpl-blue); margin-bottom: 1.5rem; cursor: pointer; background: var(--bg-body); padding: 1rem; border-radius: 0.75rem; border: 1px solid var(--border);">
        <input type="checkbox" id="consentChk" style="margin-top: 0.125rem; width: 1.25rem; height: 1.25rem; accent-color: var(--utpl-blue);" aria-required="true">
        <span>ACEPTO EL TRATAMIENTO SEGURO DE MIS DATOS.</span>
      </label>
      <div class="modal-acts">
        <button class="btn-out" onclick="closeModal()">❌ CANCELAR</button>
        <button class="btn" onclick="acceptConsent('${targetScreen}')">✅ CONFIRMAR</button>
      </div>
    </div>
  `;
  document.getElementById('modalContainer').appendChild(ov);
  document.getElementById('consentChk').focus();
}

/**
 * Procesa la aceptación del consentimiento.
 * @param {string} targetScreen - La pantalla de destino.
 */
function acceptConsent(targetScreen) {
  const chk = document.getElementById('consentChk');
  if (!chk || !chk.checked) {
    showToast('DEBES MARCAR LA CASILLA PARA CONTINUAR');
    return;
  }
  app.state.consentAccepted = true;
  closeModal();
  showToast('CONSENTIMIENTO LOPDP OTORGADO');
  setTimeout(() => showScreen(targetScreen), 200);
}

/**
 * Guarda un nuevo proyecto introducido en el formulario.
 */
function saveNewProject() {
  const title = document.getElementById('newTitle').value.trim();
  const resumen = document.getElementById('newResumen').value.trim();
  const team = document.getElementById('newTeam').value.trim() || 'PEDRO YEPEZ';
  const branch = document.getElementById('newBranch').value;

  if (!title || !resumen) {
    showToast('COMPLETAR TÍTULO Y RESUMEN');
    return;
  }

  const newId = app.data.PROJECTS.length + 1;
  app.data.PROJECTS.push({
    id: newId,
    title: title.toUpperCase(),
    team: team.toUpperCase(),
    branch: branch,
    resumen: resumen,
    solicitudes: [
      { id: newId * 100 + 1, trlObj: 3, status: 'borrador', date: '21 JUL 2026', obs: 0 }
    ]
  });

  showToast('PROYECTO WEB REGISTRADO');
  navTo('inv_home');
}

/**
 * Simula la carga de un archivo para un criterio específico.
 * @param {string} key - La clave única del criterio.
 */
function handleFileUpload(key) {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.style.display = 'none';

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      app.state.uploadedFiles[key] = {
        name: file.name,
        size: file.size,
      };

      showToast(`'${file.name}' CARGADO CORRECTAMENTE`);
      _render(app.state.currentScreen, app.state.currentScreenArg);
    }
    document.body.removeChild(fileInput);
  });

  document.body.appendChild(fileInput);
  fileInput.click();
}

/**
 * Elimina un archivo cargado para un criterio.
 * @param {string} key - La clave única del criterio.
 */
function removeFile(key) {
  if (app.state.uploadedFiles[key]) {
    const fileName = app.state.uploadedFiles[key].name;
    delete app.state.uploadedFiles[key];
    showToast(`'${fileName}' ELIMINADO`);
    _render(app.state.currentScreen, app.state.currentScreenArg);
  }
}

/**
 * Establece la respuesta de autoevaluación para un criterio.
 * @param {string} key - La clave única para la respuesta.
 * @param {string} val - El valor de la respuesta ('CUMPLE' o 'NO CUMPLE').
 * @param {HTMLElement} el - El elemento en el que se hizo clic.
 */
function setAnswer(key, val, el) {
  app.state.critAnswers[key] = val;
  const optsContainer = el.closest('.crit-opts');
  optsContainer.querySelectorAll('.crit-opt').forEach(opt => {
    opt.classList.remove('sel', 'sel-no');
  });
  if (val === 'CUMPLE') el.classList.add('sel');
  else el.classList.add('sel-no');
}

/**
 * Envía una solicitud de evaluación al panel del auditor.
 * @param {number} projId - El ID del proyecto.
 * @param {number} solId - El ID de la solicitud.
 */
function sendToEval(projId, solId) {
  const proj = app.data.PROJECTS.find(x => x.id === projId);
  if (proj) {
    const sol = proj.solicitudes.find(s => s.id === solId) || proj.solicitudes[proj.solicitudes.length - 1];
    if (sol) {
      sol.status = 'en_evaluacion';
      sol.date = '21 JUL 2026';
    }
  }
  showToast('ENVIADO AL PANEL DE AUDITORÍA TRL');
  setTimeout(() => navTo('inv_home'), 1000);
}

/**
 * Establece el veredicto del evaluador para un criterio.
 * @param {string} key - La clave única para el veredicto.
 * @param {string} val - El valor del veredicto ('CUMPLE' o 'OBSERVADO').
 * @param {HTMLElement} el - El elemento en el que se hizo clic.
 */
function setVerdict(key, val, el) {
  app.state.evVerdicts[key] = val;
  const optsContainer = el.closest('.crit-opts');
  optsContainer.querySelectorAll('.crit-opt').forEach(opt => {
    opt.classList.remove('sel', 'sel-no');
  });
  if (val === 'CUMPLE') el.classList.add('sel');
  else el.classList.add('sel-no');
}

/**
 * Abre un modal para registrar una observación del evaluador.
 * @param {number} projId - El ID del proyecto.
 * @param {string} ref - La referencia del criterio.
 */
function openObsModal(projId, ref) {
  var ov = document.createElement('div');
  ov.className = 'modal-ov';
  ov.id = 'modal';
  ov.innerHTML = `
    <div class="modal-bx" role="dialog" aria-labelledby="obsModalTitle" aria-modal="true">
      <h3 class="modal-ttl" id="obsModalTitle">REGISTRAR OBSERVACIÓN</h3>
      <p style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 1rem; text-align: center;">REFERENCIA: ${ref}</p>
      <label for="obsText" style="display: none;">Detalle de la corrección</label>
      <textarea class="inp" id="obsText" rows="4" placeholder="DETALLE LA CORRECCIÓN REQUERIDA EN EL SISTEMA WEB..." aria-required="true"></textarea>
      <div class="modal-acts">
        <button class="btn-out" onclick="closeModal()" aria-label="Cancelar y cerrar modal">❌ CANCELAR</button>
        <button class="btn" onclick="saveObservation(${projId})" aria-label="Guardar observación">💾 GUARDAR OBSERVACIÓN</button>
      </div>
    </div>
  `;
  document.getElementById('modalContainer').appendChild(ov);
  document.getElementById('obsText').focus();
}

/**
 * Guarda una observación (simulado).
 * @param {number} projId - El ID del proyecto.
 */
function saveObservation(projId) {
  const text = document.getElementById('obsText').value;
  if(!text.trim()) {
    showToast('DEBES ESCRIBIR UNA OBSERVACIÓN PARA GUARDAR');
    document.getElementById('obsText').focus();
    return;
  }
  closeModal();
  showToast('OBSERVACIÓN ANOTADA EN EL EXPEDIENTE');
}

/**
 * Emite el dictamen final de una evaluación pidiendo confirmación primero.
 * @param {number} projId - El ID del proyecto.
 * @param {string} status - El nuevo estado de la solicitud.
 * @param {number} finalTrl - El nivel TRL final certificado o reclasificado.
 */
function dictaminar(projId, status, finalTrl) {
  var ov = document.createElement('div');
  ov.className = 'modal-ov';
  ov.id = 'modal';
  ov.innerHTML = `
    <div class="modal-bx" role="alertdialog" aria-labelledby="confirmTitle" aria-describedby="confirmDesc" aria-modal="true">
      <h3 class="modal-ttl" id="confirmTitle" style="color: var(--danger);">⚠️ CONFIRMAR DICTAMEN</h3>
      <p class="modal-desc" id="confirmDesc">
        ESTÁ A PUNTO DE EMITIR EL DICTAMEN <strong>${status.toUpperCase().replace('_', ' ')}</strong>.<br>
        ESTA ACCIÓN NO SE PUEDE DESHACER Y QUEDARÁ REGISTRADA EN LA BITÁCORA ISO 27001.
      </p>
      <div class="modal-acts">
        <button class="btn-out" onclick="closeModal()">CANCELAR</button>
        <button class="btn" onclick="executeDictaminar(${projId}, '${status}', ${finalTrl})" style="background: var(--danger);">CONFIRMAR Y EMITIR</button>
      </div>
    </div>
  `;
  document.getElementById('modalContainer').appendChild(ov);
}

/**
 * Ejecuta el dictamen final.
 * @private
 */
function executeDictaminar(projId, status, finalTrl) {
  closeModal();
  const proj = app.data.PROJECTS.find(x => x.id === projId);
  if (proj) {
    const sol = proj.solicitudes[proj.solicitudes.length - 1];
    if (sol) {
      sol.status = status;
      if (status === 'certificado' || status === 'reclasificado') sol.trlFinal = finalTrl;
      if (status === 'requiere_cambios') sol.obs = 2;
    }
  }
  showToast(`DICTAMEN EMITIDO: ${status.toUpperCase().replace('_', ' ')}`);
  setTimeout(() => navTo('ev_home'), 1200);
}

// =================================================================================
// DATA HELPERS
// =================================================================================

/**
 * Obtiene la especificación de criterios para una rama y TRL dados.
 * @param {string} branch - La rama del proyecto (ej. 'SOFTWARE / IA').
 * @param {number} trl - El nivel de TRL.
 * @returns {Array<object>} Una lista de criterios.
 */
function getCriteria(branch, trl) {
  return (app.data.CRITERIA_SPEC[branch] || {})[trl] || [
    { ref: `GEN-${trl}-A`, label: `Validación general para TRL ${trl}`, hint: 'Cumplimiento técnico documentado en la plataforma para el nivel solicitado.' }
  ];
}

// =================================================================================
// APP INITIALIZATION
// =================================================================================

document.addEventListener('DOMContentLoaded', () => {
  app.state.currentScreenArg = null;
  _render(app.state.currentScreen, app.state.currentScreenArg);
});