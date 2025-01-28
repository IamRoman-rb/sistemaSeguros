import { readFile, writeFile } from 'node:fs/promises';
import path from 'path';

export const actividades = async (req, res) => {
    res.render('actividades/actividades');
}