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
  };
  
  export default polizasController;
  