// Dynamic, chunked Word Document (.docx) export utility
// Uses dynamic import() to ensure 'docx' is chunked separately and never loaded on initial page load

interface FitnessExportParams {
  goal: string;
  days: number;
  fitnessLevel: string;
  routine: string;
}

export const exportFitnessPlanDocx = async ({
  goal,
  days,
  fitnessLevel,
  routine
}: FitnessExportParams) => {
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

  const parseTextWithFormatting = (text: string, defaultOptions: any = {}) => {
    const runs: any[] = [];
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);

    parts.forEach((part) => {
      if (!part) return;
      if (part.startsWith('**') && part.endsWith('**')) {
        runs.push(
          new TextRun({
            ...defaultOptions,
            text: part.slice(2, -2),
            bold: true,
          })
        );
      } else if (part.startsWith('*') && part.endsWith('*')) {
        runs.push(
          new TextRun({
            ...defaultOptions,
            text: part.slice(1, -1),
            italics: true,
          })
        );
      } else {
        runs.push(
          new TextRun({
            ...defaultOptions,
            text: part,
          })
        );
      }
    });

    return runs;
  };

  const buildDocxTable = (rows: string[][]) => {
    const tableRowsDocx = rows.map((rowCells, rowIndex) => {
      const isHeader = rowIndex === 0;
      const cellPadding = {
        top: 140,
        bottom: 140,
        left: 180,
        right: 180,
      };

      return new TableRow({
        children: rowCells.map((cellText) => {
          return new TableCell({
            children: [
              new Paragraph({
                children: parseTextWithFormatting(cellText, {
                  color: isHeader ? "FFFFFF" : "334155",
                  size: isHeader ? 20 : 18,
                  bold: isHeader,
                }),
                alignment: AlignmentType.LEFT,
              })
            ],
            shading: {
              fill: isHeader ? "1E3A8A" : (rowIndex % 2 === 0 ? "F8FAFC" : "FFFFFF"),
            },
            margins: cellPadding,
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
              left: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
              right: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
            },
          });
        }),
      });
    });

    return new Table({
      rows: tableRowsDocx,
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      margins: {
        top: 200,
        bottom: 200,
      },
    });
  };

  const children: any[] = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: "PULSEMED CLINICAL WELLNESS",
          color: "0D9488",
          bold: true,
          size: 20,
          font: "Segoe UI"
        })
      ]
    }),
    new Paragraph({
      heading: HeadingLevel.TITLE,
      spacing: { before: 100, after: 200 },
      children: [
        new TextRun({
          text: `Personalized Performance & Workout Protocol`,
          bold: true,
          size: 36,
          color: "1E3A8A",
          font: "Segoe UI"
        })
      ]
    }),
    new Paragraph({
      spacing: { before: 80, after: 300 },
      children: [
        new TextRun({ text: "Primary Goal: ", bold: true, color: "0F172A", size: 22 }),
        new TextRun({ text: `${goal.toUpperCase()}  |  `, color: "334155", size: 22 }),
        new TextRun({ text: "Commitment: ", bold: true, color: "0F172A", size: 22 }),
        new TextRun({ text: `${days} Days / Week  |  `, color: "334155", size: 22 }),
        new TextRun({ text: "Experience: ", bold: true, color: "0F172A", size: 22 }),
        new TextRun({ text: `${fitnessLevel.toUpperCase()}`, color: "334155", size: 22 }),
      ]
    }),
    new Paragraph({
      spacing: { before: 100, after: 300 },
      children: [
        new TextRun({
          text: "_________________________________________________________________________________",
          color: "CBD5E1",
          size: 16
        })
      ]
    })
  ];

  const lines = routine.split('\n');
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

    const isTableLine = line.startsWith('|') && line.endsWith('|');
    if (isTableLine) {
      if (line.includes('---')) continue;
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      tableRows.push(cells);
      inTable = true;
      continue;
    } else {
      if (inTable && tableRows.length > 0) {
        children.push(buildDocxTable(tableRows));
        tableRows = [];
        inTable = false;
      }
    }

    if (line.startsWith('# ')) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
          children: parseTextWithFormatting(line.substring(2).trim(), { color: "1E3A8A", size: 28, bold: true })
        })
      );
    } else if (line.startsWith('## ')) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 320, after: 160 },
          children: parseTextWithFormatting(line.substring(3).trim(), { color: "0D9488", size: 24, bold: true })
        })
      );
    } else if (line.startsWith('### ')) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 240, after: 120 },
          children: parseTextWithFormatting(line.substring(4).trim(), { color: "475569", size: 22, bold: true })
        })
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 100, after: 100 },
          children: parseTextWithFormatting(line.substring(2).trim(), { color: "334155", size: 22 })
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
        properties: {},
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "PulseMed Elite Wellness Program  |  Confidential Training Guide",
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
                    text: "Generated by PulseMed Clinical Analytics Engine  •  Page ",
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
        children: children
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PulseMed_Fitness_Plan_${goal}_${days}Days.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

interface SymptomAssessmentParams {
  age: string;
  gender: string;
  duration: string;
  severity: number;
  selectedSymptoms: string[];
  history: string;
  allergiesMedications: string;
  triggers: string;
  parsed: any;
}

export const exportSymptomAssessmentDocx = async ({
  age,
  gender,
  duration,
  severity,
  selectedSymptoms,
  history,
  allergiesMedications,
  triggers,
  parsed
}: SymptomAssessmentParams) => {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    Table,
    TableRow,
    TableCell
  } = await import('docx');

  const children: any[] = [
    new Paragraph({
      text: "PulsePoint - Comprehensive Clinical Triage Assessment",
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Date Generated: ${new Date().toLocaleString()}`, italics: true })
      ],
      spacing: { after: 200 }
    }),
    new Paragraph({
      text: "Patient Demographic & Symptom Summary",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 }
    }),
    new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "Patient Demographics:" })] }),
            new TableCell({ children: [new Paragraph({ text: `Age: ${age || 'N/A'}, Gender: ${gender}` })] }),
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "Duration & Severity:" })] }),
            new TableCell({ children: [new Paragraph({ text: `${duration} (Self-reported intensity: ${severity}/10)` })] }),
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "Associated Symptoms:" })] }),
            new TableCell({ children: [new Paragraph({ text: selectedSymptoms.join(', ') || 'None selected' })] }),
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "Reported Medical History:" })] }),
            new TableCell({ children: [new Paragraph({ text: history || 'None reported' })] }),
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "Active Medications & Allergies:" })] }),
            new TableCell({ children: [new Paragraph({ text: allergiesMedications || 'None reported' })] }),
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "Context / Potential Triggers:" })] }),
            new TableCell({ children: [new Paragraph({ text: triggers || 'None reported' })] }),
          ]
        }),
      ]
    }),
  ];

  const sectionConfigs = [
    { label: "1. Potential Causes & Pathologies", content: parsed?.causes || "" },
    { label: "2. Evidence-Based Treatment Pathways", content: parsed?.treatments || "" },
    { label: "3. First Aid & Critical Warning Red Flags", content: parsed?.firstaid || "" },
    { label: "4. Preventive Care & Lifestyle Adjustments", content: parsed?.prevention || "" },
    { label: "5. Physician Questions & Verified Clinical Sources", content: parsed?.resources || "" }
  ];

  for (const sc of sectionConfigs) {
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
};
