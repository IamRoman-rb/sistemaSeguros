import path from 'path';
import { readFile, writeFile } from 'node:fs/promises';


export const listado = async (req, res) => {
    try {
        const { busqueda = null } = req.query || {};
        const clientesPath = path.resolve(process.cwd(), "src/data", "clientes.json");
        const clientesData = await readFile(clientesPath, 'utf8');
        let clientes = JSON.parse(clientesData);
        if (busqueda) {
            clientes = clientes.filter(cliente => {
                return (
                    cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                    cliente.cuit.toLowerCase().includes(busqueda.toLowerCase())
                )
            })
        }
        res.render('clientes/clientes', { clientes, busqueda });
    } catch (error) {
        console.error('Error al cargar los clientes:', error.message);
        res.status(500).send('Error al cargar los clientes: ' + error.message);
    }
};
export const nuevo = async (req, res) => {
    const resources = [
        path.resolve(process.cwd(), "src/data", "provincias.json"),
        path.resolve(process.cwd(), "src/data", "ciudades.json"),
    ]
    let [provincias, ciudades] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8'))))

    ciudades = ciudades.map((c) => ({ ...c, provincia: provincias.find(({ id }) => id == Number(c.idprovincia)) }))
    return res.render('clientes/nuevo', { provincias, ciudades });
};
export const detalle = async (req, res) => {
    try {
        const { id } = req.params;
        const resources = [
            path.resolve(process.cwd(), "src/data", "clientes.json"),
            path.resolve(process.cwd(), "src/data", "polizas.json"),
            path.resolve(process.cwd(), "src/data", "provincias.json"),
            path.resolve(process.cwd(), "src/data", "ciudades.json"),
            path.resolve(process.cwd(), "src/data", "empresas.json"),
            path.resolve(process.cwd(), "src/data", "automarcas.json"),
        ]

        let [clientes, polizas, provincias, ciudades, empresas, autos] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8'))))

        // Buscar al cliente por ID
        const cliente = clientes.find(cliente => cliente.id === Number(id));

        if (!cliente) {
            return res.status(404).send('Cliente no encontrado');
        }

        cliente.provincia = provincias.find(({ id }) => id == Number(cliente.provincia))
        cliente.localidad = ciudades.find(({ id }) => id == Number(cliente.localidad))

        polizas = cliente.polizas.length == 0 ? cliente.polizas : polizas.filter(poliza => cliente.polizas.includes(poliza.id)).map(poliza => {
            return ({ ...poliza, empresa: empresas.find(empresa => empresa.id == poliza.empresa), marca: autos.find(auto => auto.id == poliza.marca) })
        })
        //return res.status(200).json({ cliente, polizas });
        res.render('clientes/detalle', { cliente, polizas });
    } catch (error) {
        console.error('Error al obtener los detalles del cliente:', error.message);
        res.status(500).send('Error al obtener los detalles del cliente');
    }
};

export const guardar = async (req, res) => {
    try {
        const { nombre, cuit, fecha_n, telefono, telefono_fijo,email, provincia, localidad, direccion } = req.body;

        const clientesPath = path.resolve(process.cwd(), "src/data", "clientes.json");
        const actividadesPath = path.resolve(process.cwd(), "src/data", "actividades.json");
        const clientesData = await readFile(clientesPath, 'utf8');
        const actividadesData = await readFile(actividadesPath, 'utf8');
        const clientes = JSON.parse(clientesData);
        const actividades = JSON.parse(actividadesData);

        // Verificar si el cliente ya existe
        const clienteExistente = clientes.find(cliente => cliente.cuit === cuit);

        if (clienteExistente) {
            return res.status(400).send('El cliente con ese CUIT ya existe.');
        }

        // Si el cliente no existe, lo creamos
      
        const nuevoCliente = {
            id: Date.now(),
            nombre,
            cuit,
            fecha_n,
            telefono,
            provincia,
            localidad,
            direccion,
            polizas: []
        };


        let actividad = {
            id: new Date().getTime(),
            id_cliente: nuevoCliente.id,
            accion: "Crear cliente",
            id_usuario: req.session.user.id,
            fecha: `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`,
            hora: `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`,
            tipo: 'cliente'
        };

        if (telefono_fijo) {
            nuevoCliente.telefono_fijo = telefono_fijo;
        }

        if (email) {
            nuevoCliente.email = email;
        }


        clientes.push(nuevoCliente);

        actividades.push(actividad);

        await writeFile(clientesPath, JSON.stringify(clientes, null, 2));
        await writeFile(actividadesPath, JSON.stringify(actividades, null, 2));

        res.redirect(`/clientes/detalle/${nuevoCliente.id}`);
    } catch (error) {
        console.error('Error al crear el cliente:', error.message);
        res.status(500).send('Error al crear el cliente');
    }
};

export const confirmar = async (req, res) => {
    const { id } = req.params;

    // Ruta al archivo JSON de clientes
    const clientesPath = path.resolve(process.cwd(), "src/data", "clientes.json");

    // Leer los datos de los archivos JSON
    const clientesData = await readFile(clientesPath, 'utf8');
    const clientes = JSON.parse(clientesData);

    const cliente = clientes.find((c) => c.id == id);

    res.render('alertas/eliminarCliente', { cliente });
};
export const eliminar = async (req, res) => {
    try {
        const { id } = req.body;

        const resources = [
            path.resolve(process.cwd(), "src/data", "clientes.json"),
            path.resolve(process.cwd(), "src/data", "polizas.json"),
            path.resolve(process.cwd(), "src/data", "pagos.json"),
            path.resolve(process.cwd(), "src/data", "actividades.json")
        ]

        let [clientes, polizas, pagos, actividades] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8'))))


        let actividad_cliente = {
            id: new Date().getTime(),
            id_cliente: id,
            accion: "Eliminar cliente",
            id_usuario: req.session.user.id,
            fecha: `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`,
            hora: `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`,
            tipo: 'cliente'
        };

        let actividades_polizas = [];
        let actividades_pagos = [];


        // Inhabilitar los clientes para eliminar el que coincide con el ID
        clientes = clientes.map((c) => {
            if (c.id == id) {
                c.inhabilitado = true;
            }
            return c;
        });

        // Ocultar las pólizas que pertenecen al cliente a eliminar
        polizas = polizas.map((p) => {
            if (p.clienteId == id) {
                let actividad = {
                    id: new Date().getTime(),
                    id_poliza: p.id,
                    accion: "Eliminar poliza",
                    id_usuario: req.session.user.id,
                    fecha: `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`,
                    hora: `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`,
                    tipo: 'poliza'
                };
                actividades_polizas.push(actividad);
                p.inhabilitado = true;
            }
            return p;
        });

        // Desconocer los pagos que pertenecen a las pólizas eliminadas
        pagos = pagos.map((p) => {
            if (p.id_cliente == id) {
                let actividad = {
                    id: new Date().getTime(),
                    id_pago: p.id,
                    accion: "Eliminar pago",
                    id_usuario: req.session.user.id,
                    fecha: `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`,
                    hora: `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`,
                    tipo: 'pago'
                };
                actividades_pagos.push(actividad);
                p.desconocido = true;
            }
            return p;
        });

        actividades.push(actividad_cliente);
        if (actividades_polizas.length >= 1) {
            actividades.push(actividades_polizas.find(a => a));
        }
        if (actividades_pagos.length >= 1) {
            actividades.push(actividades_pagos.find(a => a));
        }

        // Escribir los clientes y pólizas filtrados en sus respectivos archivos JSON
        await writeFile(resources[0], JSON.stringify(clientes, null, 2));
        await writeFile(resources[1], JSON.stringify(polizas, null, 2));
        await writeFile(resources[2], JSON.stringify(pagos, null, 2));
        await writeFile(resources[3], JSON.stringify(actividades, null, 2));

        res.redirect('/clientes');
    } catch (error) {
        console.error('Error al eliminar el cliente:', error.message);
        res.status(500).send('Error al eliminar el cliente');
    }
};

export const editar = async (req, res) => {
    const { id } = req.params;

    try {

        const resources = [
            path.resolve(process.cwd(), "src/data", "clientes.json"),
            path.resolve(process.cwd(), "src/data", "provincias.json"),
            path.resolve(process.cwd(), "src/data", "ciudades.json"),
        ]
        let [clientes, provincias, ciudades] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8'))))

        ciudades = ciudades.map((c) => ({ ...c, provincia: provincias.find(({ id }) => id == Number(c.idprovincia)) }))
        const cliente = clientes.find(cliente => cliente.id === parseInt(id));

        if (!cliente) {
            return res.status(404).send('Cliente no encontrado');
        }

        res.render('clientes/editar', { cliente, provincias, ciudades });
    } catch (error) {
        console.error('Error al leer el archivo clientes.json:', error);
        res.status(500).send('Error al obtener los datos del cliente');
    }
};

export const actualizar = async (req, res) => {

    const { nombre, cuit, fecha_n, telefono, telefono_fijo, email, provincia, localidad, direccion, id } = req.body; // Agrega más campos según sea necesario

    try {
        // Leer los datos de los clientes desde el archivo JSON
        const clientesPath = path.resolve(process.cwd(), "src/data", "clientes.json");
        const clientesData = await readFile(clientesPath, 'utf8');
        const clientes = JSON.parse(clientesData);
        const actividadesPath = path.resolve(process.cwd(), "src/data", "actividades.json");
        const actividadesData = await readFile(actividadesPath, 'utf8');
        const actividades = JSON.parse(actividadesData);

        const index = clientes.findIndex(cliente => cliente.id === parseInt(id));

        // Verificar si se encontró el cliente
        if (index === -1) {
            return res.status(404).send('Cliente no encontrado');
        }

        // Crear un objeto con los cambios a realizar
        const cambios = {};
        if (nombre !== clientes[index].nombre) cambios.nombre = nombre;
        if (cuit !== clientes[index].cuit) cambios.cuit = cuit;
        if (fecha_n !== clientes[index].fecha_n) cambios.fecha_n = fecha_n;
        if (telefono !== clientes[index].telefono) cambios.telefono = telefono;
        if (telefono_fijo !== clientes[index].telefono_fijo) cambios.telefono_fijo = telefono_fijo;
        if (email !== clientes[index].email) cambios.email = email;
        if (provincia !== clientes[index].provincia) cambios.provincia = provincia;
        if (localidad !== clientes[index].localidad) cambios.localidad = localidad;
        if (direccion !== clientes[index].direccion) cambios.direccion = direccion;


        let actividad = {
            id: new Date().getTime(),
            id_cliente: id,
            accion: "Editar cliente",
            id_usuario: req.session.user.id,
            fecha: `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`,
            hora: `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`,
            tipo: 'cliente'
        };

        // Aplicar los cambios al cliente
        Object.assign(clientes[index], cambios);

        actividades.push(actividad);

        // Escribir los datos actualizados en el archivo JSON
        await writeFile(clientesPath, JSON.stringify(clientes, null, 2));
        await writeFile(actividadesPath, JSON.stringify(actividades, null, 2));

        res.redirect(`/clientes/detalle/${clientes[index].id}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al actualizar el cliente');
    }
}
