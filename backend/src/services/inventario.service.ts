import { prisma } from '../utils/prisma';
import { RegistrarEntregaInput, RegistrarTransaccionInput, CierreTurnoInput } from '../validators/inventario.validator';

export class InventarioService {

    /**
     * Realiza un cierre de turno comparando el nivel teórico vs el físico reportado.
     * Ajusta el inventario al nivel físico y retorna la diferencia.
     */
    async cierreTurno(data: CierreTurnoInput) {
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
            if (Math.abs(diferencia) > 0.001) {
                await tx.transaccionCombustible.create({
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
    async registrarEntrega(data: RegistrarEntregaInput) {
        const tanque = await prisma.tanque.findUnique({ where: { id: data.tanqueId } });
        if (!tanque) throw new Error('Tanque no encontrado');

        if (tanque.estacionId !== data.estacionId) {
            throw new Error('El tanque no pertenece a la estación indicada');
        }

        if (tanque.tipoCombustible !== data.tipoCombustible) {
            throw new Error(`El tanque es de ${tanque.tipoCombustible}, se intentó descargar ${data.tipoCombustible}`);
        }

        const capacidadMaxima = Number(tanque.capacidadGalones);
        const nivelActual = Number(tanque.nivelActual);
        const nuevoNivel = nivelActual + data.galones;

        if (nuevoNivel > capacidadMaxima) {
            throw new Error(`La entrega excede la capacidad del tanque (${capacidadMaxima} galones máx).`);
        }

        const precioTotal = Number((data.galones * data.precioUnitario).toFixed(2));

        // Transacción Atómica
        return prisma.$transaction(async (tx: any) => {
            // 1. Crear la entrega
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
                    confirmada: true // Se asume confirmada de inmediato para simplificar
                }
            });

            // 2. Transacción contable ligada
            await tx.transaccionCombustible.create({
                data: {
                    estacionId: data.estacionId,
                    tanqueId: data.tanqueId,
                    distribuidorId: data.distribuidorId,
                    entregaId: entrega.id,
                    tipo: 'ENTRADA',
                    tipoCombustible: data.tipoCombustible,
                    tipoServicio: 'CARGA', // Generica para entradas
                    galones: data.galones,
                    precioUnitario: data.precioUnitario,
                    precioTotal: precioTotal,
                    estado: 'COMPLETADA'
                }
            });

            // 3. Actualizar Inventario Físico
            await tx.tanque.update({
                where: { id: data.tanqueId },
                data: { nivelActual: nuevoNivel }
            });

            return entrega;
        });
    }

    /**
     * Registra una venta reduciendo el nivel de combustible del tanque.
     */
    async registrarTransaccion(data: RegistrarTransaccionInput) {
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

        const precioTotal = Number((data.galones * data.precioUnitario).toFixed(2));

        // Transacción atómica
        const transaccion = await prisma.$transaction(async (tx: any) => {
            // 1. Descontar del inventario
            await tx.tanque.update({
                where: { id: data.tanqueId },
                data: { nivelActual: nuevoNivel }
            });

            // 2. Registrar Transacción (Salida)
            return tx.transaccionCombustible.create({
                data: {
                    estacionId: data.estacionId,
                    tanqueId: data.tanqueId,
                    tipo: 'SALIDA',
                    tipoCombustible: data.tipoCombustible,
                    tipoServicio: data.tipoServicio,
                    galones: data.galones,
                    precioUnitario: data.precioUnitario,
                    precioTotal: precioTotal,
                    placaVehiculo: data.placaVehiculo,
                    decretoAplicado: data.decretoAplicado,
                    subsidioAplicado: data.subsidioAplicado,
                    estado: 'COMPLETADA'
                }
            });
        });

        return { ...transaccion, _alertaNivelMinimo: alertaMinimo };
    }
}

export const inventarioService = new InventarioService();
