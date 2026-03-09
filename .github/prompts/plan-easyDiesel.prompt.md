## Plan: Roadmap EasyDiesel

El proyecto ya tiene una base MVP sólida: monorepo separado, backend Express + Prisma bastante completo, frontend React con la mayoría de pantallas creadas y documentación técnica amplia. La mejor continuación no es abrir más módulos nuevos, sino cerrar las piezas críticas que todavía están dispersas o parciales: autenticación/RBAC, motor normativo, flujos operativos end-to-end, calidad de datos y endurecimiento antes de pensar en producción.

**Estado actual**
- Backend más maduro que frontend en lógica de negocio y estructura.
- Frontend funcional en pantallas, pero todavía poco modular y con validaciones/estados incompletos.
- La documentación describe un sistema más cerrado y gobernado que el que hoy se ve implementado en algunos puntos.
- El mayor riesgo funcional está en el motor normativo, la trazabilidad real de operaciones y la consistencia del modelo de permisos.

**Checklist por fases**
1. Fase 1 — Alineación base y limpieza
- [ ] Confirmar el alcance del MVP real frente a la documentación: qué módulos quedan “listos para usar” y cuáles siguen en construcción.
- [ ] Revisar y corregir diferencias entre documentación y código, especialmente auth, OAuth, roles, permisos y reglas normativas.
- [ ] Limpiar artefactos del repo raíz y dejar claro el flujo de instalación/despliegue real.
- [ ] Verificar `.env.example`, scripts y prerequisitos actuales del backend y frontend.
- [ ] Definir una lista corta de “flujos críticos” que el sistema debe cerrar sí o sí: login, consulta pública de precios, CRUD maestros, inventario, cierre de turno, reportes, auditoría.

2. Fase 2 — Autenticación, autorización y gobierno de acceso
- [ ] Decidir un flujo de autenticación definitivo: backend-first, Supabase como proveedor, o integración híbrida formalizada.
- [ ] Cerrar el flujo OAuth/Google completo de punta a punta y documentar el intercambio de tokens.
- [ ] Estandarizar el modelo de roles y permisos; decidir si `roles.permisos` sigue en JSON o se normaliza.
- [ ] Alinear el control de acceso en backend y frontend con la misma matriz de permisos.
- [ ] Proteger rutas, acciones y vistas del frontend por permiso real, no solo por nombre de rol.
- [ ] Documentar la matriz de acceso operativa por módulo y acción.

3. Fase 3 — Motor normativo y precios
- [ ] Centralizar la lógica de cálculo de precios/subsidios en un punto único del backend.
- [ ] Completar la lógica pendiente del Decreto 763/2024 y validar sus excepciones/reglas.
- [ ] Separar claramente reglas normativas, consultas de precios vigentes y aplicación en transacciones.
- [ ] Cubrir con pruebas unitarias los escenarios regulatorios clave: particular, público, carga, oficial, diplomático, zonas y vigencias.
- [ ] Definir trazabilidad del decreto aplicado en cada transacción y reporte.

4. Fase 4 — Flujos operativos end-to-end
- [ ] Validar y cerrar el flujo de entregas de distribuidores a estación.
- [ ] Validar y cerrar el flujo de salidas/transacciones de combustible.
- [ ] Validar y cerrar el flujo de cierre de turno con comparación físico vs teórico.
- [ ] Garantizar que cada operación crítica escriba auditoría consistente.
- [ ] Conectar dashboard y reportes a datos operativos reales y no a estados parciales/mock.
- [ ] Confirmar que cada flujo responde con errores claros y consistentes para frontend.

5. Fase 5 — Datos, API y consistencia transversal
- [ ] Unificar validación de entrada en todos los controladores con Zod y reglas de negocio coherentes.
- [ ] Estandarizar formato de respuestas y errores de la API.
- [ ] Revisar índices, consultas complejas y uso de Prisma/raw SQL en módulos críticos.
- [ ] Añadir paginación, filtros y búsqueda a endpoints que hoy cargan listas completas.
- [ ] Completar y documentar `seed.ts` con datos representativos para pruebas y demo.
- [ ] Revisar campos sensibles del modelo: permisos, coordenadas, vigencias, estados, relaciones opcionales.

6. Fase 6 — Reorganización y cierre funcional del frontend
- [ ] Mover lógica de negocio repetida desde páginas a `features/`, hooks y servicios más claros.
- [ ] Añadir validación de formularios del lado cliente para los módulos administrativos.
- [ ] Incorporar estados de carga, vacío y error de forma uniforme.
- [ ] Convertir rutas hardcodeadas a configuración central con metadatos de acceso.
- [ ] Hacer responsive real las vistas administrativas más pesadas.
- [ ] Mejorar UX en tablas y filtros: paginación, búsquedas, selectores largos, feedback de acciones.

7. Fase 7 — Pruebas, calidad y endurecimiento
- [ ] Subir cobertura de integración backend en los flujos críticos.
- [ ] Añadir al menos validación de build/lint estable en frontend; evaluar pruebas de componentes luego.
- [ ] Probar manualmente el circuito completo usuario → inventario → reporte → auditoría.
- [ ] Revisar seguridad operativa: expiración JWT, refresh/revocación, rate limits por módulo, hardening de endpoints públicos.
- [ ] Preparar checklist de salida a producción con logs, variables, migraciones y seed controlada.

8. Fase 8 — Documentación operativa y entrega
- [ ] Actualizar README y docs para que reflejen exactamente el sistema implementado.
- [ ] Documentar endpoints, permisos y flujos críticos desde la perspectiva de operación.
- [ ] Dejar un backlog separado de mejoras no-MVP: mapas avanzados, analítica, caching, CI/CD, microservicios.
- [ ] Marcar versión candidata cuando auth, normativa, inventario, reportes y auditoría estén verificados de punta a punta.

**Dependencias y paralelismo**
1. La Fase 1 bloquea todo lo demás porque fija el alcance real.
2. Las Fases 2 y 3 pueden avanzar en paralelo después de la Fase 1.
3. La Fase 4 depende de que auth/permisos y motor normativo estén suficientemente cerrados.
4. Las Fases 5 y 6 pueden ejecutarse en paralelo una vez los flujos críticos estén definidos.
5. Las Fases 7 y 8 deben correr al final, aunque parte de pruebas puede adelantarse por módulo.

**Relevant files**
- `c:\Users\DELL\OneDrive - Universidad Piloto de Colombia\Documents\easyDiesel_kode\README.md` — visión del MVP, módulos y alcance declarado.
- `c:\Users\DELL\OneDrive - Universidad Piloto de Colombia\Documents\easyDiesel_kode\docs\Arquitectura_Plataforma_Combustibles.md` — arquitectura objetivo, roles, modelo de datos y conexiones entre módulos.
- `c:\Users\DELL\OneDrive - Universidad Piloto de Colombia\Documents\easyDiesel_kode\backend\src\app.ts` — middleware global, healthcheck, rate limit y bootstrap HTTP.
- `c:\Users\DELL\OneDrive - Universidad Piloto de Colombia\Documents\easyDiesel_kode\backend\prisma\schema.prisma` — modelo real de datos, relaciones y decisión actual de permisos JSON.
- `c:\Users\DELL\OneDrive - Universidad Piloto de Colombia\Documents\easyDiesel_kode\backend\src\services\precio.service.ts` — núcleo esperado de precios y normativa.
- `c:\Users\DELL\OneDrive - Universidad Piloto de Colombia\Documents\easyDiesel_kode\backend\src\services\inventario.service.ts` — flujo transaccional más crítico.
- `c:\Users\DELL\OneDrive - Universidad Piloto de Colombia\Documents\easyDiesel_kode\backend\src\services\auth.service.ts` — emisión de JWT e integración auth.
- `c:\Users\DELL\OneDrive - Universidad Piloto de Colombia\Documents\easyDiesel_kode\frontend\src\App.tsx` — definición actual de rutas y protección base.
- `c:\Users\DELL\OneDrive - Universidad Piloto de Colombia\Documents\easyDiesel_kode\frontend\src\context\AuthContext.tsx` — flujo híbrido real de autenticación.
- `c:\Users\DELL\OneDrive - Universidad Pilito de Colombia\Documents\easyDiesel_kode\frontend\src\pages\admin` — superficie funcional actual del frontend administrativo.

**Verification**
1. Confirmar que backend compila y pasa `pnpm test` y `pnpm test:integration` en `backend/` con base y migraciones correctas.
2. Confirmar que frontend pasa `pnpm build` y `pnpm lint` en `frontend/`.
3. Ejecutar smoke test manual de 7 flujos: login, precios públicos, CRUD zona/precio, entrega, transacción, cierre de turno, reporte, consulta auditoría.
4. Validar que la documentación final coincida con los endpoints, roles y pantallas reales.

**Decisions**
- Incluye estabilización funcional, checklist técnico y orden recomendado de desarrollo.
- Excluye rediseñar a microservicios, rehacer el stack o abrir productos nuevos antes de cerrar el MVP.
- Recomendación: tratar el proyecto como “MVP avanzado en consolidación”, no como producto listo para producción.

**Further Considerations**
1. Conviene separar dos tableros: uno de “bloqueantes MVP” y otro de “mejoras post-MVP”, para no mezclar endurecimiento con expansión funcional.
2. Si el objetivo es sustentación académica antes que producción masiva, la prioridad debe ser: trazabilidad, normativa, evidencia de pruebas y consistencia documental.
