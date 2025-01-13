/*

Vistas:
- Caja
- Ingresos
- Egresos
- Resumen

- Caja filtrada por el mes actual y el año actual
  - Listado de los ingresos
    - Listado de las pagos de las polizas realizadas en efectivo
    - Otros ingresos que se hacen en efectivo que no sean pagos de polizas
  - Listado de los egresos
    - Listado de las pagos de las polizas realizadas en transferencia
    - Otros egresos que no sean pagos de polizas : transferencias y servicios
  - Listado de los pagos de las polizas
- Ingresos (formulario de ingreso)
- Egresos (formulario de egreso)
- Resumen de la caja del dia
  - Sumatoria de los ingresos
  - Sumatoria de los egresos
  - Balance = Ingresos - Egresos ( al final del dia tiene que ser 0)


*/

import { readFile, writeFile } from 'node:fs/promises';
import path from 'path';

export const caja = async (req, res) => {
  const resources = [
    path.resolve(process.cwd(), "src/data", "pagos.json"),
    path.resolve(process.cwd(), "src/data", "polizas.json"),
    path.resolve(process.cwd(), "src/data", "caja.json"),
  ];
  try {
    let [pagos, polizas, caja] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8'))));
    let ingresos = caja.filter(item => item.tipo === 'ingreso');
    let egresos = caja.filter(item => item.tipo === 'egreso');

    pagos = pagos.filter(pago => new Date(pago.fecha).getFullYear() === new Date().getFullYear() && new Date(pago.fecha).getMonth() === new Date().getMonth());
    pagos = pagos.map(pago => ({ ...pago, poliza: polizas.find(poliza => poliza.id === pago.id_poliza) }));

    ingresos = ingresos.concat(pagos.filter(pago => pago.forma_pago === 'efectivo'));
    egresos = egresos.concat(pagos.filter(pago => pago.forma_pago === 'transferencia'));
    return res.status(200).json({ ingresos, egresos });
  } catch (error) {
    console.error('Error en la carga de la caja', error.message);
    res.status(500).send('Error al cargar la caja');
  }
}

export const ingreso = async (req, res) => {
  const resources = [
    path.resolve(process.cwd(), "src/data", "caja.json"),
  ];
  try {
    let [caja] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8'))));
    caja = caja.filter(item => item.tipo === 'ingreso');
    let motivos = caja.map(item => item.motivo);
    motivos = [...new Set(motivos)];
    res.render('caja/ingresos', { motivos })
  } catch (error) {
    console.error('Error en la carga de la caja', error.message);
    res.status(500).send('Error al cargar la caja');
  }
}

export const egreso = async (req, res) => {
  const resources = [
    path.resolve(process.cwd(), "src/data", "caja.json"),
  ];
  try {
    let [caja] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8'))));
    caja = caja.filter(item => item.tipo === 'egreso');
    let motivos = caja.map(item => item.motivo);
    motivos = [...new Set(motivos)];
    res.render('caja/egresos', { motivos })
  } catch (error) {
    console.error('Error en la carga de la caja', error.message);
    res.status(500).send('Error al cargar la caja');
  }
}

export const guardar = async (req, res) => {
  // Guardar el ingreso o egreso en la caja
  const resources = [
    path.resolve(process.cwd(), "src/data", "caja.json"),
  ];
  try {
    let [caja] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8'))));
    const { monto, tipo, motivo, descripcion } = req.body;
    const time = new Date();
    const id = time.getTime();
    const formatDate = time.getFullYear() + "-" + ("0" + (time.getMonth() + 1)).slice(-2) + "-" + ("0" + time.getDate()).slice(-2);
    const nuevo = { id, monto, tipo, motivo, descripcion, fecha: formatDate };
    caja.push(nuevo);
    await writeFile(path.resolve(process.cwd(), "src/data", "caja.json"), JSON.stringify(caja, null, 2));
    res.redirect('/caja');
  } catch (error) {
    console.error('Error en la carga de la caja', error.message);
    res.status(500).send('Error al cargar la caja');
  }
}

export const resumen = async (req, res) => {
  const resources = [
    path.resolve(process.cwd(), "src/data", "caja.json"),
    path.resolve(process.cwd(), "src/data", "pagos.json"),

  ];
  try {
    let [caja, pagos] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8'))));
    let resumenes = Array.from({length:12}, (_, i) => ({ mes: i + 1, anio: new Date().getFullYear(),  ingresos: [], egresos: [], balance: 0}))
    resumenes = resumenes.map(resumen => {
      let ingresosCaja = caja.filter(item => item.tipo === 'ingreso' && new Date(item.fecha).getMonth() === resumen.mes - 1 && new Date(item.fecha).getFullYear() === resumen.anio);
      let egresosCaja = caja.filter(item => item.tipo === 'egreso' && new Date(item.fecha).getMonth() === resumen.mes - 1 && new Date(item.fecha).getFullYear() === resumen.anio);
      let ingresosPagos = pagos.filter(item => item.forma_pago === 'efectivo' && new Date(item.fecha).getMonth() === resumen.mes - 1 && new Date(item.fecha).getFullYear() === resumen.anio);
      let egresosPagos = pagos.filter(item => item.forma_pago === 'transferencia' && new Date(item.fecha).getMonth() === resumen.mes - 1 && new Date(item.fecha).getFullYear() === resumen.anio);
      let ingresos = ingresosCaja.concat(ingresosPagos);
      let egresos = egresosCaja.concat(egresosPagos);
      resumen.ingresos = ingresos;
      resumen.egresos = egresos;
      return resumen;
    });
    return res.status(200).json({ resumenes });
    res.render('caja/resumen', { resumenes })
  } catch (error) {
    console.error('Error en la carga de la caja', error.message);
    res.status(500).send('Error al cargar la caja');
  }
}