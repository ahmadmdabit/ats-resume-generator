# ats-resume-generator

CLI tool that converts resume files (Markdown/JSON) into MD, DOCX, PDF, or TXT. Built with SOLID principles — parsers and generators are interchangeable via interfaces.

## Dev environment

- **Runtime:** Node.js 22+ (ESM, `"type": "module"`)
- **Package manager:** Yarn 4 (via Corepack — run `corepack enable` first)
- **Bun:** Required only for `yarn package` (standalone binary builds)

```bash
corepack enable
yarn install
```

## Build & test

```bash
yarn build          # tsc compile → dist/
yarn start          # node dist/index.js <input> <output> <lang>
yarn generate       # ts-node src/index.ts (dev mode, no build needed)
```

**No test suite exists.** Verification is manual: run `yarn generate` or `yarn start` with a sample file and inspect the output.

**CI** (`.github/workflows/ci.yml`): runs `yarn install --immutable` + `yarn build` on Node 22.14.0.

## Usage

```bash
node dist/index.js <input.(md|json)> [options]

Options:
  -f, --format <list>     Output formats: txt,md,docx,pdf (comma-separated, default: txt)
  -n, --name <list>       Output file name(s) without extension (comma-separated, default: input stem)
  --lang <list>           Language(s): en,tr (comma-separated, required)
  --no-blank-lines        Remove blank paragraphs from DOCX output
  --date <yyyy-MM-dd>     Append date to output file name
  -h, --help              Show help message
```

`--lang` is **required** — the CLI exits 1 with usage if it is missing or not `en`/`tr`. Multiple languages produce per-lang files named `{name}-{LANG}.{format}` (lang uppercased). Optional `--date` appends `--{yyyy-MM-dd}` before the extension.

**Input and lang counts must match** (one input per lang, no fallback). Provide a comma-separated list of input files, one per language.

Examples:
```bash
node dist/index.js local/Resume-EN.md --format docx --name Resume-EN --lang en
node dist/index.js local/Resume-EN.md --format txt,md,docx,pdf --name Resume-EN --lang en
node dist/index.js local/Resume-EN.md,local/Resume-TR.md --format txt --name Resume --lang en,tr
node dist/index.js local/Resume-EN.md,local/Resume-TR.md --format txt --name A,B --lang en,tr
node dist/index.js local/Resume-EN.md --format docx --name Resume-EN --lang en --no-blank-lines
```

## Architecture

```
src/
  index.ts              # CLI entry — selects semantic (.docx/.pdf) or layout (.txt/.md) path by output extension
  core/
    interfaces.ts       # IResumeParser, ILayoutParser, IResumeGenerator, ILayoutGenerator, GeneratorOptions, LANG
    models.ts           # ResumeData (semantic), ResumeLayout (shape), and sub-interfaces
  parsers/
    MarkdownParser.ts   # marked.lexer-based; implements IResumeParser + ILayoutParser; SectionMap normalizes EN/TR headers
    JsonParser.ts       # thin JSON.parse wrapper; synthesizes canonical layout
  generators/
    DocxGenerator.ts    # IResumeGenerator; docx library; Calibri, green theme (#4EA72E / #3A7C22)
    PdfGenerator.ts     # delegates to DocxGenerator → docx-to-pdf-wasm
    MarkdownGenerator.ts # ILayoutGenerator; renders ResumeLayout back to Markdown (exact round-trip)
    TxtGenerator.ts     # ILayoutGenerator; renders ResumeLayout as plain text (strips syntax, uppercases H2)
  services/
    ResumeService.ts    # ResumeService (semantic: ResumeData → DOCX/PDF) + LayoutResumeService (layout: ResumeLayout → TXT/MD)
```

**Adding a new format:** implement `IResumeParser`/`ILayoutParser` or `IResumeGenerator`/`ILayoutGenerator`, add one `else if` branch in `index.ts`. No other changes needed (OCP).

## Conventions

- **Naming:** PascalCase files/classes, camelCase members. Interfaces prefixed with `I` (e.g. `IResumeParser`).
- **Imports:** always include `.js` extension (NodeNext module resolution).
- **Localization:** `LANG = 'en' | 'tr'`. Each generator holds its own `t` dictionary. MarkdownParser's `SectionMap` maps both EN and TR section headers to canonical internal keys.
- **Error handling:** parsers throw on invalid input; generators propagate errors; `index.ts` catches and exits with code 1.
- **No linter, no formatter config** — match existing code style.

## Packaging (standalone binaries)

```bash
yarn package              # all platforms → dist-bin/
yarn package:windows      # windows-x64 only
```

Uses `bun build --compile`. Cross-compilation from Windows is unreliable for non-Windows targets — use CI or a Linux/macOS machine. The script auto-copies `docx-to-pdf.wasm` next to each binary (required for PDF generation at runtime).

## Pitfalls

- **PDF generation requires `docx-to-pdf.wasm`** at runtime. In dev mode it resolves from `node_modules`. In a compiled binary it must sit next to the executable (the packaging script handles this).
- **MarkdownParser logs the full parse result to stdout** (`console.log('PARSING RESULT:', ...)`) — expected noise, not a bug.
- **`dist/` and `dist-bin/` are gitignored.** Build artifacts are not committed.
- **`local/` contains sample resumes** (EN/TR in MD/DOCX/PDF/TXT) — useful as test inputs, not source code.
- **No `resolveJsonModule`** in tsconfig — JSON imports won't type-check; use `JsonParser` with raw string input instead.
- **Turkish characters in regex:** the parser uses `/i` flag with explicit Turkish char alternations (e.g. `Günümüz|Devam ediyor`) rather than relying on `toLowerCase()` which handles Turkish I/İ incorrectly. Section-header matching uses `normalizeHeader()` (folds Turkish chars before uppercasing) because `'Teknik Beceriler'.toUpperCase()` yields `'TEKNIK BECERILER'`, not `'TEKNİK BECERİLER'`.
