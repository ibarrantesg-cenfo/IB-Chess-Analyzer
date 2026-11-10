// Opening names and starting sequences cross-checked against Lichess chess-openings (CC0).
// The questions are original study prompts. These entries make no engine or novelty claims.
const openSicilian='e4 c5 Nf3 ';
const dragon=openSicilian+'d6 d4 cxd4 Nxd4 Nf6 Nc3 g6 ';
const accelerated=openSicilian+'Nc6 d4 cxd4 Nxd4 g6 ';
const sveshnikov=openSicilian+'Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5 ';
const e6Sicilian=openSicilian+'e6 d4 cxd4 Nxd4 ';
const scheveningen=e6Sicilian+'Nf6 Nc3 d6 ';
const french='e4 e6 d4 d5 ';
const tarrasch=french+'Nd2 ';
const caro='e4 c6 d4 d5 ';
const nimzo='d4 Nf6 c4 e6 Nc3 Bb4 ';
const kingsIndian='d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 ';
const benko='d4 Nf6 c4 c5 d5 b5 ';
const dutch='d4 f5 g3 Nf6 Bg2 g6 Nf3 Bg7 O-O O-O c4 d6 Nc3 ';
const spanish='e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 O-O ';
const pirc='e4 d6 d4 Nf6 Nc3 g6 ';
const database='https://github.com/lichess-org/chess-openings/blob/master/';

const rows=[
 ['dragon-yugoslav','Defensa Siciliana · Dragón','Ataque Yugoslavo · enroques opuestos','B77',dragon+'Be3 Bg7 f3 O-O Qd2 Nc6 Bc4','Compará la presión negra en la columna c con el ataque blanco sobre h7. ¿Qué cambia si las blancas aún no enrocan largo?'],
 ['dragon-classical','Defensa Siciliana · Dragón','Variante clásica · Ae2 y enroque corto','B73',dragon+'Be2 Bg7 O-O Nc6 Be3','Compará la seguridad del rey con el Ataque Yugoslavo y buscá una ruptura central para cada bando.'],
 ['dragon-levenfish','Defensa Siciliana · Dragón','Levenfish · 6.f4 y ...Cbd7','B71',dragon+'f4 Nbd7','Calculá cuándo es posible e5 y qué casillas deja el peón de f4.'],
 ['acc-dragon-bind','Defensa Siciliana · Dragón acelerado','Maróczy · control de d5 con c4','B39',accelerated+'c4 Bg7 Be3 Nf6 Nc3 Ng4','Ubicá el peón de c4 y compará cómo cambia la ruptura ...d5 respecto al Dragón ordinario.'],
 ['acc-dragon-nc3','Defensa Siciliana · Dragón acelerado','Desarrollo con 5.Cc3 y 7.Ac4','B35',accelerated+'Nc3 Bg7 Be3 Nf6 Bc4','Compará las opciones centrales negras con la posición del Maróczy.'],
 ['sveshnikov-main','Defensa Siciliana · Sveshnikov','Línea principal · 6.Cdb5 y 9.Cd5','B33',sveshnikov+'Ndb5 d6 Bg5 a6 Na3 b5 Nd5','Identificá el puesto avanzado d5 y el contrajuego negro en el flanco de dama.'],
 ['sveshnikov-exchange','Defensa Siciliana · Sveshnikov','Variante del cambio · 6.Cxc6','B33',sveshnikov+'Nxc6','Compará la estructura tras ...bxc6 con la línea que lleva el caballo blanco a b5.'],
 ['taimanov-english','Defensa Siciliana · Taimanov','Ataque Inglés · ...Dc7 y 6.Ae3','B48',e6Sicilian+'Nc6 Nc3 Qc7 Be3','Compará f3, Dd2 y el momento de ...a6. ¿Qué cambia frente a la Najdorf?'],
 ['taimanov-ponomariov','Defensa Siciliana · Taimanov','Gambito Ponomariov · 6.Cdb5','B47',e6Sicilian+'Nc6 Nc3 Qc7 Ndb5 Qb8 Be3 a6 Bb6','Seguí la ruta de la dama negra y calculá los tiempos de desarrollo que cuesta desplazarla.'],
 ['kan-maroczy','Defensa Siciliana · Kan','Maróczy · 5.c4 con ...Ab4','B41',e6Sicilian+'a6 c4 Nf6 Nc3 Bb4 Bd3 Nc6','Compará el control de d5 con el del Dragón acelerado e identificá qué pieza negra presiona c3.'],
 ['kan-nc3','Defensa Siciliana · Kan','5.Cc3 b5 · fianchettos enfrentados','B43',e6Sicilian+'a6 Nc3 b5 g3 Bb7 Bg2','Estudiá la presión sobre e4 y qué cambia si las blancas desarrollan el alfil por d3.'],
 ['scheveningen-keres','Defensa Siciliana · Scheveningen','Ataque Keres · 6.g4','B81',scheveningen+'g4','Compará el avance del peón g con la respuesta más tranquila 6.Ae2. ¿Cuándo puede abrirse el centro?'],
 ['scheveningen-classical','Defensa Siciliana · Scheveningen','Clásica · 6.Ae2','B83',scheveningen+'Be2','Ubicá el centro negro e6–d6 y estudiá las condiciones para ...d5 o ...e5.'],
 ['french-tarrasch-closed','Defensa Francesa','Tarrasch cerrada · 3…Cf6','C05',tarrasch+'Nf6 e5 Nfd7 Bd3 c5 c3 Nc6','Identificá la base d4 de la cadena y la casilla de ruptura para cada bando.'],
 ['french-tarrasch-open','Defensa Francesa','Tarrasch abierta · 3…c5','C07',tarrasch+'c5 exd5 Qxd5 Ngf3 cxd4 Bc4 Qd8','Calculá qué gana el alfil con Ac4 y qué estructura queda si las blancas recuperan en d4.'],
 ['caro-panov','Defensa Caro-Kann','Panov · desarrollo con 5…e6','B14',caro+'exd5 cxd5 c4 Nf6 Nc3 e6 Nf3 Bb4','Reconocé cuándo puede quedar un peón aislado en d4 y qué actividad compensa esa estructura.'],
 ['caro-panov-modern','Defensa Caro-Kann','Panov moderno · 5…Cc6 y ...Ag4','B13',caro+'exd5 cxd5 c4 Nf6 Nc3 Nc6 Nf3 Bg4','Compará la presión sobre d4 con el desarrollo negro de la variante con ...e6.'],
 ['caro-classical','Defensa Caro-Kann','Clásica · 4…Af5 y avance h4','B19',caro+'Nd2 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3 Nd7','Reconstruí la ruta del alfil y calculá qué pretende h4 antes de decidir el enroque.'],
 ['nimzo-capablanca','Defensa Nimzoindia','Clásica · 4.Dc2 y ...d5','E36',nimzo+'Qc2 d5 a3 Bxc3+ Qxc3 Ne4','Compará recapturar en c3 con dama o peón y estudiá el efecto de ...Ce4.'],
 ['nimzo-classical-keres','Defensa Nimzoindia','Clásica · 4.Dc2 O-O y ...b6','E32',nimzo+'Qc2 O-O a3 Bxc3+ Qxc3 b6','Compará este fianchetto con la reacción central inmediata ...d5.'],
 ['kid-saemisch-panno','Defensa India de Rey','Sämisch · formación Panno','E84',kingsIndian+'f3 O-O Be3 Nc6 Nge2 a6 Qd2 Rb8','Observá cómo ...Tb8 prepara juego en el flanco de dama y cuándo las blancas pueden enrocar largo.'],
 ['kid-saemisch-closed','Defensa India de Rey','Sämisch cerrada · 7.d5 c6','E88',kingsIndian+'f3 O-O Be3 e5 d5 c6','Identificá qué peones pueden abrir la posición y qué ala favorece el espacio blanco.'],
 ['benko-fianchetto','Gambito Benko','Aceptado · fianchetto blanco','A58',benko+'cxb5 a6 bxa6 g6 Nc3 Bxa6 g3 d6 Bg2 Bg7 Nf3','Identificá las columnas a y b y qué piezas pueden aprovecharlas tras entregar el peón.'],
 ['benko-declined','Gambito Benko','Rehusado · 4.Cf3','A57',benko+'Nf3','Compará conservar la tensión con aceptar en b5 y estudiá cómo sostener d5.'],
 ['dutch-warsaw','Defensa Holandesa','Leningrado · ...c6','A88',dutch+'c6','Compará qué ruptura central prepara ...c6 frente al desarrollo inmediato ...Cc6.'],
 ['dutch-matulovic','Defensa Holandesa','Leningrado · ...Cc6','A89',dutch+'Nc6','Estudiá el control de e5 y las consecuencias de que el caballo bloquee temporalmente el peón de c7.'],
 ['spanish-marshall','Apertura Española','Ataque Marshall · 8…d5','C89',spanish+'c3 d5','Calculá qué gana el segundo jugador al abrir el centro y compará con 8.a4.'],
 ['pirc-austrian','Defensa Pirc','Ataque Austríaco · 5…O-O 6.e5','B09',pirc+'f4 Bg7 Nf3 O-O e5 Nfd7 h4','Compará la ventaja espacial blanca con los recursos negros para atacar el centro.'],
 ['pirc-austrian-c5','Defensa Pirc','Ataque Austríaco · 5…c5','B09',pirc+'f4 Bg7 Nf3 c5','Buscá qué cambia si las negras atacan d4 antes de enrocar.'],
 ['benoni-taimanov','Defensa Benoni','Benoni Moderna · ataque Taimanov','A67','d4 Nf6 c4 c5 d5 e6 Nc3 exd5 cxd5 d6 e4 g6 f4 Bg7 Bb5+','Compará la mayoría negra del flanco de dama con el centro de peones blanco.'],
 ['english-four-knights','Apertura Inglesa','Cuatro Caballos · 4.e4','A28','c4 e5 Nc3 Nf6 Nf3 Nc6 e4','Compará el control de d5 con el de la Inglesa simétrica y pensá qué pieza disputará esa casilla.']
];
export const OPENING_REFERENCE_LINES=rows.map(([id,family,name,eco,moves,research])=>({
 id:'ref-'+id,family,name,eco,moves,research,notes:{},
 reference:database+eco[0].toLowerCase()+'.tsv'
}));
