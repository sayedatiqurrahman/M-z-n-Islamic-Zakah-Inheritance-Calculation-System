try{require("next/dist/compiled/regenerator-runtime/runtime.js")}catch{}
const fs=require("fs"), fontkit=require("@pdf-lib/fontkit").default||require("@pdf-lib/fontkit");
const fkFont=fontkit.create(fs.readFileSync("public/fonts/pdf/Poppins-Regular.ttf"));
const run=fkFont.layout("H");
console.log(fkFont.unitsPerEm);
const g=run.glyphs[0], p=run.positions[0];
console.log(g.id, g.name, p);
const svg=g.path.toSVG();
console.log(svg.slice(0,300));
