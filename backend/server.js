import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import { supabase } from './supabase.js';
import {
  REGLAS,
  generarCodigoLibre,
  validarNombre,
  validarApodo,
  validarPassword,
  comprobarAntispamApodo,
  nombreMostrado,
} from './identidad.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_cambiar';
const PORT = process.env.PORT || 3000;

// ------------------------------------------------------------
// Middleware: verificar token de sesión
// ------------------------------------------------------------
function requiereAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autenticado.' });
  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Sesión inválida o expirada.' });
  }
}

function tokenDeUsuario(u) {
  return jwt.sign(
    { id: u.id, nombre: u.nombre, codigo: u.codigo },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function usuarioPublico(u) {
  return {
    id: u.id,
    nombre: u.nombre,
    codigo: u.codigo,
    tag_completo: `${u.nombre}#${u.codigo}`,
    apodo: u.apodo || null,
    nombre_mostrado: nombreMostrado(u),
  };
}

// ------------------------------------------------------------
// POST /api/registro  { nombre, password, apodo? }
// ------------------------------------------------------------
app.post('/api/registro', async (req, res) => {
  try {
    const { nombre, password, apodo } = req.body;

    let err = validarNombre(nombre) || validarPassword(password) || validarApodo(apodo);
    if (err) return res.status(400).json({ error: err });

    const nombreLimpio = nombre.trim();
    const codigo = await generarCodigoLibre(supabase, nombreLimpio);
    if (!codigo) return res.status(409).json({ error: 'Ese nombre está saturado, prueba otro.' });

    const password_hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('usuarios')
      .insert({
        nombre: nombreLimpio,
        codigo,
        apodo: apodo ? apodo.trim() : null,
        password_hash,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: 'No se pudo crear la cuenta: ' + error.message });

    return res.status(201).json({
      usuario: usuarioPublico(data),
      token: tokenDeUsuario(data),
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ------------------------------------------------------------
// POST /api/login  { tag, password }   tag = "nombre#codigo"
// ------------------------------------------------------------
app.post('/api/login', async (req, res) => {
  try {
    const { tag, password } = req.body;
    if (!tag || !tag.includes('#'))
      return res.status(400).json({ error: 'Usa tu nombre completo: nombre#codigo' });

    const [nombre, codigo] = tag.split('#');
    if (!nombre || !/^[0-9]{5}$/.test(codigo || ''))
      return res.status(400).json({ error: 'Formato inválido. Ejemplo: Juan#04821' });

    const { data: u, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('nombre', nombre.trim())
      .eq('codigo', codigo)
      .single();

    if (error || !u) return res.status(401).json({ error: 'Credenciales incorrectas.' });

    const ok = await bcrypt.compare(password || '', u.password_hash);
    if (!ok) return res.status(401).json({ error: 'Credenciales incorrectas.' });

    await supabase.from('usuarios').update({ ultimo_acceso: new Date().toISOString() }).eq('id', u.id);

    return res.json({ usuario: usuarioPublico(u), token: tokenDeUsuario(u) });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ------------------------------------------------------------
// GET /api/yo   -> datos del usuario en sesión
// ------------------------------------------------------------
app.get('/api/yo', requiereAuth, async (req, res) => {
  const { data: u, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', req.usuario.id)
    .single();
  if (error || !u) return res.status(404).json({ error: 'Usuario no encontrado.' });
  return res.json({ usuario: usuarioPublico(u) });
});

// ------------------------------------------------------------
// PUT /api/apodo   { apodo }   (apodo null o "" => borrar)
// ------------------------------------------------------------
app.put('/api/apodo', requiereAuth, async (req, res) => {
  try {
    const { apodo } = req.body;
    const err = validarApodo(apodo);
    if (err) return res.status(400).json({ error: err });

    const { data: u, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', req.usuario.id)
      .single();
    if (error || !u) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const borrar = apodo === null || apodo === '' || apodo.trim() === '';

    // El borrado de apodo NO cuenta como spam (vuelves a tu nombre#codigo)
    if (!borrar) {
      const anti = comprobarAntispamApodo(u);
      if (!anti.permitido) {
        return res.status(429).json({
          error: `Has cambiado el apodo demasiadas veces. Espera ${anti.segundos_restantes}s.`,
          segundos_restantes: anti.segundos_restantes,
        });
      }
      var actualizacion = {
        apodo: apodo.trim(),
        apodo_cambios: anti.nuevoContador,
        apodo_ultimo_cambio: new Date().toISOString(),
      };
    } else {
      var actualizacion = { apodo: null };
    }

    const { data: actualizado, error: e2 } = await supabase
      .from('usuarios')
      .update(actualizacion)
      .eq('id', u.id)
      .select()
      .single();

    if (e2) return res.status(500).json({ error: e2.message });

    return res.json({ usuario: usuarioPublico(actualizado) });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.get('/api/salud', (_req, res) => res.json({ ok: true, app: 'InterClouder' }));

app.listen(PORT, () => {
  console.log(`InterClouder backend escuchando en http://localhost:${PORT}`);
});
