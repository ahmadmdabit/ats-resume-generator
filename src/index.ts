import * as fs from 'fs';
import * as path from 'path';
import { LayoutResumeService, ResumeService } from './services/ResumeService.js';
import { MarkdownParser } from './parsers/MarkdownParser.js';
import { JsonParser } from './parsers/JsonParser.js';
import { DocxGenerator } from './generators/DocxGenerator.js';
import { PdfGenerator } from './generators/PdfGenerator.js';
import { TxtGenerator } from './generators/TxtGenerator.js';
import { MarkdownGenerator } from './generators/MarkdownGenerator.js';
import { GeneratorOptions, ILayoutGenerator, ILayoutParser, IResumeGenerator, IResumeParser, LANG } from './core/interfaces.js';

const USAGE = `Usage: ats-resume-generator <input.(md|json)> [options]

Options:
  -f, --format <list>     Output formats: txt,md,docx,pdf (comma-separated, default: txt)
  -n, --name <list>       Output file name(s) without extension (comma-separated, default: input stem)
  --lang <list>           Language(s): en,tr (comma-separated, required)
  --no-blank-lines        Remove blank paragraphs from DOCX output
  --date <yyyy-MM-dd>     Append date to output file name
  -h, --help              Show help message

Input and lang counts must match (one input per lang, no fallback).

Examples:
  ats-resume-generator resume.md --format pdf --name Resume-EN --lang en
  ats-resume-generator resume.md --format txt,md,docx,pdf --name Resume-EN --lang en
  ats-resume-generator en.md,tr.md --format txt --name Resume --lang en,tr
  ats-resume-generator en.md,tr.md --format txt --name A,B --lang en,tr
  ats-resume-generator --help`;

interface CliOptions {
    inputs: string[];
    formats: string[];
    names: string[];
    langs: LANG[];
    noBlankLines: boolean;
    date: string;
    help: boolean;
}

function parseArgs(argv: string[]): CliOptions {
    const opts: CliOptions = {
        inputs: [],
        formats: ['txt'],
        names: [],
        langs: [],
        noBlankLines: false,
        date: '',
        help: false,
    };

    const positional: string[] = [];

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '-h' || arg === '--help') {
            opts.help = true;
        } else if (arg === '--no-blank-lines') {
            opts.noBlankLines = true;
        } else if (arg === '-f' || arg === '--format') {
            const val = argv[++i];
            if (!val) { console.error('❌ --format requires a value'); process.exit(1); }
            opts.formats = val.split(',').map(s => s.trim()).filter(Boolean);
        } else if (arg === '-n' || arg === '--name') {
            const val = argv[++i];
            if (!val) { console.error('❌ --name requires a value'); process.exit(1); }
            opts.names = val.split(',').map(s => s.trim()).filter(Boolean);
        } else if (arg === '--lang') {
            const val = argv[++i];
            if (!val) { console.error('❌ --lang requires a value'); process.exit(1); }
            opts.langs = val.split(',').map(s => s.trim()).filter(Boolean) as LANG[];
        } else if (arg === '--date') {
            const val = argv[++i];
            if (!val) { console.error('❌ --date requires a value'); process.exit(1); }
            opts.date = val;
        } else if (arg.startsWith('-')) {
            console.error(`❌ Unknown option: ${arg}\n${USAGE}`);
            process.exit(1);
        } else {
            positional.push(arg);
        }
    }

    // Input files: comma-separated, one per lang (or single file for all langs)
    if (positional.length > 0) {
        opts.inputs = positional[0].split(',').map(s => s.trim()).filter(Boolean);
    }

    return opts;
}

const args = process.argv.slice(2);
const opts = parseArgs(args);

if (opts.help) {
    console.log(USAGE);
    process.exit(0);
}

if (opts.inputs.length === 0) {
    console.error(`❌ Missing input file.\n${USAGE}`);
    process.exit(1);
}

// Strict 1:1 mapping — no fallback. Input count must equal lang count.
if (opts.inputs.length !== opts.langs.length) {
    console.error(`❌ Input count (${opts.inputs.length}) must equal lang count (${opts.langs.length}). Provide one input per lang.`);
    process.exit(1);
}

// Validate all input files exist and have supported extensions
for (const input of opts.inputs) {
    const inputPath = path.resolve(input);
    if (!fs.existsSync(inputPath)) {
        console.error(`❌ Input file not found: ${inputPath}`);
        process.exit(1);
    }
    const ext = path.extname(inputPath).toLowerCase();
    if (ext !== '.md' && ext !== '.json') {
        console.error(`❌ Unsupported input format: "${input}". Use .md or .json`);
        process.exit(1);
    }
}

// Validate formats
const validFormats = ['txt', 'md', 'docx', 'pdf'];
for (const f of opts.formats) {
    if (!validFormats.includes(f)) {
        console.error(`❌ Unsupported format: "${f}". Use: ${validFormats.join(', ')}`);
        process.exit(1);
    }
}

// Validate langs
for (const l of opts.langs) {
    if (l !== 'en' && l !== 'tr') {
        console.error(`❌ Unsupported language: "${l}". Use en or tr.`);
        process.exit(1);
    }
}

if (opts.langs.length === 0) {
    console.error(`❌ Missing required --lang.\n${USAGE}`);
    process.exit(1);
}

// Resolve names: if 1 name and multiple langs, use same name for all
const firstInputPath = path.resolve(opts.inputs[0]);
const firstExt = path.extname(firstInputPath).toLowerCase();
const inputStem = path.basename(firstInputPath, firstExt);
if (opts.names.length === 0) {
    opts.names = [inputStem];
}
if (opts.names.length === 1 && opts.langs.length > 1) {
    // Use same name for all langs
} else if (opts.names.length !== opts.langs.length) {
    console.error(`❌ Name count (${opts.names.length}) must match lang count (${opts.langs.length}) or be 1.`);
    process.exit(1);
}

// Select parser based on first input extension
let parser: IResumeParser & ILayoutParser;
if (firstExt === '.md') parser = new MarkdownParser();
else parser = new JsonParser();

const genOptions: GeneratorOptions = { noBlankLines: opts.noBlankLines };

// Generate for each lang × format
const runs: Promise<void>[] = [];
const outputs: string[] = [];

for (let li = 0; li < opts.langs.length; li++) {
    const lang = opts.langs[li];
    const name = opts.names.length === 1 ? opts.names[0] : opts.names[li];
    const inputPath = path.resolve(opts.inputs[li]);
    const inputContent = fs.readFileSync(inputPath, 'utf-8');

    for (const format of opts.formats) {
        const dateSuffix = opts.date ? `--${opts.date}` : '';
        const outputPath = path.resolve(`${name}-${lang.toUpperCase()}${dateSuffix}.${format}`);
        outputs.push(outputPath);

        let run: Promise<void>;
        if (format === 'txt' || format === 'md') {
            const generator: ILayoutGenerator = format === 'txt' ? new TxtGenerator() : new MarkdownGenerator();
            run = new LayoutResumeService(parser, generator).process(inputContent, outputPath, lang, genOptions);
        } else {
            const generator: IResumeGenerator = format === 'docx' ? new DocxGenerator() : new PdfGenerator();
            run = new ResumeService(parser, generator).process(inputContent, outputPath, lang, genOptions);
        }
        runs.push(run);
    }
}

console.log(`⏳ Processing ${opts.inputs.join(', ')} → ${outputs.length} file(s)...`);

Promise.all(runs)
    .then(() => {
        for (const out of outputs) {
            console.log(`✅ Generated: ${out}`);
        }
    })
    .catch(err => { console.error('❌ Error:', err); process.exit(1); });
