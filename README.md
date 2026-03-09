# 🍸 Sandra's Bar
### Mobile Bar Management App
> Proof of Concept (PoC) – Bar Management Application

**Sandra's Bar** es una aplicación móvil desarrollada con **React Native** y **Expo** para gestionar fácilmente la economía diaria de un bar.

Permite registrar ingresos diarios (caja), gastos y proveedores, además de visualizar un resumen mensual del negocio.

Este proyecto representa una primera versión funcional (MVP) creada para simplificar la gestión financiera de pequeños negocios familiares.

---

## 🚀 Tecnologías Utilizadas

- React Native
- Expo
- JavaScript
- SQLite (`expo-sqlite`)
- EAS Build
- Node.js

---

## 🏗 Arquitectura

El proyecto sigue una arquitectura modular simple:
```
Screens → Database Layer → SQLite
```

### Screens
Contienen las pantallas de la aplicación:
- `DashboardScreen`
- `IngresosScreen`
- `GastosScreen`
- `ProveedoresScreen`

### Database Layer
Archivo central: **`database.js`**

Contiene:
- Inicialización de base de datos
- Queries SQL
- Lógica de acceso a datos

### SQLite
Base de datos local almacenada directamente en el dispositivo móvil.

Esto permite:
- ✅ Funcionamiento offline
- ✅ Almacenamiento persistente
- ✅ Mayor simplicidad (sin backend)

---

## 📱 Funcionalidades

### 💰 Caja diaria
Registro de ingresos diarios del bar. Permite:
- Añadir caja del día
- Editar ingresos
- Añadir notas
- Visualizar total mensual

### 💸 Gestión de gastos
Registro de gastos asociados al negocio. Ejemplos:
- Proveedor de bebidas
- Panadería
- Limpieza
- Mantenimiento

### 🏢 Gestión de proveedores
Permite gestionar proveedores del bar:
- Añadir proveedor
- Editar proveedor
- Eliminar proveedor
- Visualizar gasto mensual por proveedor

### 📊 Dashboard (Resumen del negocio)
Pantalla principal con indicadores clave:
- Ingresos del mes
- Gastos del mes
- Beneficio neto
- Evolución de ingresos y gastos

---

## 💾 Base de Datos

La aplicación utiliza **SQLite local**.

**Tablas principales:**
| Tabla | Descripción |
|---|---|
| `proveedores` | Gestión de proveedores |
| `gastos` | Registro de gastos |
| `ingresos` | Registro de ingresos diarios |

**Ventajas:**
- No requiere conexión a internet
- Datos almacenados localmente
- Alta velocidad de acceso

---

## 🐳 Ejecución del Proyecto (Desarrollo)

**1. Clonar repositorio:**
```bash
git clone https://github.com/aaronrj/sandras-bar.git
cd sandras-bar
```

**2. Instalar dependencias:**
```bash
npm install
```

**3. Ejecutar aplicación:**
```bash
npx expo start
```

> Abrir la app en el móvil usando **Expo Go**.

---

## 📦 Generar APK

Para generar el APK instalable:
```bash
eas build --platform android --profile preview
```

> Expo generará un enlace para descargar el APK instalable en Android.

---

## 📂 Estructura del Proyecto
```
sandras-bar/
│
├── screens/
│   ├── DashboardScreen.js
│   ├── IngresosScreen.js
│   ├── GastosScreen.js
│   └── ProveedoresScreen.js
│
├── assets/
│
├── database.js
├── App.js
├── app.json
├── package.json
└── README.md
```

---

## 🎯 Objetivo del Proyecto

Crear una herramienta simple para gestionar las cuentas de un bar **sin necesidad de usar ordenador ni software complejo**.

La aplicación está diseñada para ser utilizada directamente desde el móvil por personas sin conocimientos técnicos.

---

## 🔮 Próximas Mejoras

- [ ] Exportación de datos
- [ ] Backup automático
- [ ] Autenticación de usuarios
- [ ] Estadísticas avanzadas
- [ ] Gráficos mejorados

---

## 👨‍💻 Autor

**Aarón Rodríguez Jiménez**

Proyecto desarrollado como aplicación práctica para la gestión interna de Sandra's Bar.

---

> Version: 1.0.0
