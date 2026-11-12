import { ARROW_COLORS } from './board-arrows.js';

// General family guidance. Board annotations are tied to reviewed positions below.
const profile=(white,black)=>({white,black});
const PLANS={
 'Najdorf':profile('Elegí entre presión central con f4 y ataque con f3, Dd2 y g4. Confirmá dónde quedará tu rey antes de avanzar los peones.','Completá el desarrollo y compará …e5 con …e6. El avance …b5 gana espacio; …d5 requiere calcular la presión sobre e4 y d6.'),
 'Dragón acelerado':profile('Con c4, reforzá el control de d5; sin ese peón, desarrollá las piezas vigilando …d5. Evitá cambiar piezas que sostienen el bloqueo sin compensación.','Usá la diagonal del alfil de g7 y prepará …d5. Contra el Maróczy, buscá cambios y rupturas sin crear una debilidad permanente en d6.'),
 'Dragón':profile('Con Ae3, f3 y Dd2 podés preparar enroque largo y h4–h5; con Ae2 y enroque corto, priorizá el centro. Elegí el esquema según la seguridad del rey.','Activá el alfil de g7 y presioná por la columna c. Compará …d5 con el contrajuego de flanco antes de seguir empujando peones.'),
 'Sveshnikov':profile('Disputá d5 y valorá el cambio del caballo de f6, que suele defender esa casilla. Compará ese control con la actividad que cedés a las negras.','Aprovechá espacio y actividad para compensar d5. Prepará …f5 o juego con …b5–b4 sin perder el control táctico del centro.'),
 'Taimanov':profile('Completá el desarrollo y elegí entre fianchetto o Ae3 con f3. Antes de atacar, comprobá la presión de …Dc7 sobre e5 y c3.','Desarrollá con flexibilidad. Compará …d5 con …b5; la dama en c7 y el caballo de c6 deben coordinarse antes de abrir el centro.'),
 'Kan':profile('Ganancias de espacio con c4 pueden limitar …d5; desarrollá sin dejar e4 indefenso frente a …Ab7 y …Cf6.','Coordiná el fianchetto de dama con …Cf6. Prepará …d5 o …b5 sin atrasar demasiado el desarrollo del rey.'),
 'Scheveningen':profile('Compará el ataque Keres con g4 frente a un desarrollo más tranquilo. Sostené e4 y revisá las rupturas centrales antes de atacar.','La cadena e6–d6 necesita actividad. Prepará …d5 o …e5 y asegurá el rey antes de iniciar contrajuego en el flanco de dama.'),
 'Siciliana':profile('Desarrollá con rapidez y disputá d5. El ataque de flanco funciona mejor cuando el centro y la seguridad del rey están controlados.','Buscá actividad en la columna c y una ruptura central …d5. Elegí …e5 o …e6 según la estructura y las piezas desarrolladas.'),
 'Francesa':profile('Con centro cerrado, sostené d4 y ganá espacio en el flanco de rey. Si se abre el centro, priorizá actividad y seguridad del rey sobre avances automáticos.','Atacá la base d4 con …c5 y compará …f6 contra e5. Buscá una función útil para el alfil de c8 antes de fijar más peones.'),
 'Caro-Kann':profile('En el Avance, usá el espacio sin descuidar d4. En Panov, la actividad y la ruptura d5 pueden compensar un posible peón aislado.','Desarrollá el alfil de c8 cuando el esquema lo permita. Atacá d4 con …c5 y calculá …e5 antes de aceptar una posición pasiva.'),
 'Catalana':profile('Coordiná el alfil de g2 con la presión central y la columna c. Si las negras capturan en c4, compará recuperar de inmediato con completar el desarrollo.','Disputá el centro con …c5 y desarrollá el flanco de dama. Si retenés el peón c4, calculá el coste en tiempos y seguridad.'),
 'Española':profile('Sostené e4 y prepará d4. En centros cerrados, reagrupá los caballos y vigilá el momento de abrir el flanco de rey.','Completá el desarrollo y disputá d4. Compará …d5 con el juego de espacio en el flanco de dama antes de fijar la estructura.'),
 'Berlín':profile('Si cambiás damas, buscá actividad del rey y presión sobre la estructura negra. Conservá las piezas que facilitan crear una segunda debilidad.','Coordiná la pareja de alfiles y activá el rey cuando sea seguro. Prepará rupturas centrales sin exponer los peones.'),
 'Italiana':profile('Coordiná c3 y d4 para disputar el centro. Si elegís d3, completá el desarrollo y prepará la ruptura sin perder e4.','Desarrollá y enrocá a tiempo. Compará …d5 directo con prepararlo mediante …d6 y mejorá las piezas antes de atacar.'),
 'Escocesa':profile('Aprovechá la apertura del centro para desarrollar con tiempos. Calculá las amenazas sobre e4 y c2 antes de perseguir piezas.','Disputá la iniciativa con desarrollo activo. Los golpes …d5 y la presión sobre e4 pueden equilibrar el espacio blanco.'),
 'Cuatro Caballos':profile('Completá el desarrollo y elegí d4 o d3 según la tensión en e4. Evitá cambios que ayuden a desarrollar al rival sin una idea concreta.','Mantené la coordinación de los caballos y calculá …d5. La simetría exige revisar las amenazas concretas antes de copiar jugadas.'),
 'Inglesa':profile('Disputá d5 con el peón c4 y las piezas. Compará el fianchetto con la expansión b4, atendiendo a las respuestas centrales negras.','Disputá el centro con …d5 o …e5 según el esquema. Evitá dejar un puesto avanzado permanente en d5 sin actividad a cambio.'),
 'Réti':profile('Usá presión de piezas contra el centro antes de fijarlo. Elegí entre d4, g3 o b3 según la respuesta negra y las transposiciones disponibles.','Ocupá el centro con apoyo y prepará …c5. Conservá flexibilidad para responder al fianchetto y al cambio cxd5.'),
 'Londres':profile('Coordiná Af4, e3 y el desarrollo del flanco de rey. Prepará e4 o Ce5; contra …g6, compará el ataque de flanco con el juego central.','Disputá d4 con …c5 y vigilá b2 si sale la dama. Evitá permitir e4 sin presión sobre el centro blanco.'),
 'Colle':profile('Prepará e4 con Ad3, Cbd2 y desarrollo del rey. Si …g6 controla e4, compará c4 con una preparación adicional antes de romper.','Presioná d4 con …c5 y desarrollá sin facilitar e4. Elegí los cambios centrales según la actividad de los alfiles.'),
 'Trompowsky':profile('Decidí si cambiar en f6 según la estructura resultante. Sostené el centro y evitá perder tiempos con el alfil sin una ganancia concreta.','Ganancias de tiempo sobre el alfil deben acompañarse de control central. Compará …c5 con …d5 antes de avanzar peones del enroque.'),
 'Ataque Indio':profile('Coordiná Cf3, g3, Ag2 y e4. El avance e5 puede ganar espacio, pero requiere sostener el centro y revisar contragolpes.','Disputá el centro con …c5 o …e5. No permitás un ataque gratuito sobre el rey si podés abrir líneas en el centro.'),
 'Grünfeld':profile('Sostené el centro móvil y desarrollá antes de avanzarlo. Compará d5 con mantener la tensión y revisá siempre la presión sobre d4.','Atacá el centro con …c5 y el alfil de g7. La presión sobre d4 debe compensar el espacio cedido.'),
 'India de Rey':profile('Aprovechá el espacio central. En centros cerrados, prepará juego en el flanco de dama; si el centro sigue abierto, priorizá desarrollo.','Compará …e5 y …c5. Con centro cerrado, …f5 puede iniciar contrajuego, pero antes calculá la seguridad del rey y las rupturas blancas.'),
 'Nimzoindia':profile('Elegí cómo resolver la clavada en c3. La pareja de alfiles y e4 pueden compensar daños de estructura, siempre que las piezas salgan a tiempo.','Presioná e4 y d4, y decidí cuándo cambiar en c3. Compará …c5 y …d5 con la estructura que dejará la recaptura blanca.'),
 'Semieslava':profile('Desarrollá y vigilá la tensión en c4. Si elegís e4 o g4, calculá las capturas centrales y la seguridad del rey antes de avanzar.','Prepará …c5 o …e5 para liberar la posición. Resolvé el desarrollo del alfil de c8 y calculá cuándo capturar en c4.'),
 'Eslava':profile('Sostené el centro y calculá e4. Si las negras capturan en c4, compará recuperar con desarrollo y la expansión a4.','Desarrollá el alfil de c8 antes de encerrarlo cuando sea posible. Compará …c5 y …e5 para disputar el centro.'),
 'Ragozin':profile('Resolvé la presión sobre c3 y d4 sin perder desarrollo. Calculá cuándo a3 o e4 obligan al alfil negro a decidir.','Combiná la clavada en c3 con presión central. Compará …c5 con simplificar en c3 según la recaptura blanca.'),
 'Gambito de Dama':profile('Completá el desarrollo y elegí entre presión central, e4 o juego de minorías cuando exista una estructura Carlsbad. La estructura decide el plan.','Disputá el centro y buscá la liberación con …c5 o …e5 cuando la estructura lo permita. Coordiná el alfil de c8 antes de aceptar una posición restringida.'),
 'Escandinava':profile('Desarrollá con tiempos contra la dama y ocupá el centro. Evitá perseguirla si con eso retrasás la seguridad del rey.','Elegí una retirada segura para la dama y completá el desarrollo. Compará …c5 o …e5 para disputar d4.'),
 'Pirc':profile('Usá el centro para ganar espacio sin dejarlo desprotegido. Compará e5 o f4 con desarrollar y asegurar el rey.','Presioná el centro con …c5 o …e5. El alfil de g7 necesita líneas y el rey seguridad antes de permitir un ataque de peones.'),
 'Benoni':profile('Usá la mayoría central para preparar e5 y restringí …b5. Mejorá las piezas antes de abrir el centro.','Buscá actividad por la columna e y expansión con …b5. Calculá el avance e5 blanco antes de apartar piezas del centro.'),
 'Benko':profile('Devolvé el peón si facilita desarrollo y seguridad. Neutralizá la presión sobre a y b antes de buscar un avance central.','Coordiná torres y alfil de g7 sobre el flanco de dama. La actividad duradera debe justificar el peón entregado.'),
 'Holandesa':profile('Presioná el centro y vigilá e5. Compará d5 con desarrollar el fianchetto y restringir el ataque negro.','Prepará …e5 en el Leningrado y controlá e4. Cualquier ataque de flanco exige comprobar la seguridad del rey.'),
 'Alapin':profile('Sostené d4 y completá el desarrollo. Si queda un peón aislado, buscá actividad y calculá d5 antes de cambiar piezas.','Atacá el centro antes de que se consolide. Compará …d5 con presión sobre e4 y evitá perder tiempos con la dama.'),
 'Vienesa':profile('Apoyá el centro y terminá el desarrollo antes de atacar. El avance f4 abre líneas cerca de tu rey y requiere cálculo.','Reaccioná en el centro con …d5 cuando sea posible. Buscá actividad de piezas antes de intentar conservar material.'),
 'Rossolimo':profile('Elegí entre cambiar en c6 y conservar el alfil según la estructura. Prepará el centro y no regalés tiempos persiguiendo el caballo.','Desarrollá y prepará …d5. Si se dobla el peón c, aprovechá las columnas y la pareja de alfiles.'),
 'Petrov':profile('Desarrollá y disputá el centro con d4. La simetría hace valioso mejorar las piezas antes de buscar una ruptura.','Coordiná el desarrollo y sostené e4 cuando corresponda. Compará …d5 con simplificar sin perder actividad.')
};
const fallback=profile('Completá el desarrollo, protegé el rey e identificá la ruptura central de esta posición antes de avanzar peones.','Disputá el centro, activá la pieza menos desarrollada y comprobá las amenazas antes de cambiar la estructura.');
export function openingPlans(draft){
 const family=String(draft.family||'');
 const key=Object.keys(PLANS).find(key=>new RegExp('(?:^|[^\\p{L}])'+key+'(?:$|[^\\p{L}])','iu').test(family));
 return {...(PLANS[key]||fallback),family,scope:key?'family':'general'};
}

const positionPlans=new Map([
 ['rn1qkbnr/pp3pp1/4p1b1/2ppP2p/3P1NPP/2N5/PPP2P2/R1BQKB1R b KQkq -',{
  white:'El caballo de f4 ataca al alfil de g6 y al peón de h5. Si las negras capturan en d4, compará sostener el centro con cambiar el caballo por el alfil. El peón de f7 puede recapturar en g6.',
  black:'Juegan negras. Calculá 8…cxd4 para capturar la base de la cadena blanca. Si sigue 9.Cxg6, el peón de f7 puede recapturar. Compará qué cambia en el centro y en el flanco de rey.',
  arrows:[
   {from:'f4',to:'g6',side:'w',color:ARROW_COLORS.blue,
    explanation:'El caballo ataca al alfil de g6, defendido por el peón de f7.'},
   {from:'c5',to:'d4',side:'b',color:ARROW_COLORS.red,
    explanation:'Las negras pueden capturar en d4 con el peón de c5.'}
  ]
 }]
]);

export function openingPositionPlan(fen){
 return positionPlans.get(fen.split(' ').slice(0,4).join(' '));
}
