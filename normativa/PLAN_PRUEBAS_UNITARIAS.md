# Plan de Pruebas Unitarias
**Versión:** 1.0  
**Proyecto:** EasyDiesel  
**Fecha:** Marzo 2026

## 1. Introducción
El Plan de Pruebas Unitarias (PPU) tiene como objetivo definir las estrategias, herramientas y casos de prueba necesarios para validar la lógica individual de cada componente del sistema EasyDiesel.

## 2. Estrategia de Pruebas
- **Enfoque:** Pruebas de "Caja Blanca" sobre servicios, controladores y validadores del backend.
- **Herramientas:** Jest (v29+), ts-jest para soporte de TypeScript.
- **Mocks:** Uso de `jest-mock-extended` para simular la base de datos (Prisma) sin afectar el entorno real.
- **Umbral de Calidad:** Cobertura mínima obligatoria del **70%** en todas las categorías (Sentencias, Funciones, Líneas y Ramas).

## 3. Casos de Prueba por Módulo
### 3.1 Módulo de Inventario (InventarioService)
- **Caso 1:** Registro de transacciones de venta (Cálculo de saldo y precio).
- **Caso 2:** Validación de capacidad de tanque en entregas (Error si se excede el límite).
- **Caso 3:** Control de tipos de combustible (Error si se descarga un tipo incorrecto).

### 3.2 Módulo de Precios (PrecioService)
- **Caso 1:** Consulta de precio vigente según zona y tipo de servicio (Particular vs. Público).
- **Caso 2:** Aplicación de subsidio de $2.350 solo para transporte público.
- **Caso 3:** Validación de fechas de vigencia de decretos.

### 3.3 Módulo de Autenticación (AuthService)
- **Caso 1:** Login exitoso con credenciales válidas y generación de JWT.
- **Caso 2:** Fallo de login por contraseña incorrecta o usuario inexistente.
- **Caso 3:** Registro de usuario vía Google OAuth (Integración con perfiles).

### 3.4 Módulo de Auditoría (AuditoriaService)
- **Caso 1:** Registro automático de logs en cada operación crítica.
- **Caso 2:** Filtrado de auditoría por estación asignada para el rol de Estación.

### 3.5 Módulo de Actores (ActorService)
- **Caso 1:** Gestión de Estaciones de Servicio (Creación, actualización y validación de NIT/SICOM).
- **Caso 2:** Gestión de Distribuidores (Validación de tipos mayorista/minorista).
- **Caso 3:** Asignación de zonas geográficas a estaciones.

### 3.6 Módulo de Tanques (TanqueService)
- **Caso 1:** Creación y monitoreo de niveles de combustible en tanques.
- **Caso 2:** Alertas de nivel crítico y capacidad máxima.
- **Caso 3:** Vinculación de tanques con estaciones de servicio específicas.

### 3.7 Módulo de Zonas (ZonaService)
- **Caso 1:** Definición de zonas de distribución (Interconectadas vs ZNI).
- **Caso 2:** Validación de duplicidad de nombres de zona.
- **Caso 3:** Listado y actualización de parámetros de zona.

### 3.8 Módulo de Decretos (DecretoService)
- **Caso 1:** Registro de normatividad legal (Decretos) y su vigencia.
- **Caso 2:** Validación de números de decreto únicos.
- **Caso 3:** Activación/Desactivación de normatividad en el motor de precios.

### 3.9 Módulo de Usuarios (UsuarioService)
- **Caso 1:** CRUD de usuarios con validación de emails únicos.
- **Caso 2:** Gestión de roles y permisos (RBAC).
- **Caso 3:** Desactivación lógica de cuentas de usuario.

### 3.10 Módulo de Reportes (ReporteService)
- **Caso 1:** Generación de reportes de inventario, transacciones y auditoría.
- **Caso 2:** Aplicación de filtros por fecha, estación y tipo de combustible.
- **Caso 3:** Persistencia del historial de reportes generados.

### 3.11 Módulo de Dashboard (DashboardService)
- **Caso 1:** Cálculo de estadísticas globales para el Administrador.
- **Caso 2:** Resumen de ventas y stock para el rol Estación.
- **Caso 3:** Visualización de tendencias de precios por zona.

### 3.12 Módulo de Motor de Precios (PricingEngineService)
- **Caso 1:** Resolución compleja de precios aplicando normatividad vigente.
- **Caso 2:** Aplicación del Decreto 763/2024 para Grandes Consumidores de ACPM.
- **Caso 3:** Manejo de excepciones cuando no existe normatividad para una zona/servicio.

### 3.13 Módulo de Controladores (Controllers)
- **Caso 1:** Validación de flujos HTTP para Autenticación (Login/Register).
- **Caso 2:** Gestión de peticiones para Inventario y Tanques (Endpoints de lectura/escritura).
- **Caso 3:** Control de acceso y respuestas de error para Usuarios y Actores.
- **Caso 4:** Integración de validadores Zod en la capa de transporte (API).

### 3.14 Utilidades de Generación y Sistema (Utils)
- **Caso 1:** Transformación de datos JSON a formato Buffer de PDF (pdf-lib).
- **Caso 2:** Exportación de tablas dinámicas a formato Excel/CSV (exceljs).
- **Caso 3:** Configuración centralizada de cliente Prisma y manejo de tipos globales.

## 4. Criterios de Aceptación
1. **Funcionalidad:** Todos los tests individuales deben pasar satisfactoriamente.
2. **Cobertura Global:** Alcanzar el 70% de cobertura total del proyecto.
3. **Mantenibilidad:** El código de las pruebas debe ser legible y seguir los estándares de codificación.

