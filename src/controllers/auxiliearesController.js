import { readFile, writeFile } from 'node:fs/promises';
import path from 'path';
import { DateTime } from 'luxon'; 

export const auxiliares = async (req, res) => {
    try {
        const resources = [
            path.resolve(process.cwd(), "src/data", "automarcas.json"),
            path.resolve(process.cwd(), "src/data", "provincias.json"),
            path.resolve(process.cwd(), "src/data", "ciudades.json"),
        ];

        let [automarcas, provincias, ciudades] = await Promise.all(
            resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8')))
        );

        // Combinar provincias y ciudades
        const provinciasConCiudades = {};
        provincias.forEach(provincia => {
            provinciasConCiudades[provincia.id] = {
                provincia: provincia.provincia,
                ciudades: []
            };
        });

        ciudades.forEach(ciudad => {
            if (provinciasConCiudades[ciudad.idprovincia]) {
                provinciasConCiudades[ciudad.idprovincia].ciudades.push(ciudad.ciudad);
            }
        });


        const provinciasArray = Object.values(provinciasConCiudades);
               

        // Pasar los datos combinados a la vista
        return res.status(200).render('auxiliares/auxiliares', {
            automarcas: automarcas,
            provincias: provinciasArray // Datos combinados
        });

    } catch (error) {
        console.error('Error al listar los datos', error);
        return res.status(500).send('Error al listar los datos'); // No enviar el error directamente al cliente en producción
    }
}