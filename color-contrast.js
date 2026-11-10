// sRGB relative luminance; also used for custom board colors, independently of UI theme.
export function luminance(hex){
 const values=hex.replace('#','').match(/.{2}/g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
 return .2126*values[0]+.7152*values[1]+.0722*values[2];
}
export function contrastRatio(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
export function coordinateInk(background){return contrastRatio(background,'#000000')>=contrastRatio(background,'#ffffff')?'#000000':'#ffffff';}
export function pieceSetForStyle(style){return style==='classic'?'cburnett':['chessnut','fantasy','spatial','celtic','rhosgfx','kiwen-suwi','totoy','papercut','cburnett','merida'].includes(style)?style:null;}
