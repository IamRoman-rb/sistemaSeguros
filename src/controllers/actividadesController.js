import { readFile, writeFile } from 'node:fs/promises';
import path from 'path';
import { DateTime } from 'luxon'; 

export const actividades = async (req, res) => {
    try {
      const resources = [
        path.resolve(process.cwd(), "src/data", "clientes.json"),
        path.resolve(process.cwd(), "src/data", "polizas.json"),
        path.resolve(process.cwd(), "src/data", "pagos.json"),
        path.resolve(process.cwd(), "src/data", "usuarios.json"),
        path.resolve(process.cwd(), "src/data", "actividades.json"),
      ];
  
      let [clientes, polizas, pagos, usuarios, actividades] = await Promise.all(
        resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8')))
      );
  
      function enriquecerActividad(actividad, clientes, polizas, pagos, usuarios) {
        let usuario = usuarios.find(u => u.id === Number(actividad.id_usuario));
        actividad.usuario = usuario;
  
        switch (actividad.tipo) {
          case 'cliente':
            let cliente = clientes.find(c => c.id == Number(actividad.id_cliente));
            actividad.cliente = cliente;
            break;
          case 'poliza':
            let poliza = polizas.find(p => p.id == Number(actividad.id_poliza));
            actividad.poliza = poliza;
            break;
          case 'pago':
            let pago = pagos.find(p => p.id == Number(actividad.id_pago));
            actividad.pago = pago;
            break;
        }
        return actividad;
      }
  
      // Aplicar la función a cada actividad y ordenar por fecha y hora
      let actividades_filtradas = actividades
      .map(actividad => {
          // 1. Determina la zona horaria original de la fecha.
          //    Si las fechas están en UTC, usa 'UTC'.
          //    Si están en Argentina, usa 'America/Argentina/Buenos_Aires'.
          //    Si están en otra zona, especifícala aquí.
          const zonaHorariaOriginal = 'America/Argentina/Buenos_Aires'; // Ajusta según corresponda

          // 2. Convierte la fecha y hora a un objeto DateTime, usando la zona horaria correcta.
          const fechaHoraOriginal = DateTime.fromFormat(
              `${actividad.fecha} ${actividad.hora}`,
              'yyyy-MM-dd HH:mm:ss',
              { zone: zonaHorariaOriginal }
          );

          // 3. (Opcional) Si necesitas mostrar la fecha y hora en otra zona horaria,
          //    puedes convertirla aquí.
          const fechaHoraArgentina = fechaHoraOriginal.setZone('America/Argentina/Buenos_Aires');

          actividad.fecha = fechaHoraArgentina.toFormat('yyyy-MM-dd');
          actividad.hora = fechaHoraArgentina.toFormat('HH:mm:ss');

          return enriquecerActividad(actividad, clientes, polizas, pagos, usuarios);
      })
        .sort((a, b) => {
          // Combinar fecha y hora en una sola cadena para una comparación más sencilla
          const fechaHoraA = DateTime.fromFormat(`${a.fecha} ${a.hora}`, 'yyyy-MM-dd HH:mm:ss', { zone: 'America/Argentina/Buenos_Aires' });
          const fechaHoraB = DateTime.fromFormat(`${b.fecha} ${b.hora}`, 'yyyy-MM-dd HH:mm:ss', { zone: 'America/Argentina/Buenos_Aires' });
  
          return fechaHoraB - fechaHoraA; // Ordenar de más reciente a más antiguo
        });
  
        console.log(actividades_filtradas);
        

      res.render('actividades/actividades', { actividades: actividades_filtradas });
    } catch (error) {
      res.status(500).send(error);
      console.error(error);
    }
  };