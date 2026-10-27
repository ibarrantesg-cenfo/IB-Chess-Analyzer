import test from 'node:test';
import assert from 'node:assert/strict';
import {gameMetrics,tournamentStats} from './performance.js';
const game=(white,black,result,welo,belo,event='Torneo A')=>({headers:{White:white,Black:black,Result:result,WhiteElo:String(welo||''),BlackElo:String(belo||''),Event:event,Round:'1'},moves:[{san:'e4'},{san:'e5'},{san:'Nf3'},{san:'Nc6'}]});
test('game index reflects CP loss and is complete only when every move is evaluated',()=>{
 const g=game('Alumno','Rival','1-0',1800,1600);
 const r=gameMetrics(g,[{loss:0,type:'best'},{loss:40,type:'good'},{loss:120,type:'mistake'},{loss:0,type:'best'}]);
 assert.equal(r.w.complete,true);assert.equal(r.b.complete,true);
 assert.equal(r.w.count,2);assert.ok(r.w.quality<100);assert.equal(r.w.counts.mistake,1);
 assert.equal(gameMetrics(g,[{loss:0,type:'best'}]).w.complete,false);
});
test('opponent-adjusted performance equals opponent rating at 50 percent',()=>{
 const g=[game('Alumno','A','1-0',1500,1800),game('B','Alumno','1-0',1800,1500)];
 const result=tournamentStats(g,'Alumno','Torneo A',new Map());
 assert.equal(result.rated,2);assert.equal(result.scored,2);assert.equal(result.points,1);assert.equal(result.performance,1800);
});
test('perfect and zero scores do not manufacture finite Elo performance',()=>{
 const win=tournamentStats([game('Alumno','R','1-0',1600,2000)],'Alumno','Torneo A',new Map());
 const loss=tournamentStats([game('Alumno','R','0-1',1600,2000)],'Alumno','Torneo A',new Map());
 assert.equal(win.performance,null);assert.equal(loss.performance,null);assert.ok(win.allWon);assert.ok(loss.allLost);
});
test('unrated opponents and missing results do not affect TPR',()=>{
 const g=[game('Alumno','R','1-0',1800,0),game('Alumno','S','*',1800,1950)];
 const t=tournamentStats(g,'Alumno','Torneo A',new Map());
 assert.equal(t.rated,0);assert.equal(t.scored,1);assert.equal(t.points,1);assert.equal(t.performance,null);
});
test('tournament only includes selected player and event',()=>{
 const g=[game('Alumno','R','1-0',1800,1900),game('Otro','R','0-1',1800,1900),game('Alumno','R','0-1',1800,1900,'Otro evento')];
 assert.equal(tournamentStats(g,'Alumno','Torneo A',new Map()).rows.length,1);
});
