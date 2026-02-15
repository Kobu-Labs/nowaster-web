pub const NPC_NAMES: &[&str] = &[
    "axolotl_kai",
    "SolanaJinx",
    "ByteWitch",
    "CryptoNomad",
    "luna.exe",
    "QuantumVex",
    "NebulaDrift",
    "HexSage",
    "ripple_nova",
    "CipherMoss",
    "ZeroGravity",
    "arcane_pixel",
    "Voltex",
    "MidnightLoop",
    "prism_echo",
    "TechSerpent",
    "glitch_wren",
    "CosmicHaze",
    "NullPointer",
    "starforge_io",
    "Zephyrax",
    "DataPhantom",
    "neon_oracle",
    "IronVeil",
    "Kryptova",
    "loopbreaker",
    "SynthWolf",
    "echo_cipher",
    "VortexSeal",
    "neothread",
    "phantom_rook",
    "SkywireKira",
];

pub const COLORS: &[&str] = &[
    "#3B82F6", "#1D4ED8", "#60A5FA", "#0EA5E9", "#06B6D4",
    "#EF4444", "#DC2626", "#F87171", "#EC4899", "#DB2777",
    "#10B981", "#059669", "#34D399", "#84CC16", "#4ADE80",
    "#F59E0B", "#D97706", "#FBBF24", "#F97316", "#FB923C",
    "#8B5CF6", "#7C3AED", "#A78BFA", "#6366F1", "#4F46E5",
    "#14B8A6", "#0D9488", "#2DD4BF", "#67E8F9", "#38BDF8",
    "#F43F5E", "#E11D48", "#FB7185", "#D946EF", "#A21CAF",
    "#65A30D", "#16A34A", "#22C55E", "#A3E635", "#86EFAC",
    "#EAB308", "#CA8A04", "#FDE047", "#FCD34D", "#FCA5A5",
    "#64748B", "#6B7280", "#94A3B8", "#9CA3AF", "#CBD5E1",
];

pub struct ProjectSeed {
    pub name: &'static str,
    pub tasks: &'static [&'static str],
}

pub struct UsecaseProfile {
    pub name: &'static str,
    pub categories: &'static [&'static str],
    pub tags: &'static [&'static str],
    pub projects: &'static [ProjectSeed],
}

pub static PROFILES: &[UsecaseProfile] = &[
    UsecaseProfile {
        name: "Developer",
        categories: &["Coding", "Planning", "Research"],
        tags: &["feature", "bug", "refactor", "deep-work"],
        projects: &[
            ProjectSeed {
                name: "Portfolio Website",
                tasks: &["Implement auth", "Write tests", "CORS fix"],
            },
            ProjectSeed {
                name: "Open Source Lib",
                tasks: &["API design", "CI setup"],
            },
        ],
    },
    UsecaseProfile {
        name: "Student",
        categories: &["Study", "Research", "Reading", "Writing"],
        tags: &["exam", "assignment", "deadline", "learning"],
        projects: &[
            ProjectSeed {
                name: "CS Thesis",
                tasks: &["Literature review", "Write ch.2"],
            },
            ProjectSeed {
                name: "ML Course",
                tasks: &["Study backprop", "Practice problems"],
            },
        ],
    },
    UsecaseProfile {
        name: "Fitness",
        categories: &["Exercise", "Health", "Meal Prep"],
        tags: &["workout", "cardio", "strength", "nutrition"],
        projects: &[
            ProjectSeed {
                name: "Marathon Training",
                tasks: &["Morning run", "Long run Sunday"],
            },
            ProjectSeed {
                name: "Weight Loss",
                tasks: &["Track macros", "Rest day yoga"],
            },
        ],
    },
    UsecaseProfile {
        name: "Creative",
        categories: &["Design", "Writing", "Research"],
        tags: &["draft", "revision", "feedback", "inspiration"],
        projects: &[
            ProjectSeed {
                name: "Personal Blog",
                tasks: &["Write intro post", "Edit ch.1"],
            },
            ProjectSeed {
                name: "Novel Draft",
                tasks: &["Outline plot", "Write ch.3"],
            },
        ],
    },
    UsecaseProfile {
        name: "Productivity",
        categories: &["Deep Work", "Admin", "Meetings", "Planning"],
        tags: &["urgent", "blocked", "needs-review", "delegated"],
        projects: &[
            ProjectSeed {
                name: "Q1 Goals",
                tasks: &["Weekly review", "Plan sprint"],
            },
            ProjectSeed {
                name: "Team Ops",
                tasks: &["1-on-1s", "Clear inbox"],
            },
        ],
    },
    UsecaseProfile {
        name: "Accountant",
        categories: &["Finance", "Admin", "Research"],
        tags: &["tax", "audit", "reconciliation", "deadline"],
        projects: &[
            ProjectSeed {
                name: "Annual Report",
                tasks: &["Reconcile accounts", "Review budget"],
            },
            ProjectSeed {
                name: "Tax Filing",
                tasks: &["Gather docs", "Client meeting"],
            },
        ],
    },
    UsecaseProfile {
        name: "MathAcademic",
        categories: &["Research", "Study", "Writing"],
        tags: &["theorem", "proof", "experiment", "publication"],
        projects: &[
            ProjectSeed {
                name: "Research Paper",
                tasks: &["Prove lemma", "Write abstract"],
            },
            ProjectSeed {
                name: "Course Prep",
                tasks: &["Lecture slides", "Assignment set"],
            },
        ],
    },
    UsecaseProfile {
        name: "HealthyLife",
        categories: &["Health", "Exercise", "Meal Prep", "Reading"],
        tags: &["sleep", "hydration", "mindfulness", "nutrition"],
        projects: &[
            ProjectSeed {
                name: "Morning Routine",
                tasks: &["Meditation", "Journaling"],
            },
            ProjectSeed {
                name: "Nutrition Plan",
                tasks: &["Meal prep Sunday", "Track water"],
            },
        ],
    },
];
