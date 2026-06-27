import * as fs from 'fs';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { convertToPdf, ConvertError } from 'docx-to-pdf-wasm';
import { IResumeGenerator } from '../core/interfaces.js';
import { ResumeData } from '../core/models.js';
import { DocxGenerator } from './DocxGenerator.js';

// WASM modules are compiled and cached only once.
let wasmModule: WebAssembly.Module | null = null;

async function getWasmModule(): Promise<WebAssembly.Module> {
    if (wasmModule) return wasmModule;

    const require = createRequire(import.meta.url);
    const wasmPath = require.resolve('docx-to-pdf-wasm/wasm');
    const wasmBytes = await readFile(wasmPath);
    wasmModule = await WebAssembly.compile(wasmBytes);
    return wasmModule;
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