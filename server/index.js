require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const OpenAI = require("openai");
// const Anthropic = require('@anthropic-ai/sdk');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Set up OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
});

// Configure Multer for file uploads (store in memory for processing)
const upload = multer({ storage: multer.memoryStorage() });

// Ensure temp directory exists
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Helper to extract text from buffer
async function extractText(buffer, mimetype, originalname) {
  if (mimetype === 'application/pdf') {
    const data = await pdfParse(buffer);
    return data.text;
  } else if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    originalname.endsWith('.docx')
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } else if (mimetype === 'text/plain' || originalname.endsWith('.txt')) {
    return buffer.toString('utf-8');
  }
  throw new Error('Unsupported file format. Please upload .docx, .pdf, or .txt');
}

app.post('/api/format', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { instruction } = req.body;

    // 1. Extract raw text
    const rawText = await extractText(req.file.buffer, req.file.mimetype, req.file.originalname);

    if (!rawText || rawText.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract text from the document, or document is empty.' });
    }

    // 2. Build Claude API prompt
    const systemPrompt = `You are a professional document formatter. Analyze the provided raw document text and return ONLY a JSON object (no markdown, no explanation) with this structure: { "docType": "...", "title": "...", "sections": [] }. docType must be one of: resume, report, assignment, offer_letter, general. Each section object has: type (header | heading | paragraph | list | table), content or items, level (1-3 for headings), ordered (true/false for lists), align (left | center | right). Apply correct formatting logic: use bullet lists for skills and responsibilities, numbered lists for steps or procedures, centered alignment for headers and titles, heading levels based on content hierarchy. If the user provides instructions, follow them first and override defaults.`;

    let userMessage = `Raw Document Text:\n${rawText}\n`;
    if (instruction && instruction.trim() !== '') {
      userMessage += `\nUser Instructions:\n${instruction}`;
    }

    // 3. Call OpenAI API
    const msg = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 4096,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]
    });

    let jsonResponseText = msg.choices[0].message.content;

    // Clean up potential markdown formatting around JSON
    if (jsonResponseText.includes('```json')) {
      jsonResponseText = jsonResponseText.replace(/```json/g, '').replace(/```/g, '');
    } else if (jsonResponseText.includes('```')) {
      jsonResponseText = jsonResponseText.replace(/```/g, '');
    }

    const layout = JSON.parse(jsonResponseText.trim());

    // 4. Generate DOCX
    const docChildren = [];

    // Add title
    if (layout.title) {
      docChildren.push(new Paragraph({
        text: layout.title,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      }));
    }

    // Helper for alignment
    const getAlignment = (alignStr) => {
      switch (alignStr) {
        case 'center': return AlignmentType.CENTER;
        case 'right': return AlignmentType.RIGHT;
        case 'left':
        default: return AlignmentType.LEFT;
      }
    };

    // Add sections
    if (layout.sections && Array.isArray(layout.sections)) {
      layout.sections.forEach(section => {
        if (section.type === 'header') {
          docChildren.push(new Paragraph({
            text: section.content,
            alignment: getAlignment(section.align || 'center'),
            heading: HeadingLevel.TITLE
          }));
        } else if (section.type === 'heading') {
          const levelMap = {
            1: HeadingLevel.HEADING_1,
            2: HeadingLevel.HEADING_2,
            3: HeadingLevel.HEADING_3,
          };
          docChildren.push(new Paragraph({
            text: section.content,
            heading: levelMap[section.level] || HeadingLevel.HEADING_2,
            alignment: getAlignment(section.align)
          }));
        } else if (section.type === 'paragraph') {
          docChildren.push(new Paragraph({
            text: section.content,
            alignment: getAlignment(section.align)
          }));
        } else if (section.type === 'list') {
          if (section.items && Array.isArray(section.items)) {
            section.items.forEach((item, index) => {
              docChildren.push(new Paragraph({
                text: item,
                bullet: section.ordered ? undefined : { level: 0 },
                numbering: section.ordered ? { reference: "default-numbering", level: 0 } : undefined
              }));
            });
          }
        }
      });
    }

    const doc = new Document({
      numbering: {
        config: [
          {
            reference: "default-numbering",
            levels: [
              {
                level: 0,
                format: "decimal",
                text: "%1.",
                alignment: AlignmentType.START,
                style: {
                  paragraph: { indent: { left: 720, hanging: 360 } }
                }
              }
            ]
          }
        ]
      },
      sections: [{
        properties: {},
        children: docChildren
      }]
    });

    const buffer = await Packer.toBuffer(doc);

    // 5. Save to temp folder
    const fileId = uuidv4();
    const tempFilePath = path.join(tempDir, `${fileId}.docx`);
    fs.writeFileSync(tempFilePath, buffer);

    // Return JSON layout and download token
    res.json({ layout, downloadId: fileId });

  } catch (error) {
    console.error('Error formatting document:', error);
    res.status(500).json({ error: error.message || 'An error occurred during formatting.' });
  }
});

// 6. GET /api/download/:id
app.get('/api/download/:id', (req, res) => {
  const fileId = req.params.id;
  const filePath = path.join(tempDir, `${fileId}.docx`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found or expired.' });
  }

  res.download(filePath, 'Formatted_Document.docx', (err) => {
    if (err) {
      console.error('Download error:', err);
    }
    // Clean up temp file
    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr) console.error('Error deleting temp file:', unlinkErr);
    });
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
