import { Chess } from 'chess.js';
import { ARROW_COLORS } from './board-arrows.js';

// Original educational summaries. Plans describe a family, not engine recommendations.
// Arrow candidates are shown only when legal for that side in the displayed position.
const profile=(white,black,w=[],b=[])=>({white,black,candidates:{w,b}});
const PLANS={
 'Najdorf':profile('Elegí entre presión central con f4 y ataque con f3, Dd2 y g4. Confirmá dónde quedará tu rey antes de avanzar los peones.','Completá el desarrollo y compará …e5 con …e6. El avance …b5 gana espacio; …d5 requiere calcular la presión sobre e4 y d6.',['f2f4','g2g4','g4g5'],['b7b5','b5b4','d6d5']),
 'Dragón acelerado':profile('Con c4, reforzá el control de d5; sin ese peón, desarrollá las piezas vigilando …d5. Evitá cambiar piezas que sostienen el bloqueo sin compensación.','Usá la diagonal del alfil de g7 y prepará …d5. Contra el Maróczy, buscá cambios y rupturas sin crear una debilidad permanente en d6.',['c2c4','f2f3'],['d7d5','d6d5','b7b5']),
 'Dragón':profile('Con Ae3, f3 y Dd2 podés preparar enroque largo y h4–h5; con Ae2 y enroque corto, priorizá el centro. Elegí el esquema según la seguridad del rey.','Activá el alfil de g7 y presioná por la columna c. Compará …d5 con el contrajuego de flanco antes de seguir empujando peones.',['h2h4','h4h5','f2f4'],['d6d5','b7b5']),
 'Sveshnikov':profile('Disputá d5 y valorá el cambio del caballo de f6, que suele defender esa casilla. Compará ese control con la actividad que cedés a las negras.','Aprovechá espacio y actividad para compensar d5. Prepará …f5 o juego con …b5–b4 sin perder el control táctico del centro.',['c2c4','a2a4'],['f7f5','b5b4']),
 'Taimanov':profile('Completá el desarrollo y elegí entre fianchetto o Ae3 con f3. Antes de atacar, comprobá la presión de …Dc7 sobre e5 y c3.','Desarrollá con flexibilidad. Compará …d5 con …b5; la dama en c7 y el caballo de c6 deben coordinarse antes de abrir el centro.',['f2f3','g2g3'],['d7d5','b7b5']),
 'Kan':profile('Ganancias de espacio con c4 pueden limitar …d5; desarrollá sin dejar e4 indefenso frente a …Ab7 y …Cf6.','Coordiná el fianchetto de dama con …Cf6. Prepará …d5 o …b5 sin atrasar demasiado el desarrollo del rey.',['c2c4','f2f3'],['d7d5','b7b5','b5b4']),
 'Scheveningen':profile('Compará el ataque Keres con g4 frente a un desarrollo más tranquilo. Sostené e4 y revisá las rupturas centrales antes de atacar.','La cadena e6–d6 necesita actividad. Prepará …d5 o …e5 y asegurá el rey antes de iniciar contrajuego en el flanco de dama.',['g2g4','f2f4'],['d6d5','e6e5','b7b5']),
 'Siciliana':profile('Desarrollá con rapidez y disputá d5. El ataque de flanco funciona mejor cuando el centro y la seguridad del rey están controlados.','Buscá actividad en la columna c y una ruptura central …d5. Elegí …e5 o …e6 según la estructura y las piezas desarrolladas.',['f2f4','f2f3'],['d6d5','d7d5','b7b5']),
 'Francesa':profile('Con centro cerrado, sostené d4 y ganá espacio en el flanco de rey. Si se abre el centro, priorizá actividad y seguridad del rey sobre avances automáticos.','Atacá la base d4 con …c5 y compará …f6 contra e5. Buscá una función útil para el alfil de c8 antes de fijar más peones.',['f2f4','f4f5'],['c7c5','c5c4','f7f6']),
 'Caro-Kann':profile('En el Avance, usá el espacio sin descuidar d4. En Panov, la actividad y la ruptura d5 pueden compensar un posible peón aislado.','Desarrollá el alfil de c8 cuando el esquema lo permita. Atacá d4 con …c5 y calculá …e5 antes de aceptar una posición pasiva.',['c2c4','d4d5','h2h4'],['c6c5','c7c5','e6e5']),
 'Catalana':profile('Coordiná el alfil de g2 con la presión central y la columna c. Si las negras capturan en c4, compará recuperar de inmediato con completar el desarrollo.','Disputá el centro con …c5 y desarrollá el flanco de dama. Si retenés el peón c4, calculá el coste en tiempos y seguridad.',['e2e4','a2a4'],['c7c5','b7b5']),
 'Española':profile('Sostené e4 y prepará d4. En centros cerrados, reagrupá los caballos y vigilá el momento de abrir el flanco de rey.','Completá el desarrollo y disputá d4. Compará …d5 con el juego de espacio en el flanco de dama antes de fijar la estructura.',['d2d4','a2a4','d3d4'],['d6d5','d7d5','c7c5']),
 'Berlín':profile('Si cambiás damas, buscá actividad del rey y presión sobre la estructura negra. Conservá las piezas que facilitan crear una segunda debilidad.','Coordiná la pareja de alfiles y activá el rey cuando sea seguro. Prepará rupturas centrales sin exponer los peones.',['d2d4','h2h3'],['c7c5','f7f6']),
 'Italiana':profile('Coordiná c3 y d4 para disputar el centro. Si elegís d3, completá el desarrollo y prepará la ruptura sin perder e4.','Desarrollá y enrocá a tiempo. Compará …d5 directo con prepararlo mediante …d6 y mejorá las piezas antes de atacar.',['c2c3','d2d4','d3d4'],['d7d5','d6d5']),
 'Escocesa':profile('Aprovechá la apertura del centro para desarrollar con tiempos. Calculá las amenazas sobre e4 y c2 antes de perseguir piezas.','Disputá la iniciativa con desarrollo activo. Los golpes …d5 y la presión sobre e4 pueden equilibrar el espacio blanco.',['c2c3','c2c4'],['d7d5','d6d5']),
 'Cuatro Caballos':profile('Completá el desarrollo y elegí d4 o d3 según la tensión en e4. Evitá cambios que ayuden a desarrollar al rival sin una idea concreta.','Mantené la coordinación de los caballos y calculá …d5. La simetría exige revisar las amenazas concretas antes de copiar jugadas.',['d2d4','d2d3'],['d7d5','d6d5']),
 'Inglesa':profile('Disputá d5 con el peón c4 y las piezas. Compará el fianchetto con la expansión b4, atendiendo a las respuestas centrales negras.','Disputá el centro con …d5 o …e5 según el esquema. Evitá dejar un puesto avanzado permanente en d5 sin actividad a cambio.',['d2d4','b2b4','g2g3'],['d7d5','e7e5']),
 'Réti':profile('Usá presión de piezas contra el centro antes de fijarlo. Elegí entre d4, g3 o b3 según la respuesta negra y las transposiciones disponibles.','Ocupá el centro con apoyo y prepará …c5. Conservá flexibilidad para responder al fianchetto y al cambio cxd5.',['d2d4','g2g3','b2b3'],['c7c5','e7e5']),
 'Londres':profile('Coordiná Af4, e3 y el desarrollo del flanco de rey. Prepará e4 o Ce5; contra …g6, compará el ataque de flanco con el juego central.','Disputá d4 con …c5 y vigilá b2 si sale la dama. Evitá permitir e4 sin presión sobre el centro blanco.',['e3e4','c2c4','h2h4'],['c7c5','e7e5','e6e5']),
 'Colle':profile('Prepará e4 con Ad3, Cbd2 y desarrollo del rey. Si …g6 controla e4, compará c4 con una preparación adicional antes de romper.','Presioná d4 con …c5 y desarrollá sin facilitar e4. Elegí los cambios centrales según la actividad de los alfiles.',['e3e4','c2c4'],['c7c5','e7e5']),
 'Trompowsky':profile('Decidí si cambiar en f6 según la estructura resultante. Sostené el centro y evitá perder tiempos con el alfil sin una ganancia concreta.','Ganancias de tiempo sobre el alfil deben acompañarse de control central. Compará …c5 con …d5 antes de avanzar peones del enroque.',['e2e4','e3e4','c2c4'],['c7c5','d7d5']),
 'Ataque Indio':profile('Coordiná Cf3, g3, Ag2 y e4. El avance e5 puede ganar espacio, pero requiere sostener el centro y revisar contragolpes.','Disputá el centro con …c5 o …e5. No permitás un ataque gratuito sobre el rey si podés abrir líneas en el centro.',['e2e4','e4e5','h2h4'],['c7c5','e7e5']),
 'Grünfeld':profile('Sostené el centro móvil y desarrollá antes de avanzarlo. Compará d5 con mantener la tensión y revisá siempre la presión sobre d4.','Atacá el centro con …c5 y el alfil de g7. La presión sobre d4 debe compensar el espacio cedido.',['d4d5','e4e5'],['c7c5','e7e5']),
 'India de Rey':profile('Aprovechá el espacio central. En centros cerrados, prepará juego en el flanco de dama; si el centro sigue abierto, priorizá desarrollo.','Compará …e5 y …c5. Con centro cerrado, …f5 puede iniciar contrajuego, pero antes calculá la seguridad del rey y las rupturas blancas.',['c4c5','b2b4','d4d5'],['e7e5','c7c5','f7f5']),
 'Nimzoindia':profile('Elegí cómo resolver la clavada en c3. La pareja de alfiles y e4 pueden compensar daños de estructura, siempre que las piezas salgan a tiempo.','Presioná e4 y d4, y decidí cuándo cambiar en c3. Compará …c5 y …d5 con la estructura que dejará la recaptura blanca.',['e2e4','a2a3'],['c7c5','d7d5']),
 'Semieslava':profile('Desarrollá y vigilá la tensión en c4. Si elegís e4 o g4, calculá las capturas centrales y la seguridad del rey antes de avanzar.','Prepará …c5 o …e5 para liberar la posición. Resolvé el desarrollo del alfil de c8 y calculá cuándo capturar en c4.',['e3e4','e2e4'],['c6c5','e6e5']),
 'Eslava':profile('Sostené el centro y calculá e4. Si las negras capturan en c4, compará recuperar con desarrollo y la expansión a4.','Desarrollá el alfil de c8 antes de encerrarlo cuando sea posible. Compará …c5 y …e5 para disputar el centro.',['e2e4','a2a4'],['c6c5','e7e5','e6e5']),
 'Ragozin':profile('Resolvé la presión sobre c3 y d4 sin perder desarrollo. Calculá cuándo a3 o e4 obligan al alfil negro a decidir.','Combiná la clavada en c3 con presión central. Compará …c5 con simplificar en c3 según la recaptura blanca.',['a2a3','e2e4'],['c7c5']),
 'Gambito de Dama':profile('Completá el desarrollo y elegí entre presión central, e4 o juego de minorías cuando exista una estructura Carlsbad. La estructura decide el plan.','Disputá el centro y buscá la liberación con …c5 o …e5 cuando la estructura lo permita. Coordiná el alfil de c8 antes de aceptar una posición restringida.',['e3e4','e2e4','b2b4'],['c7c5','e6e5']),
 'Escandinava':profile('Desarrollá con tiempos contra la dama y ocupá el centro. Evitá perseguirla si con eso retrasás la seguridad del rey.','Elegí una retirada segura para la dama y completá el desarrollo. Compará …c5 o …e5 para disputar d4.',['d2d4','c2c4'],['c6c5','c7c5','e6e5']),
 'Pirc':profile('Usá el centro para ganar espacio sin dejarlo desprotegido. Compará e5 o f4 con desarrollar y asegurar el rey.','Presioná el centro con …c5 o …e5. El alfil de g7 necesita líneas y el rey seguridad antes de permitir un ataque de peones.',['e4e5','f2f4'],['c7c5','e7e5']),
 'Benoni':profile('Usá la mayoría central para preparar e5 y restringí …b5. Mejorá las piezas antes de abrir el centro.','Buscá actividad por la columna e y expansión con …b5. Calculá el avance e5 blanco antes de apartar piezas del centro.',['e4e5','a2a4'],['b7b5','b5b4']),
 'Benko':profile('Devolvé el peón si facilita desarrollo y seguridad. Neutralizá la presión sobre a y b antes de buscar un avance central.','Coordiná torres y alfil de g7 sobre el flanco de dama. La actividad duradera debe justificar el peón entregado.',['e2e4','e4e5'],['c5c4','f7f5']),
 'Holandesa':profile('Presioná el centro y vigilá e5. Compará d5 con desarrollar el fianchetto y restringir el ataque negro.','Prepará …e5 en el Leningrado y controlá e4. Cualquier ataque de flanco exige comprobar la seguridad del rey.',['d4d5','e2e4'],['e7e5','e6e5']),
 'Alapin':profile('Sostené d4 y completá el desarrollo. Si queda un peón aislado, buscá actividad y calculá d5 antes de cambiar piezas.','Atacá el centro antes de que se consolide. Compará …d5 con presión sobre e4 y evitá perder tiempos con la dama.',['d2d4','d4d5'],['d7d5']),
 'Vienesa':profile('Apoyá el centro y terminá el desarrollo antes de atacar. El avance f4 abre líneas cerca de tu rey y requiere cálculo.','Reaccioná en el centro con …d5 cuando sea posible. Buscá actividad de piezas antes de intentar conservar material.',['d2d4','f4f5'],['d7d5']),
 'Rossolimo':profile('Elegí entre cambiar en c6 y conservar el alfil según la estructura. Prepará el centro y no regalés tiempos persiguiendo el caballo.','Desarrollá y prepará …d5. Si se dobla el peón c, aprovechá las columnas y la pareja de alfiles.',['c2c3','d2d4'],['d7d5','d6d5']),
 'Petrov':profile('Desarrollá y disputá el centro con d4. La simetría hace valioso mejorar las piezas antes de buscar una ruptura.','Coordiná el desarrollo y sostené e4 cuando corresponda. Compará …d5 con simplificar sin perder actividad.',['d2d4','c2c4'],['d7d5'])
};
const fallback=profile('Completá el desarrollo, protegé el rey e identificá la ruptura central de esta posición antes de avanzar peones.','Disputá el centro, activá la pieza menos desarrollada y comprobá las amenazas antes de cambiar la estructura.');
export function openingPlans(draft){
 const family=String(draft.family||'');
 const key=Object.keys(PLANS).find(key=>family.includes(key));
 return {...(PLANS[key]||fallback),family,scope:key?'family':'general'};
}
export function planReferenceArrows(fen,plan){
 const result=[];
 for(const color of ['w','b']){
  const fields=fen.split(' ');if(fields[1]!==color){fields[1]=color;fields[3]='-';}
  let chess;try{chess=new Chess(fields.join(' '));}catch{continue;}
  // Do not suggest strategic advances for a side that must answer check.
  if(chess.isCheck())continue;
  const legal=chess.moves({verbose:true});
  for(const candidate of plan.candidates[color]){
   const move=legal.find(m=>m.from+m.to===candidate&&!m.captured);
   if(!move)continue;
   result.push({from:move.from,to:move.to,color:color==='w'?ARROW_COLORS.blue:ARROW_COLORS.red,side:color,san:move.san});
   if(result.filter(a=>a.side===color).length===2)break;
  }
 }
 return result;
}
