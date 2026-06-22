import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    ExternalHyperlink,
    ShadingType,
    convertInchesToTwip
} from "docx";
import * as fs from "fs";

// Helper to create Job Experience blocks
function createJob(title: string, company: string, location: string, date: string, bullets: string[]) {
    return [
        new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: [
                new TextRun(`${title} - `),
                new TextRun({ text: company, color: "4EA72E" }), // Exact Green Accent
                new TextRun(`, ${location}`),
            ],
        }),
        new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 80 },
            children: [new TextRun({ text: date, italics: true })],
        }),
        ...bullets.map(b => new Paragraph({
            children: [new TextRun(`- ${b}`)],
            spacing: { after: 40 }
        }))
    ];
}

// Helper to create Project blocks
function createProject(title: string, link: string, tech: string, bullets: string[]) {
    return [
        new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: [
                new TextRun(`${title} - `),
                new ExternalHyperlink({
                    link: link,
                    children: [new TextRun({ text: link, style: "Hyperlink" })]
                })
            ],
        }),
        new Paragraph({
            spacing: { after: 40 },
            children: [
                new TextRun("- "),
                new TextRun({ text: "Technologies:", bold: true }),
                new TextRun(` ${tech}`)
            ],
        }),
        ...bullets.map(b => new Paragraph({
            children: [new TextRun(`- ${b}`)],
            spacing: { after: 40 }
        }))
    ];
}

// Helper for Technical Skills
function createSkill(category: string, skills: string) {
    return new Paragraph({
        spacing: { after: 40 },
        children: [
            new TextRun("- "),
            new TextRun({ text: `${category}:`, color: "4EA72E" }), // Exact Green Accent
            new TextRun(` ${skills}`)
        ],
    });
}

const doc = new Document({
    styles: {
        default: {
            document: {
                run: { font: "Calibri", size: 22 }, // 11pt
            },
            heading1: {
                run: { font: "Calibri", size: 40, color: "3A7C22", bold: true }, // 20pt
                paragraph: {
                    spacing: { before: 360, after: 80 },
                    shading: { type: ShadingType.CLEAR, fill: "D9F2D0", color: "auto" },
                    alignment: AlignmentType.CENTER,
                },
            },
            heading2: {
                run: { font: "Calibri", size: 32, color: "4EA72E", bold: true }, // 16pt
                paragraph: {
                    spacing: { before: 160, after: 80 },
                    shading: { type: ShadingType.CLEAR, fill: "D9F2D0", color: "auto" },
                },
            },
            heading3: {
                run: { font: "Calibri", size: 28, color: "3A7C22", bold: true }, // 14pt
                paragraph: {
                    spacing: { before: 160, after: 80 },
                    shading: { type: ShadingType.CLEAR, fill: "B3E5A1", color: "auto" },
                },
            },
        },
        paragraphStyles: [
            {
                id: "Compact",
                name: "Compact",
                basedOn: "Normal",
                next: "Normal",
                run: { font: "Calibri", size: 22 },
                paragraph: { spacing: { before: 36, after: 36 } },
            },
        ],
    },
    sections: [
        {
            properties: {
                page: {
                    margin: {
                        top: convertInchesToTwip(0.5),
                        right: convertInchesToTwip(0.5),
                        bottom: convertInchesToTwip(0.5),
                        left: convertInchesToTwip(0.5),
                    },
                },
            },
            children: [
                // HEADER
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Ahmet FATIHOGLU")] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "E-mail: ", bold: true }), new TextRun("ahmet.fatihoglu.89@gmail.com")] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Phone: ", bold: true }), new TextRun("+90 543 838 0942")] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Address: ", bold: true }), new TextRun("CEKMEKOY, ISTANBUL, TURKEY")] }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({ text: "Website: ", bold: true }),
                        new ExternalHyperlink({ link: "https://ahmadmdabit.github.io", children: [new TextRun({ text: "https://ahmadmdabit.github.io", style: "Hyperlink" })] }),
                    ],
                }),

                // PROFESSIONAL SUMMARY
                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("PROFESSIONAL SUMMARY")] }),
                new Paragraph({ children: [new TextRun({ text: "Senior Software Developer (Architect)", bold: true }), new TextRun(" with 9+ years of experience in full-stack web, desktop, and mobile development.")] }),
                new Paragraph({ children: [new TextRun("- Specializes in C# .NET ecosystem, building scalable ERP architectures and microservices.")] }),
                new Paragraph({ children: [new TextRun("- Proficient in TypeScript, React.js, Vue.js, and cross-platform mobile development with Dart/Flutter.")] }),
                new Paragraph({ children: [new TextRun({ text: "- Microsoft Certified:", bold: true }), new TextRun(" Azure Data Engineer Associate - 2023.")] }),
                new Paragraph({ children: [new TextRun("- Proven track record of delivering clean, maintainable software solutions, resolving complex technical issues, and implementing effective, scalable systems.")] }),

                // TECHNICAL SKILLS
                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("TECHNICAL SKILLS")] }),
                createSkill("Programming Languages", "C#, TypeScript, JavaScript, Kotlin, Java, PHP, C, C++, VB.NET"),
                createSkill("Architectures & Patterns", "Microservices, Clean Architecture, Domain-Driven Design (DDD), CQRS, N-Tier, MVVM, Zero-Allocation Architecture, Fine-Grained Reactivity, List Virtualization"),
                createSkill(".NET Ecosystem", "ASP.NET Core, .NET Framework, ASP.NET MVC, Web API Entity Framework Core, WCF, WPF, WinForms, System.CommandLine, P/Invoke / LibraryImport, AutoMapper, MediatR, Mediator.SourceGenerator, Polly, FluentValidation, CommunityToolkit.Mvvm, Hangfire"),
                createSkill("Web & Frontend", "React, Vue, Angular, RxJS, Node.js, Laravel, HTML5, CSS3, Tailwind CSS, MUI, SASS, Bootstrap, jQuery, Vite.js, WebPack, Gulp.js, Hyperscript"),
                createSkill("Backend & APIs", "RESTful API, gRPC, MassTransit, RabbitMQ, Ocelot (API Gateway), Swagger, JWT, Refit, JsonSchema.Net"),
                createSkill("Databases & Cache", "Microsoft SQL Server, PostgreSQL, MySQL, SQLite, MongoDB, Cassandra, Redis"),
                createSkill("Cloud, DevOps & Infrastructure", "Microsoft Azure (Virtual Machines, Storage, Functions, Blobs, File Share, Tables), Docker, MinIO, Heroku, CI/CD, Git, GitHub, SVN, Microsoft IIS, Apache HTTP Server, Microsoft Server, Ubuntu Server, Serilog, ZLogger, OpenTelemetry, VirtualBox, Windows Kernel API"),
                createSkill("Testing & Quality Assurance (QA)", "NUnit, xUnit, Moq, FluentAssertions, Testcontainers, coverlet.collector, Bogus, WireMock.Net, Karma, Jasmine, Vitest, ESLint, Prettier, Husky"),
                createSkill("AI, Search & API Integration", "Claude, GPT, Google Gemini AI, YouTube API, GitHub Copilot, Ollama, OpenRouter, ElasticSearch, Lucene, Chrome Extensions, Prompt Engineering, Context Engineering, AI Orchestration, Cline"),
                createSkill("Mobile & Desktop", "Flutter, Dart, Ionic, Android, Electron.js"),
                createSkill("Project Management", "Jira, Asana, Slack"),

                // PROFESSIONAL EXPERIENCE
                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("PROFESSIONAL EXPERIENCE")] }),

                ...createJob("Senior Software Developer (Architect)", "Freelancer", "Istanbul, Turkey, Online", "07/2025 – Present", [
                    "Architected and delivered end-to-end software solutions, leading projects from initial concept and system design through to full-stack implementation, cloud deployment, and release management.",
                    "Engineered scalable backend systems using a microservices architecture with .NET, DDD, MassTransit and RabbitMQ, and RESTful APIs secured by JWT and routed through an Ocelot API Gateway.",
                    "Developed modern, responsive user interfaces and browser extensions using React.js, TypeScript, MUI, and Tailwind CSS, ensuring high-quality code with a robust testing framework featuring Vite and Vitest and by integrating third-party services such as the Google Gemini AI and YouTube Data APIs.",
                    "Established and automated a complete DevOps lifecycle, implementing CI/CD pipelines, containerization with Docker, and observability with OpenTelemetry and Serilog."
                ]),

                ...createJob("Software Developer", "HİTİT BİLGİ TEKNOLOJİLERİ", "Istanbul, Turkey, Hybrid", "01/2024 – 07/2025", [
                    "Contributed to the development and maintenance of the company’s core ERP application and other internal systems as part of a collaborative software development team.",
                    "Developed using ASP.NET MVC, Web Services (WCF), ASP.NET Core, RESTful API, WinForms, DevExpress, MS SQL Server, React.js and Flutter."
                ]),

                ...createJob("Software Developer", "Freelancer", "Istanbul, Turkey, Online", "11/2023 – 01/2024", [
                    "Developed C# .NET applications using WPF, and Console platforms, following the best practices.",
                    "Built RESTful services and web applications with PHP Laravel and Lumen frameworks using MVC pattern.",
                    "Designed and managed database solutions with MySQL."
                ]),

                ...createJob("Software Developer", "Getron TR", "Istanbul, Turkey, Online", "01/2023 – 11/2023", [
                    "Developed C# .NET applications using .NET Core and .NET Framework, including Windows Services, WPF, Console apps, and n-Tier architecture projects.",
                    "Built ASP.NET MVC web applications following n-Tier architecture.",
                    "Implemented Azure services such as Blobs, File Share, Tables, and MS SQL for cloud-based solutions."
                ]),

                ...createJob("Full-Stack Engineer", "Freelancer", "Istanbul, Turkey, Online", "04/2020 – 12/2022", [
                    "Developed C# .NET applications using ASP.NET Core, MVC, WinForms, WPF, and Console platforms, following n-Tier and Microservices architectures.",
                    "Built RESTful services and web applications with PHP Laravel and Lumen frameworks using MVC pattern.",
                    "Designed and managed database solutions with MS SQL and MySQL."
                ]),

                ...createJob("Software Developer", "SETCARD", "Istanbul, Turkey, On-Site", "08/2018 – 03/2020", [
                    "Contributed to the development and maintenance of the company’s core ERP web application and other internal systems as part of a collaborative software development team.",
                    "Developed using ASP.NET WebForms, DevExpress and MS SQL Server (Stored Procedure)."
                ]),

                ...createJob("Full-Stack Developer", "Freelancer", "Istanbul, Online", "10/2017 – 08/2018", [
                    "Built and maintained full-stack applications through all stages of the development lifecycle.",
                    "Built responsive, cross-browser compatible web interfaces.",
                    "Utilized CI tools such as Heroku and Azure for automated deployment.",
                    "Provided IT support and software development consulting services."
                ]),

                ...createJob("Software Developer", "Verisun Bilisim", "Istanbul, Turkey, On-Site", "09/2015 – 10/2017", [
                    "Designed, analyzed, developed, tested, debugged and maintained full-stack applications.",
                    "Wrote code that meets standards and provides desired functionality using project-specific technologies.",
                    "Built responsive, cross-browser compatible web interfaces.",
                    "Collaborated with team members using Git, Slack, Asana, and Jira.",
                    "Worked with system engineers, developers, project managers, and analysts to deliver integrated, scalable solutions.",
                    "Prepared the necessary documentation in line with the project requirements.",
                    "Troubleshooted and configured web servers and extended them with necessary modules and plugins.",
                    "Designed, modeled, developed, managed, backed up and deployed application databases.",
                    "Implemented backup and recovery strategies.",
                    "Installed, configured and managed virtual machines.",
                    "Installed, configured and updated operating systems and necessary software.",
                    "Converted Photoshop and illustrator images into HTML5 applications.",
                    "Provided customer support by answering questions and resolving technical issues.",
                    "Contributed innovative ideas to enhance application functionality and optimize user experience."
                ]),

                // PROJECTS
                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("PROJECTS")] }),
                new Paragraph({ children: [new TextRun("A complete portfolio of my work, including additional personal projects, is available on my website.")] }),

                ...createProject("Distributed File Fragmentor", "https://github.com/ahmadmdabit/DistributedFileFragmentor", ".NET 9, Clean Architecture, CQRS, EF Core 9, System.CommandLine, Resilience Patterns", [
                    "Architected a distributed file storage system using .NET 9 and Clean Architecture to fragment large files, distribute them across multiple storage providers (FileSystem, Database), and verify integrity with SHA-256.",
                    "Implemented a CQRS pattern with a source-generated Mediator and engineered a robust batch processing system with isolated DbContext scopes to handle parallel operations safely and efficiently.",
                    "Integrated advanced resilience patterns, including exponential backoff retries and circuit breakers, and implemented security measures against path traversal and symlink attacks."
                ]),

                ...createProject("Meeting System", "https://github.com/ahmadmdabit/MeetingSystem", ".NET 9, Angular 20+, Clean Architecture, Docker, MinIO, Hangfire, Testcontainers, RxJS", [
                    "Architected a full-stack, containerized meeting management system using .NET 9 Clean Architecture for the backend and Angular 20+ Standalone Components for the frontend.",
                    "Implemented a complete DevOps environment using Docker Compose, integrating services like MinIO for object storage and Hangfire for background job processing.",
                    "Developed a reactive frontend with RxJS, managing component state declaratively to create a responsive and predictable user experience.",
                    "Established a robust testing strategy for the backend using Testcontainers to run integration tests against a real SQL Server instance, ensuring high reliability."
                ]),

                ...createProject("RepoAIfy", "https://github.com/ahmadmdabit/RepoAIfy", "C#, .NET 9, WPF, MVVM, .NET Class Library, .NET CLI, JSON, Git, Markdown", [
                    "Architected and developed a dual-interface .NET 9 solution (WPF & CLI) to analyze and document large codebases, using the MVVM pattern to ensure a clean separation of concerns.",
                    "Implemented a dynamic, real-time file filtering system with an interactive tree view and cancellable tasks for a responsive and seamless user experience.",
                    "Engineered an automated output chunking feature to split large code analyses into manageable Markdown files, optimizing them for AI model consumption and review."
                ]),

                ...createProject("AI Utils Extension", "https://github.com/ahmadmdabit/ai-utils-extension", "React 19, TypeScript, Tailwind CSS, Vite, Vitest, Chrome Manifest V3, Google Gemini AI", [
                    "Developed a Chrome extension featuring a multi-step AI pipeline using Google's Gemini AI to perform complex operations on browser tabs, including summarization, translation, and custom data extraction.",
                    "Engineered a modern, responsive user interface with React 19 and Tailwind CSS, featuring real-time task status updates and the ability to synthesize data from multiple tabs into a single output.",
                    "Established a professional, scalable development environment with a strict testing framework (Vitest, React Testing Library) and automated code quality checks using ESLint, Prettier, and Husky git hooks."
                ]),

                ...createProject("Notification System", "https://github.com/ahmadmdabit/NotificationSystem", ".NET Core, Microservices Architecture, Ocelot API Gateway, Dapper, SQL Server, RESTful API", [
                    "Designed and implemented a distributed system using a microservices architecture, separating user and notification functionalities into independent, scalable services.",
                    "Configured an API Gateway using Ocelot to provide a single, unified entry point, centralizing request routing and simplifying service discovery for the frontend.",
                    "Built a high-performance data access layer using the Dapper ORM for direct SQL query execution, ensuring efficient communication between services and the database."
                ]),

                // EDUCATION
                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("EDUCATION")] }),
                new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("B.Sc. Electrical & Electronics Engineering - Computer Engineering")] }),
                new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 80 }, children: [new TextRun({ text: "01/2007 – 01/2014", italics: true })] }),
                new Paragraph({ children: [new TextRun("- University of Aleppo, Faculty of Electrical and Electronics Engineering, Aleppo, Syria.")] }),

                // CERTIFICATIONS
                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("CERTIFICATIONS")] }),
                new Paragraph({ style: "Compact", children: [new TextRun("- "), new TextRun({ text: "Azure Data Engineer Associate", bold: true }), new TextRun(" (Microsoft) - 2023 - Reference")] }),
                new Paragraph({ style: "Compact", children: [new TextRun("- "), new TextRun({ text: "A+", bold: true }), new TextRun(" (CompTIA) - 2010")] }),

                // LANGUAGES
                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("LANGUAGES")] }),
                new Paragraph({ style: "Compact", children: [new TextRun("- Turkish (Professional)")] }),
                new Paragraph({ style: "Compact", children: [new TextRun("- English (Professional)")] }),
                new Paragraph({ style: "Compact", children: [new TextRun("- Arabic (Native)")] }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("Ahmet-FATIHOGLU_Resume_EN.docx", buffer);
    console.log("✅ Document created successfully with exact styling: Ahmet-FATIHOGLU_Resume_EN.docx");
}).catch((err) => {
    console.error("❌ Error generating document:", err);
});