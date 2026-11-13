/**
 * Competitive Intelligence public tournament provenance registry.
 * The presence of a FIDE ID in a tournament list is evidence of registration/
 * listed participation, NOT automatically a PGN or proof that every round was played.
 * Sources checked 2026-11-13. No private information or analysis.
 */
export const CI_TOURNAMENTS=Object.freeze([
 {id:'JUNCOS-ST-2026',title:'JUNCOS 2026 · Clásico',timeControl:'standard',date:'2026-10',status:'initial-list',url:'https://s2.chess-results.com/tnr1516373.aspx?SNode=S0&lan=21',fideIds:['6507522','6506941','6521541','6520901','6518095','6514219','6560377','6563147','6511430','6529151','6550550','6583822']},
 {id:'JUNCOS-BL-2026',title:'JUNCOS 2026 · Blitz',timeControl:'blitz',date:'2026-10',status:'initial-list',url:'https://s3.chess-results.com/Test/tnr1516388.aspx?lan=1',fideIds:['6507522','6522181','6505945','6550096','6516858','6508200','6512682','6524869','6513697','6513743','6519890','6506941']},
 {id:'UTN-CONARE-2026',title:'II Torneo Universitario UTN–CONARE',timeControl:'rapid',date:'2026-09',status:'initial-list',url:'https://s3.chess-results.com/tnr1498218.aspx?SNode=S0&lan=21',fideIds:['6513743','6508200','6524869','6516858','6522181','6506941','6508014','6520901','6518095','6514219','6560377','6511430','6550959']},
 {id:'EQUIPOS-ST-2026',title:'Campeonato Nacional por Equipos Clásico 2026',timeControl:'standard',date:'2026-05',status:'player-list',url:'https://s2.chess-results.com/tnr1413614.aspx?SNode=S0&art=15&flag=NO&lan=33&turdet=YES',fideIds:['6507522','6505945','6508200','6508332','6516858','6550096','6522181','6521541','6513743','6512682','6560377','6518095']},
 {id:'CLASIF-ABS-2026',title:'Clasificatorio Absoluto FCA 2026–2027',timeControl:'standard',date:'2026-08',status:'published-list',url:'https://s3.chess-results.com/tnr1479494.aspx?SNode=S0&lan=-1210',fideIds:['6505945','6513743','6508200','6524869','6508332','6516858','6513697','6506941']},
 {id:'NACIONAL-ABS-2026',title:'Campeonato Nacional Absoluto 2026',timeControl:'standard',date:'2026-02',status:'published-list',url:'https://s1.chess-results.com/Test/tnrWZ.aspx?lan=9&tno=1341014',fideIds:['6507522','6513743','6508332']},
 {id:'GP3-PRELIM-2026',title:'III Abierto Grand Prix 2026 · Lista preliminar',timeControl:'standard',date:'2026-10',status:'preliminary-list',url:'https://s4.chess-results.com/tnrWZ.aspx?flag=30&lan=1&tno=1513182&turdet=NO',fideIds:['6507522','6513743','6508332','6550096']},
 {id:'OLYMPIAD-OPEN-2026',title:'46.ª Olimpiada de Ajedrez · Samarcanda 2026',timeControl:'standard',date:'2026-09',status:'games-with-scores',url:'https://s4.chess-results.com/tnrWZ.aspx?art=9&fed=CRC&fedb=SEY&flag=30&lan=1&snr=407&tno=1469895&turdet=YES',fideIds:['6507522']}
]);

export const CI_SOURCE_STATUS=Object.freeze({
 'initial-list':'Inscripción / lista inicial',
 'player-list':'Jugador en listado oficial',
 'published-list':'Listado publicado',
 'preliminary-list':'Inscripción preliminar, participación por comprobar',
 'games-with-scores':'Resultados y planillas publicadas'
});
const chessResultsGame=id=>({url:'https://s4.chess-results.com/PartieSuche.aspx?art=36&id='+id,kind:'full-score-link'});
/** Eight individual scored games linked from the official tournament record.
 * Link to score is not proof that PGN bytes were imported to Supabase.
 */
export const CI_OLYMPIAD_CABEZAS_GAMES=Object.freeze([
 {round:1,opponent:'CM Ragul Pillay',color:'b',result:'1',date:'2026-09-16',...chessResultsGame('6624945')},
 {round:2,opponent:'IM Filip Magold',color:'w',result:'0',date:'2026-09-17',...chessResultsGame('6625143')},
 {round:3,opponent:'Yazid Elhayek',color:'w',result:'1',date:'2026-09-18',...chessResultsGame('6625659')},
 {round:4,opponent:'FM Colin Federer',color:'b',result:'½',date:'2026-09-19',...chessResultsGame('6625950')},
 {round:5,opponent:'Nidal Ghanoui',color:'b',result:'1',date:'2026-09-20',...chessResultsGame('6626439')},
 {round:7,opponent:'FM Reinis Paikens',color:'b',result:'0',date:'2026-09-23',...chessResultsGame('6627190')},
 {round:9,opponent:'IM Satria Duta Cahaya',color:'w',result:'0',date:'2026-09-25',...chessResultsGame('6628038')},
 {round:10,opponent:'CM Ifan Rathbone-Jones',color:'b',result:'0',date:'2026-09-26',...chessResultsGame('6634991')}
]);
export const tournamentSourcesFor=fideId=>CI_TOURNAMENTS.filter(event=>event.fideIds.includes(String(fideId||'')));
export const olympiadScoresFor=fideId=>String(fideId)==='6507522'?CI_OLYMPIAD_CABEZAS_GAMES:[];
