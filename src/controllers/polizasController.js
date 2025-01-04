import path from "path";
import fs from "fs";

const polizasController = {
  index: async (req, res) => {
    try {
        const { busqueda } = req.query || {};

        const clientesPath = path.resolve(process.cwd(), "src/data", "clientes.json");
        const polizasPath = path.resolve(process.cwd(), "src/data", "polizas.json");
        
        // Leer los datos de clientes
        const clientesData = await fs.promises.readFile(clientesPath, "utf8");
        const clientes = JSON.parse(clientesData);

        // Leer los datos de pólizas
        const polizasData = await fs.promises.readFile(polizasPath, "utf8");
        const polizas = JSON.parse(polizasData);

        // Añadir el cliente correspondiente a cada póliza
        const polizasConClientes = polizas.map((poliza) => {
            const cliente = clientes.find((c) => c.polizas.includes(poliza.id));
            return {
                ...poliza,
                cliente,
            };
        });

        // Filtrar las pólizas si hay un término de búsqueda
        let polizasFiltradas = polizasConClientes;
        if (busqueda) {
            const busquedaLower = busqueda.toLowerCase();
            polizasFiltradas = polizasConClientes.filter((poliza) => {
                return (
                    (poliza.cliente && poliza.cliente.nombre.toLowerCase().includes(busquedaLower)) ||
                    (poliza.n_poliza && poliza.n_poliza.toString().includes(busqueda)) ||
                    (poliza.patente && poliza.patente.toLowerCase().includes(busquedaLower))
                );
            });
        }

        // Renderizar la vista con las pólizas filtradas y la búsqueda (si existe)
        res.render("polizas/polizas", { polizas: polizasFiltradas, busqueda });
    } catch (error) {
        console.error("Error al cargar las pólizas:", error.message);
        res.status(500).send("Error al cargar las pólizas: " + error.message);
    }
},


  nueva: async (req, res) => {
    try {
      const { id } = req.params; // Obtener el ID del cliente desde la URL
      //   console.log('ID recibido:', id);

      const clientesPath = path.resolve(
        process.cwd(),
        "src/data",
        "clientes.json"
      );
      const clientesData = await fs.promises.readFile(clientesPath, "utf8");
      const clientes = JSON.parse(clientesData);

      //   console.log('Clientes disponibles:', clientes);

      // Buscar al cliente por ID (asegúrate de que ambos sean cadenas)
      const cliente = clientes.find((cliente) => cliente.id.toString() === id);

      if (!cliente) {
        return res.status(404).send("Cliente no encontrado");
      }

      res.render("polizas/nueva", { cliente });
    } catch (error) {
      console.error("Error al cargar el cliente:", error.message);
      res.status(500).send("Error al cargar el cliente: " + error.message);
    }
  },
  crearPoliza: async (req, res) => {
    try {
      const { id } = req.params; // ID del cliente desde la URL
      const nuevaPoliza = {
        n_poliza: req.body.n_poliza,
        f_emision: req.body.f_emision,
        f_ini_vigencia: req.body.f_ini_vigencia,
        f_fin_vigencia: req.body.f_fin_vigencia,
        suma: req.body.suma,
        cuotas: req.body.cuotas,
        empresa: req.body.empresa,
        precio: req.body.precio,
        cobertura: req.body.cobertura,
        marca: req.body.marca,
        modelo: req.body.modelo,
        patente: req.body.patente,
        anio: req.body.anio,
        n_chasis: req.body.n_chasis,
        n_motor: req.body.n_motor,
        combustible: req.body.combustible,
        clienteId: id, // Asociar la póliza al cliente
      };

      const polizasPath = path.resolve(
        process.cwd(),
        "src/data",
        "polizas.json"
      );
      const clientesPath = path.resolve(
        process.cwd(),
        "src/data",
        "clientes.json"
      );

      // Leer clientes para verificar que el cliente existe
      const clientesData = await fs.promises.readFile(clientesPath, "utf8");
      const clientes = JSON.parse(clientesData);

      const cliente = clientes.find((cliente) => cliente.id.toString() === id);
      if (!cliente) {
        return res.status(404).send("Cliente no encontrado");
      }

      // Leer pólizas existentes
      const polizasData = await fs.promises.readFile(polizasPath, "utf8");
      const polizas = JSON.parse(polizasData);

      // Generar un nuevo ID para la póliza
      const nuevoIdPoliza =
        polizas.length > 0 ? Math.max(...polizas.map((p) => p.id)) + 1 : 1;
      nuevaPoliza.id = nuevoIdPoliza;

      // Agregar la nueva póliza a las pólizas existentes
      polizas.push(nuevaPoliza);

      // Guardar el nuevo archivo de pólizas
      await fs.promises.writeFile(
        polizasPath,
        JSON.stringify(polizas, null, 2)
      );

      // Agregar el ID de la nueva póliza al cliente correspondiente
      cliente.polizas.push(nuevaPoliza.id);

      // Actualizar el archivo de clientes con el nuevo ID de póliza
      await fs.promises.writeFile(
        clientesPath,
        JSON.stringify(clientes, null, 2)
      );

      res.redirect("/polizas"); // Redirige a la lista de pólizas
    } catch (error) {
      console.error("Error al guardar la póliza:", error.message);
      res.status(500).send("Error al guardar la póliza: " + error.message);
    }
  },
  buscarCliente: async (req, res) => {
    try {
      const { nombre } = req.query || {};
      const clientesPath = path.resolve(
        process.cwd(),
        "src/data",
        "clientes.json"
      );

      const clientesData = await fs.promises.readFile(clientesPath, "utf8");
      const clientes = JSON.parse(clientesData);

      const clientesEncontrados = nombre
        ? clientes.filter((cliente) =>
            cliente.nombre.toLowerCase().includes(nombre.toLowerCase())
          )
        : [];
      console.log(clientesEncontrados);

      res.render("polizas/buscarCliente", { clientes: clientesEncontrados });
    } catch (error) {
      console.error("Error al buscar clientes:", error.message);
      res.render("polizas/buscarCliente", { clientes: [] });
    }
  },
  detalle: async (req, res) => {
    try {
      const { id } = req.params; // ID de la póliza desde la URL

      const clientesPath = path.resolve(
        process.cwd(),
        "src/data",
        "clientes.json"
      );
      const polizasPath = path.resolve(
        process.cwd(),
        "src/data",
        "polizas.json"
      );

      // Leer datos de clientes
      const clientesData = await fs.promises.readFile(clientesPath, "utf8");
      const clientes = JSON.parse(clientesData);

      // Leer datos de pólizas
      const polizasData = await fs.promises.readFile(polizasPath, "utf8");
      const polizas = JSON.parse(polizasData);

      // Buscar la póliza por ID
      const poliza = polizas.find((p) => p.id.toString() === id);
      if (!poliza) {
        return res.status(404).send("Póliza no encontrada");
      }

      // Buscar el cliente asociado a la póliza
      const cliente = clientes.find((c) => c.polizas.includes(Number(id)));
      if (!cliente) {
        return res.status(404).send("Cliente asociado no encontrado");
      }

      // Renderizar la vista con los detalles
      res.render("polizas/detalle", { poliza, cliente });

    } catch (error) {
      console.error("Error al obtener el detalle de la póliza:", error.message);
      res
        .status(500)
        .send("Error al obtener el detalle de la póliza: " + error.message);
    }
  },
  confirmarEliminar: async (req, res) => {
    try {
        const { id } = req.params;

        const polizasPath = path.resolve(process.cwd(), "src/data", "polizas.json");
        const polizasData = await fs.promises.readFile(polizasPath, "utf8");
        const polizas = JSON.parse(polizasData);

        // Buscar la póliza por ID
        const poliza = polizas.find((p) => p.id.toString() === id);
        if (!poliza) {
            return res.status(404).send("Póliza no encontrada");
        }

        // Renderizar la vista de confirmación desde alertas
        res.render("alertas/confirmar", { poliza });
    } catch (error) {
        console.error("Error al confirmar eliminación:", error.message);
        res.status(500).send("Error al confirmar eliminación: " + error.message);
    }
},
  eliminar: async (req, res) => {
    try {
      const { id } = req.params;

      const polizasPath = path.resolve(process.cwd(), "src/data", "polizas.json");
      const clientesPath = path.resolve(process.cwd(), "src/data", "clientes.json");

      // Leer pólizas existentes
      const polizasData = await fs.promises.readFile(polizasPath, "utf8");
      let polizas = JSON.parse(polizasData);

      // Leer clientes
      const clientesData = await fs.promises.readFile(clientesPath, "utf8");
      const clientes = JSON.parse(clientesData);

      // Buscar la póliza y eliminarla
      const polizaIndex = polizas.findIndex((p) => p.id.toString() === id);
      if (polizaIndex === -1) {
        return res.status(404).send("Póliza no encontrada");
      }

      // Eliminar el ID de la póliza del cliente asociado
      const cliente = clientes.find((c) => c.polizas.includes(Number(id)));
      if (cliente) {
        cliente.polizas = cliente.polizas.filter((pid) => pid !== Number(id));
      }

      // Eliminar la póliza de la lista
      polizas.splice(polizaIndex, 1);

      // Guardar los cambios
      await fs.promises.writeFile(polizasPath, JSON.stringify(polizas, null, 2));
      await fs.promises.writeFile(clientesPath, JSON.stringify(clientes, null, 2));

      res.redirect("/polizas");
    } catch (error) {
      console.error("Error al eliminar la póliza:", error.message);
      res.status(500).send("Error al eliminar la póliza: " + error.message);
    }
  },
  editar: async function editarPoliza(req, res) {
    const { id } = req.params;

    try {
        // Leer los datos de las pólizas desde el archivo JSON (o base de datos)
        const polizasPath = path.resolve(process.cwd(), "src/data", "polizas.json");
        const polizasData = await fs.promises.readFile(polizasPath, 'utf8');
        const polizas = JSON.parse(polizasData);

        // Encontrar la póliza a editar
        const poliza = polizas.find(poliza => poliza.id === parseInt(id));

        if (!poliza) {
            return res.status(404).send('Póliza no encontrada');
        }

        // Renderizar la vista de edición con los datos de la póliza
        res.render('polizas/editar', { poliza });
    } catch (error) {
        console.error('Error al editar la póliza:', error);
        res.status(500).send('Error al editar la póliza');
    }
},
 modificarPoliza: async (req, res) => {
  const { id } = req.params;
  const { n_poliza, f_emision, f_ini_vigencia, f_fin_vigencia, suma, cuotas, empresa, precio, cobertura, marca, modelo, patente, anio, n_chasis, n_motor, combustible } = req.body;

  try {
    // Leer los datos de las pólizas desde el archivo JSON
    const polizasPath = path.resolve(process.cwd(), "src/data", "polizas.json");
    const polizasData = await fs.promises.readFile(polizasPath, 'utf8');
    const polizas = JSON.parse(polizasData);

    // Encontrar el índice de la póliza a modificar
    const index = polizas.findIndex(poliza => poliza.id === parseInt(id));

    if (index === -1) {
        return res.status(404).send('Póliza no encontrada');
    }

    // Crear un objeto con los cambios a realizar
    const cambios = {};

    // Utilizar un bucle for para iterar sobre todos los campos y crear los condicionales
    const campos = ['n_poliza', 'f_emision', 'f_fin_vigencia', 'suma', 'cuotas', 'empresa', 'precio', 'cobertura', 'marca', 'modelo', 'patente', 'anio', 'n_chasis', 'n_motor', 'combustible'];

    for (const campo of campos) {
        if (req.body[campo] !== undefined && req.body[campo] !== polizas[index][campo]) {
            cambios[campo] = req.body[campo];
        }
    }

    // Aplicar los cambios a la póliza
    Object.assign(polizas[index], cambios);

    // Escribir los datos actualizados en el archivo JSON
    await fs.promises.writeFile(polizasPath, JSON.stringify(polizas, null, 2));

    res.redirect('/polizas'); // Redirige a la lista de pólizas
} catch (error) {
    console.error('Error al modificar la póliza:', error);
    res.status(500).send('Error al modificar la póliza');
}
}
};

export default polizasController;
