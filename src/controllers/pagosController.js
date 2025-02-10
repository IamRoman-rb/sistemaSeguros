import path from 'path';
import {readFile,writeFile} from 'node:fs/promises';
import { DateTime } from 'luxon';

export const listar = async (req, res) => {
  const resources = [
    path.resolve(process.cwd(), "src/data", "pagos.json"),
    path.resolve(process.cwd(), "src/data", "clientes.json"),
    path.resolve(process.cwd(), "src/data", "polizas.json"),
    path.resolve(process.cwd(), "src/data", "usuarios.json"),
  ];

  try {
    let [pagos, clientes, polizas, usuarios]= await Promise.all(resources.map(async (file) => JSON.parse(await readFile(file, 'utf-8'))));

    pagos = pagos.map(pago => ({
      ...pago,
      cliente: clientes.find(c => c.id === pago.id_cliente) || { nombre: 'Cliente no encontrado' },
      poliza: polizas.find(p => p.id === pago.id_poliza) || { n_poliza: 'Póliza no encontrada' },
      cobrador: usuarios.find(u => u.id === parseInt(pago.id_cobrador)) || { nombre: 'Cobrador no encontrado' },
    }));

    if(["Empleado"].includes(req.session.user.rol)) {
      pagos = pagos.filter(pago => pago.cobrador.id === req.session.user.id);
    }

    res.render('pagos/pagos', { pagos });
  } catch (error) {
    console.error('Error al procesar los datos:', error);
    res.status(500).send('Error interno del servidor'); // Handle unexpected errors gracefully
  }
};

export const detalle = async (req, res) => {
  const { id } = req.params;

  const resources = [
    path.resolve(process.cwd(), "src/data", "pagos.json"),
    path.resolve(process.cwd(), "src/data", "clientes.json"),
    path.resolve(process.cwd(), "src/data", "polizas.json"),
    path.resolve(process.cwd(), "src/data", "usuarios.json"),
    path.resolve(process.cwd(), "src/data", "provincias.json"),
    path.resolve(process.cwd(), "src/data", "ciudades.json"),
    path.resolve(process.cwd(), "src/data", "coberturas.json"),
    path.resolve(process.cwd(), "src/data", "automarcas.json"),
    path.resolve(process.cwd(), "src/data", "sucursales.json"),
    path.resolve(process.cwd(), "src/data", "empresas.json"),
  ];

  try {
    let [pagos, clientes, polizas, usuarios, provincias, ciudades, coberturas, automarcas, sucursales, empresas]= await Promise.all(resources.map(async (file) => JSON.parse(await readFile(file, 'utf-8'))));

    pagos = pagos.map(pago => ({
      ...pago,
      cliente: clientes.find(c => c.id === pago.id_cliente) || { nombre: 'Cliente no encontrado' },
      poliza: polizas.find(p => p.id === pago.id_poliza) || { n_poliza: 'Póliza no encontrada' },
      cobrador: usuarios.find(u => u.id === Number(pago.id_cobrador)) || { nombre: 'Cobrador no encontrado' },
    }));

    const pago = pagos.find(p => p.id === Number(id));

    if (!pago) {
      return res.status(404).send('Pago no encontrado');
    }

    pago.cliente.provincia = provincias.find(p => p.id == Number(pago.cliente.provincia));
    pago.cliente.localidad = ciudades.find(c => c.id == Number(pago.cliente.localidad));
    pago.poliza.cobertura = coberturas.find(c => c.id == Number(pago.poliza.cobertura));
    pago.poliza.marca = automarcas.find(a => a.id == Number(pago.poliza.marca));
    pago.poliza.empresa = empresas.find(e => e.id == Number(pago.poliza.empresa));
    pago.cobrador.sucursal = sucursales.find(s => s.id == Number(pago.cobrador.sucursal));

    res.render('pagos/pago', { pago });
  } catch (error) {
    console.error('Error al procesar los datos:', error);
    res.status(500).send('Error interno del servidor'); // Handle unexpected errors gracefully
  }
};

export const recibo = async (req, res) => {
  const { id } = req.params;

  const resources = [
    path.resolve(process.cwd(), "src/data", "pagos.json"),
    path.resolve(process.cwd(), "src/data", "clientes.json"),
    path.resolve(process.cwd(), "src/data", "polizas.json"),
    path.resolve(process.cwd(), "src/data", "usuarios.json"),
    path.resolve(process.cwd(), "src/data", "provincias.json"),
    path.resolve(process.cwd(), "src/data", "ciudades.json"),
    path.resolve(process.cwd(), "src/data", "coberturas.json"),
    path.resolve(process.cwd(), "src/data", "automarcas.json"),
    path.resolve(process.cwd(), "src/data", "sucursales.json"),
    path.resolve(process.cwd(), "src/data", "empresas.json"),
  ];

  try {
    let [pagos, clientes, polizas, usuarios, provincias, ciudades, coberturas, automarcas, sucursales, empresas]= await Promise.all(resources.map(async (file) => JSON.parse(await readFile(file, 'utf-8'))));


    pagos = pagos.map(pago => ({
      ...pago,
      cliente: clientes.find(c => c.id === pago.id_cliente) || { nombre: 'Cliente no encontrado' },
      poliza: polizas.find(p => p.id === pago.id_poliza) || { n_poliza: 'Póliza no encontrada' },
      cobrador: usuarios.find(u => u.id === Number(pago.id_cobrador)) || { nombre: 'Cobrador no encontrado' },
    }));

    const pago = pagos.find(p => p.id === Number(id));

    if (!pago) {
      return res.status(404).send('Pago no encontrado');
    }
     // Obtener la póliza asociada al pago
     const poliza = polizas.find(p => p.id === pago.id_poliza);

     if (!poliza) {
       return res.status(404).send('Póliza no encontrada');
     }
 
     // Obtener todos los pagos para esta póliza
     const pagosPoliza = pagos.filter(p => p.id_poliza === poliza.id);
 
     // Ordenar los pagos por fecha
     pagosPoliza.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
 
     // Calcular la próxima fecha de pago
     let fechaUltimoPago = DateTime.fromISO(pagosPoliza[pagosPoliza.length - 1].fecha).setZone('America/Argentina/Buenos_Aires');
     let proximoPago = fechaUltimoPago.plus({ months: 1 });
 
     // Ajustar al último día del mes si es necesario
     proximoPago = proximoPago.day > proximoPago.daysInMonth ? proximoPago.endOf('month') : proximoPago;
 
     // **CORRECCIÓN:** Ajustar la fecha de pago según la vigencia de la póliza y la cantidad de cuotas
     const fechaFinVigencia = DateTime.fromISO(poliza.f_fin_vigencia).setZone('America/Argentina/Buenos_Aires');
     const mesesVigencia = poliza.periodo; // Asumiendo que "periodo" indica la duración en meses
     const cuotas = poliza.cuotas;
 
     // Calcular la fecha de pago teórica para cada cuota
     const fechasPagoTeoricas = [];
     let fechaPagoTeorica = DateTime.fromISO(poliza.f_ini_vigencia).setZone('America/Argentina/Buenos_Aires');
     for (let i = 0; i < cuotas; i++) {
       fechasPagoTeoricas.push(fechaPagoTeorica);
       fechaPagoTeorica = fechaPagoTeorica.plus({ months: mesesVigencia / cuotas });
     }
 
     // Encontrar la próxima fecha de pago que no haya sido pagada
     for (const fechaPagoTeorica of fechasPagoTeoricas) {
       const pagoRealizado = pagosPoliza.find(p => DateTime.fromISO(p.fecha).setZone('America/Argentina/Buenos_Aires').equals(fechaPagoTeorica));
       if (!pagoRealizado) {
         proximoPago = fechaPagoTeorica;
         break;
       }
     }
 
     // Ajustar al último día del mes si es necesario
     proximoPago = proximoPago.day > proximoPago.daysInMonth ? proximoPago.endOf('month') : proximoPago;
 
     pago.proximoPago = proximoPago.toFormat('dd/MM/yyyy');
 

    Object.defineProperty(String.prototype, 'capitalizar', {
      value: function () {
          return this.charAt(0).toUpperCase() + this.slice(1);
      },
      writable: true, // Asi, puede sobreescribirse más tarde
      configurable: true // Asi, puede borrarse más tarde
  });

    pago.cliente.provincia = provincias.find(p => p.id == Number(pago.cliente.provincia));
    pago.cliente.localidad = ciudades.find(c => c.id == Number(pago.cliente.localidad));
    pago.poliza.cobertura = coberturas.find(c => c.id == Number(pago.poliza.cobertura));
    pago.poliza.marca = automarcas.find(a => a.id == Number(pago.poliza.marca));
    pago.poliza.empresa = empresas.find(e => e.id == Number(pago.poliza.empresa));
    pago.cobrador.sucursal = sucursales.find(s => s.id == Number(pago.cobrador.sucursal));

    // Usar Luxon para formatear la fecha
    pago.fechaEnLetras = DateTime.fromISO(pago.fecha).setZone('America/Argentina/Buenos_Aires').toFormat('dd de MMMM de yyyy');


    // convertir el monto a moneda argentina en formato de texto
    var numeroALetras = (function() {
          function Unidades(num){
      
              switch(num)
              {
                  case 1: return 'UN';
                  case 2: return 'DOS';
                  case 3: return 'TRES';
                  case 4: return 'CUATRO';
                  case 5: return 'CINCO';
                  case 6: return 'SEIS';
                  case 7: return 'SIETE';
                  case 8: return 'OCHO';
                  case 9: return 'NUEVE';
              }
      
              return '';
          }//Unidades()
      
          function Decenas(num){
      
              let decena = Math.floor(num/10);
              let unidad = num - (decena * 10);
      
              switch(decena)
              {
                  case 1:
                      switch(unidad)
                      {
                          case 0: return 'DIEZ';
                          case 1: return 'ONCE';
                          case 2: return 'DOCE';
                          case 3: return 'TRECE';
                          case 4: return 'CATORCE';
                          case 5: return 'QUINCE';
                          default: return 'DIECI' + Unidades(unidad);
                      }
                  case 2:
                      switch(unidad)
                      {
                          case 0: return 'VEINTE';
                          default: return 'VEINTI' + Unidades(unidad);
                      }
                  case 3: return DecenasY('TREINTA', unidad);
                  case 4: return DecenasY('CUARENTA', unidad);
                  case 5: return DecenasY('CINCUENTA', unidad);
                  case 6: return DecenasY('SESENTA', unidad);
                  case 7: return DecenasY('SETENTA', unidad);
                  case 8: return DecenasY('OCHENTA', unidad);
                  case 9: return DecenasY('NOVENTA', unidad);
                  case 0: return Unidades(unidad);
              }
          }//Unidades()
      
          function DecenasY(strSin, numUnidades) {
              if (numUnidades > 0)
                  return strSin + ' Y ' + Unidades(numUnidades)
      
              return strSin;
          }//DecenasY()
      
          function Centenas(num) {
              let centenas = Math.floor(num / 100);
              let decenas = num - (centenas * 100);
      
              switch(centenas)
              {
                  case 1:
                      if (decenas > 0)
                          return 'CIENTO ' + Decenas(decenas);
                      return 'CIEN';
                  case 2: return 'DOSCIENTOS ' + Decenas(decenas);
                  case 3: return 'TRESCIENTOS ' + Decenas(decenas);
                  case 4: return 'CUATROCIENTOS ' + Decenas(decenas);
                  case 5: return 'QUINIENTOS ' + Decenas(decenas);
                  case 6: return 'SEISCIENTOS ' + Decenas(decenas);
                  case 7: return 'SETECIENTOS ' + Decenas(decenas);
                  case 8: return 'OCHOCIENTOS ' + Decenas(decenas);
                  case 9: return 'NOVECIENTOS ' + Decenas(decenas);
              }
      
              return Decenas(decenas);
          }//Centenas()
      
          function Seccion(num, divisor, strSingular, strPlural) {
              let cientos = Math.floor(num / divisor)
              let resto = num - (cientos * divisor)
      
              let letras = '';
      
              if (cientos > 0)
                  if (cientos > 1)
                      letras = Centenas(cientos) + ' ' + strPlural;
                  else
                      letras = strSingular;
      
              if (resto > 0)
                  letras += '';
      
              return letras;
          }//Seccion()
      
          function Miles(num) {
              let divisor = 1000;
              let cientos = Math.floor(num / divisor)
              let resto = num - (cientos * divisor)
      
              let strMiles = Seccion(num, divisor, 'UN MIL', 'MIL');
              let strCentenas = Centenas(resto);
      
              if(strMiles == '')
                  return strCentenas;
      
              return strMiles + strCentenas;
          }//Miles()
      
          function Millones(num) {
              let divisor = 1000000;
              let cientos = Math.floor(num / divisor)
              let resto = num - (cientos * divisor)
      
              let strMillones = Seccion(num, divisor, 'UN MILLON DE', 'MILLONES DE');
              let strMiles = Miles(resto);
      
              if(strMillones == '')
                  return strMiles;
      
              return strMillones + strMiles;
          }//Millones()
      
          return function NumeroALetras(num, currency) {
              currency = currency || {};
              let data = {
                  numero: num,
                  enteros: Math.floor(num),
                  centavos: (((Math.round(num * 100)) - (Math.floor(num) * 100))),
                  letrasCentavos: '',
                  letrasMonedaPlural: currency.plural || 'PESOS CHILENOS',//'PESOS', 'Dólares', 'Bolívares', 'etcs'
                  letrasMonedaSingular: currency.singular || 'PESO CHILENO', //'PESO', 'Dólar', 'Bolivar', 'etc'
                  letrasMonedaCentavoPlural: currency.centPlural || 'CHIQUI PESOS CHILENOS',
                  letrasMonedaCentavoSingular: currency.centSingular || 'CHIQUI PESO CHILENO'
              };
      
              if (data.centavos > 0) {
                  data.letrasCentavos = 'CON ' + (function () {
                          if (data.centavos == 1)
                              return Millones(data.centavos) + ' ' + data.letrasMonedaCentavoSingular;
                          else
                              return Millones(data.centavos) + ' ' + data.letrasMonedaCentavoPlural;
                      })();
              };
      
              if(data.enteros == 0)
                  return 'CERO ' + data.letrasMonedaPlural + ' ' + data.letrasCentavos;
              if (data.enteros == 1)
                  return Millones(data.enteros) + ' ' + data.letrasMonedaSingular + ' ' + data.letrasCentavos;
              else
                  return Millones(data.enteros) + ' ' + data.letrasMonedaPlural + ' ' + data.letrasCentavos;
          };
      
      })();

      pago.valorEnLetras = numeroALetras(pago.valor, { plural: 'PESOS', singular: 'PESO', centPlural: 'PESOS', centSingular: 'PESO' }).trim();
    // return res.status(200).json({ pago });
    res.render('pagos/recibo', { pago, DateTime });
  } catch (error) {
    console.error('Error al procesar los datos:', error);
    res.status(500).send('Error interno del servidor'); // Handle unexpected errors gracefully
  }
};


export const pagar = async (req, res) => {
  const { id } = req.params;
  const resources = [
    path.resolve(process.cwd(), "src/data", "polizas.json"),
    path.resolve(process.cwd(), "src/data", "clientes.json"),
    path.resolve(process.cwd(), "src/data", "provincias.json"),
    path.resolve(process.cwd(), "src/data", "ciudades.json"),
    path.resolve(process.cwd(), "src/data", "coberturas.json"),
    path.resolve(process.cwd(), "src/data", "automarcas.json"),
    path.resolve(process.cwd(), "src/data", "pagos.json"),
    path.resolve(process.cwd(), "src/data", "empresas.json"),
  ];
  const [polizas, clientes, provincias, ciudades, coberturas, automarcas, pagos, empresas] = await Promise.all(resources.map(async (file) => JSON.parse(await readFile(file, 'utf-8'))));

  // Encontrar la póliza por ID
  const poliza = polizas.find(poliza => poliza.id === parseInt(id));
  if (!poliza) return res.status(404).send('Póliza no encontrada');

  // Encontrar el cliente correspondiente a la póliza
  const cliente = clientes.find(cliente => cliente.id === parseInt(poliza.clienteId));
  if (!cliente) return res.status(404).send('Cliente no encontrado');

  cliente.provincia = provincias.find(({ id }) => id == Number(cliente.provincia));
  cliente.localidad = ciudades.find(({ id }) => id == Number(cliente.localidad));
  poliza.cobertura = coberturas.find(({ id }) => id == Number(poliza.cobertura));
  poliza.marca = automarcas.find(({ id }) => id == Number(poliza.marca));
  poliza.pagos = pagos.filter(pago => pago.id_poliza === poliza.id);
  poliza.empresa = empresas.find(({ id }) => id == Number(poliza.empresa));

  // Enviar la póliza y el cliente a la vista
  res.render('pagos/pagar', { poliza, cliente });
};

export const acreditar = async (req, res) => {
  try {
    const { polizaId } = req.body;

    const resources = [
      path.resolve(process.cwd(), "src/data", "polizas.json"),
      path.resolve(process.cwd(), "src/data", "pagos.json"),
    ];
    const [polizas, pagos] = await Promise.all(resources.map(async (file) => JSON.parse(await readFile(file, 'utf-8'))));

    // Encontrar la póliza
    const poliza = polizas.find((p) => p.id === parseInt(polizaId));
    if (!poliza) {
      return res.status(404).send("Póliza no encontrada.");
    }

    // Obtener la fecha y hora actual en la zona horaria de Argentina
    const fecha = DateTime.now().setZone('America/Argentina/Buenos_Aires');

    // Crear el objeto del pago
    const pago = {
      id: fecha.toMillis(), // ID del pago
      id_cliente: Number(poliza.clienteId), // ID del cliente de la póliza
      id_poliza: Number(poliza.id), // ID de la póliza
      n_poliza: Number(poliza.n_poliza), // Número de póliza
      fecha: fecha.toFormat('yyyy-MM-dd'), // Fecha en formato YYYY-MM-DD
      hora: fecha.toFormat('HH:mm:ss'), // Hora actual
      valor: (Number(poliza.precio) / poliza.cuotas), // Premio de la póliza
      forma_pago: 'efectivo',
      observaciones: req.body.observaciones,
      n_cuota: poliza.pagos.length + 1,
      desconocido: false,
      id_cobrador: Number(req.session.user.id), // ID del cobrador 
    };

    // Actualizar el archivo de pagos
    pagos.push(pago);
    await writeFile(resources[1], JSON.stringify(pagos, null, 2));

    // Actualizar la póliza con las cuotas pagadas
    polizas[polizas.findIndex((p) => p.id === Number(polizaId))].pagos.push(pago.id);
    await writeFile(resources[0], JSON.stringify(polizas, null, 2));

    // Redirigir a la lista de pagos o a una vista de confirmación
    res.redirect(`/polizas/detalle/${polizaId}`);
  } catch (error) {
    console.error("Error al realizar el pago:", error.message);
    res.status(500).send("Error al realizar el pago.");
  }
};

export const eliminar = async (req, res) => {
  try {
    const { pagoId, polizaId } = req.body;
    const resources = [
      path.resolve(process.cwd(), "src/data", "pagos.json"),
      path.resolve(process.cwd(), "src/data", "polizas.json"),
      path.resolve(process.cwd(), "src/data", "actividades.json"),
    ];
    let [pagos, polizas, actividades] = await Promise.all(resources.map(async (file) => JSON.parse(await readFile(file, "utf-8"))));

    let poliza = polizas.find((p) => p.id == polizaId);

    // Encontrar el pago
    const pago = pagos.findIndex((p) => p.id === Number(pagoId));
    if (pago === -1) {
      return res.status(404).send("Pago no encontrado.");
    }

    // Desconocer el pago
    pagos[pago].desconocido = true;
    poliza.pagos = poliza.pagos.filter((p) => p != pagos[pago].id);

    // Obtener la fecha y hora actual en la zona horaria de Argentina
    const fechaArgentina = DateTime.now().setZone('America/Argentina/Buenos_Aires');

    // Crear la actividad
    let actividad = {
      id: fechaArgentina.toMillis(), // ID de la actividad
      id_pago: pagos[pago].id,
      accion: "Eliminar pago",
      id_usuario: req.session.user.id,
      fecha: fechaArgentina.toFormat('yyyy-MM-dd'), // Fecha en formato YYYY-MM-DD
      hora: fechaArgentina.toFormat('HH:mm:ss'), // Hora en formato HH:mm:ss
      tipo: 'pago'
    };

    // Guardar la actividad
    actividades.push(actividad);

    // Actualizar los archivos
    await Promise.all([
      writeFile(resources[0], JSON.stringify(pagos, null, 2)), // Actualizar pagos.json
      writeFile(resources[1], JSON.stringify(polizas, null, 2)), // Actualizar polizas.json
      writeFile(resources[2], JSON.stringify(actividades, null, 2)), // Actualizar actividades.json
    ]);

    res.status(200).send("Pago eliminado correctamente.");
  } catch (error) {
    console.error("Error al eliminar el pago:", error.message);
    res.status(500).send("Error al eliminar el pago.");
  }
};
