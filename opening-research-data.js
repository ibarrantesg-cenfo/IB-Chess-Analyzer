// Editorial research drafts only. Never label these lines as engine-verified theory.
// The UI checks move legality with chess.js before opening a line.
export const OPENING_RESEARCH_DRAFTS = [
  {
    id:'najdorf-h5', family:'Defensa Siciliana · Najdorf', eco:'B90',
    name:'Ataque Inglés · respuesta profiláctica ...h5',
    moves:'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be3 e5 Nb3 Be6 f3 h5 Qd2 Nbd7 O-O-O',
    notes:{
      10:'La Najdorf no desarrolla una pieza: quita b5 a las piezas blancas y prepara ...b5. Ese tiempo de peón solo se justifica si las negras consiguen coordinar el juego por la columna c y el flanco de dama antes de que prospere la iniciativa blanca.',
      12:'...e5 gana espacio y fuerza al caballo de d4 a retirarse. A cambio, d5 ya no puede ser defendida por un peón e negro: el punto estratégico será controlar esa casilla con piezas y vigilar cuándo la presión blanca sobre d6 puede volverse concreta.',
      16:'...h5 controla g4 de forma directa. No convierte automáticamente g4 en un error: obliga a las blancas a calcular el avance y sus posibles sacrificios, mientras las negras deben decidir si ...h4 crea objetivos fijos o si conviene priorizar ...b5. Contrastar ambas carreras con variantes tácticas.',
      19:'Con el rey blanco en c1, ...b5 y ...b4 pueden ganar fuerza porque el caballo de c3 participa en su defensa. Sin embargo, atacar al caballo sin resolver d5 o permitir rupturas centrales puede ser prematuro. Identificar qué piezas sostienen c3 y cuándo abrir la columna c.'
    },
    research:'Comprobar ...h5 frente a ...Be7 tras 8.f3. Evaluar las rutas de las piezas hacia d5 y la velocidad de los ataques.',
    reference:'https://lichess.org/opening/Sicilian_Defense_Najdorf_Variation'
  },
  {
    id:'najdorf-be7',family:'Defensa Siciliana · Najdorf',eco:'B90',
    name:'Ataque Inglés · desarrollo con ...Be7',
    moves:'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be3 e5 Nb3 Be6 f3 Be7 Qd2 O-O O-O-O Nbd7',
    notes:{
      12:'Las negras fuerzan el repliegue del caballo de d4 y obtienen un centro de peones e5-d6. La pregunta crítica no es solo si d5 está débil: hay que verificar si las blancas pueden llevar allí una pieza, mantenerla y atacar d6 sin permitir contrajuego sobre e4.',
      16:'...Ae7 acelera el enroque corto y preserva el peón h negro en h7. A diferencia de ...h5, no frena g4 directamente. Eso puede ser aceptable si las negras consiguen ...b5 con suficiente velocidad, pero exige medir los tiempos y las amenazas concretas de ambos flancos.',
      18:'Tras ...O-O se define el objetivo del ataque blanco. Comparar la secuencia g4-g5 con ...b5-b4, pero también revisar rupturas de centro: una columna abierta sobre el rey enemigo puede valer más que avanzar un peón adicional en el flanco.',
      20:'...Cbd7 aporta una pieza a la defensa del centro y permite coordinar ...Tc8 o ...b5. No debe asumirse que impide Cd5: el control efectivo depende de piezas, cambios posibles y de si las blancas pueden sostener el caballo una vez instalado.'
    },
    research:'Comparar 8...Be7 y 8...h5 con MultiPV a la misma profundidad. Identificar planes útiles, no solo cifras.',
    reference:'https://lichess.org/opening/Sicilian_Defense_Najdorf_Variation'
  },
  {
    id:'french-a3',family:'Defensa Francesa · Avance',eco:'C02',
    name:'Presión sobre d4 · estructura con ...c4',
    moves:'e4 e6 d4 d5 e5 c5 c3 Nc6 Nf3 Qb6 a3 c4 Nbd2 Na5',
    notes:{
      5:'e5 obtiene espacio, pero deja d4 como base de la cadena blanca.',
      6:'...c5 cuestiona d4 directamente y define la lucha central.',
      10:'...Qb6 añade presión sobre d4 y b2; comprobar la táctica antes de imitar el plan.',
      12:'...c4 cierra de momento el contacto directo con d4: a cambio de espacio, las negras permiten que las blancas busquen la ruptura b3 contra el peón c4. Estudiar cuándo ...Ca5 y ...Ad7 apoyan el flanco y cuándo ...f6 se convierte en el verdadero contragolpe central.'
    },
    research:'Analizar qué cambia en el control de b3 y las rupturas blancas después de ...c4.',
    reference:'https://lichess.org/opening/French_Defense_Advance_Variation'
  },
  {
    id:'french-bd3',family:'Defensa Francesa · Avance',eco:'C02',
    name:'6.Bd3 · desarrollo y posible sacrificio del peón d4',
    moves:'e4 e6 d4 d5 e5 c5 c3 Nc6 Nf3 Qb6 Bd3 cxd4 O-O Bd7',
    notes:{
      6:'...c5 ejerce presión inmediata contra la base de la cadena blanca.',
      11:'Ad3 apunta a h7 y acelera la movilización de las piezas. Si las negras capturan en d4 y el blanco elige enrocar en vez de recapturar, el peón sacrificado solo se justifica por tiempos de desarrollo y presión concreta: identificar amenazas reales antes de hablar de compensación.',
      13:'O-O deja el peón de d4 sin recuperar y conduce a un esquema de gambito. La compensación debe comprobarse jugada por jugada: desarrollo del alfil c1, columnas abiertas, debilidad de e6 y capacidad negra para consolidar el material adicional.'
    },
    research:'Antes de recomendar este gambito, comprobar las capturas en d4 y la actividad de las piezas con MultiPV.',
    reference:'https://lichess.org/opening/French_Defense_Advance_Variation'
  },
  {
    id:'caro-short',family:'Defensa Caro-Kann · Avance',eco:'B12',
    name:'Sistema Short · desarrollo y ruptura ...c5',
    moves:'e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2 c5 O-O Nc6 c3',
    notes:{
      6:'...Bf5 desarrolla el alfil antes de ...e6, diferencia clave respecto a la Francesa.',
      10:'...c5 ataca d4 tras c7-c6-c5, dos movimientos del mismo peón. El retraso puede quedar compensado por la salida previa del alfil de c8 a f5, que la Francesa clásica suele tener restringida. Analizar si la presión sobre d4 llega a tiempo o si las blancas pueden consolidar e5.',
      13:'c3 sostiene d4 y favorece un centro blanco estable; las negras buscan presión sobre él.'
    },
    research:'Cuantificar el impacto de ...c5 y explorar cambios de orden con 4.Nf3.',
    reference:'https://lichess.org/opening/Caro-Kann_Defense_Advance_Variation'
  },
  {
    id:'caro-g4',family:'Defensa Caro-Kann · Avance',eco:'B12',
    name:'Estructura agresiva · avance g4 contra el alfil',
    moves:'e4 c6 d4 d5 e5 Bf5 Nc3 e6 g4 Bg6 Nge2',
    notes:{
      6:'El alfil negro se desarrolla con libertad, pero queda expuesto a avances blancos.',
      9:'g4 gana un tiempo contra el alfil de f5 y señala una intención agresiva. Su coste es claro: el peón blanco adelantado puede convertirse en objetivo mediante ...c5, ...h5 o juego de piezas. La evaluación práctica exige calcular cómo mantener el centro cuando el rey blanco todavía no está seguro.',
      11:'Cge2 apoya f4 y protege la coordinación antes de decidir el destino del rey. El caballo puede dirigirse a f4 para presionar el alfil de g6, pero las negras cuentan con ...c5 y, según la estructura, ...h5. Evitar presentar el avance blanco como una carrera sin contrajuego.'
    },
    research:'Examinar respuestas negras frente a g4, estructura de peones y seguridad del rey blanco.',
    reference:'https://lichess.org/opening/Caro-Kann_Defense_Advance_Variation'
  }
];
