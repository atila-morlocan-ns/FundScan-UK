// ═══════════════════════════════════════════════════════
// FundScan UK — Funder Intelligence Data
// Scoring rubrics, red/green flags, and strategy per funder
// ═══════════════════════════════════════════════════════

// Maps funder provider name → intelligence profile
export const FUNDER_INTELLIGENCE = {
    'Innovate UK': {
        scoringWeights: [
            { area: 'Innovation', weight: 30, desc: 'Novelty and competitive advantage of your approach' },
            { area: 'Market Awareness', weight: 25, desc: 'Clear market need, size, and route to market' },
            { area: 'Project Plan', weight: 25, desc: 'Feasibility, milestones, team capability' },
            { area: 'Value for Money', weight: 20, desc: 'Costs justified, additionality, UK economic benefit' },
        ],
        greenFlags: [
            'Clear UK economic impact and job creation potential',
            'Strong IP position or freedom to operate',
            'Evidence of customer discovery or pilot agreements',
            'Collaborative project with academic or industry partners',
            'Clear route to market within 2-3 years of project end',
        ],
        redFlags: [
            'No evidence of market validation or customer interest',
            'Project is pure research with no commercial pathway',
            'Team lacks key technical or commercial expertise',
            'Costs not benchmarked or justified',
            'Duplicate funding from other public sources',
        ],
        typicalWinner: 'SME with working prototype (TRL 4-6), clear IP, 1-2 pilot customers, and a collaborative partner. Turn projects have strong industrial context.',
        applicationStyle: 'Concise, evidence-based. Avoid hyperbole. Use data to support claims. Score each section against the published criteria.',
        successRate: '~8-12% for Smart Grants',
        tips: [
            'Each section has a word limit (typically 400 words) — be ruthless with editing',
            'Name specific customers, even if only in discussions',
            'Quantify the market opportunity with credible sources (NICE, NHS Digital)',
            'Show additionality: what would NOT happen without this grant?',
            'Include a Gantt chart or clear milestone plan',
        ],
    },

    'UKRI': {
        scoringWeights: [
            { area: 'Research Excellence', weight: 35, desc: 'Quality and significance of the proposed research' },
            { area: 'Impact', weight: 30, desc: 'Potential for real-world benefit to society and economy' },
            { area: 'Feasibility', weight: 20, desc: 'Methodology, resources, risk mitigation' },
            { area: 'Team & Environment', weight: 15, desc: 'Track record, facilities, and collaboration' },
        ],
        greenFlags: [
            'Strong academic collaboration or co-investigator',
            'Clear pathway from discovery to commercial application',
            'Multi-disciplinary approach combining technology and clinical expertise',
            'Patient/public involvement in research design',
            'Alignment with UKRI strategic priorities',
        ],
        redFlags: [
            'Purely commercial project with no research novelty',
            'No academic partner for translational research',
            'Vague impact statements without measurable outcomes',
            'Undercosted or over-ambitious project scope',
        ],
        typicalWinner: 'University-industry partnership with strong PI track record. Projects at TRL 2-5 with clear translation pathway.',
        applicationStyle: 'Academic rigour with commercial awareness. Reference published literature. Include pathways to impact document.',
        successRate: '~15-25% depending on programme',
        tips: [
            'Always include a Pathways to Impact document',
            'Reference relevant UKRI strategy documents',
            'Demonstrate patient/public engagement where applicable',
            'Budget for knowledge exchange and dissemination activities',
        ],
    },

    'NHS England / SBRI': {
        scoringWeights: [
            { area: 'Clinical Need', weight: 30, desc: 'Severity and scale of the NHS problem addressed' },
            { area: 'Innovation', weight: 25, desc: 'Novelty of approach and advantage over existing solutions' },
            { area: 'NHS Adoption Pathway', weight: 25, desc: 'Realistic route to NHS procurement and integration' },
            { area: 'Value for Money', weight: 20, desc: 'Cost-effectiveness and NHS savings potential' },
        ],
        greenFlags: [
            'Letter of support from an NHS trust or CCG',
            'Evidence of clinical engagement in product design',
            'Health economics data or NICE alignment',
            'CE/UKCA marking or clear regulatory pathway',
            'AHSN partnership or endorsement',
        ],
        redFlags: [
            'No NHS clinical partner named in application',
            'Unclear regulatory pathway (MHRA/CE)',
            'No patient involvement or clinical validation',
            'Solution doesn\'t integrate with existing NHS systems',
            'No health economic case for cost savings',
        ],
        typicalWinner: 'MedTech SME with CE-marked device or clear MHRA pathway, NHS trust co-development partner, and health economics evidence.',
        applicationStyle: 'Clinical language, avoid tech jargon. Lead with the NHS problem, not your technology. Show procurement pathway.',
        successRate: 'Phase 1: ~15%, Phase 2: ~25%',
        tips: [
            'Lead with the clinical need and patient impact — not your tech',
            'Name specific NHS trusts or health systems you\'re working with',
            'Include health economics: what does the NHS currently spend on this?',
            'Show your regulatory strategy (MHRA, NICE, DTAC)',
            'Reference the NHS Long Term Plan priorities',
        ],
    },

    'NIHR': {
        scoringWeights: [
            { area: 'Importance of Topic', weight: 30, desc: 'Significance to NHS and patient outcomes' },
            { area: 'Scientific Quality', weight: 30, desc: 'Rigour of methodology and study design' },
            { area: 'Patient & Public Involvement', weight: 20, desc: 'Meaningful PPI in design and delivery' },
            { area: 'Value for Money', weight: 20, desc: 'Appropriate costing and NHS relevance' },
        ],
        greenFlags: [
            'Strong Patient and Public Involvement (PPI)',
            'RCT or robust evaluation methodology',
            'Aligned with NIHR Evidence Standards Framework',
            'Clinical co-applicants from NHS trusts',
            'Clear evidence gap identified in systematic review',
        ],
        redFlags: [
            'No PPI strategy in the application',
            'Technology not validated in clinical setting',
            'No NHS clinical co-applicant',
            'Study design lacks rigour for evidence generation',
        ],
        typicalWinner: 'Clinical-academic partnership with embedded PPI, targeting NICE technology appraisal or evidence gap.',
        applicationStyle: 'Highly academic, evidence-based. PPI must be genuine and documented throughout.',
        successRate: '~15-20%',
        tips: [
            'PPI is not optional — it\'s scored separately and heavily weighted',
            'Include a clear evidence gap statement citing systematic reviews',
            'Name clinical co-applicants and their NHS roles',
            'Budget for PPI activities, training, and remuneration',
        ],
    },

    'HMRC': {
        scoringWeights: [
            { area: 'Qualifying R&D Activity', weight: 40, desc: 'Does the work seek to advance science or technology?' },
            { area: 'Technical Uncertainty', weight: 30, desc: 'Could a competent professional easily resolve this?' },
            { area: 'Eligible Costs', weight: 30, desc: 'Staff costs, software, consumables directly attributable' },
        ],
        greenFlags: [
            'Clear technical uncertainty that couldn\'t be resolved by a professional',
            'Novel approach to solving a specific technical challenge',
            'Well-documented R&D activities with project narratives',
            'Competent professional statement describing the advance',
        ],
        redFlags: [
            'Claiming for routine software development',
            'No documented technical uncertainty',
            'Including non-qualifying costs (capital equipment, rent)',
            'Claims filed more than 2 years after accounting period end',
        ],
        typicalWinner: 'Any UK company spending on genuine R&D, regardless of whether the R&D succeeds.',
        applicationStyle: 'Technical narratives describing: baseline state of knowledge, advance sought, uncertainties faced.',
        successRate: '~90% (if genuinely qualifying)',
        tips: [
            'File claims annually — many startups miss the 2-year deadline',
            'Document R&D activities as you go, not retrospectively',
            'A failed R&D project still qualifies if uncertainty existed',
            'Use HMRC\'s own guidelines to structure competent professional reports',
        ],
    },

    'British Business Bank': {
        scoringWeights: [
            { area: 'Business Viability', weight: 35, desc: 'Trading history, revenue trajectory, business plan' },
            { area: 'Use of Funds', weight: 30, desc: 'Clear, specific plan for how the loan will be used' },
            { area: 'Repayment Ability', weight: 25, desc: 'Cash flow evidence the loan can be serviced' },
            { area: 'Personal Commitment', weight: 10, desc: 'Founder investment, mentoring engagement' },
        ],
        greenFlags: [
            'Completed free business plan and mentoring',
            'Clear use of funds with specific costs',
            'Some existing revenue or strong pre-orders',
            'Personal financial commitment alongside the loan',
        ],
        redFlags: [
            'No business plan or financial projections',
            'Vague use of funds ("general working capital")',
            'History of CCJs or defaults on credit file',
            'Requesting maximum without strong justification',
        ],
        typicalWinner: 'Early-stage business with business plan, some traction, and a specific use for the capital.',
        applicationStyle: 'Straightforward business plan with P&L projections. Complete the free mentoring offered.',
        successRate: '~40-50%',
        tips: [
            'Complete the free mentoring before applying — it strengthens your application',
            'Be specific about what you\'ll spend the money on with cost breakdowns',
            'Show you\'ve invested your own time/money already',
            'Have your business plan reviewed by a mentor first',
        ],
    },
};

// Evidence types that funders commonly require
export const EVIDENCE_TYPES = [
    { id: 'market-data', name: 'Market Size & Validation', icon: '📊', desc: 'TAM/SAM/SOM, market research, competitor analysis', funders: ['Innovate UK', 'UKRI', 'NHS England / SBRI'] },
    { id: 'clinical-data', name: 'Clinical / Pilot Results', icon: '🏥', desc: 'Clinical trials, pilot studies, user testing, accuracy data', funders: ['NHS England / SBRI', 'NIHR', 'UKRI'] },
    { id: 'ip-docs', name: 'IP Documentation', icon: '🔒', desc: 'Patent filings, FTO analysis, trade secrets register', funders: ['Innovate UK', 'HMRC'] },
    { id: 'financial-proj', name: 'Financial Projections', icon: '💰', desc: '3-year P&L, cash flow forecast, unit economics', funders: ['Innovate UK', 'British Business Bank', 'NHS England / SBRI'] },
    { id: 'letters-support', name: 'Letters of Support', icon: '📨', desc: 'NHS trust letters, AHSN endorsements, partner commitments', funders: ['NHS England / SBRI', 'NIHR', 'Innovate UK'] },
    { id: 'team-cvs', name: 'Team CVs & Track Record', icon: '👥', desc: 'Key personnel CVs, advisory board, domain expertise', funders: ['Innovate UK', 'UKRI', 'NIHR'] },
    { id: 'tech-docs', name: 'Technical Architecture', icon: '🔧', desc: 'System diagrams, TRL evidence, data flow, tech stack', funders: ['Innovate UK', 'UKRI'] },
    { id: 'regulatory', name: 'Regulatory Strategy', icon: '📋', desc: 'MHRA pathway, CE/UKCA marking plan, DTAC compliance', funders: ['NHS England / SBRI', 'NIHR'] },
    { id: 'health-econ', name: 'Health Economics', icon: '🏛️', desc: 'Cost-effectiveness analysis, QALY estimates, NHS savings case', funders: ['NHS England / SBRI', 'NIHR', 'UKRI'] },
    { id: 'business-plan', name: 'Business Plan', icon: '📑', desc: 'Executive summary, strategy, operations, growth plan', funders: ['British Business Bank', 'Innovate UK'] },
    { id: 'ppi-evidence', name: 'Patient & Public Involvement', icon: '🤝', desc: 'PPI strategy, patient advisory group, co-design evidence', funders: ['NIHR', 'NHS England / SBRI'] },
    { id: 'project-plan', name: 'Project Plan & Milestones', icon: '📅', desc: 'Gantt chart, work packages, deliverables, risk register', funders: ['Innovate UK', 'UKRI', 'NHS England / SBRI'] },
];

// Regional Growth Hub data — Surrey and South East
export const REGIONAL_HUBS = {
    surrey: {
        name: 'Enterprise M3 / Surrey Business',
        region: 'Surrey & Hampshire',
        growthHub: {
            name: 'Enterprise M3 Growth Hub',
            url: 'https://www.enterprisem3.org.uk/',
            phone: '01onal',
            programmes: [
                { name: 'Innovation Vouchers', amount: '£5,000', desc: 'Partner with universities on technical challenges' },
                { name: 'Business Growth Grants', amount: '£1K–£25K', desc: 'Capital investment for growth projects' },
                { name: 'Scale-Up Programme', amount: 'Free mentoring', desc: 'Peer networks and specialist coaching for high-growth SMEs' },
                { name: 'Net Zero Support', amount: 'Free audits', desc: 'Energy audits and sustainability planning' },
            ],
        },
        ahsn: {
            name: 'Kent Surrey Sussex AHSN (KSS AHSN)',
            url: 'https://kssahsn.net/',
            focus: 'MedTech adoption, patient safety, mental health innovation',
            relevance: 'Key partner for NHS introductions, clinical validation, and MedTech adoption in the South East. They run MedTech acceleration programmes and can connect you with NHS trusts in Surrey.',
            programmes: [
                { name: 'MedTech Adoption Programme', desc: 'Helps innovators navigate NHS procurement' },
                { name: 'Patient Safety Collaborative', desc: 'Supports falls prevention and patient monitoring innovations' },
                { name: 'Innovation Exchange', desc: 'Connect with NHS clinicians who have unmet needs' },
            ],
        },
        catapult: {
            name: 'Digital Catapult (London)',
            url: 'https://www.digicatapult.org.uk/',
            distance: '~30 miles from Surrey',
            relevance: 'AI and computer vision expertise, machine learning testbeds, access to Catapult network',
            programmes: [
                { name: 'Machine Intelligence Garage', desc: 'AI/ML startup support and compute resources' },
                { name: 'DCMS Cyber Programme', desc: 'Cybersecurity for connected medical devices' },
            ],
        },
        council: {
            name: 'Surrey County Council',
            url: 'https://www.surreycc.gov.uk/business',
            programmes: [
                { name: 'Surrey Business Rates Relief', desc: 'Potential rates relief for R&D-focused premises' },
                { name: 'Economic Development Team', desc: 'Direct support for high-growth tech companies' },
            ],
        },
        universities: [
            { name: 'University of Surrey', url: 'https://www.surrey.ac.uk/', strength: 'AI, computer vision, 5G, health sciences — strong KTP partner', ktp: true },
            { name: 'Royal Holloway', url: 'https://www.royalholloway.ac.uk/', strength: 'Cybersecurity, machine learning, information security', ktp: true },
        ],
        nearbyFunds: [
            { name: 'Enterprise M3 Funding Escalator', amount: 'Up to £150K', type: 'Loan', desc: 'Patient capital for Surrey & Hampshire SMEs' },
            { name: 'South East Investment Fund', amount: '£25K–£2M', type: 'Loan/Equity', desc: 'British Business Bank regional fund for the South East' },
            { name: 'Maven Capital (South East)', amount: '£50K–£5M', type: 'Equity', desc: 'Growth equity for technology companies' },
        ],
    },
};

// Sprint plan template (weeks before deadline)
export const SPRINT_TEMPLATE = [
    {
        weeksOut: 8, phase: 'Discover', icon: '🔍', tasks: [
            'Read the full competition brief and scoring criteria',
            'Identify assessor priorities from funder intelligence',
            'Gather existing evidence from your vault',
            'Identify evidence gaps requiring new work',
            'Confirm eligibility criteria are met',
        ]
    },
    {
        weeksOut: 6, phase: 'Draft', icon: '✍️', tasks: [
            'Draft the innovation/technical narrative',
            'Write market opportunity section with data sources',
            'Outline project plan with milestones',
            'Prepare financial model and cost justification',
            'Draft team capability and track record section',
        ]
    },
    {
        weeksOut: 4, phase: 'Evidence', icon: '📊', tasks: [
            'Attach letters of support from named partners',
            'Finalise financial projections with sensitivity analysis',
            'Include clinical/pilot data or user testing results',
            'Prepare regulatory strategy document',
            'Complete project Gantt chart or milestone plan',
        ]
    },
    {
        weeksOut: 2, phase: 'Review', icon: '👁️', tasks: [
            'Internal review against scoring criteria checklist',
            'External review by advisor or mentor',
            'Check all word counts meet limits (typically 400/section)',
            'Verify all mandatory attachments are included',
            'Cross-check budget against narrative claims',
        ]
    },
    {
        weeksOut: 1, phase: 'Polish', icon: '✨', tasks: [
            'Final proofread for typos and clarity',
            'Verify all URLs, references, and partner names are correct',
            'Test submission portal — don\'t leave to last day',
            'Save final version with timestamp',
            'Prepare 1-page executive summary for records',
        ]
    },
    {
        weeksOut: 0, phase: 'Submit', icon: '🚀', tasks: [
            'Submit at least 24 hours before deadline',
            'Screenshot/save submission confirmation',
            'Note assessor panel dates if published',
            'Share submission with team and advisors',
            'Log in funding stack tracker',
        ]
    },
];

// Funding stack conflict rules
export const STACK_RULES = [
    { type: 'state-aid', desc: 'SBRI + Smart Grants both count as Minimal Financial Assistance (formerly de minimis). Check cumulative limits (€300K over 3 years).', funds: ['SBRI Healthcare', 'Innovate UK Smart Grants', 'Healthy Ageing Challenge Fund'] },
    { type: 'double-funding', desc: 'Cannot use two grants to fund the same activity. Ensure different work packages or time periods.', funds: ['*'] },
    { type: 'seis-timing', desc: 'SEIS investment must occur within 3 years of company incorporation. EIS opens after SEIS cap is reached.', funds: ['SEIS', 'EIS'] },
    { type: 'rd-overlap', desc: 'R&D Tax Credits can cover costs NOT funded by grants. Reduce claim by grant-funded R&D spend.', funds: ['R&D Tax Credits'] },
    { type: 'loan-grant', desc: 'Innovation Loans and grants can be combined — loan covers costs grant doesn\'t. Strong combination.', funds: ['Innovation Loans', 'Smart Grants'] },
];
