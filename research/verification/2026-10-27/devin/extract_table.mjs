import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
const doc = await getDocument({ url: '/home/erosales/proyectos/lungnodules/research/pdf/McWilliams - Probability of Cancer in Pulmonary Nodules Detected on First Screening CT.pdf', isEvalSupported: false }).promise;
for (let i = 1; i <= doc.numPages; i++) {
  const page = await doc.getPage(i);
  const tc = await page.getTextContent();
  const joined = tc.items.map(x=>x.str).join(' ');
  if (/Model 1a|Model 2a|constant/i.test(joined)) {
    console.log(`===== PAGE ${i} =====`);
    // group by y (transform[5]), sort by x (transform[4])
    const rows = {};
    for (const it of tc.items) {
      if (!it.str.trim()) continue;
      const y = Math.round(it.transform[5]);
      (rows[y] = rows[y] || []).push([it.transform[4], it.str]);
    }
    for (const y of Object.keys(rows).sort((a,b)=>b-a)) {
      const cells = rows[y].sort((a,b)=>a[0]-b[0]);
      console.log(y.padStart(5), '|', cells.map(c=>`${Math.round(c[0])}:${c[1]}`).join('  '));
    }
  }
}
