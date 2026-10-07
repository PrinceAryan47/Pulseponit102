/**
 * Lazy / Chunked DOCX Export Utilities
 * Dynamically imports the heavy 'docx' library only when the user requests an export,
 * preventing 'docx' from being bundled into initial page loads.
 */

export interface FitnessPlanExportData {
  goal: string;
  days: number;
  fitnessPlanText: string;
}

export interface SymptomAssessmentExportData {
  symptoms: string;
  sections: Array<{ label: string; content: string }>;
}

export async function exportFitnessPlanDocx({ goal, days, fitnessPlanText }: FitnessPlanExportData): Promise<void> {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    Table,
    TableRow,
    TableCell,
    BorderStyle,
    AlignmentType,
    WidthType,
    Header,
    Footer,
    PageNumber
  } = await import('docx');

  // Helper to parse markdown-style bold and italic
  const parseTextWithFormatting = (rawText: string, defaultOptions: any = {}) => {
    const runs: any[] = [];
    const regex = /(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*|[^*]+)/g;
    let match;

    while ((match = regex.exec(rawText)) !== null) {
      const part = match[0];
      if (part.startsWith('***') && part.endsWith('***')) {
        runs.push(new TextRun({
          ...defaultOptions,
          text: part.slice(3, -3),
          bold: true,
          italics: true
        }));
      } else if (part.startsWith('**') && part.endsWith('**')) {
        runs.push(new TextRun({
          ...defaultOptions,
          text: part.slice(2, -2),
          bold: true
        }));
      } else if (part.startsWith('*') && part.endsWith('*')) {
        runs.push(new TextRun({
          ...defaultOptions,
          text: part.slice(1, -1),
          italics: true
        }));
      } else {
        runs.push(new TextRun({
          ...defaultOptions,
          text: part
        }));
      }
    }
    return runs.length > 0 ? runs : [new TextRun({ ...defaultOptions, text: rawText })];
  };

  const buildDocxTable = (rowsData: string[][]) => {
    const tableRows = rowsData.map((rowCells, rowIndex) => {
      const isHeader = rowIndex === 0;
      return new TableRow({
        tableHeader: isHeader,
        children: rowCells.map(cellText => {
          return new TableCell({
            width: {
              size: Math.floor(100 / Math.max(rowCells.length, 1)),
              type: WidthType.PERCENTAGE
            },
            shading: {
              fill: isHeader ? "1E3A8A" : rowIndex % 2 === 1 ? "F8FAFC" : "FFFFFF"
            },
            margins: { top: 120, bottom: 120, left: 140, right: 140 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
              left: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
              right: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" }
            },
            children: [
              new Paragraph({
                alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
                children: parseTextWithFormatting(cellText.trim(), {
                  bold: isHeader,
                  color: isHeader ? "FFFFFF" : "1E293B",
                  size: isHeader ? 20 : 18,
                  font: "Segoe UI"
                })
              })
            ]
          });
        })
      });
    });

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows
    });
  };

  const children: any[] = [];

  // Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 120 },
      children: [
        new TextRun({
          text: `PERSONALIZED FITNESS & WORKOUT REGIMEN`,
          bold: true,
          size: 36,
          color: "1E3A8A",
          font: "Segoe UI"
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 300 },
      children: [
        new TextRun({
          text: `Goal: ${goal.toUpperCase()}  |  Duration: ${days} Days Schedule`,
          bold: true,
          size: 22,
          color: "0284C7",
          font: "Segoe UI"
        })
      ]
    })
  );

  const lines = fitnessPlanText.split('\n');
  let inTable = false;
  let tableRows: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      if (inTable && tableRows.length > 0) {
        children.push(buildDocxTable(tableRows));
        tableRows = [];
        inTable = false;
      }
      continue;
    }

    if (line.startsWith('|') && line.endsWith('|')) {
      if (line.includes('---')) continue;
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      if (cells.length > 0) {
        inTable = true;
        tableRows.push(cells);
        continue;
      }
    } else if (inTable && tableRows.length > 0) {
      children.push(buildDocxTable(tableRows));
      tableRows = [];
      inTable = false;
    }

    if (line.startsWith('# ')) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 120 },
          children: [
            new TextRun({
              text: line.replace('# ', '').trim(),
              bold: true,
              size: 28,
              color: "1E3A8A",
              font: "Segoe UI"
            })
          ]
        })
      );
    } else if (line.startsWith('## ')) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 100 },
          children: [
            new TextRun({
              text: line.replace('## ', '').trim(),
              bold: true,
              size: 24,
              color: "0284C7",
              font: "Segoe UI"
            })
          ]
        })
      );
    } else if (line.startsWith('### ')) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 180, after: 80 },
          children: [
            new TextRun({
              text: line.replace('### ', '').trim(),
              bold: true,
              size: 22,
              color: "334155",
              font: "Segoe UI"
            })
          ]
        })
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const bulletText = line.replace(/^[-*]\s+/, '');
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 60, after: 60 },
          children: parseTextWithFormatting(bulletText, { color: "334155", size: 22 })
        })
      );
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.*)/);
      if (match) {
        children.push(
          new Paragraph({
            spacing: { before: 100, after: 100 },
            children: [
              new TextRun({ text: `${match[1]}. `, bold: true, color: "1E3A8A", size: 22, font: "Segoe UI" }),
              ...parseTextWithFormatting(match[2].trim(), { color: "334155", size: 22 })
            ]
          })
        );
      }
    } else {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 140 },
          children: parseTextWithFormatting(line, { color: "1E293B", size: 22 })
        })
      );
    }
  }

  if (inTable && tableRows.length > 0) {
    children.push(buildDocxTable(tableRows));
  }

  const doc = new Document({
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "PulsePoint Elite Wellness Program  |  Training Regimen Guide",
                    size: 16,
                    color: "94A3B8",
                    font: "Segoe UI"
                  })
                ]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "Generated by PulsePoint Clinical Analytics  •  Page ",
                    size: 16,
                    color: "94A3B8",
                    font: "Segoe UI"
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: "94A3B8",
                    font: "Segoe UI"
                  }),
                  new TextRun({
                    text: " of ",
                    size: 16,
                    color: "94A3B8",
                    font: "Segoe UI"
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: "94A3B8",
                    font: "Segoe UI"
                  })
                ]
              })
            ]
          })
        },
        children
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PulsePoint_Fitness_Plan_${goal}_${days}Days.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportClinicalAssessmentDocx({ symptoms, sections }: SymptomAssessmentExportData): Promise<void> {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType
  } = await import('docx');

  const children: any[] = [
    new Paragraph({
      text: "PulsePoint Clinical Symptom Assessment Report",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Generated: ", bold: true }),
        new TextRun({ text: new Date().toLocaleDateString(undefined, { dateStyle: 'full' }) })
      ],
      spacing: { after: 120 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Patient Reported Symptoms: ", bold: true }),
        new TextRun({ text: symptoms })
      ],
      spacing: { after: 300 }
    })
  ];

  for (const sc of sections) {
    if (!sc.content.trim()) continue;
    children.push(
      new Paragraph({
        text: sc.label,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 120 }
      })
    );
    const lines = sc.content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        children.push(
          new Paragraph({
            text: trimmed.replace(/^[-*]\s+/, ''),
            bullet: { level: 0 },
            spacing: { after: 60 }
          })
        );
      } else if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
        children.push(
          new Paragraph({
            text: trimmed.replace(/^#{2,3}\s+/, ''),
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 140, after: 60 }
          })
        );
      } else {
        children.push(
          new Paragraph({
            text: trimmed,
            spacing: { after: 80 }
          })
        );
      }
    }
  }

  // Educational Guidance Disclaimer
  children.push(
    new Paragraph({
      text: "\nEducational Guidance Disclaimer:",
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 300, after: 60 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "This clinical assessment is generated for educational and triage guidance purposes and does not constitute a formal in-person medical diagnosis. Always consult a qualified medical professional for acute, severe, or persistent symptoms.",
          italics: true
        })
      ],
      spacing: { after: 200 }
    })
  );

  const docObj = new Document({
    sections: [{ children }]
  });

  const blob = await Packer.toBlob(docObj);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PulsePoint_Clinical_Assessment_${new Date().toISOString().slice(0, 10)}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
