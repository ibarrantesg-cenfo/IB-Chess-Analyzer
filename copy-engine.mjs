import {copyFileSync,existsSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const src=resolve('node_modules/stockfish/bin');
const dst=resolve('public/engine');
mkdirSync(dst,{recursive:true});
const names=['stockfish-19-lite-single.js','stockfish-19-lite-single.wasm','stockfish-19-single.js','stockfish-19-single.wasm'];
for(const name of names){const f=resolve(src,name);if(!existsSync(f)) throw new Error(`Falta el motor ${f}; comprueba la versión del paquete stockfish`);copyFileSync(f,resolve(dst,name));console.log('Incluido:',name)}
