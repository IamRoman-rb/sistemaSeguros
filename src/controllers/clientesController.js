import path from 'path';
import { readFile, writeFile } from 'node:fs/promises';
import { DateTime } from 'luxon';


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
            path.resolve(process.cwd(), "src/data", "otros_riesgos.json"),
            path.resolve(process.cwd(), "src/data", "provincias.json"),
            path.resolve(process.cwd(), "src/data", "ciudades.json"),
            path.resolve(process.cwd(), "src/data", "empresas.json"),
            path.resolve(process.cwd(), "src/data", "automarcas.json"),
        ]

        let [clientes, polizas, otros_riesgos, provincias, ciudades, empresas, autos] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8'))))

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
        otros_riesgos = cliente.polizas.length == 0 ? cliente.polizas : otros_riesgos.filter(poliza => cliente.polizas.includes(poliza.id)).map(poliza => {
            return ({ ...poliza, empresa: empresas.find(empresa => empresa.id == poliza.empresa) })
        })
        //return res.status(200).json({ cliente, polizas });
        res.status(200).render('clientes/detalle', { cliente, polizas, otros_riesgos });
    } catch (error) {
        res.send(error.message)
        // console.error('Error al obtener los detalles del cliente:', error.message);
        // res.status(500).send('Error al obtener los detalles del cliente', error);
    }
};

export const guardar = async (req, res) => {
    try {
      const { nombre, cuit, fecha_n, telefono, telefono_fijo, email, provincia, localidad, direccion } = req.body;
  
      const clientesPath = path.resolve(process.cwd(), "src/data", "clientes.json");
      const actividadesPath = path.resolve(process.cwd(), "src/data", "actividades.json");
  
      const [clientesData, actividadesData] = await Promise.all([
        readFile(clientesPath, 'utf8'),
        readFile(actividadesPath, 'utf8')
      ]);
  
      const clientes = JSON.parse(clientesData);
      const actividades = JSON.parse(actividadesData);
  
      // Verificar si el cliente ya existe
      const clienteExistente = clientes.find(cliente => cliente.cuit ===  cuit);
  
      if (clienteExistente) {
        // Verificar si el cliente está inhabilitado
        if (clienteExistente.inhabilitado == false) {
            return res.status(400).send('El cliente con ese CUIT ya existe.');
        }
      }
  
      // Obtener la fecha y hora actual con Luxon en la zona horaria de Argentina
      const ahoraArgentina = DateTime.now().setZone('America/Argentina/Buenos_Aires');
  
      const nuevoCliente = {
        id: ahoraArgentina.toMillis(), // Usar milisegundos desde la época como ID único
        nombre,
        cuit,
        fecha_n,
        telefono,
        provincia,
        localidad,
        direccion,
        polizas: [],
        inhabilitado: false // Por defecto, el cliente no está inhabilitado
      };
  
      let actividad = {
        id: ahoraArgentina.toMillis(),  // Usar milisegundos desde la época para el ID de actividad
        id_cliente: nuevoCliente.id,
        accion: "Crear cliente",
        id_usuario: req.session.user.id,
        fecha: ahoraArgentina.toFormat('yyyy-MM-dd'), // Formato ISO 8601 para la fecha
        hora: ahoraArgentina.toFormat('HH:mm:ss'), // Formato de 24 horas para la hora
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
  
      await Promise.all([ // Guardar ambos archivos de forma asíncrona y paralela
        writeFile(clientesPath, JSON.stringify(clientes, null, 2)),
        writeFile(actividadesPath, JSON.stringify(actividades, null, 2))
      ]);
  
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
            path.resolve(process.cwd(), "src/data", "otros_riesgos.json"),
            path.resolve(process.cwd(), "src/data", "pagos.json"),
            path.resolve(process.cwd(), "src/data", "actividades.json")
        ];

        let [clientes, polizas, otros_riesgos, pagos, actividades] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8'))));

        const ahoraArgentina = DateTime.now().setZone('America/Argentina/Buenos_Aires');

        let actividad_cliente = {
            id: ahoraArgentina.toMillis(),
            id_cliente: id,
            accion: "Eliminar cliente",
            id_usuario: req.session.user.id,
            fecha: ahoraArgentina.toFormat('yyyy-MM-dd'),
            hora: ahoraArgentina.toFormat('HH:mm:ss'),
            tipo: 'cliente'
        };

        let actividades_polizas = [];
        let actividades_pagos = [];

        clientes = clientes.map((c) => {
            if (c.id == id) {
                c.inhabilitado = true;
            }
            return c;
        });

        polizas = polizas.map((p) => {
            if (p.clienteId == id) {
                let actividad = {
                    id: ahoraArgentina.toMillis(),
                    id_poliza: p.id,
                    accion: "Eliminar poliza",
                    id_usuario: req.session.user.id,
                    fecha: ahoraArgentina.toFormat('yyyy-MM-dd'),
                    hora: ahoraArgentina.toFormat('HH:mm:ss'),
                    tipo: 'poliza'
                };
                actividades_polizas.push(actividad);
                p.inhabilitado = true;
            }
            return p;
        });

        otros_riesgos = otros_riesgos.map((p) => {
            if (p.clienteId == id) {
                let actividad = {
                    id: ahoraArgentina.toMillis(),
                    id_poliza: p.id,
                    accion: "Eliminar poliza",
                    id_usuario: req.session.user.id,
                    fecha: ahoraArgentina.toFormat('yyyy-MM-dd'),
                    hora: ahoraArgentina.toFormat('HH:mm:ss'),
                    tipo: 'poliza'
                };
                actividades_polizas.push(actividad);
                p.inhabilitado = true;
            }
        })

        pagos = pagos.map((p) => {
            if (p.id_cliente == id) {
                let actividad = {
                    id: ahoraArgentina.toMillis(),
                    id_pago: p.id,
                    accion: "Eliminar pago",
                    id_usuario: req.session.user.id,
                    fecha: ahoraArgentina.toFormat('yyyy-MM-dd'),
                    hora: ahoraArgentina.toFormat('HH:mm:ss'),
                    tipo: 'pago'
                };
                actividades_pagos.push(actividad);
                p.desconocido = true;
            }
            return p;
        });

        actividades.push(actividad_cliente);
        actividades.push(...actividades_polizas); // Usar spread operator para añadir múltiples actividades
        actividades.push(...actividades_pagos);   // Usar spread operator para añadir múltiples actividades


        await Promise.all([ // Escritura de archivos en paralelo
            writeFile(resources[0], JSON.stringify(clientes, null, 2)),
            writeFile(resources[1], JSON.stringify(polizas, null, 2)),
            writeFile(resources[2], JSON.stringify(pagos, null, 2)),
            writeFile(resources[3], JSON.stringify(actividades, null, 2))
        ]);


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
    const { nombre, cuit, fecha_n, telefono, telefono_fijo, email, provincia, localidad, direccion, id } = req.body;

    try {
        const clientesPath = path.resolve(process.cwd(), "src/data", "clientes.json");
        const actividadesPath = path.resolve(process.cwd(), "src/data", "actividades.json");

        const [clientesData, actividadesData] = await Promise.all([
            readFile(clientesPath, 'utf8'),
            readFile(actividadesPath, 'utf8')
        ]);

        const clientes = JSON.parse(clientesData);
        const actividades = JSON.parse(actividadesData);

        const index = clientes.findIndex(cliente => cliente.id === parseInt(id));

        if (index === -1) {
            return res.status(404).send('Cliente no encontrado');
        }

        const ahoraArgentina = DateTime.now().setZone('America/Argentina/Buenos_Aires');

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
            id: ahoraArgentina.toMillis(),
            id_cliente: id,
            accion: "Editar cliente",
            id_usuario: req.session.user.id,
            fecha: ahoraArgentina.toFormat('yyyy-MM-dd'), // Formato ISO 8601
            hora: ahoraArgentina.toFormat('HH:mm:ss'),    // Formato 24 horas
            tipo: 'cliente'
        };

        Object.assign(clientes[index], cambios);
        actividades.push(actividad);

        await Promise.all([
            writeFile(clientesPath, JSON.stringify(clientes, null, 2)),
            writeFile(actividadesPath, JSON.stringify(actividades, null, 2))
        ]);

        res.redirect(`/clientes/detalle/${clientes[index].id}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al actualizar el cliente');
    }
};