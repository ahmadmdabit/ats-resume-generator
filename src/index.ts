import * as fs from 'fs';
import * as path from 'path';
import { ResumeService } from './services/ResumeService.js';
import { MarkdownParser } from './parsers/MarkdownParser.js';
import { JsonParser } from './parsers/JsonParser.js';
import { DocxGenerator } from './generators/DocxGenerator.js';
import { PdfGenerator } from './generators/PdfGenerator.js';
import { TxtGenerator } from './generators/TxtGenerator.js';
import { MarkdownGenerator } from './generators/MarkdownGenerator.js';
import { IResumeParser, IResumeGenerator, LANG } from './core/interfaces.js';

const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('Usage: node dist/index.js <input.(md|json)> <output.(md|docx|pdf|txt)> <(en|tr)>');
    process.exit(1);
}

const inputPath = path.resolve(args[0]);
const outputPath = path.resolve(args[1]);
const lang = (args[2] || 'en') as LANG;

if (!fs.existsSync(inputPath)) { console.error(`❌ Input file not found: ${inputPath}`); process.exit(1); }

const inputExt = path.extname(inputPath).toLowerCase();
const outputExt = path.extname(outputPath).toLowerCase();

// Open/Closed Principle (OCP): New formats can be added without modifying this logic
let parser: IResumeParser;
if (inputExt === '.md') parser = new MarkdownParser();
else if (inputExt === '.json') parser = new JsonParser();
else { console.error('❌ Unsupported input format. Use .md or .json'); process.exit(1); }

let generator: IResumeGenerator;
if (outputExt === '.docx') generator = new DocxGenerator();
else if (outputExt === '.pdf') generator = new PdfGenerator();
else if (outputExt === '.md') generator = new MarkdownGenerator();
else if (outputExt === '.txt') generator = new TxtGenerator();
else { console.error('❌ Unsupported output format. Use .md, .docx, .pdf, or .txt'); process.exit(1); }

const service = new ResumeService(parser, generator);
const inputContent = fs.readFileSync(inputPath, 'utf-8');

console.log(`⏳ Processing ${inputPath} -> ${outputPath}...`);
service.process(inputContent, outputPath, lang)
    .then(() => console.log(`✅ Successfully generated: ${outputPath}`))
    .catch(err => { console.error('❌ Error:', err); process.exit(1); });