import { readFile } from 'node:fs/promises';
import path from 'path';
import { DateTime } from 'luxon';

export const actividades = async (req, res) => {
    try {
        const { fecha, actividad } = req.query; // Obtener filtros de la consulta

        const resources = [
            path.resolve(process.cwd(), "src/data", "clientes.json"),
            path.resolve(process.cwd(), "src/data", "polizas.json"),
            path.resolve(process.cwd(), "src/data", "pagos.json"),
            path.resolve(process.cwd(), "src/data", "usuarios.json"),
            path.resolve(process.cwd(), "src/data", "actividades.json"),
        ];

        const results = await Promise.allSettled(resources.map(resource => 
            readFile(resource, 'utf-8').then(JSON.parse)
        ));

        if (results.some(result => result.status === 'rejected')) {
            throw new Error('Error al leer uno o más archivos de datos.');
        }

        const [clientes, polizas, pagos, usuarios, actividades] = results.map(result => result.value);

        const enrichActivity = (actividad, clientes, polizas, pagos, usuarios) => {
            const usuario = usuarios.find(u => u.id === Number(actividad.id_usuario));
            if (usuario) actividad.usuario = usuario;

            switch (actividad.tipo) {
                case 'cliente':
                    actividad.cliente = clientes.find(c => c.id === Number(actividad.id_cliente));
                    break;
                case 'poliza':
                    actividad.poliza = polizas.find(p => p.id === Number(actividad.id_poliza));
                    break;
                case 'pago':
                    const pago = pagos.find(p => p.id === Number(actividad.id_pago));
                    if (pago) {
                        actividad.pago = pago;
                        actividad.pago.cliente = clientes.find(c => c.id === pago.id_cliente);
                    }
                    break;
            }
            return actividad;
        };

        let actividadesFiltradas = actividades
            .map(actividad => {
                const fechaHoraOriginal = DateTime.fromFormat(
                    `${actividad.fecha} ${actividad.hora}`,
                    'yyyy-MM-dd HH:mm:ss',
                    { zone: 'America/Argentina/Buenos_Aires' }
                );
                actividad.fecha = fechaHoraOriginal.toFormat('yyyy-MM-dd');
                actividad.hora = fechaHoraOriginal.toFormat('HH:mm:ss');
                return enrichActivity(actividad, clientes, polizas, pagos, usuarios);
            })
            .sort((a, b) => DateTime.fromFormat(`${b.fecha} ${b.hora}`, 'yyyy-MM-dd HH:mm:ss', { zone: 'America/Argentina/Buenos_Aires' }) -
                DateTime.fromFormat(`${a.fecha} ${a.hora}`, 'yyyy-MM-dd HH:mm:ss', { zone: 'America/Argentina/Buenos_Aires' })
            );

        // Aplicar filtros si están presentes
        if (fecha) {
            actividadesFiltradas = actividadesFiltradas.filter(a => a.fecha === fecha);
        }
        if (actividad && actividad !== '.') {
            actividadesFiltradas = actividadesFiltradas.filter(a => a.tipo === actividad);
        }

        res.render('actividades/actividades', { actividades: actividadesFiltradas });
    } catch (error) {
        console.error(error);
        res.status(500).send(`Error al procesar la solicitud: ${error.message}`);
    }
};