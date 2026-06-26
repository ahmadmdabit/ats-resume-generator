import * as fs from 'fs';
import * as path from 'path';
import { ResumeService } from './services/ResumeService';
import { MarkdownParser } from './parsers/MarkdownParser';
import { JsonParser } from './parsers/JsonParser';
import { DocxGenerator } from './generators/DocxGenerator';
import { PdfGenerator } from './generators/PdfGenerator';
import { MarkdownGenerator } from './generators/MarkdownGenerator';
import { IResumeParser, IResumeGenerator } from './core/interfaces';

const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('Usage: node dist/index.js <input.(md|json)> <output.(md|docx|pdf)>');
    process.exit(1);
}

const inputPath = path.resolve(args[0]);
const outputPath = path.resolve(args[1]);

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
else { console.error('❌ Unsupported output format. Use .md, .docx, or .pdf'); process.exit(1); }

const service = new ResumeService(parser, generator);
const inputContent = fs.readFileSync(inputPath, 'utf-8');

console.log(`⏳ Processing ${inputPath} -> ${outputPath}...`);
service.process(inputContent, outputPath)
    .then(() => console.log(`✅ Successfully generated: ${outputPath}`))
    .catch(err => { console.error('❌ Error:', err); process.exit(1); });