/**
 * database.js
 * -------------------------------------------------------
 * Módulo encargado de gestionar la base de datos SQLite
 * de la aplicación Sandra's Bar.
 *
 * Contiene:
 * - Inicialización de la base de datos
 * - Creación de tablas
 * - Funciones CRUD para ingresos, gastos y proveedores
 * - Consultas para estadísticas y resúmenes mensuales
 *
 * La base de datos se almacena localmente en el dispositivo
 * móvil utilizando expo-sqlite.
 */
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('sandras_bar_v2.db');

/**
 * Inicializa la base de datos SQLite.
 *
 * Crea las tablas necesarias si no existen:
 * - proveedores
 * - gastos
 * - ingresos
 *
 * Esta función se ejecuta al iniciar la aplicación.
 */
export function initDB() {
  console.log('Iniciando DB...');

  db.execSync(`
    CREATE TABLE IF NOT EXISTS proveedores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      categoria TEXT,
      telefono TEXT,
      notas TEXT
    );
    CREATE TABLE IF NOT EXISTS gastos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL,
      proveedor_id INTEGER,
      concepto TEXT NOT NULL,
      cantidad REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ingresos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL UNIQUE,
      total REAL NOT NULL,
      notas TEXT
    );
  `);

  const tablas = db.getAllSync(
    `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`
  );

  console.log('Tablas creadas/encontradas:', tablas);
  console.log('DB iniciada OK');
}

// ── PROVEEDORES ───────────────────────────────────────────────────────────────

/**
 * Obtiene todos los proveedores almacenados en la base
 * de datos ordenados por nombre.
 *
 * @returns {Array} Lista de proveedores
 */
export function getProveedores() {
  return db.getAllSync('SELECT * FROM proveedores ORDER BY nombre');
}

/**
 * Inserta un nuevo proveedor en la base de datos.
 *
 * @param {string} nombre - Nombre del proveedor
 * @param {string} categoria - Categoría del proveedor
 * @param {string} telefono - Teléfono de contacto
 * @param {string} notas - Información adicional
 */
export function addProveedor(nombre, categoria, telefono, notas) {
  return db.runSync(
    'INSERT INTO proveedores (nombre, categoria, telefono, notas) VALUES (?,?,?,?)',
    [nombre, categoria || null, telefono || null, notas || null]
  );
}

export function updateProveedor(id, nombre, categoria, telefono, notas) {
  db.runSync(
    'UPDATE proveedores SET nombre=?, categoria=?, telefono=?, notas=? WHERE id=?',
    [nombre, categoria || null, telefono || null, notas || null, id]
  );
}

export function deleteProveedor(id) {
  db.runSync('UPDATE gastos SET proveedor_id=NULL WHERE proveedor_id=?', [id]);
  db.runSync('DELETE FROM proveedores WHERE id=?', [id]);
}

// ── GASTOS ────────────────────────────────────────────────────────────────────
export function getGastos(mes) {
  const [first, last] = rangoMes(mes);
  return db.getAllSync(
    `SELECT g.*, p.nombre as proveedor_nombre
     FROM gastos g LEFT JOIN proveedores p ON g.proveedor_id = p.id
     WHERE g.fecha >= ? AND g.fecha <= ?
     ORDER BY g.fecha DESC, g.id DESC`,
    [first, last]
  );
}
/**
 * Registra un nuevo gasto en la base de datos.
 *
 * @param {string} fecha - Fecha del gasto
 * @param {number|null} proveedor_id - ID del proveedor
 * @param {string} concepto - Descripción del gasto
 * @param {number} cantidad - Cantidad gastada
 */
export function addGasto(fecha, proveedor_id, concepto, cantidad) {
  db.runSync(
    'INSERT INTO gastos (fecha, proveedor_id, concepto, cantidad) VALUES (?,?,?,?)',
    [fecha, proveedor_id || null, concepto, cantidad]
  );
}

export function updateGasto(id, fecha, proveedor_id, concepto, cantidad) {
  db.runSync(
    'UPDATE gastos SET fecha=?, proveedor_id=?, concepto=?, cantidad=? WHERE id=?',
    [fecha, proveedor_id || null, concepto, cantidad, id]
  );
}

export function deleteGasto(id) {
  db.runSync('DELETE FROM gastos WHERE id=?', [id]);
}

// ── INGRESOS ──────────────────────────────────────────────────────────────────
/**
 * Obtiene los ingresos registrados para un mes concreto.
 *
 * @param {string} mes - Mes en formato YYYY-MM
 * @returns {Array} Lista de ingresos del mes
 */
export function getIngresos(mes) {
  const [first, last] = rangoMes(mes);
  return db.getAllSync(
    'SELECT * FROM ingresos WHERE fecha >= ? AND fecha <= ? ORDER BY fecha DESC',
    [first, last]
  );
}
/**
 * Guarda o actualiza el ingreso de un día concreto.
 *
 * Si ya existe un ingreso para esa fecha se actualiza,
 * en caso contrario se crea uno nuevo.
 *
 * @param {string} fecha - Fecha del ingreso (YYYY-MM-DD)
 * @param {number} total - Total de caja del día
 * @param {string} notas - Notas opcionales
 */
export function saveIngreso(fecha, total, notas) {
  db.runSync(
    'INSERT INTO ingresos (fecha, total, notas) VALUES (?,?,?) ON CONFLICT(fecha) DO UPDATE SET total=excluded.total, notas=excluded.notas',
    [fecha, total, notas || null]
  );
}

export function deleteIngreso(id) {
  db.runSync('DELETE FROM ingresos WHERE id=?', [id]);
}

// ── RESUMEN ───────────────────────────────────────────────────────────────────
export function getResumen(mes) {
  console.log('getResumen mes:', mes);

  const [first, last] = rangoMes(mes);

  const totalIngresos = db.getFirstSync(
    'SELECT COALESCE(SUM(total),0) as t FROM ingresos WHERE fecha>=? AND fecha<=?',
    [first, last]
  )?.t ?? 0;

  const totalGastos = db.getFirstSync(
    'SELECT COALESCE(SUM(cantidad),0) as t FROM gastos WHERE fecha>=? AND fecha<=?',
    [first, last]
  )?.t ?? 0;

  const porProveedor = db.getAllSync(
    `SELECT p.nombre, COALESCE(SUM(g.cantidad),0) as total
     FROM gastos g JOIN proveedores p ON g.proveedor_id=p.id
     WHERE g.fecha>=? AND g.fecha<=?
     GROUP BY p.id ORDER BY total DESC`,
    [first, last]
  );

  const tendencia = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);

    const m = formatMonth(d);
    const [f, l] = rangoMes(m);

    const ing = db.getFirstSync(
      'SELECT COALESCE(SUM(total),0) as t FROM ingresos WHERE fecha>=? AND fecha<=?',
      [f, l]
    )?.t ?? 0;

    const gas = db.getFirstSync(
      'SELECT COALESCE(SUM(cantidad),0) as t FROM gastos WHERE fecha>=? AND fecha<=?',
      [f, l]
    )?.t ?? 0;

    tendencia.push({
      mes: formatMonthShort(d),
      ingresos: ing,
      gastos: gas,
    });
  }

  return {
    totalIngresos,
    totalGastos,
    beneficio: totalIngresos - totalGastos,
    porProveedor,
    tendencia,
  };
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function rangoMes(mes) {
  const [y, m] = mes.split('-').map(Number);
  const first = `${y}-${pad(m)}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const last = `${y}-${pad(m)}-${pad(lastDay)}`;
  return [first, last];
}

function formatMonth(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function formatMonthShort(date) {
  return `${pad(date.getMonth() + 1)}/${String(date.getFullYear()).slice(2)}`;
}

function pad(value) {
  return String(value).padStart(2, '0');
}