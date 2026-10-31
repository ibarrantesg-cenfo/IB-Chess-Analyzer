// Editorial research drafts only. Never label these lines as engine-verified theory.
// The UI checks move legality with chess.js before opening a line.
export const OPENING_RESEARCH_DRAFTS = [
  {
    id:'najdorf-h5', family:'Defensa Siciliana · Najdorf', eco:'B90',
    name:'Ataque Inglés · respuesta profiláctica ...h5',
    moves:'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be3 e5 Nb3 Be6 f3 h5 Qd2 Nbd7 O-O-O',
    notes:{
      10:'...a6 controla b5 y mantiene flexibilidad en el flanco de dama.',
      12:'...e5 gana espacio y desplaza al caballo de d4, pero hace de d5 una casilla crítica.',
      16:'...h5 dificulta g4 sin demostrar por sí sola que el ataque blanco ha sido detenido.',
      19:'El rey blanco en c1 puede ser objetivo de ...b5 y ...b4; la coordinación central sigue siendo decisiva.'
    },
    research:'Comprobar ...h5 frente a ...Be7 tras 8.f3. Evaluar las rutas de las piezas hacia d5 y la velocidad de los ataques.',
    reference:'https://lichess.org/opening/Sicilian_Defense_Najdorf_Variation'
  },
  {
    id:'najdorf-be7',family:'Defensa Siciliana · Najdorf',eco:'B90',
    name:'Ataque Inglés · desarrollo con ...Be7',
    moves:'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be3 e5 Nb3 Be6 f3 Be7 Qd2 O-O O-O-O Nbd7',
    notes:{
      12:'Las negras ganan espacio, pero deben vigilar d5 y mantener una coordinación activa.',
      16:'...Be7 favorece el enroque y no impide directamente la expansión g4.',
      18:'Con ...O-O se aclara la posición del rey; comparar velocidad y calidad de los ataques.',
      20:'...Nbd7 apoya la coordinación sin resolver por sí sola las tensiones del centro.'
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
      12:'...c4 cambia la estructura y también las rupturas disponibles para ambos bandos.'
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
      11:'Bd3 da prioridad al desarrollo y crea motivos de sacrificio; la compensación requiere cálculo concreto.',
      13:'O-O desarrolla el plan con rapidez, pero no debe describirse como compensación demostrada sin análisis.'
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
      10:'...c5 cuestiona d4 tras haber empleado dos tiempos con el peón c.',
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
      9:'g4 gana espacio y ataca el alfil; también deja debilidades en el flanco de rey blanco.',
      11:'Nge2 conserva flexibilidad para f4 y mantiene la lucha central.'
    },
    research:'Examinar respuestas negras frente a g4, estructura de peones y seguridad del rey blanco.',
    reference:'https://lichess.org/opening/Caro-Kann_Defense_Advance_Variation'
  }
];
