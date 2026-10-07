export interface ResumeHeader {
    name: string;
    email: string;
    phone: string;
    address: string;
    website: string;
    linkedin: string;
}

export interface ResumeSkill { category: string; items: string; }
export interface ResumeJob { title: string; company: string; location: string; date: string; bullets: string[]; }
export interface ResumeProject { title: string; link: string; subtitle?: string; tech: string; bullets: string[]; }
export interface ResumeEducation { degree: string; date: string; institution: string; overview?: string; detail?: string; }
export interface ResumeCertification { text: string; link?: string; }

// ---------------------------------------------------------------------------
// Layout model — describes HOW the document was laid out, as opposed to
// ResumeData which describes WHAT it says. Text generators consume this so
// output shape matches the source exactly instead of being reconstructed.
// ---------------------------------------------------------------------------
export type LayoutLineKind =
    | 'title'      // H1 — document name
    | 'contact'    // header field line; may pack several fields
    | 'section'    // H2 — section heading, stored uppercased
    | 'entry'      // H3 — job / project / education title
    | 'date'       // date or year line
    | 'bullet'     // "- text"
    | 'labeled'    // "- Link: url", "- Technologies: …"
    | 'reference'  // indented "Reference: url"
    | 'plain'      // any other body line
    | 'blank';     // preserved empty line

export interface LayoutLine {
    kind: LayoutLineKind;
    text: string;      // raw source text (syntax intact), indentation preserved
    indent: number;    // leading spaces (0 or 2)
}

export interface ResumeLayout {
    lines: LayoutLine[];
}

export interface ResumeData {
    header: ResumeHeader;
    summary: string[];
    experienceOverview: string;
    skills: ResumeSkill[];
    experience: ResumeJob[];
    projectsIntro: string;
    projects: ResumeProject[];
    education: ResumeEducation;
    certifications: ResumeCertification[];
    languages: string[];
}