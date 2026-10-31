// Additional editorial research lines. Their legal move sequences are CI-tested.
// No engine evaluation has been attached to these lines or their annotations.
const N='e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6';
const F='e4 e6 d4 d5 e5 c5 c3 Nc6 Nf3 Qb6';
const C='e4 c6 d4 d5 e5 Bf5';
const Q='d4 d5 c4 e6 Nc3 Nf6';
const I='d4 Nf6 c4 e6 Nc3 Bb4';
const K='d4 Nf6 c4 g6 Nc3 Bg7 e4 d6';
const G='d4 Nf6 c4 g6 Nc3 d5';
const E='e4 e5 Nf3 Nc6';
const family={
 najdorf:'Defensa Siciliana · Najdorf',
 french:'Defensa Francesa',
 caro:'Defensa Caro-Kann',
 qgd:'Gambito de Dama',
 nimzo:'Defensa Nimzoindia',
 kid:'Defensa India de Rey',
 grunfeld:'Defensa Grünfeld',
 ru:'Apertura Española',
 italian:'Apertura Italiana',
 scotch:'Apertura Escocesa',
 slav:'Defensa Eslava',
 catalan:'Apertura Catalana',
 english:'Apertura Inglesa',
 london:'Sistema Londres',
 tromp:'Ataque Trompowsky'
};
const url={
 najdorf:'https://lichess.org/opening/Sicilian_Defense_Najdorf_Variation',
 french:'https://lichess.org/opening/French_Defense',
 caro:'https://lichess.org/opening/Caro-Kann_Defense',
 qgd:'https://lichess.org/opening/Queens_Gambit_Declined',
 nimzo:'https://lichess.org/opening/Nimzo-Indian_Defense',
 kid:'https://lichess.org/opening/Kings_Indian_Defense',
 grunfeld:'https://lichess.org/opening/Grunfeld_Defense',
 ru:'https://lichess.org/opening/Ruy_Lopez',
 italian:'https://lichess.org/opening/Italian_Game',
 scotch:'https://lichess.org/opening/Scotch_Game',
 slav:'https://lichess.org/opening/Slav_Defense',
 catalan:'https://lichess.org/opening/Catalan_Opening',
 english:'https://lichess.org/opening/English_Opening',
 london:'https://lichess.org/opening/London_System',
 tromp:'https://lichess.org/opening/Trompowsky_Attack'
};
const make=(id,key,name,moves,eco,notes,research)=>({id,family:family[key],eco,name,moves,notes,research,reference:url[key]});
export const OPENING_RESEARCH_EXPANSION=[
 make('najdorf-bg5-classic','najdorf','6.Bg5 · estructura clásica con ...Be7',N+' Bg5 e6 f4 Be7 Qf3 Qc7 O-O-O Nbd7 g4 b5','B96',{
  11:'El alfil clava el caballo f6 contra la dama: la presión sobre e6 exige precisión.',
  13:'f4 obtiene espacio, pero también deja casillas oscuras susceptibles de contraataque.',
  15:'La dama en f3 refuerza el ataque; calcular tácticas sobre c3, e4 y d4.',
  20:'...b5 apunta al enroque blanco. Comprobar si existen recursos centrales en este momento.'
 },'Contrastar 7...Be7, 7...Qc7, 7...Nbd7 y 7...Qb6 en el mismo FEN.'),
 make('najdorf-poison','najdorf','6.Bg5 · Peón Envenenado 7...Db6',N+' Bg5 e6 f4 Qb6 Qd2 Qxb2 Rb1 Qa3 e5 dxe5 fxe5 Nfd7','B97',{
  14:'...Db6 ataca b2 y entra en una variante muy concreta; no es un plan universal.',
  16:'La dama captura b2 a cambio de tiempo y desarrollo blanco. Debe comprobarse tácticamente.',
  18:'...Da3 obliga a calcular secuencias forzadas antes de emitir juicios de compensación.'
 },'Exigir MultiPV profundo y referencias magistrales; no usar como recomendación sin revisión.'),
 make('najdorf-bc4','najdorf','6.Ac4 · ataque Fischer-Sozin',N+' Bc4 e6 Bb3 b5 O-O Be7 f4 O-O Qe2 Qc7','B86',{
  11:'Ac4 presiona e6 y f7, con un enfoque distinto del Ataque Inglés.',
  14:'...b5 obtiene espacio, pero crea objetivos en casillas claras y posibles saltos de caballo.',
  19:'La dama en e2 coordina el centro; comparar la amenaza f5 con el juego negro en c.'
 },'Buscar partidas modelo de Sozin y contrastar cambios de orden con 7...b5.'),
 make('najdorf-f4','najdorf','6.f4 e5 · ataque de cuatro peones',N+' f4 e5 Nf3 Nbd7 a4 Be7 Bd3 O-O O-O','B93',{
  11:'f4 prepara e5 o f5 según la estructura; la casilla e4 también puede debilitarse.',
  12:'...e5 gana espacio y obliga al caballo a retirarse; comprobar d5 y d6.',
  13:'Cf3 mantiene piezas activas; el momento de f5 depende de la respuesta negra.'
 },'Contrastar 7.Cf3 y posibles alternativas de desarrollo negro; evitar analogías automáticas con el Ataque Inglés.'),
 make('najdorf-be2','najdorf','6.Ae2 · desarrollo clásico',N+' Be2 e5 Nb3 Be7 O-O O-O Be3 Be6','B92',{
  11:'Ae2 reduce la exposición inmediata del rey, sin renunciar a presión central.',
  12:'...e5 desplaza el caballo blanco a cambio del control de d4.',
  18:'La estructura es menos forzada que los ataques con enroques opuestos; evaluar planes centrales.'
 },'Separar planes con 8.Ae3, 8.Te1 y rupturas del centro.'),
 make('najdorf-h3','najdorf','6.h3 e5 · expansión g4',N+' h3 e5 Nde2 Be7 g4 O-O Bg2','B90',{
  11:'h3 suele apoyar g4 y evita motivos de ...Cg4; requiere precisión en el orden de jugadas.',
  13:'Cde2 conserva la flexibilidad del caballo sin cederlo por el alfil.',
  15:'El avance g4 cambia el equilibrio entre iniciativa y seguridad del rey.'
 },'Comparar 6.h3 y 6.f3; no suponer que una transposición conserva los mismos recursos.'),
 make('najdorf-g3','najdorf','6.g3 · desarrollo posicional',N+' g3 e5 Nde2 Be7 Bg2 O-O O-O','B91',{
  11:'g3 anuncia el fianchetto blanco y un enfoque más posicional.',
  12:'...e5 gana control sobre d4 y deja d5 como objetivo.',
  15:'Ag2 presiona la diagonal larga; examinar si el centro permite explotar su actividad.'
 },'Investigar ataques negros con ...b5 y el empleo de f4 blanco.'),
 make('najdorf-f3','najdorf','6.f3 · orden alternativo del Ataque Inglés',N+' f3 e5 Nb3 Be6 Be3 Nbd7 Qd2 Be7 O-O-O','B90',{
  11:'f3 refuerza e4 antes de decidir la ubicación del alfil de c1.',
  12:'...e5 es una decisión estructural que requiere atención a d5.',
  15:'Ae3 transpone a posiciones similares del Ataque Inglés, pero hay que comprobar las diferencias.'
 },'Anotar transposiciones reales por FEN, no únicamente por nombres.'),
 make('najdorf-ng4','najdorf','6.Ae3 Cg4 · intento de cambio',N+' Be3 Ng4 Bg5 h6 Bh4 g5 Bg3 Bg7 h3 Ne5','B90',{
  12:'...Cg4 ataca directamente el alfil en e3 antes de f3.',
  13:'Ag5 evita el cambio inmediato: estudiar la reacción ...h6.',
  19:'h3 cuestiona el caballo de g4, pero la expansión negra crea debilidades propias.'
 },'Comprobar 7.Ag5 y rutas alternativas del alfil con engine.'),
 make('french-a3-bd7','french','Avance 6.a3 · ...Ad7 y ...Tc8',F+' a3 Bd7 b4 cxd4 cxd4 Rc8 Bb2','C02',{
  11:'a3 puede preparar b4, ganando espacio en el flanco de dama y apoyando c3.',
  13:'La expansión b4 debe medirse contra la posible presión negra en c.',
  16:'...Tc8 utiliza una columna que quedó disponible por la evolución del centro.'
 },'Comparar estructuras tras ...c4 y ...cxd4; identificar cuándo b4 es una ganancia de tiempo.'),
 make('french-be2','french','Avance 6.Ae2 · desarrollo flexible',F+' Be2 Bd7 O-O Nh6 Na3 cxd4 cxd4 Nf5','C02',{
  11:'Ae2 desarrolla sin ofrecer la misma iniciativa inmediata que Ad3.',
  13:'El rey blanco se pone a salvo antes de decidir cómo contrarrestar la presión sobre d4.',
  17:'La recaptura con el peón c modifica la base de la cadena y permite analizar c abierta.'
 },'Verificar si los planes con ...Cf5 dependen de transposiciones previas.'),
 make('french-winawer','french','Winawer 3.Cc3 Ab4 · tensión estructural','e4 e6 d4 d5 Nc3 Bb4 e5 c5 a3 Bxc3+ bxc3 Ne7 Qg4','C18',{
  6:'...Ab4 vincula la lucha del centro con la estructura blanca de peones doblados.',
  10:'...Axc3 crea una asimetría posicional importante; los peones c pueden ser fuerza y debilidad.',
  13:'Dg4 busca presión directa; calcular la seguridad del rey negro antes de hablar de ventaja.'
 },'Comparar respuestas negras tras Dg4; no trasladar análisis de la Francesa del Avance a la Winawer.'),
 make('caro-short-be3','caro','Avance Short · ...c5 y Ae3',C+' Nf3 e6 Be2 c5 O-O Nc6 c3 Nge7 Be3','B12',{
  6:'El alfil negro se desarrolla antes de ...e6; diferencia importante con la Francesa.',
  10:'...c5 pone a prueba d4 después de c7-c6-c5.',
  15:'Ae3 sostiene el desarrollo y puede ayudar en la lucha sobre d4.'
 },'Contrastar 4.Cf3 y las opciones 4...e6/4...c5, teniendo en cuenta los tiempos del peón c.'),
 make('caro-g4-c5','caro','Avance 4.Cc3 · 5.g4 y ruptura ...c5',C+' Nc3 e6 g4 Bg6 Nge2 c5 h4 h5 Nf4','B12',{
  9:'g4 gana espacio, pero desprotege zonas del flanco de rey y exige cálculo.',
  10:'...Ag6 preserva el alfil, aunque condiciona futuras reacciones con ...h5.',
  12:'...c5 busca contrajuego central cuando las blancas ya han avanzado peones de flanco.',
  15:'Cf4 aumenta las amenazas al alfil y centraliza el caballo desde e2.'
 },'Calcular las respuestas negras frente a g4/h4 antes de asignar categorías como ataque ganador.'),
 make('caro-h4','caro','Avance 4.h4 h5 · provocación temprana',C+' h4 h5 Bd3 Bxd3 Qxd3 e6 Nf3 c5','B12',{
  7:'h4 cuestiona el espacio del alfil y limita o condiciona ...h5.',
  8:'...h5 fija una estructura temprana; estudiarla sin asumir que es obligatoria.',
  10:'El cambio de alfiles modifica el ritmo del ataque y la movilidad de la dama.'
 },'Contrastar 4.h4 y 4.Cc3; revisar respuestas negras con ...h5 y ...h6.'),
 make('caro-classical','caro','Clásica 3.Cc3 · ...Af5 y ...Ag6','e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3 Nd7','B19',{
  6:'...dxe4 transforma el centro para reducir el espacio blanco.',
  8:'...Af5 desarrolla activamente el alfil antes de cerrar con ...e6.',
  11:'h4 cuestiona el alfil g6 y obliga a valorar ...h6 y ...h5.'
 },'Comprobar la secuencia de alfil y caballo en la posición clásica; evitar evaluación automática.'),
 make('qgd-classic','qgd','Gambito Rehusado · estructura ortodoxa',Q+' Bg5 Be7 e3 O-O Nf3 Nbd7 Rc1 c6','D55',{
  4:'...e6 apoya d5, pero condiciona la salida natural del alfil de c8.',
  7:'Ag5 ejerce presión sobre el caballo defensor del centro.',
  14:'...c6 sostiene el centro y prepara decisiones posteriores en d5 o c5.'
 },'Comparar ...c6 con ruptura ...c5 y tiempos de desarrollo del alfil malo.'),
 make('qgd-exchange','qgd','Gambito Rehusado · Cambio y minorías',Q+' cxd5 exd5 Bg5 Be7 e3 O-O Bd3 Nbd7 Qc2 Re8','D35',{
  7:'cxd5 permite una estructura característica con la columna c relevante.',
  8:'...exd5 deja una cadena de peones en d5 y c7 que puede ser objetivo de ataque de minorías.',
  13:'Ad3 influye en h7 y facilita el enroque, pero el plan de b4-b5 depende del desarrollo.'
 },'Relacionar con ataque de minorías y ruptura ...c5 solo cuando la estructura lo permita.'),
 make('nimzo-classic','nimzo','Nimzoindia · estructura clásica 4.e3',I+' e3 O-O Bd3 d5 Nf3 c5 O-O Nc6','E40',{
  6:'...Ab4 clava al caballo de c3 y vincula la lucha del centro con la estructura blanca.',
  8:'...O-O prioriza la seguridad del rey y conserva flexibilidad.',
  12:'...c5 enfrenta directamente el centro blanco y puede inducir peones aislados.'
 },'Contrastar resultados estructurales tras ...Axc3 y ...dxc4.'),
 make('nimzo-qc2','nimzo','Nimzoindia · sistema de 4.Dc2',I+' Qc2 O-O a3 Bxc3+ Qxc3 d5 Nf3','E32',{
  7:'Dc2 permite recapturar en c3 con dama y evitar peones doblados, aunque retrasa desarrollo.',
  10:'...Axc3 elimina al caballo c3; la dama blanca sale temprano.',
  11:'Dxc3 preserva la estructura de peones, pero deja a la dama expuesta a tiempos.'
 },'Verificar el momento ...d5 y posibles ataques a la dama c3.'),
 make('kid-classic','kid','India de Rey · centro clásico y ...e5',K+' Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7 Ne1','E97',{
  8:'...d6 permite ...e5 sin abandonar inmediatamente el centro.',
  12:'...e5 bloquea el centro y anuncia una lucha por rupturas de flanco.',
  15:'d5 fija la cadena; el blanco puede buscar c5 y el negro ...f5, según la configuración.',
  17:'Ce1 prepara maniobras hacia d3 o f3 y libera f3; estudiar planes concretos.'
 },'Comparar ...f5 con ...c6, fechas y recursos tácticos cuando ambos atacan en flancos.'),
 make('kid-saemisch','kid','India de Rey · Sämisch y presión sobre f3',K+' f3 O-O Be3 e5 d5 Nh5','E80',{
  9:'f3 refuerza e4 y condiciona el desarrollo natural del caballo de g1.',
  12:'...e5 bloquea la estructura y prepara maniobras de piezas.',
  14:'...Ch5 apunta a f4 y g3, pero exige atención al posible avance blanco g4.'
 },'Analizar Sämisch con planes distintos de ataque y control central.'),
 make('grunfeld-exchange','grunfeld','Grünfeld · Cambio y centro blanco móvil',G+' cxd5 Nxd5 e4 Nxc3 bxc3 Bg7 Nf3 c5 Be2','D85',{
  6:'...d5 ataca el centro blanco antes de consolidarlo y acepta tensión dinámica.',
  10:'...Cxc3 cambia el caballo por el defensor del centro; bxc3 aumenta los peones centrales.',
  14:'...c5 ataca la cadena desde un flanco; el blanco debe decidir entre d5 y desarrollo.'
 },'Precisar qué rupturas negras son tácticamente posibles según el alfil en g7.'),
 make('grunfeld-russian','grunfeld','Grünfeld · sistema Ruso con 5.Db3',G+' Nf3 Bg7 Qb3 dxc4 Qxc4 O-O e4','D97',{
  9:'Db3 defiende indirectamente el centro y presiona d5; desarrolla la dama temprano.',
  10:'...dxc4 convierte la tensión central en una carrera por desarrollo.',
  12:'...O-O prioriza seguridad mientras prepara ataques al amplio centro blanco.'
 },'Comparar 5.Db3 con 5.Af4 y con el sistema de cambio.'),
 make('ru-berlin','ru','Española · Berlinesa 4...Cxe4',E+' Bb5 Nf6 O-O Nxe4 d4 Nd6 Bxc6 dxc6 dxe5 Nf5','C67',{
  8:'...Cxe4 obtiene un peón momentáneamente, pero el blanco dispone de d4.',
  9:'d4 pregunta por la estabilidad del caballo y acelera el desarrollo.',
  13:'dxe5 define el centro; evaluar movilidad de reyes y estructura antes de proyectar un final.'
 },'Comprobar si las transposiciones llevan realmente al final berlinés típico.'),
 make('ru-closed','ru','Española · línea cerrada',E+' Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O h3','C84',{
  6:'...a6 obliga a decidir el alfil de b5; también prepara espacio mediante ...b5.',
  12:'...b5 expande en el flanco de dama; el alfil blanco reacciona con Ab3.',
  17:'h3 restringe ...Ag4 y prepara una fase lenta de maniobras.'
 },'Investigar rupturas d4, ...d5 y maniobras de caballos; no asumir equivalencia con la Berlinesa.'),
 make('italian-quiet','italian','Italiana · d3 y planes lentos',E+' Bc4 Bc5 c3 Nf6 d3 d6 O-O O-O Re1 a6','C54',{
  6:'Ac5 iguala la presencia de los alfiles en diagonales hacia los reyes.',
  7:'c3 sostiene una futura expansión d4 y conserva opciones estratégicas.',
  10:'...d6 frena ciertas rupturas; ambos bandos pueden desarrollar sin forzar cambios.'
 },'Contrastar Giuoco Pianissimo con aperturas abiertas donde d4 llega antes.'),
 make('scotch-classic','scotch','Escocesa · ...Ac5 y ...Df6',E+' d4 exd4 Nxd4 Bc5 Be3 Qf6 c3 Nge7 Bc4','C45',{
  5:'d4 abre el centro mientras las piezas menores aún se desarrollan.',
  8:'...Ac5 presiona d4; las blancas contestan con Ae3.',
  10:'...Df6 mantiene tensión táctica sobre d4 y f2; exigir verificación precisa.'
 },'Revisar recapturas sobre d4 y amenazas de ...Cxd4 antes de recomendar.',
),
 make('slav-main','slav','Eslava · centro con ...dxc4','d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3 e6 Bxc4 Bb4','D17',{
  4:'...c6 sostiene d5 y deja libre la diagonal del alfil c8.',
  8:'...dxc4 plantea la cuestión de recuperar el peón y el tiempo.',
  10:'...Af5 desarrolla fuera de la cadena antes de jugar ...e6.',
  13:'Axc4 recupera material a costa de elegir el momento de actividad blanca.'
 },'Comprobar alternativas en 5.a4 y 5.e3; estudiar si ...b5 defiende c4.'),
 make('catalan-open','catalan','Catalana · ...dxc4 y recuperación', 'd4 Nf6 c4 e6 g3 d5 Bg2 Be7 Nf3 O-O O-O dxc4 Qc2 a6 Qxc4','E04',{
  5:'g3 anuncia el alfil en la diagonal larga hacia el centro negro.',
  12:'...dxc4 acepta ceder el centro a cambio de material y tiempos.',
  15:'Dxc4 recupera el peón; la actividad de las piezas tiene más importancia que contar peones aislados.'
 },'Examinar qué líneas permiten sostener el peón de c4 sin perder demasiados tiempos.'),
 make('english-symm','english','Inglesa · estructura simétrica','c4 c5 Nc3 Nc6 Nf3 Nf6 g3 g6 Bg2 Bg7 O-O O-O','A34',{
  2:'...c5 crea simetría central, pero el orden de jugadas todavía permite planes diferentes.',
  7:'g3 busca control de casillas oscuras desde el flanco.',
  10:'...Ag7 coloca al alfil en una diagonal que puede cobrar importancia con d4 o ...d5.'
 },'Diferenciar simetría superficial de posiciones transpuestas a defensas contra d4.'),
 make('london-c5','london','Sistema Londres · presión ...c5','d4 d5 Bf4 Nf6 e3 c5 c3 Nc6 Nd2 Qb6 Qb3','D02',{
  3:'Af4 desarrolla el alfil antes de e3, evitando problemas de movilidad.',
  6:'...c5 interroga directamente el centro d4.',
  10:'...Db6 ataca b2 y d4; las blancas proponen el cambio de damas o tensión en b.'
 },'Comprobar si la dama en b6 puede ganar tiempos y cuándo la estructura es desfavorable.'),
 make('tromp-early','tromp','Trompowsky · ...Ce4 y ...Da5+','d4 Nf6 Bg5 Ne4 Bf4 c5 f3 Qa5+ c3 Nf6','A45',{
  3:'Ag5 plantea cambiar el alfil por el caballo antes de ...d5.',
  4:'...Ce4 evita la clavada y cuestiona la posición del alfil.',
  8:'...Da5+ explota las casillas que dejó el peón d4; revisar tácticas antes de memorizar.'
 },'Comprobar legalidad y atractivo teórico de 4.f3 frente a otras alternativas.'),
];
