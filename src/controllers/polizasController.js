import path from "path";
import fs from "fs";
const polizasController = {
    index: async (req, res) => {
      try {
        const polizasPath = path.resolve(process.cwd(), "src/data", "polizas.json");
        console.log(polizasPath);
        
        const polizasData = await fs.promises.readFile(polizasPath, 'utf8');
        const polizas = JSON.parse(polizasData);
  
        res.render('polizas/polizas', { polizas });
      } catch (error) {
        console.error('Error al cargar las pólizas:', error.message);
        res.status(500).send('Error al cargar las pólizas: ' + error.message);
      }
    },
    nueva: (req, res) => {
      res.render('polizas/nueva');
    },
    crearPoliza: async (req, res) => {
      try {
        const nuevaPoliza = req.body; // Obtén los datos del formulario
        const polizasPath = path.resolve(process.cwd(), "src/data", "polizas.json");
    
        // Lee el contenido actual del archivo
        const data = await fs.promises.readFile(polizasPath, 'utf8');
        const polizas = JSON.parse(data);
    
        // Agrega la nueva póliza al array
        polizas.push(nuevaPoliza);
    
        // Escribe el nuevo contenido al archivo
        await fs.promises.writeFile(polizasPath, JSON.stringify(polizas, null, 2));
    
        res.redirect('/polizas'); // Redirige a la lista de pólizas
      } catch (error) {
        console.error('Error al guardar la póliza:', error);
        res.status(500).send('Error al guardar la póliza');
      }
    }
  };
  
  export default polizasController;
  