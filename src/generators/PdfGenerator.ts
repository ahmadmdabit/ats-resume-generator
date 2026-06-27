import * as fs from 'fs';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { convertToPdf, ConvertError } from 'docx-to-pdf-wasm';
import { IResumeGenerator } from '../core/interfaces.js';
import { ResumeData } from '../core/models.js';
import { DocxGenerator } from './DocxGenerator.js';

// WASM modules are compiled and cached only once.
let wasmModule: WebAssembly.Module | null = null;

async function getWasmModule(): Promise<WebAssembly.Module> {
    if (wasmModule) return wasmModule;

    // Try 1: Standard Node.js require.resolve (works in dev/unbundled mode)
    try {
        const require = createRequire(import.meta.url);
        const wasmPath = require.resolve('docx-to-pdf-wasm/wasm');
        const wasmBytes = await readFile(wasmPath);
        wasmModule = await WebAssembly.compile(wasmBytes);
        return wasmModule;
    } catch {
        // Fall through to fallback
    }

    // Try 2: Bun --compile binary — load WASM from executable's directory.
    // In a Bun-compiled binary, import.meta.url resolves to an internal
    // Bun virtual path (B:/~BUN/root/...), not the real filesystem.
    // process.execPath always gives the real executable location.
    const execDir = dirname(process.execPath);
    const fallbackPath = resolve(execDir, 'docx-to-pdf.wasm');
    if (fs.existsSync(fallbackPath)) {
        const wasmBytes = await readFile(fallbackPath);
        wasmModule = await WebAssembly.compile(wasmBytes);
        return wasmModule;
    }

    throw new Error(
        'Cannot find docx-to-pdf.wasm. In a Bun --compile binary, place ' +
        'docx-to-pdf.wasm next to the executable. In dev mode, ensure ' +
        'docx-to-pdf-wasm is installed in node_modules.'
    );
}

export class PdfGenerator implements IResumeGenerator {
    async generate(data: ResumeData, outputPath: string): Promise<void> {
        const docxPath = outputPath.replace(/\.pdf$/, '.docx');
        const docxGen = new DocxGenerator();
        await docxGen.generate(data, docxPath);

        const wasmModule = await getWasmModule();
        const docxBytes = new Uint8Array(await readFile(docxPath));

        try {
            const pdfBytes = await convertToPdf(wasmModule, docxBytes);
            await fs.promises.writeFile(outputPath, pdfBytes);
        } catch (e) {
            if (e instanceof ConvertError) {
                throw new Error(`PDF conversion failed: ${e.message}`);
            }
            throw e;
        } finally {
            // Delete the docx file temporarily.
            await fs.promises.unlink(docxPath).catch(() => { });
        }
    }
}