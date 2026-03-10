import { prisma } from '../utils/prisma';
import { RegistrarEntregaInput, ConfirmarEntregaInput, RegistrarTransaccionInput, CierreTurnoInput } from '../validators/inventario.validator';
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
        const tanque = await prisma.tanque.findUnique({ where: { id: data.tanqueId } });
        if (!tanque) throw new Error('Tanque no encontrado');

        if (tanque.estacionId !== data.estacionId) {
            throw new Error('El tanque no pertenece a la estación indicada');
        }

        if (tanque.tipoCombustible !== data.tipoCombustible) {
            throw new Error(`El tanque es de ${tanque.tipoCombustible}, se intentó descargar ${data.tipoCombustible}`);
        }

        const precioTotal = Number((data.galones * data.precioUnitario).toFixed(2));

        // Transacción Atómica: el distribuidor registra la entrega como pendiente.
        return prisma.$transaction(async (tx: any) => {
            const entrega = await tx.entregaDistribuidor.create({
                data: {
                    distribuidorId: data.distribuidorId,
                    estacionId: data.estacionId,
                    tanqueId: data.tanqueId,
                    tipoCombustible: data.tipoCombustible,
                    galones: data.galones,
                    precioUnitario: data.precioUnitario,
                    precioTotal: precioTotal,
                    numeroRemision: data.numeroRemision,
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
                            precioUnitario: data.precioUnitario,
                            precioTotal,
                            numeroRemision: data.numeroRemision,
                            fechaEntrega: data.fechaEntrega,
                            confirmada: false,
                        },
                        ip: options.ip,
                        userAgent: options.userAgent,
                    }
                });
            }

            return entrega;
        });
    }

    async listarEntregasPendientes(estacionId: string) {
        return prisma.entregaDistribuidor.findMany({
            where: {
                estacionId,
                confirmada: false,
            },
            include: {
                distribuidor: { select: { id: true, nombre: true, tipo: true } },
                tanque: { select: { id: true, nombre: true, tipoCombustible: true } },
            },
            orderBy: { fechaEntrega: 'asc' },
        });
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
}

export const inventarioService = new InventarioService();
