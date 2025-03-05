import { readFile, writeFile } from 'node:fs/promises';
import path from 'path';
import { DateTime } from 'luxon'; 
import e from 'express';

export const auxiliares = async (req, res) => {
    try {
        const resources = [
            path.resolve(process.cwd(), "src/data", "automarcas.json"),
        ];

        let [automarcas] = await Promise.all(
            resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8')))
        );               

        // Pasar los datos combinados a la vista
        return res.status(200).render('auxiliares/auxiliares', {
            automarcas: automarcas
        });

    } catch (error) {
        console.error('Error al listar los datos', error);
        return res.status(500).send('Error al listar los datos'); // No enviar el error directamente al cliente en producción
    }
}

export const editar = async (req, res) => {
    try {

        const { id } = req.params;

        const resources = [
            path.resolve(process.cwd(), "src/data", "automarcas.json"),
        ];
        let [automarcas] = await Promise.all(
            resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8')))
        );

        let marca = automarcas.find( (m) => m.id == Number(id) );
        
        res.status(200).render('auxiliares/editar', { marca });

    } catch (error) {
        res.status(500).send('Error', error);
        console.error(error);
        
    }
}
export const actualizar = async (req, res) => {
    try {
        const { id, nombre } = req.body; // Get id from params now

        const resources = [
            path.resolve(process.cwd(), "src/data", "automarcas.json"),
        ];
        let [automarcas] = await Promise.all(
            resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8')))
        );

        let marcaIndex = automarcas.findIndex( (m) => m.id == id );

        

        if (marcaIndex !== -1) { // Check if the marca was found
            automarcas[marcaIndex].marca = nombre;

            await Promise.all([
                writeFile(resources[0], JSON.stringify(automarcas, null, 2)),
            ]);

            res.redirect('/auxiliares'); // Redirect to the correct path
        } else {
            res.status(404).send("Marca no encontrada"); // Handle the case where the marca is not found
        }


    } catch (error) {
        res.status(500).send('Error', error);
        console.error(error);        
    }
}

export const nuevo = async (req, res) => {
    try {
        res.status(200).render('auxiliares/nuevo', { user: req.session.user });
    } catch (error) {
        res.status(500).send('Error', error);
        console.error(error);        
    }
}
export const guardar = async (req, res) => {
    try {

        const { id, nombre } = req.body;        

        const resources = [
            path.resolve(process.cwd(), "src/data", "automarcas.json"),
            path.resolve(process.cwd(), "src/data", "actividades.json"),
        ];
        let [automarcas, actividades] = await Promise.all(
            resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8')))
        );

        const ahoraArgentina = DateTime.now().setZone('America/Argentina/Buenos_Aires');

        let marca = {
            id: ahoraArgentina.toMillis(),
            marca: nombre
        }


            // Crea la actividad
    let actividad = {
        id: ahoraArgentina.toMillis(), // ID de la actividad
        id_marca: marca.id, // Usar el ID del movimiento
        accion: 'Crear Marca',
        id_usuario: id,
        fecha: ahoraArgentina.toFormat('yyyy-MM-dd'), // Fecha en formato YYYY-MM-DD
        hora: ahoraArgentina.toFormat('HH:mm:ss'), // Hora en formato HH:mm:ss
        tipo: 'auxiliares'
      };
  

        automarcas.push(marca);
        actividades.push(actividad);
        await Promise.all([
            writeFile(resources[0], JSON.stringify(automarcas, null, 2)),
            writeFile(resources[1], JSON.stringify(actividades, null, 2)),
          ]);

          res.redirect('/auxiliares');

    } catch (error) {
        console.error(error);        
        res.status(500).send({ error: error.message });
    }
}