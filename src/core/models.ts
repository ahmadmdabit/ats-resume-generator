export interface ResumeHeader {
    name: string;
    email: string;
    phone: string;
    address: string;
    website: string;
}

export interface ResumeSkill { category: string; items: string; }
export interface ResumeJob { title: string; company: string; location: string; date: string; bullets: string[]; }
export interface ResumeProject { title: string; link: string; subtitle?: string; tech: string; bullets: string[]; }
export interface ResumeEducation { degree: string; date: string; institution: string; overview?: string; }
export interface ResumeCertification { text: string; link?: string; }

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