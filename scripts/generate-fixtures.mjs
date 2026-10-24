// Generates the document fixtures used by unit and E2E tests.
// Run: node scripts/generate-fixtures.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import JSZip from "jszip";
import { PDFDocument, StandardFonts } from "pdf-lib";

const OUT = join(import.meta.dirname, "..", "tests", "fixtures");
mkdirSync(OUT, { recursive: true });

async function pdf(pages, fileName, { scattered = false } = {}) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const lines of pages) {
    const page = doc.addPage([595, 842]);
    lines.forEach((line, i) => {
      const x = scattered ? 40 + ((i * 137) % 300) : 50;
      const y = scattered ? 800 - ((i * 211) % 740) : 790 - i * 18;
      page.drawText(line, { x, y, size: scattered ? 9 + (i % 4) * 3 : 11, font });
    });
  }
  writeFileSync(join(OUT, fileName), await doc.save());
}

async function docx(paragraphs, fileName) {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
  );
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
  );
  const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
${paragraphs.map((p) => `<w:p><w:r><w:t xml:space="preserve">${escape(p)}</w:t></w:r></w:p>`).join("\n")}
</w:body></w:document>`,
  );
  writeFileSync(join(OUT, fileName), await zip.generateAsync({ type: "nodebuffer" }));
}

// 1. Short proposal (PDF)
await pdf(
  [
    [
      "Proposal: Brand Refresh for Acme Coffee Co.",
      "Prepared by Northwind Studio for Dana Lee, Marketing Director",
      "",
      "Deliverables: new logo suite, brand guidelines, 6 social media templates.",
      "We will need: current logo files, brand fonts, and access to the Instagram account.",
      "Kickoff: November 10, 2026. Final delivery: December 15, 2026.",
      "Approvals: Dana Lee signs off on the moodboard before design begins.",
    ],
  ],
  "short-proposal.pdf",
);

// 2. PDF with unclear structure: scattered fragments over two pages, odd sizes
await pdf(
  [
    [
      "need FONTS??",
      "website redesign - phase 2",
      "page 3 of ?",
      "Jordan to send hosting login (NOT password - invite)",
      "colors: see old deck",
      "launch maybe Q1",
      "photos from shoot - dropbox?",
    ],
    ["notes cont.", "approve sitemap", "GA4 access", "copy from client"],
  ],
  "unclear-structure.pdf",
  { scattered: true },
);

// 3. Scanned-style PDF: graphics only, no text layer
{
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  page.drawRectangle({ x: 50, y: 50, width: 495, height: 742, borderWidth: 2 });
  writeFileSync(join(OUT, "scanned-no-text.pdf"), await doc.save());
}

// 4. Project brief (DOCX)
await docx(
  [
    "Project Brief — Launch Video for Globex Fitness App",
    "Client: Globex Inc. Main contact: Priya Shah (priya@globex.example).",
    "Deliverables: one 60-second launch video, three 15-second cutdowns for Reels/TikTok.",
    "Client to provide: app screen recordings, logo pack (SVG), brand music license, approved script.",
    "Access needed: shared Google Drive folder with raw footage; YouTube channel manager invite.",
    "Deadline: launch on January 20, 2027.",
  ],
  "project-brief.docx",
);

// 5. Messy discovery-call transcript with no clear deadline (TXT)
writeFileSync(
  join(OUT, "discovery-call.txt"),
  `[00:00:03] Alex (Studio): ok so we're recording, cool
[00:00:07] Sam (Client): yeah hi, sorry, train was late um
[00:00:15] Alex: no worries. so the website — you said shopify right?
[00:00:19] Sam: shopify yes. well. my cousin set it up, I think I have the login somewhere
[00:00:31] Alex: perfect, don't send the password, just add us as a collaborator, I'll send instructions
[00:00:40] Sam: ok. and the logo, we have like a png? maybe the designer has the AI file
[00:01:02] Alex: we'd love the vector if you can find it. also product photos
[00:01:10] Sam: photos are... mostly on my phone haha
[00:01:15] Alex: that's fine. who signs off on designs?
[00:01:19] Sam: me and my business partner Jo. Jo is picky about colors
[00:01:30] Alex: noted. any timeline?
[00:01:33] Sam: honestly whenever, no rush, maybe before summer? we'll see
`,
);

// 6. Long email thread (TXT, ~40k chars)
{
  const parts = [];
  for (let i = 1; i <= 60; i++) {
    parts.push(`From: ${i % 2 ? "Maria Gomez <maria@bluebird.example>" : "Ben (Studio) <ben@northwind.example>"}
Date: ${(i % 28) + 1} Oct 2026
Subject: RE: Bluebird Bakery social campaign (${i})

${i % 2 ? "Hi Ben," : "Hi Maria,"}
${
  i === 7
    ? "Attaching nothing yet — we still need to find the brand guidelines PDF. Also we approved the content calendar, but the owner wants to review captions."
    : i === 23
      ? "Quick note: please launch the campaign on 1 December 2026. You'll need admin access to our Facebook page; I'll send an invite."
      : "Following up on the points below. Let me know if you need anything else from our side. ".repeat(6)
}
Thanks,
${i % 2 ? "Maria" : "Ben"}

> ${"Earlier message quoted text. ".repeat(4)}
`);
  }
  writeFileSync(join(OUT, "long-email-thread.txt"), parts.join("\n"));
}

// 7. Windows-1252 encoded text (curly quotes, euro sign)
writeFileSync(
  join(OUT, "windows-1252.txt"),
  Buffer.from([
    ...Buffer.from("Budget: "),
    0x80, // €
    ...Buffer.from("5,000 for the "),
    0x93, // “
    ...Buffer.from("Summer Launch"),
    0x94, // ”
    ...Buffer.from(" campaign. Client will send logo files and approve the storyboard."),
  ]),
);

// --- Malicious / invalid uploads ------------------------------------------
// 8. Windows executable renamed to .pdf (MZ header + PE-like junk)
{
  const bytes = Buffer.alloc(4096, 0);
  bytes.write("MZ", 0, "latin1");
  bytes.write("This program cannot be run in DOS mode.", 78, "latin1");
  bytes.write("PE\0\0", 128, "latin1");
  writeFileSync(join(OUT, "malicious-renamed.pdf"), bytes);
  writeFileSync(join(OUT, "malicious-renamed.txt"), bytes);
}

// 9. A ZIP that is not a Word document, renamed to .docx
{
  const zip = new JSZip();
  zip.file("payload.sh", "#!/bin/sh\necho pwned\n");
  writeFileSync(join(OUT, "not-a-docx.docx"), await zip.generateAsync({ type: "nodebuffer" }));
}

// 10. HTML/script disguised as a PDF
writeFileSync(join(OUT, "script-as.pdf"), "<html><script>alert('xss')</script></html>");

console.log(`Fixtures written to ${OUT}`);
