try{require("next/dist/compiled/regenerator-runtime/runtime.js")}catch{}
const fs=require("fs"), fontkit=require("@pdf-lib/fontkit").default||require("@pdf-lib/fontkit");
const {PDFDocument,rgb}=require("pdf-lib");
(async()=>{
  const pdf=await PDFDocument.create(); pdf.registerFontkit(fontkit);
  const page=pdf.addPage([300,150]);
  const fontBytes=fs.readFileSync("public/fonts/pdf/Poppins-Regular.ttf");
  const embedded=await pdf.embedFont(fontBytes);
  const fkFont=fontkit.create(fontBytes);
  // normal text
  page.drawText("Hello", {x:40,y:100,size:24,font:embedded,color:rgb(0,0,0)});
  // shaped path
  const run=fkFont.layout("Hello");
  const size=24, scale=size/fkFont.unitsPerEm;
  let x=40, y=60;
  for(let i=0;i<run.glyphs.length;i++){
    const g=run.glyphs[i], pos=run.positions[i];
    const path=g.path; if(path){ const svg=path.toSVG(); if(svg) page.drawSvgPath(svg,{x:x+(pos.xOffset||0)*scale,y:y+(pos.yOffset||0)*scale,scale,color:rgb(0,0.4,0)}); }
    x+=(pos.xAdvance||0)*scale;
  }
  fs.writeFileSync("tmp-compare.pdf", await pdf.save());
  console.log("ok");
})();
