-- ============================================================
-- InterClouder — Esquema base de datos (Supabase / PostgreSQL)
-- ============================================================
-- Sistema de identidad:
--   nombre  = nombre elegido (NO único por sí solo)
--   codigo  = 5 cifras (00000-99999) que distingue usuarios con igual nombre
--   tag completo = nombre#codigo  (identificador permanente y único)
--   apodo   = nombre visible cambiable, sin tag. Si es NULL -> se muestra nombre#codigo
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists usuarios (
    id              uuid primary key default gen_random_uuid(),

    nombre          text        not null,
    codigo          char(5)     not null,                 -- '04821'
    apodo           text,                                  -- NULL = sin apodo

    password_hash   text        not null,                  -- bcrypt

    -- antispam de cambios de apodo
    apodo_cambios   int         not null default 0,
    apodo_ultimo_cambio timestamptz,

    creado_en       timestamptz not null default now(),
    ultimo_acceso   timestamptz,

    -- el par (nombre, codigo) debe ser único -> ese es el "nombre#codigo"
    constraint uq_nombre_codigo unique (nombre, codigo),
    constraint chk_codigo_5cifras check (codigo ~ '^[0-9]{5}$'),
    constraint chk_nombre_len check (char_length(nombre) between 2 and 32),
    constraint chk_apodo_len check (apodo is null or char_length(apodo) between 1 and 32)
);

-- Índices de búsqueda
create index if not exists idx_usuarios_nombre on usuarios (nombre);
create index if not exists idx_usuarios_apodo on usuarios (apodo);

-- ============================================================
-- Vista cómoda: nombre a mostrar (apodo si existe, si no nombre#codigo)
-- ============================================================
create or replace view usuarios_publico as
select
    id,
    nombre,
    codigo,
    nombre || '#' || codigo                as tag_completo,
    coalesce(apodo, nombre || '#' || codigo) as nombre_mostrado,
    apodo,
    creado_en,
    ultimo_acceso
from usuarios;
