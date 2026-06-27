# ATS Resume Generator

A command-line tool that parses resume data from **Markdown** or **JSON** and generates formatted output in **Markdown**, **DOCX**, **PDF**, or **plain text** (TXT).

---

## Overview

This project implements a **SOLID‑principled** workflow for resume generation. It separates parsing, data modeling, and output generation, allowing new input or output formats to be added without modifying existing code.

### Key Features

- **Input Formats:** Markdown (`.md`) or JSON (`.json`)
- **Output Formats:** Markdown (`.md`), DOCX (`.docx`), PDF (`.pdf`), plain text (`.txt`)
- **TypeScript** with strict typing
- **PDF generation** via `docx‑to‑pdf‑wasm` (converts DOCX to PDF using WebAssembly)
- **Dependency injection** for decoupled, testable components

### High‑Level Data Flow (Workflow)

```mermaid
flowchart LR
    A[Input File<br>.md / .json] --> B[Parser]
    B --> C[ResumeData<br>Model]
    C --> D[Generator]
    D --> E[Output File<br>.md / .docx / .pdf / .txt]
```

This diagram shows the entire transformation workflow from input to output.

---

## Architecture

```
src/
├── core/               # Interfaces & data models
│   ├── interfaces.ts   # IResumeParser, IResumeGenerator
│   └── models.ts       # ResumeData, ResumeJob, ResumeProject, etc.
├── parsers/            # Input parsers
│   ├── MarkdownParser.ts
│   └── JsonParser.ts
├── generators/         # Output generators
│   ├── MarkdownGenerator.ts
│   ├── DocxGenerator.ts
│   ├── PdfGenerator.ts
│   └── TxtGenerator.ts
├── services/           # Orchestration
│   └── ResumeService.ts
└── index.ts            # CLI entry point
```

### SOLID Principles Applied

| Principle                 | Implementation                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Single Responsibility** | Each parser/generator handles exactly one format                                                        |
| **Open/Closed**           | New parser/generator classes can be added without changing existing ones (CLI entry point needs update) |
| **Liskov Substitution**   | All parsers/generators are interchangeable                                                              |
| **Interface Segregation** | `IResumeParser` and `IResumeGenerator` are minimal and focused                                          |
| **Dependency Inversion**  | `ResumeService` depends on abstractions, not concretions                                                |

#### Class Diagram – SOLID Design

```mermaid
classDiagram
    class IResumeParser {
        <<interface>>
        +parse(input: string): ResumeData
    }
    class IResumeGenerator {
        <<interface>>
        +generate(data: ResumeData, outputPath: string): Promise~void~
    }
    class MarkdownParser {
        +parse(input: string): ResumeData
    }
    class JsonParser {
        +parse(input: string): ResumeData
    }
    class MarkdownGenerator {
        +generate(data: ResumeData, outputPath: string): Promise~void~
    }
    class DocxGenerator {
        +generate(data: ResumeData, outputPath: string): Promise~void~
    }
    class PdfGenerator {
        +generate(data: ResumeData, outputPath: string): Promise~void~
    }
    class TxtGenerator {
        +generate(data: ResumeData, outputPath: string): Promise~void~
    }
    class ResumeService {
        -parser: IResumeParser
        -generator: IResumeGenerator
        +process(input: string, outputPath: string): Promise~void~
    }

    IResumeParser <|.. MarkdownParser
    IResumeParser <|.. JsonParser
    IResumeGenerator <|.. MarkdownGenerator
    IResumeGenerator <|.. DocxGenerator
    IResumeGenerator <|.. PdfGenerator
    IResumeGenerator <|.. TxtGenerator
    ResumeService --> IResumeParser
    ResumeService --> IResumeGenerator
```

This class diagram clarifies the interface‑based design and dependency injection.

---

## Installation

```bash
yarn install
```

### Build

```bash
yarn build
```

### Run (from source)

```bash
yarn generate <input.(md|json)> <output.(md|docx|pdf|txt)>
```

### Run (compiled)

```bash
yarn start <input.(md|json)> <output.(md|docx|pdf|txt)>
```

---

## Usage Example

```bash
yarn generate resume.md resume.docx
```

This reads `resume.md`, parses it into a `ResumeData` object, and writes a formatted DOCX file.

```bash
yarn generate resume.json resume.pdf
```

Reads JSON input, generates a temporary DOCX, converts it to PDF, and cleans up the temporary file.

---

## Sequence Diagram – Execution Flow

```mermaid
sequenceDiagram
    participant CLI as index.ts
    participant Service as ResumeService
    participant Parser as IResumeParser
    participant Generator as IResumeGenerator

    CLI->>Service: process(input, outputPath)
    Service->>Parser: parse(input)
    Parser-->>Service: ResumeData
    Service->>Generator: generate(data, outputPath)
    Generator-->>Service: (file written)
    Service-->>CLI: (success)
```

This shows the runtime interaction between the main entry point, the service, and the pluggable components.

---

## Input Format

### Data Model – ResumeData Structure

```mermaid
classDiagram
    class ResumeData {
        +header: ResumeHeader
        +summary: string[]
        +skills: ResumeSkill[]
        +experience: ResumeJob[]
        +projectsIntro: string
        +projects: ResumeProject[]
        +education: ResumeEducation
        +certifications: ResumeCertification[]
        +languages: string[]
    }
    class ResumeHeader {
        +name: string
        +email: string
        +phone: string
        +address: string
        +website: string
    }
    class ResumeSkill {
        +category: string
        +items: string
    }
    class ResumeJob {
        +title: string
        +company: string
        +location: string
        +date: string
        +bullets: string[]
    }
    class ResumeProject {
        +title: string
        +link: string
        +subtitle?: string
        +tech: string
        +bullets: string[]
    }
    class ResumeEducation {
        +degree: string
        +date: string
        +institution: string
    }
    class ResumeCertification {
        +text: string
        +link?: string
    }

    ResumeData --> ResumeHeader
    ResumeData --> ResumeSkill
    ResumeData --> ResumeJob
    ResumeData --> ResumeProject
    ResumeData --> ResumeEducation
    ResumeData --> ResumeCertification
```

This diagram gives a quick visual reference of the data structure used throughout the system.

### Markdown Structure

The Markdown parser expects sections with the following headings (case‑sensitive):

```
# John Doe
E-mail: john@example.com
Phone: +1 234 567 890
Address: 123 Main St, City, Country
Website: https://john.dev

## PROFESSIONAL SUMMARY
[paragraph text]

## TECHNICAL SKILLS
- Category: item1, item2, item3

## PROFESSIONAL EXPERIENCE
Senior Developer - Company Inc., Location
01/2020 – Present
- Bullet point 1
- Bullet point 2

## PROJECTS
[Complete portfolio](https://github.com/john/portfolio)

[Project Title](https://project.link)
Technologies: TypeScript, Node.js
- Bullet point

## EDUCATION
B.Sc. in Computer Science
09/2016 – 06/2020
- University Name

## CERTIFICATIONS
- Certification Name - [Reference](https://cert.link)

## LANGUAGES
- English (Native)
- Spanish (Fluent)
```

### JSON Structure

The JSON schema mirrors the `ResumeData` interface:

```json
{
  "header": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1 234 567 890",
    "address": "123 Main St, City, Country",
    "website": "https://john.dev"
  },
  "summary": ["Paragraph text"],
  "skills": [{ "category": "Programming", "items": "TypeScript, Node.js, Python" }],
  "experience": [
    {
      "title": "Senior Developer",
      "company": "Company Inc.",
      "location": "Remote",
      "date": "01/2020 – Present",
      "bullets": ["Bullet point 1", "Bullet point 2"]
    }
  ],
  "projectsIntro": "[Complete portfolio](https://github.com/john/portfolio)",
  "projects": [
    {
      "title": "Project Title",
      "link": "https://project.link",
      "subtitle": "Optional subtitle",
      "tech": "TypeScript, Node.js",
      "bullets": ["Bullet point"]
    }
  ],
  "education": {
    "degree": "B.Sc. in Computer Science",
    "date": "09/2016 – 06/2020",
    "institution": "University Name"
  },
  "certifications": [{ "text": "Certification Name", "link": "https://cert.link" }],
  "languages": ["English (Native)", "Spanish (Fluent)"]
}
```

---

## Output Format Details

| Format       | Implementation Notes                                                                                       |
| ------------ | ---------------------------------------------------------------------------------------------------------- |
| **Markdown** | Plain text with standard Markdown syntax                                                                   |
| **DOCX**     | Uses `docx` library with custom styles (Calibri, green accents, shaded headings)                           |
| **PDF**      | Generated via DOCX → PDF conversion using `docx‑to‑pdf‑wasm`; creates and removes a temporary `.docx` file |
| **TXT**      | Strips all Markdown formatting, converts links to `text (url)`, and uses plain ASCII separators            |

---

## Technical Constraints

- **PDF Generation:** Requires a WebAssembly module from `docx‑to‑pdf‑wasm`. The module is compiled and cached after first use.
- **Memory:** Temporary DOCX files are created in the same directory as the output PDF and deleted after conversion.
- **Node.js Version:** ES2020 modules; requires Node.js 18+.
- **Package Manager:** Yarn 4.17.0 (see `.yarnrc.yml`).

---

## Continuous Integration & Delivery

This repository uses GitHub Actions for automated builds and releases:

### CI Workflow (`.github/workflows/ci.yml`)

- Triggered on pushes to `main`/`master` and pull requests
- Uses Node.js 22 and Yarn 4 via Corepack
- Caches Yarn dependencies for faster runs
- Runs TypeScript compilation and type checking (`yarn build`)

### Release Workflow (`.github/workflows/release.yml`)

- Triggered after a successful CI run on push events (e.g., tagged commits)
- Configured to build the project and package standalone binaries (requires a `package` script – e.g., using `bun build --compile` – to generate the binaries)
- Generates compressed archives (`.tar.gz` / `.zip`) and SHA‑256 checksums
- Creates a GitHub Release with the packaged assets and an auto‑generated changelog

---

## Dependencies

| Package            | Version | Purpose                        |
| ------------------ | ------- | ------------------------------ |
| `docx`             | 9.7.1   | DOCX document creation         |
| `docx‑to‑pdf‑wasm` | ^0.1.0  | DOCX → PDF conversion via WASM |
| `marked`           | 18.0.5  | Markdown lexing for parsing    |
| `typescript`       | ^5.9.3  | Development compiler           |
| `ts‑node`          | ^10.9.2 | Run TypeScript directly        |

---

## Extending the System

### Adding a New Input Parser

1. Implement `IResumeParser`:
   ```ts
   export class MyParser implements IResumeParser {
     parse(input: string): ResumeData {
       /* ... */
     }
   }
   ```
2. Add a new condition in `src/index.ts` for your file extension.

### Adding a New Output Generator

1. Implement `IResumeGenerator`:
   ```ts
   export class MyGenerator implements IResumeGenerator {
     async generate(data: ResumeData, outputPath: string): Promise<void> {
       /* ... */
     }
   }
   ```
2. Add a new condition in `src/index.ts` for your output extension.

---

## Known Limitations

- PDF output depends on a third‑party WASM module; conversion may fail for very complex DOCX layouts.
- The Markdown parser is opinionated about section heading text and order.
- Hyperlinks in DOCX are styled with a specific green color (`#4EA72E`) and no underline.
- Standalone binary generation is not yet fully implemented; the release workflow will need a `package` script (e.g., using `bun build --compile`).

---

## License

[MIT](LICENSE) © 2026 Ahmet Fatihoğlu
