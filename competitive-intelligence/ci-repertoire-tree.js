import {Chess} from 'chess.js';
import {createCIGameIndex,filterCIGames} from './ci-game-explorer.js';

const root=()=>({move:null,ply:0,total:0,completed:0,wins:0,draws:0,losses:0,unknown:0,children:new Map()});
const gameOutcome=(result,color)=>{
 if(result==='1/2-1/2')return 'draw';
 if(result==='1-0')return color==='w'?'wins':'losses';
 if(result==='0-1')return color==='b'?'wins':'losses';
 return 'unknown';
};
const include=(node,outcome)=>{
 node.total++;
 if(outcome==='unknown'){node.unknown++;return;}
 node.completed++;node[outcome]++;
};
/**
 * Tree of actual legal move sequences. Each branch count uses only the games
 * that passed the same dossier filters. No engine / inferred ECO / fake PGN.
 * Both colors' moves appear, so a black repertoire starts at opponent's move.
 */
export function buildCIRepertoireTree(records=[],{color='w',filters={},maxPly=24}={}){
 const index=filterCIGames(createCIGameIndex(records),{...filters,color});
 const tree=root();
 let rejected=0;
 for(const meta of index){
  try{
   const chess=new Chess();
   chess.loadPgn(meta.record.pgn,{strict:false});
   const history=chess.history();
   if(!history.length)throw Error('No moves');
   const outcome=gameOutcome(meta.result,color);
   let node=tree;
   include(node,outcome);
   for(const move of history.slice(0,maxPly)){
    if(!node.children.has(move))node.children.set(move,{...root(),move,ply:node.ply+1});
    node=node.children.get(move);include(node,outcome);
   }
  }catch{rejected++;}
 }
 return {tree,sample:tree.total,color,rejected,maxPly};
}
export function ciTreeNodeAt(tree,moves=[]){
 let node=tree;
 for(const m of moves){
  node=node?.children.get(m);
  if(!node)return null;
 }
 return node;
}
export function ciTreeChoices(node){
 if(!node)return [];
 return [...node.children.values()].sort((a,b)=>b.total-a.total||a.move.localeCompare(b.move)).map(child=>({
  move:child.move,ply:child.ply,count:child.total,share:node.total?child.total/node.total:0,
  wins:child.wins,draws:child.draws,losses:child.losses,unknown:child.unknown,completed:child.completed
 }));
}
export function ciTreeMoveLabel(move,ply){
 const number=Math.ceil(ply/2);
 return ply%2?number+'. '+move:number+'... '+move;
}
