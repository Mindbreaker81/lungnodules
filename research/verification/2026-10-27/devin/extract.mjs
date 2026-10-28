import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
const [,, pdfPath, outPath] = process.argv;
import fs from 'fs';
const doc = await getDocument({ url: pdfPath, isEvalSupported: false }).promise;
let out = [];
for (let i = 1; i <= doc.numPages; i++) {
  const page = await doc.getPage(i);
  const tc = await page.getTextContent();
  out.push(`\n=== PAGE ${i} ===\n` + tc.items.map(it => it.str).join(' '));
}
fs.writeFileSync(outPath, out.join('\n'));
console.log(pdfPath, '->', doc.numPages, 'pages');
