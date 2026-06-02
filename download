// ============================================================
// Configuración de reglas
// ============================================================
export const REGLAS = {
  // Antispam de apodo: máximo de cambios dentro de la ventana
  apodo_max_cambios: 3,
  apodo_ventana_horas: 1,   // 3 cambios por hora
  nombre_min: 2,
  nombre_max: 32,
  apodo_min: 1,
  apodo_max: 32,
  password_min: 6,
};

// ============================================================
// Genera un código de 5 cifras libre para un nombre dado.
// Varios usuarios pueden compartir 'nombre', pero el par
// (nombre, codigo) debe ser único.
// ============================================================
export async function generarCodigoLibre(supabase, nombre) {
  // Cuántos códigos ya usa este nombre (máx teórico 100.000)
  const { data: existentes, error } = await supabase
    .from('usuarios')
    .select('codigo')
    .eq('nombre', nombre);

  if (error) throw new Error('Error consultando códigos: ' + error.message);

  if (existentes && existentes.length >= 100000) {
    return null; // nombre saturado (improbable)
  }

  const usados = new Set((existentes || []).map((u) => u.codigo));

  // Intentamos varios códigos aleatorios; si no, buscamos secuencial
  for (let i = 0; i < 50; i++) {
    const cod = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    if (!usados.has(cod)) return cod;
  }
  for (let n = 0; n < 100000; n++) {
    const cod = String(n).padStart(5, '0');
    if (!usados.has(cod)) return cod;
  }
  return null;
}

// ============================================================
// Validaciones
// ============================================================
export function validarNombre(nombre) {
  if (typeof nombre !== 'string') return 'El nombre es obligatorio.';
  const n = nombre.trim();
  if (n.length < REGLAS.nombre_min || n.length > REGLAS.nombre_max)
    return `El nombre debe tener entre ${REGLAS.nombre_min} y ${REGLAS.nombre_max} caracteres.`;
  if (n.includes('#')) return 'El nombre no puede contener "#".';
  return null;
}

export function validarApodo(apodo) {
  if (apodo === null || apodo === '') return null; // borrar apodo es válido
  if (typeof apodo !== 'string') return 'Apodo inválido.';
  const a = apodo.trim();
  if (a.length < REGLAS.apodo_min || a.length > REGLAS.apodo_max)
    return `El apodo debe tener entre ${REGLAS.apodo_min} y ${REGLAS.apodo_max} caracteres.`;
  return null;
}

export function validarPassword(pw) {
  if (typeof pw !== 'string' || pw.length < REGLAS.password_min)
    return `La contraseña debe tener al menos ${REGLAS.password_min} caracteres.`;
  return null;
}

// ============================================================
// Antispam de cambios de apodo
// Devuelve { permitido: bool, segundos_restantes: number }
// ============================================================
export function comprobarAntispamApodo(usuario) {
  const ahora = Date.now();
  const ventanaMs = REGLAS.apodo_ventana_horas * 3600 * 1000;

  // Si el último cambio fue hace más que la ventana, se reinicia el contador
  const ultimo = usuario.apodo_ultimo_cambio
    ? new Date(usuario.apodo_ultimo_cambio).getTime()
    : 0;

  if (ahora - ultimo > ventanaMs) {
    return { permitido: true, nuevoContador: 1, segundos_restantes: 0 };
  }

  if (usuario.apodo_cambios < REGLAS.apodo_max_cambios) {
    return {
      permitido: true,
      nuevoContador: usuario.apodo_cambios + 1,
      segundos_restantes: 0,
    };
  }

  const restanteMs = ventanaMs - (ahora - ultimo);
  return {
    permitido: false,
    nuevoContador: usuario.apodo_cambios,
    segundos_restantes: Math.ceil(restanteMs / 1000),
  };
}

// ============================================================
// Nombre a mostrar (apodo si existe, si no nombre#codigo)
// ============================================================
export function nombreMostrado(usuario) {
  return usuario.apodo && usuario.apodo.trim() !== ''
    ? usuario.apodo
    : `${usuario.nombre}#${usuario.codigo}`;
}
