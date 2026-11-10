// Each branch stores an actual chapter and ply so board navigation reuses Game Review.
export function buildOpeningPositionTree(lines, entryMoves) {
 if (!lines.length) return null;
 const first = lines[0].sans;
 let entryPly = 0;
 if (entryMoves) {
  entryPly = entryMoves.length;
 } else {
  while (entryPly < first.length && lines.every(line => line.sans[entryPly] === first[entryPly])) entryPly++;
  if (lines.length === 1) entryPly = Math.min(entryPly, 6);
  entryMoves = first.slice(0, entryPly);
 }
 const makeNode = (ply, san, parent) => ({ply, san, parent, routes:[], children:new Map(), ends:[]});
 const root = makeNode(entryPly, entryMoves.at(-1), null);
 const routes = new Map();
 const alternate = [];
 for (const line of lines) {
  if (!entryMoves.every((san, i) => san === line.sans[i])) {
   alternate.push(line);
   continue;
  }
  let node = root;
  const path = new Map([[entryPly,root]]);
  for (let ply = entryPly; ply <= line.sans.length; ply++) {
   if (ply > entryPly) {
    const san = line.sans[ply-1];
    if (!node.children.has(san)) node.children.set(san, makeNode(ply,san,node));
    node = node.children.get(san);
    path.set(ply,node);
   }
   node.routes.push(line);
  }
  node.ends.push(line);
  routes.set(line.id,path);
 }
 return {root,routes,alternate};
}
