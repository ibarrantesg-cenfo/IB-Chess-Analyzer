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
const italian='e4 e5 Nf3 Nc6 Bc4 Bc5 ';
const scotch='e4 e5 Nf3 Nc6 d4 exd4 ';
const catalan='d4 Nf6 c4 e6 g3 d5 Bg2 ';
const vienna='e4 e5 Nc3 Nf6 f4 d5 fxe5 Nxe4 ';
const alapin='e4 c5 c3 ';
const reti='Nf3 d5 c4 ';
const londonIndian='d4 Nf6 Nf3 g6 Bf4 Bg7 e3 d6 ';
const semiSlav='d4 d5 c4 c6 Nf3 Nf6 Nc3 e6 ';
const najdorf='e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 ';
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
 ['english-four-knights','Apertura Inglesa','Cuatro Caballos · 4.e4','A28','c4 e5 Nc3 Nf6 Nf3 Nc6 e4','Compará el control de d5 con el de la Inglesa simétrica y pensá qué pieza disputará esa casilla.'],
 ['white-london-steinitz','Sistema Londres','Londres acelerado · aceptar el contragambito Steinitz','D00','d4 d5 Bf4 c5 dxc5','Evaluá si el peón de c5 se puede conservar sin retrasar el desarrollo del flanco de rey.'],
 ['white-london-indian-bd3','Sistema Londres','Contra …g6 · desarrollo con Ad3','A48',londonIndian+'Bd3','Compará la presión hacia h7 con el control de e4. ¿Qué cambia si las negras rompen con …c5?'],
 ['white-london-indian-be2','Sistema Londres','Contra …g6 · desarrollo con Ae2','A48',londonIndian+'Be2 O-O','Compará la seguridad del rey y el momento de c4 o c3 con el esquema de Ad3.'],
 ['white-colle-gruenfeld','Sistema Colle','Contra …g6 · formación Grünfeld','D04','d4 d5 Nf3 Nf6 e3 g6 Bd3 Bg7','Decidí si preparar e4 o presionar d5 con c4 cuando el alfil negro está en g7.'],
 ['white-tromp-edge','Ataque Trompowsky','Variante del borde · 3.Ah4 y centro con e4','A45','d4 Nf6 Bg5 Ne4 Bh4 d5 f3 Nf6 Nc3 Bf5 e4','Calculá si el avance e4 gana espacio sin dejar piezas sueltas tras las capturas centrales.'],
 ['white-tromp-b6','Ataque Trompowsky','Peón envenenado · 2…c5 y …Db6','A45','d4 Nf6 Bg5 c5 d5 Qb6 Nc3','Compará la iniciativa por desarrollo con el coste de ceder b2.'],
 ['white-catalan-qa4','Apertura Catalana','Catalana abierta · recuperar con Da4+','E03',catalan+'dxc4 Qa4+ Nbd7 Qxc4 a6 Qc2','Compará recuperar rápido el peón de c4 con desarrollar primero el caballo por f3.'],
 ['white-catalan-modern','Apertura Catalana','Catalana abierta · 5.Cf3 Cc6','E04',catalan+'dxc4 Nf3 Nc6 Qa4 Bb4+','Estudiá cómo responder al jaque y en qué momento conviene intentar recuperar c4.'],
 ['white-catalan-b3','Apertura Catalana','Catalana cerrada · Dc2 y b3','E08',catalan+'Be7 Nf3 O-O O-O Nbd7 Qc2 c6 b3 b6','Buscá dónde colocar el alfil de c1 y qué ruptura abre la diagonal de g2.'],
 ['white-italian-canal','Apertura Italiana','Pianissimo · variante Canal con Ag5','C50',italian+'d3 Nf6 Nc3 d6 Bg5','Compará la clavada en f6 con el plan de c3 y d4. ¿Qué alfil conviene conservar?'],
 ['white-italian-evans-accepted','Apertura Italiana','Gambito Evans aceptado · centro con d4','C52',italian+'b4 Bxb4 c3 Ba5 O-O d6 d4 Bg4','Calculá qué tiempos de desarrollo gana el sacrificio de b4 y cómo cambia la posición si las negras devuelven material.'],
 ['white-italian-evans-declined','Apertura Italiana','Gambito Evans rehusado · variante Cordel','C51',italian+'b4 Bb6 Bb2','Compará el desarrollo de Ab2 con el plan de c3 del Evans aceptado.'],
 ['white-scotch-mieses','Apertura Escocesa','Mieses · 5.Cxc6 y 6.e5','C45',scotch+'Nxd4 Nf6 Nxc6 bxc6 e5','Localizá la presión blanca sobre el caballo de f6 y el contrajuego negro contra e5.'],
 ['white-scotch-gambit','Apertura Escocesa','Gambito Escocés · 4.Ac4 y 5.e5','C44',scotch+'Bc4 Nf6 e5','Antes de avanzar e5, revisá los recursos de jaque y si el alfil de c4 queda expuesto.'],
 ['white-alapin-stoltz','Apertura Alapin','Contra 2…Cf6 · ataque Stoltz','B22',alapin+'Nf6 e5 Nd5 Nf3 Nc6 Bc4 Nb6 Bb3','Compará el espacio que da e5 con el tiempo que cuesta retirar el alfil de c4.'],
 ['white-alapin-barmen','Apertura Alapin','Contra 2…d5 · Barmen con cambio central','B22',alapin+'d5 exd5 Qxd5 d4 cxd4 cxd4 Nc6 Nf3 Bg4','Identificá el peón aislado en d4 y qué piezas blancas pueden aprovechar las columnas abiertas.'],
 ['white-vienna-paulsen','Apertura Vienesa','Gambito Vienés · ataque Paulsen con Df3','C29',vienna+'Qf3','Calculá cómo presionar f7 y si la dama puede sufrir ataques con ganancia de tiempo.'],
 ['white-vienna-breyer','Apertura Vienesa','Gambito Vienés · variante Breyer con Cf3','C29',vienna+'Nf3 Be7','Compará desarrollar el caballo con sacar la dama. ¿Cómo recuperan las blancas el control central?'],
 ['white-reti-blumenfeld','Apertura Réti','Contra 2…d4 · Blumenfeld invertido','A09',reti+'d4 e3 c5 b4','Estudiá cómo el avance b4 cuestiona el soporte del peón negro de d4.'],
 ['white-reti-angloslav','Apertura Réti','Contra 2…c6 · Anglo-Eslava con b3 y Ab2','A12',reti+'c6 b3 Bf5 Bb2','Decidí entre sostener la tensión y transponer a una estructura de peón de dama.'],
 ['semi-slav-moscow','Defensa Semieslava','Moscú · 5.Ag5 h6 y cambio en f6','D43',semiSlav+'Bg5 h6 Bxf6 Qxf6','Compará la pareja de alfiles negra con el control central blanco. ¿Cuándo conviene jugar e4?'],
 ['semi-slav-botvinnik','Defensa Semieslava','Botvinnik · 5…dxc4 y 6.e4','D44',semiSlav+'Bg5 dxc4 e4 b5 e5 h6 Bh4 g5 Nxg5','Detenete antes de Cxg5 y calculá las capturas en ambos flancos. El centro blanco y el rey negro son los objetivos de la secuencia.'],
 ['semi-slav-meran','Defensa Semieslava','Merano · …b5 y …c5','D48',semiSlav+'e3 Nbd7 Bd3 dxc4 Bxc4 b5 Bd3 a6 e4 c5 d5','Contrastá el centro blanco con el contrajuego negro por el flanco de dama. Calculá qué cambia al avanzar d5.'],
 ['dragon-soltis','Defensa Siciliana · Dragón','Soltis · freno con 12…h5','B79',dragon+'Be3 Bg7 f3 O-O Qd2 Nc6 Bc4 Bd7 O-O-O Qa5 h4 Rfc8 Bb3 h5','Compará el bloqueo de h5 con la presión negra en c3. Antes de abrir la columna h, calculá los recursos en el flanco de dama.'],
 ['acc-dragon-gurgenidze','Defensa Siciliana · Dragón acelerado','Maróczy · Gurgenidze con …Cxd4','B36',accelerated+'c4 Nf6 Nc3 Nxd4 Qxd4 d6','Compará cambiar un par de caballos con mantener la tensión. ¿Qué casillas permiten a las negras reagruparse?'],
 ['kan-gipslis','Defensa Siciliana · Kan','Gipslis · 5.Ad3 y …g6','B42',e6Sicilian+'a6 Bd3 Nf6 O-O d6 c4 g6','Compará el bloqueo de d5 con las variantes de …Ab4. Revisá dónde conviene desarrollar el caballo de b8.'],
 ['najdorf-adams-reference','Defensa Siciliana · Najdorf','Ataque Adams · 6.h3','B90',najdorf+'h3','Estudiá qué habilita g4 y cuándo las negras pueden responder a la expansión con una ruptura central.'],
 ['najdorf-opocensky-reference','Defensa Siciliana · Najdorf','Opocensky · 6.Ae2 e5 y …Ae7','B92',najdorf+'Be2 e5 Nb3 Be7 O-O O-O','Compará el plan de enroque corto con la expansión del Ataque Inglés y localizá el control de d5.'],
 ['scheveningen-tal','Defensa Siciliana · Scheveningen','Tal · 6.f4 y 8.Df3','B82',scheveningen+'f4 Nc6 Be3 Be7 Qf3','Calculá qué presión crea la dama sobre f7 y qué recursos centrales tiene el segundo jugador antes de enrocar.'],
 ['sveshnikov-novosibirsk','Defensa Siciliana · Sveshnikov','Novosibirsk · 9.Axf6 y 10.Cd5','B33',sveshnikov+'Ndb5 d6 Bg5 a6 Na3 b5 Bxf6 gxf6 Nd5 Bg7','Compará el puesto avanzado d5 y los peones doblados con la iniciativa de las negras tras …f5.'],
 ['taimanov-bastrikov-be2','Defensa Siciliana · Taimanov','Bastrikov · 6.Ae3 a6 7.Ae2','B49',e6Sicilian+'Nc6 Nc3 Qc7 Be3 a6 Be2','Compará el plan con enroque corto con Dd2 y f3 del Ataque Inglés. ¿En qué momento se justifica …b5?']
];
export const OPENING_REFERENCE_LINES=rows.map(([id,family,name,eco,moves,research])=>({
 id:'ref-'+id,family,name,eco,moves,research,notes:{},
 reference:database+eco[0].toLowerCase()+'.tsv'
}));
