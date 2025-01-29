import { error } from 'node:console';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'path';

export const actividades = async (req, res) => {

    try {
        const resources = [
            path.resolve(process.cwd(), "src/data", "clientes.json"),
            path.resolve(process.cwd(), "src/data", "polizas.json"),
            path.resolve(process.cwd(), "src/data", "pagos.json"),
            path.resolve(process.cwd(), "src/data", "usuarios.json"),
            path.resolve(process.cwd(), "src/data", "actividades.json"),
        ];

        let [clientes, polizas, pagos, usuarios, actividades] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8'))));

        function enriquecerActividad(actividad, clientes, polizas, pagos, usuarios) {
            let usuario = usuarios.find(u => u.id === actividad.id_usuario);
            actividad.usuario = usuario;

            switch (actividad.tipo) {
                case 'cliente':
                    let cliente = clientes.find(c => c.id == actividad.id_cliente);
                    actividad.cliente = cliente;
                    break;
                case 'poliza':
                    let poliza = polizas.find(p => p.id == actividad.id_poliza);
                    actividad.poliza = poliza;
                    break;
                case 'pago':
                    let pago = pagos.find(p => p.id == actividad.id_pago);
                    actividad.pago = pago;
                    break;
            }
            return actividad;
        }

        // Aplicar la función a cada actividad y ordenar por fecha y hora
        let actividades_filtradas = actividades
            .map(actividad => enriquecerActividad(actividad, clientes, polizas, pagos, usuarios))
            .sort((a, b) => {
                // Combinar fecha y hora en una sola cadena para una comparación más sencilla
                const fechaHoraA = `${a.fecha} ${a.hora}`;
                const fechaHoraB = `${b.fecha} ${b.hora}`;

                // Crear objetos Date a partir de las cadenas combinadas
                const fechaA = new Date(fechaHoraA);
                const fechaB = new Date(fechaHoraB);

                return fechaB - fechaA;
            });

        res.render('actividades/actividades', {actividades: actividades_filtradas});
    } catch (error) {
        res.status(500).send(error);
        console.error(error);
    }
}