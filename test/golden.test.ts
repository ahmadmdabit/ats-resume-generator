import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'promisify-child-process';
import { mkdir, readFile, writeFile, access } from 'fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Compiled test lives at dist-test/test/ — project root is two levels up
const rootDir = join(__dirname, '..', '..');
const goldenDir = join(__dirname, 'golden');
const outputDir = join(__dirname, 'output');

// Ensure directories exist
await mkdir(goldenDir, { recursive: true });
await mkdir(outputDir, { recursive: true });

async function runCli(input: string, lang: string, format: string, name: string): Promise<string> {
    // CLI appends -{LANG} to the name: --name foo --lang en → foo-EN.{format}
    const outputPath = join(outputDir, `${name}-${lang.toUpperCase()}.${format}`);
    const args = [
        join(rootDir, 'dist', 'index.js'),
        join(rootDir, input),
        '--format', format,
        '--name', join(outputDir, name),
        '--lang', lang,
    ];
    await spawn('node', args, { cwd: rootDir });
    return outputPath;
}

function getGoldenPath(name: string, format: string): string {
    return join(goldenDir, `${name}.${format}`);
}

/**
 * Extract text from a DOCX file (ZIP archive containing word/document.xml).
 * This avoids byte-level comparison which fails due to ZIP timestamps.
 */
async function extractDocxText(docxPath: string): Promise<string> {
    const buf = await readFile(docxPath);
    // Find the word/document.xml entry in the ZIP
    // Simple approach: find the local file header for word/document.xml
    const docxText = buf.toString('latin1');
    const xmlStart = docxText.indexOf('<?xml');
    if (xmlStart === -1) return '';
    // Find the end of the XML content
    const xmlEnd = docxText.indexOf('</w:document>', xmlStart);
    if (xmlEnd === -1) return '';
    const xml = docxText.slice(xmlStart, xmlEnd + '</w:document>'.length);
    // Strip XML tags to get plain text
    return xml
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Extract text from a PDF file.
 * PDF text extraction is complex; we use a simple approach that works for
 * text-based PDFs (not scanned images).
 */
async function extractPdfText(pdfPath: string): Promise<string> {
    const buf = await readFile(pdfPath);
    const text = buf.toString('latin1');
    // Find text between BT and ET markers (PDF text objects)
    const texts: string[] = [];
    const btEtRegex = /BT\s*([\s\S]*?)\s*ET/g;
    let match;
    while ((match = btEtRegex.exec(text)) !== null) {
        const content = match[1];
        // Extract text from Tj and TJ operators
        const tjRegex = /\(([^)]*)\)\s*Tg/g;
        let tjMatch;
        while ((tjMatch = tjRegex.exec(content)) !== null) {
            texts.push(tjMatch[1]);
        }
    }
    return texts.join(' ').replace(/\s+/g, ' ').trim();
}

async function getFileContent(path: string, format: string): Promise<string> {
    if (format === 'docx') return extractDocxText(path);
    if (format === 'pdf') return extractPdfText(path);
    return readFile(path, 'utf-8');
}

async function pathExists(path: string): Promise<boolean> {
    try {
        await access(path);
        return true;
    } catch {
        return false;
    }
}

async function captureOrCompare(name: string, format: string, actualPath: string): Promise<void> {
    const goldenPath = getGoldenPath(name, format);
    const actual = await getFileContent(actualPath, format);

    if (!(await pathExists(goldenPath))) {
        // First run: capture as golden
        await writeFile(goldenPath, actual, 'utf-8');
        console.log(`  📸 Captured golden: ${name}.${format}`);
        return;
    }

    const expected = await readFile(goldenPath, 'utf-8');
    if (actual !== expected) {
        // Check if this is a known-bad output (marked with .fixme)
        const fixmePath = `${goldenPath}.fixme`;
        if (await pathExists(fixmePath)) {
            const fixme = await readFile(fixmePath, 'utf-8');
            assert.equal(actual, fixme, `${name}.${format} does not match .fixme snapshot`);
            console.log(`  ⚠️  ${name}.${format} matches .fixme (known-bad)`);
            return;
        }
        assert.equal(actual, expected, `${name}.${format} differs from golden`);
    } else {
        console.log(`  ✅ ${name}.${format} matches golden`);
    }
}

test('EN resume — all formats', async () => {
    const formats = ['txt', 'md', 'docx', 'pdf'];
    for (const format of formats) {
        const outputPath = await runCli('local/Resume-EN.md', 'en', format, `Resume-EN-${format}`);
        await captureOrCompare(`Resume-EN-${format}`, format, outputPath);
    }
});

test('TR resume — all formats', async () => {
    const formats = ['txt', 'md', 'docx', 'pdf'];
    for (const format of formats) {
        const outputPath = await runCli('local/Resume-TR.md', 'tr', format, `Resume-TR-${format}`);
        await captureOrCompare(`Resume-TR-${format}`, format, outputPath);
    }
});

test('JSON input — all formats', async () => {
    // Create a minimal JSON fixture in the source test/ directory
    const jsonFixture = join(rootDir, 'test', 'fixture.json');
    if (!(await pathExists(jsonFixture))) {
        const data = {
            header: { name: 'Test User', email: 'test@example.com', phone: '123-456-7890', address: 'Test City', website: 'https://example.com', linkedin: '' },
            summary: ['Test summary line'],
            experienceOverview: '',
            skills: [{ category: 'Languages', items: 'TypeScript, JavaScript' }],
            experience: [{ title: 'Dev', company: 'Co', location: 'Remote', date: '2020-2024', bullets: ['Did stuff'] }],
            projectsIntro: '',
            projects: [],
            education: { degree: 'BSc', date: '2020', institution: 'Test University' },
            certifications: [],
            languages: ['English']
        };
        await writeFile(jsonFixture, JSON.stringify(data, null, 2), 'utf-8');
    }

    const formats = ['txt', 'md', 'docx', 'pdf'];
    for (const format of formats) {
        const outputPath = await runCli('test/fixture.json', 'en', format, `fixture-${format}`);
        await captureOrCompare(`fixture-${format}`, format, outputPath);
    }
});
