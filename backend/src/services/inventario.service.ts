import { prisma } from '../utils/prisma';
import { RegistrarEntregaInput, ConfirmarEntregaInput, RegistrarTransaccionInput, CierreTurnoInput, EntradaDirectaInput } from '../validators/inventario.validator';
import { pricingEngineService } from './pricing-engine.service';

export class InventarioService {

    /**
     * Realiza un cierre de turno comparando el nivel teórico vs el físico reportado.
     * Ajusta el inventario al nivel físico y retorna la diferencia.
     */
    async cierreTurno(data: CierreTurnoInput, options?: { usuarioId?: string; ip?: string; userAgent?: string }) {
        const tanque = await prisma.tanque.findUnique({ where: { id: data.tanqueId } });
        if (!tanque) throw new Error('Tanque no encontrado');

        if (tanque.estacionId !== data.estacionId) {
            throw new Error('El tanque no pertenece a la estación indicada');
        }

        const nivelTeorico = Number(tanque.nivelActual);
        const diferencia = data.nivelFisico - nivelTeorico;

        // Transacción Atómica para ajustar el nivel
        return prisma.$transaction(async (tx: any) => {
            // 1. Actualizar el tanque al nivel físico real
            const tanqueActualizado = await tx.tanque.update({
                where: { id: data.tanqueId },
                data: { nivelActual: data.nivelFisico }
            });

            // 2. Registrar el ajuste como una transacción especial si hay diferencia significativa
            // (Opcional: se podría crear un tipo de transacción 'AJUSTE_INVENTARIO')
            let ajusteTransaccionId: string | undefined;
            if (Math.abs(diferencia) > 0.001) {
                const ajuste = await tx.transaccionCombustible.create({
                    data: {
                        estacionId: data.estacionId,
                        tanqueId: data.tanqueId,
                        tipo: diferencia > 0 ? 'ENTRADA' : 'SALIDA',
                        tipoCombustible: tanque.tipoCombustible,
                        tipoServicio: 'OFICIAL', // O un nuevo tipo para ajustes
                        galones: Math.abs(diferencia),
                        precioUnitario: 0,
                        precioTotal: 0,
                        estado: 'COMPLETADA',
                        decretoAplicado: `Ajuste Cierre Turno: ${data.observaciones || 'Sin observaciones'}`
                    }
                });
                ajusteTransaccionId = ajuste.id;
            }

            if (options?.usuarioId) {
                await tx.auditoriaLog.create({
                    data: {
                        usuarioId: options.usuarioId,
                        modulo: 'inventario',
                        accion: 'CIERRE_TURNO',
                        entidad: 'tanque',
                        entidadId: data.tanqueId,
                        datosAntes: {
                            nivelTeorico,
                            nivelMinimo: Number(tanque.nivelMinimo),
                            nivelActual: Number(tanque.nivelActual),
                        },
                        datosDespues: {
                            nivelFisico: data.nivelFisico,
                            diferencia,
                            ajusteRealizado: true,
                            ajusteTransaccionId,
                            observaciones: data.observaciones,
                        },
                        ip: options.ip,
                        userAgent: options.userAgent,
                    }
                });
            }

            return {
                tanqueId: tanque.id,
                nombreTanque: tanque.nombre,
                nivelTeorico,
                nivelFisico: data.nivelFisico,
                diferencia,
                ajusteRealizado: true
            };
        });
    }

    /**
     * Registra una entrega mayorista o distribuidor regulado, sumando el volumen al tanque.
     */
    async registrarEntrega(data: RegistrarEntregaInput, options?: { usuarioId?: string; ip?: string; userAgent?: string }) {
        // 1. Obtener información de la estación para el precio
        const estacion = await prisma.estacionServicio.findUnique({
            where: { id: data.estacionId },
            include: { zona: true }
        });
        if (!estacion) throw new Error('Estación no encontrada');

        // 2. Obtener precio automático por zona
        const precioAplicado = await pricingEngineService.resolveCurrentFuelPrice({
            estacionId: data.estacionId,
            tipoCombustible: data.tipoCombustible,
            tipoServicio: 'CARGA', // Las entregas de distribuidor son tipo CARGA
        });

        // 3. Generar número de remisión automático correlativo por distribuidor
        const ultimaEntrega = await prisma.entregaDistribuidor.findFirst({
            where: { distribuidorId: data.distribuidorId },
            orderBy: { createdAt: 'desc' },
            select: { numeroRemision: true }
        });

        let nuevoNumeroRemision = '000001';
        if (ultimaEntrega && ultimaEntrega.numeroRemision) {
            const ultimoNum = parseInt(ultimaEntrega.numeroRemision, 10);
            if (!isNaN(ultimoNum)) {
                nuevoNumeroRemision = (ultimoNum + 1).toString().padStart(6, '0');
            }
        }

        if (data.tanqueId) {
            const tanque = await prisma.tanque.findUnique({ where: { id: data.tanqueId } });
            if (!tanque) throw new Error('Tanque no encontrado');
            if (tanque.estacionId !== data.estacionId) {
                throw new Error('El tanque no pertenece a la estación indicada');
            }
            if (tanque.tipoCombustible !== data.tipoCombustible) {
                throw new Error(`El tanque es de ${tanque.tipoCombustible}, se intentó descargar ${data.tipoCombustible}`);
            }

            // Validación de capacidad
            const nivelActual = Number(tanque.nivelActual);
            const capacidadMaxima = Number(tanque.capacidadGalones);
            if (nivelActual + data.galones > capacidadMaxima) {
                throw new Error(`La entrega excede la capacidad del tanque (${capacidadMaxima} galones máx).`);
            }
        }

        const precioUnitario = precioAplicado.precioUnitario;
        const precioTotal = Number((data.galones * precioUnitario).toFixed(2));

        // Transacción Atómica: el distribuidor registra la entrega como pendiente.
        return prisma.$transaction(async (tx: any) => {
            const entrega = await tx.entregaDistribuidor.create({
                data: {
                    distribuidorId: data.distribuidorId,
                    estacionId: data.estacionId,
                    tanqueId: data.tanqueId ?? null,
                    tipoCombustible: data.tipoCombustible,
                    galones: data.galones,
                    precioUnitario: precioUnitario,
                    precioTotal: precioTotal,
                    numeroRemision: nuevoNumeroRemision,
                    fechaEntrega: new Date(data.fechaEntrega),
                    confirmada: false
                }
            });

            if (options?.usuarioId) {
                await tx.auditoriaLog.create({
                    data: {
                        usuarioId: options.usuarioId,
                        modulo: 'inventario',
                        accion: 'REGISTRAR_ENTREGA_PENDIENTE',
                        entidad: 'entrega_distribuidor',
                        entidadId: entrega.id,
                        datosDespues: {
                            distribuidorId: data.distribuidorId,
                            estacionId: data.estacionId,
                            tanqueId: data.tanqueId,
                            tipoCombustible: data.tipoCombustible,
                            galones: data.galones,
                            precioUnitario: precioUnitario,
                            precioTotal,
                            numeroRemision: nuevoNumeroRemision,
                            fechaEntrega: data.fechaEntrega,
                            confirmada: false,
                        },
                        ip: options.ip,
                        userAgent: options.userAgent,
                    }
                });
            }

            return { ...entrega, _precioDetalle: precioAplicado };
        });
    }

    async listarEntregasPendientes(estacionId: string, opts?: { page?: number; limit?: number }) {
        const page = Math.max(1, opts?.page ?? 1);
        const limit = Math.min(200, Math.max(1, opts?.limit ?? 50));
        const skip = (page - 1) * limit;

        const where = { estacionId, confirmada: false };
        const [data, total] = await Promise.all([
            prisma.entregaDistribuidor.findMany({
                where,
                include: {
                    distribuidor: { select: { id: true, nombre: true, tipo: true } },
                    tanque: { select: { id: true, nombre: true, tipoCombustible: true } },
                },
                orderBy: { fechaEntrega: 'asc' },
                skip,
                take: limit,
            }),
            prisma.entregaDistribuidor.count({ where }),
        ]);

        return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    async listarEntregasPorDistribuidor(distribuidorId: string, opts?: { page?: number; limit?: number }) {
        const page = Math.max(1, opts?.page ?? 1);
        const limit = Math.min(200, Math.max(1, opts?.limit ?? 50));
        const skip = (page - 1) * limit;

        const where = { distribuidorId };
        const [data, total] = await Promise.all([
            prisma.entregaDistribuidor.findMany({
                where,
                include: {
                    estacion: { select: { id: true, nombre: true, ciudad: true } },
                    tanque: { select: { id: true, nombre: true, tipoCombustible: true } },
                },
                orderBy: { fechaEntrega: 'desc' },
                skip,
                take: limit,
            }),
            prisma.entregaDistribuidor.count({ where }),
        ]);

        return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    async confirmarEntrega(data: ConfirmarEntregaInput, options?: { usuarioId?: string; ip?: string; userAgent?: string }) {
        const entrega = await prisma.entregaDistribuidor.findUnique({
            where: { id: data.entregaId },
            include: {
                distribuidor: { select: { id: true, nombre: true, tipo: true } },
                tanque: { select: { id: true, nombre: true, tipoCombustible: true } },
            },
        });

        if (!entrega) throw new Error('Entrega no encontrada');
        if (entrega.confirmada) throw new Error('La entrega ya fue confirmada anteriormente');
        if (entrega.estacionId !== data.estacionId) {
            throw new Error('La entrega no pertenece a la estación indicada');
        }

        const tanque = await prisma.tanque.findUnique({ where: { id: data.tanqueId } });
        if (!tanque) throw new Error('Tanque no encontrado');
        if (tanque.estacionId !== data.estacionId) {
            throw new Error('El tanque no pertenece a la estación indicada');
        }
        if (tanque.tipoCombustible !== entrega.tipoCombustible) {
            throw new Error(`El tanque es de ${tanque.tipoCombustible}, se intentó confirmar ${entrega.tipoCombustible}`);
        }

        const nivelActual = Number(tanque.nivelActual);
        const capacidadMaxima = Number(tanque.capacidadGalones);
        const nuevoNivel = nivelActual + data.galonesRecibidos;
        if (nuevoNivel > capacidadMaxima) {
            throw new Error(`La recepción excede la capacidad del tanque (${capacidadMaxima} galones máx).`);
        }

        const galonesEsperados = Number(entrega.galones);
        const diferenciaGalones = Number((data.galonesRecibidos - galonesEsperados).toFixed(3));
        const diferenciaPorcentaje = galonesEsperados > 0
            ? Number(((diferenciaGalones / galonesEsperados) * 100).toFixed(2))
            : 0;
        const precioUnitario = Number(entrega.precioUnitario);
        const precioTotal = Number((data.galonesRecibidos * precioUnitario).toFixed(2));

        return prisma.$transaction(async (tx: any) => {
            const entregaConfirmada = await tx.entregaDistribuidor.update({
                where: { id: data.entregaId },
                data: {
                    confirmada: true,
                    tanqueId: data.tanqueId,
                },
                include: {
                    distribuidor: { select: { id: true, nombre: true, tipo: true } },
                    tanque: { select: { id: true, nombre: true, tipoCombustible: true } },
                },
            });

            const transaccion = await tx.transaccionCombustible.create({
                data: {
                    estacionId: data.estacionId,
                    tanqueId: data.tanqueId,
                    distribuidorId: entrega.distribuidorId,
                    entregaId: entrega.id,
                    tipo: 'ENTRADA',
                    tipoCombustible: entrega.tipoCombustible,
                    tipoServicio: 'CARGA',
                    galones: data.galonesRecibidos,
                    precioUnitario,
                    precioTotal,
                    estado: 'COMPLETADA',
                }
            });

            await tx.tanque.update({
                where: { id: data.tanqueId },
                data: { nivelActual: nuevoNivel },
            });

            if (options?.usuarioId) {
                await tx.auditoriaLog.create({
                    data: {
                        usuarioId: options.usuarioId,
                        modulo: 'inventario',
                        accion: 'CONFIRMAR_ENTREGA',
                        entidad: 'entrega_distribuidor',
                        entidadId: entrega.id,
                        datosAntes: {
                            confirmada: false,
                            tanqueId: entrega.tanqueId,
                            galonesEsperados,
                            nivelTanqueAntes: nivelActual,
                        },
                        datosDespues: {
                            confirmada: true,
                            tanqueId: data.tanqueId,
                            galonesRecibidos: data.galonesRecibidos,
                            diferenciaGalones,
                            diferenciaPorcentaje,
                            nivelTanqueDespues: nuevoNivel,
                            transaccionId: transaccion.id,
                        },
                        ip: options.ip,
                        userAgent: options.userAgent,
                    }
                });
            }

            const alerta = Math.abs(diferenciaGalones) > 0.001
                ? `Diferencia detectada frente a la entrega registrada: ${diferenciaGalones.toFixed(3)} gal (${diferenciaPorcentaje.toFixed(2)}%)`
                : undefined;

            return {
                entrega: entregaConfirmada,
                transaccion,
                alerta,
            };
        });
    }

    /**
     * Registra una venta reduciendo el nivel de combustible del tanque.
     */
    async registrarTransaccion(data: RegistrarTransaccionInput, options?: { usuarioId?: string; ip?: string; userAgent?: string }) {
        const tanque = await prisma.tanque.findUnique({ where: { id: data.tanqueId } });
        if (!tanque) throw new Error('Tanque no encontrado');

        if (tanque.estacionId !== data.estacionId) {
            throw new Error('El tanque no pertenece a la estación indicada');
        }

        if (tanque.tipoCombustible !== data.tipoCombustible) {
            throw new Error(`El tipo de combustible vendido no coincide con el tanque de ${tanque.tipoCombustible}`);
        }

        const nivelActual = Number(tanque.nivelActual);
        const nivelMinimo = Number(tanque.nivelMinimo);
        const nuevoNivel = nivelActual - data.galones;

        if (nuevoNivel < 0) {
            throw new Error('No hay suficiente combustible en el tanque para completar la operación.');
        }

        // Advertencia si cae debajo del mínimo operativo
        const alertaMinimo = nuevoNivel <= nivelMinimo;

        const precioAplicado = await pricingEngineService.resolveCurrentFuelPrice({
            estacionId: data.estacionId,
            tipoCombustible: data.tipoCombustible,
            tipoServicio: data.tipoServicio,
            esGranConsumidor: data.esGranConsumidor,
        });

        const precioUnitario = precioAplicado.precioUnitario;
        const precioTotal = Number((data.galones * precioUnitario).toFixed(2));

        // Transacción atómica
        const transaccion = await prisma.$transaction(async (tx: any) => {
            // 1. Descontar del inventario
            await tx.tanque.update({
                where: { id: data.tanqueId },
                data: { nivelActual: nuevoNivel }
            });

            // 2. Registrar Transacción (Salida)
            const transaccionCreada = await tx.transaccionCombustible.create({
                data: {
                    estacionId: data.estacionId,
                    tanqueId: data.tanqueId,
                    tipo: 'SALIDA',
                    tipoCombustible: data.tipoCombustible,
                    tipoServicio: data.tipoServicio,
                    galones: data.galones,
                    precioUnitario: precioUnitario,
                    precioTotal: precioTotal,
                    placaVehiculo: data.placaVehiculo,
                    decretoAplicado: precioAplicado.decretoAplicado,
                    subsidioAplicado: precioAplicado.subsidioAplicado,
                    estado: 'COMPLETADA'
                }
            });

            if (options?.usuarioId) {
                await tx.auditoriaLog.create({
                    data: {
                        usuarioId: options.usuarioId,
                        modulo: 'inventario',
                        accion: 'REGISTRAR_TRANSACCION_SALIDA',
                        entidad: 'transaccion_combustible',
                        entidadId: transaccionCreada.id,
                        datosAntes: {
                            tanqueId: data.tanqueId,
                            nivelTanqueAntes: nivelActual,
                        },
                        datosDespues: {
                            tipoCombustible: data.tipoCombustible,
                            tipoServicio: data.tipoServicio,
                            galones: data.galones,
                            nivelTanqueDespues: nuevoNivel,
                            precioUnitario,
                            precioTotal,
                            placaVehiculo: data.placaVehiculo,
                            decretoAplicado: precioAplicado.decretoAplicado,
                            subsidioAplicado: precioAplicado.subsidioAplicado,
                        },
                        ip: options.ip,
                        userAgent: options.userAgent,
                    }
                });
            }

            return transaccionCreada;
        });

        return {
            ...transaccion,
            _alertaNivelMinimo: alertaMinimo,
            _precioAplicado: precioAplicado,
        };
    }

    /**
     * Registra una entrada directa de combustible sin distribuidor previo.
     * Actualiza el nivel del tanque y crea una TransaccionCombustible de tipo ENTRADA.
     */
    async registrarEntradaDirecta(data: EntradaDirectaInput, options?: { usuarioId?: string; ip?: string; userAgent?: string }) {
        const tanque = await prisma.tanque.findUnique({ where: { id: data.tanqueId } });
        if (!tanque) throw new Error('Tanque no encontrado');
        if (tanque.estacionId !== data.estacionId) throw new Error('El tanque no pertenece a la estación indicada');
        if (tanque.tipoCombustible !== data.tipoCombustible) {
            throw new Error(`El tipo de combustible no coincide con el tanque (${tanque.tipoCombustible})`);
        }

        const nivelActual = Number(tanque.nivelActual);
        const capacidad = Number(tanque.capacidadGalones);
        const nuevoNivel = nivelActual + data.galones;

        if (nuevoNivel > capacidad) {
            throw new Error(`La entrada supera la capacidad del tanque. Capacidad: ${capacidad} gal, Actual: ${nivelActual} gal, Ingreso solicitado: ${data.galones} gal`);
        }

        const precioTotal = Number((data.galones * data.precioUnitario).toFixed(2));

        return prisma.$transaction(async (tx: any) => {
            await tx.tanque.update({
                where: { id: data.tanqueId },
                data: { nivelActual: nuevoNivel },
            });

            const transaccion = await tx.transaccionCombustible.create({
                data: {
                    estacionId: data.estacionId,
                    tanqueId: data.tanqueId,
                    tipo: 'ENTRADA',
                    tipoCombustible: data.tipoCombustible,
                    tipoServicio: 'OFICIAL',
                    galones: data.galones,
                    precioUnitario: data.precioUnitario,
                    precioTotal,
                    estado: 'COMPLETADA',
                },
            });

            if (options?.usuarioId) {
                await tx.auditoriaLog.create({
                    data: {
                        usuarioId: options.usuarioId,
                        modulo: 'inventario',
                        accion: 'ENTRADA_DIRECTA',
                        entidad: 'tanque',
                        entidadId: data.tanqueId,
                        datosAntes: { nivelActual },
                        datosDespues: {
                            nivelActual: nuevoNivel,
                            galonesIngresados: data.galones,
                            precioUnitario: data.precioUnitario,
                            precioTotal,
                            transaccionId: transaccion.id,
                            observaciones: data.observaciones,
                        },
                        ip: options.ip,
                        userAgent: options.userAgent,
                    },
                });
            }

            return { transaccion, nivelAnterior: nivelActual, nivelNuevo: nuevoNivel };
        });
    }

    /**
     * Lista transacciones de una estación o filtra por placa de vehículo.
     * Requiere al menos uno de los dos filtros.
     */
    async listarTransacciones(opts: {
        estacionId?: string;
        placaVehiculo?: string;
        page?: number;
        limit?: number;
    }) {
        if (!opts.estacionId && !opts.placaVehiculo) {
            throw new Error('Se requiere al menos estacionId o placaVehiculo');
        }
        const page = Math.max(1, opts.page ?? 1);
        const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        if (opts.estacionId) where.estacionId = opts.estacionId;
        if (opts.placaVehiculo) {
            where.placaVehiculo = { contains: opts.placaVehiculo.toUpperCase().replace(/\s/g, ''), mode: 'insensitive' };
        }

        const [data, total] = await Promise.all([
            prisma.transaccionCombustible.findMany({
                where,
                include: {
                    tanque: { select: { id: true, nombre: true } },
                    estacion: { select: { id: true, nombre: true, ciudad: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.transaccionCombustible.count({ where }),
        ]);

        return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    /**
     * Cancela (elimina) una entrega pendiente de confirmación.
     * Solo el distribuidor que la registró puede cancelarla y solo si no está confirmada.
     */
    async proximaRemision(distribuidorId: string) {
        const ultimaEntrega = await prisma.entregaDistribuidor.findFirst({
            where: { distribuidorId },
            orderBy: { createdAt: 'desc' },
            select: { numeroRemision: true }
        });

        let proxima = '000001';
        if (ultimaEntrega && ultimaEntrega.numeroRemision) {
            const ultimoNum = parseInt(ultimaEntrega.numeroRemision, 10);
            if (!isNaN(ultimoNum)) {
                proxima = (ultimoNum + 1).toString().padStart(6, '0');
            }
        }
        return { proxima };
    }

    /**
     * Confirma una entrega distribuyendo los galones recibidos entre múltiples tanques.
     * Todo se procesa en una transacción atómica: si cualquier tanque falla, se deshace todo.
     */
    async confirmarEntregaMultiTanque(
        data: { entregaId: string; estacionId: string; distribuciones: { tanqueId: string; galones: number }[] },
        options?: { usuarioId?: string; ip?: string; userAgent?: string }
    ) {
        const entrega = await prisma.entregaDistribuidor.findUnique({
            where: { id: data.entregaId },
            include: {
                distribuidor: { select: { id: true, nombre: true, tipo: true } },
            },
        });

        if (!entrega) throw new Error('Entrega no encontrada');
        if (entrega.confirmada) throw new Error('La entrega ya fue confirmada anteriormente');
        if (entrega.estacionId !== data.estacionId) {
            throw new Error('La entrega no pertenece a la estación indicada');
        }

        // Validate all tanks upfront
        const totalGalonesRecibidos = data.distribuciones.reduce((sum, d) => sum + d.galones, 0);
        const tanqueIds = data.distribuciones.map(d => d.tanqueId);

        // Check for duplicate tanks
        if (new Set(tanqueIds).size !== tanqueIds.length) {
            throw new Error('No se puede asignar el mismo tanque más de una vez');
        }

        const tanques = await prisma.tanque.findMany({
            where: { id: { in: tanqueIds } },
        });

        const tanqueMap = new Map(tanques.map(t => [t.id, t]));

        for (const dist of data.distribuciones) {
            const tanque = tanqueMap.get(dist.tanqueId);
            if (!tanque) throw new Error(`Tanque ${dist.tanqueId} no encontrado`);
            if (tanque.estacionId !== data.estacionId) {
                throw new Error(`El tanque "${tanque.nombre}" no pertenece a la estación indicada`);
            }
            if (tanque.tipoCombustible !== entrega.tipoCombustible) {
                throw new Error(`El tanque "${tanque.nombre}" es de ${tanque.tipoCombustible}, pero la entrega es de ${entrega.tipoCombustible}`);
            }
            const nivelActual = Number(tanque.nivelActual);
            const capacidad = Number(tanque.capacidadGalones);
            if (nivelActual + dist.galones > capacidad) {
                throw new Error(`La asignación de ${dist.galones} gal al tanque "${tanque.nombre}" excede su capacidad (${capacidad} gal máx, actual ${nivelActual} gal)`);
            }
        }

        // Calculate price-related info
        const galonesEsperados = Number(entrega.galones);
        const diferenciaGalones = Number((totalGalonesRecibidos - galonesEsperados).toFixed(3));
        const diferenciaPorcentaje = galonesEsperados > 0
            ? Number(((diferenciaGalones / galonesEsperados) * 100).toFixed(2))
            : 0;
        const precioUnitario = Number(entrega.precioUnitario);

        return prisma.$transaction(async (tx: any) => {
            // 1. Mark delivery as confirmed (update tanqueId to first tank for backward compat)
            const entregaConfirmada = await tx.entregaDistribuidor.update({
                where: { id: data.entregaId },
                data: {
                    confirmada: true,
                    tanqueId: data.distribuciones[0].tanqueId,
                },
                include: {
                    distribuidor: { select: { id: true, nombre: true, tipo: true } },
                },
            });

            // 2. Create a transaction and update level for each tank
            const transacciones = [];
            for (const dist of data.distribuciones) {
                const tanque = tanqueMap.get(dist.tanqueId)!;
                const nuevoNivel = Number(tanque.nivelActual) + dist.galones;
                const precioTotal = Number((dist.galones * precioUnitario).toFixed(2));

                const transaccion = await tx.transaccionCombustible.create({
                    data: {
                        estacionId: data.estacionId,
                        tanqueId: dist.tanqueId,
                        distribuidorId: entrega.distribuidorId,
                        entregaId: entrega.id,
                        tipo: 'ENTRADA',
                        tipoCombustible: entrega.tipoCombustible,
                        tipoServicio: 'CARGA',
                        galones: dist.galones,
                        precioUnitario,
                        precioTotal,
                        estado: 'COMPLETADA',
                    },
                });

                await tx.tanque.update({
                    where: { id: dist.tanqueId },
                    data: { nivelActual: nuevoNivel },
                });

                transacciones.push({ transaccion, tanqueNombre: tanque.nombre, galones: dist.galones });
            }

            // 3. Audit log
            if (options?.usuarioId) {
                await tx.auditoriaLog.create({
                    data: {
                        usuarioId: options.usuarioId,
                        modulo: 'inventario',
                        accion: 'CONFIRMAR_ENTREGA_MULTI_TANQUE',
                        entidad: 'entrega_distribuidor',
                        entidadId: entrega.id,
                        datosAntes: {
                            confirmada: false,
                            galonesEsperados,
                        },
                        datosDespues: {
                            confirmada: true,
                            totalGalonesRecibidos,
                            diferenciaGalones,
                            diferenciaPorcentaje,
                            distribuciones: data.distribuciones.map(d => ({
                                tanqueId: d.tanqueId,
                                tanqueNombre: tanqueMap.get(d.tanqueId)?.nombre,
                                galones: d.galones,
                            })),
                        },
                        ip: options.ip,
                        userAgent: options.userAgent,
                    },
                });
            }

            const alerta = Math.abs(diferenciaGalones) > 0.001
                ? `Diferencia detectada frente a la entrega registrada: ${diferenciaGalones.toFixed(3)} gal (${diferenciaPorcentaje.toFixed(2)}%)`
                : undefined;

            return {
                entrega: entregaConfirmada,
                transacciones,
                totalGalonesRecibidos,
                alerta,
            };
        });
    }

    /**
     * Cancela (elimina) una entrega pendiente de confirmación.
     * Solo el distribuidor que la registró puede cancelarla y solo si no está confirmada.
     */
    async cancelarEntrega(entregaId: string, options?: {
        distribuidorId?: string;
        usuarioId?: string;
        ip?: string;
        userAgent?: string;
    }) {
        const entrega = await prisma.entregaDistribuidor.findUnique({ where: { id: entregaId } });
        if (!entrega) throw new Error('Entrega no encontrada');
        if (entrega.confirmada) throw new Error('No se puede cancelar una entrega ya confirmada por la estación');
        if (options?.distribuidorId && entrega.distribuidorId !== options.distribuidorId) {
            throw new Error('No tienes permiso para cancelar esta entrega');
        }

        return prisma.$transaction(async (tx: any) => {
            await tx.entregaDistribuidor.delete({ where: { id: entregaId } });

            if (options?.usuarioId) {
                await tx.auditoriaLog.create({
                    data: {
                        usuarioId: options.usuarioId,
                        modulo: 'inventario',
                        accion: 'CANCELAR_ENTREGA',
                        entidad: 'entrega_distribuidor',
                        entidadId: entregaId,
                        datosAntes: {
                            distribuidorId: entrega.distribuidorId,
                            estacionId: entrega.estacionId,
                            galones: Number(entrega.galones),
                            numeroRemision: entrega.numeroRemision,
                            tipoCombustible: entrega.tipoCombustible,
                        },
                        ip: options.ip,
                        userAgent: options.userAgent,
                    },
                });
            }

            return { cancelada: true, entregaId };
        });
    }
}

export const inventarioService = new InventarioService();
