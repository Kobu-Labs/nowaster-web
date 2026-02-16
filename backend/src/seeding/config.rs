pub struct SandboxConfig;

impl SandboxConfig {
    // ── Pool management ──────────────────────────────────────────────────
    pub const GUEST_POOL_INITIAL_SIZE: usize = 100;
    pub const GUEST_POOL_REPLENISH_THRESHOLD: usize = 50;
    pub const GUEST_POOL_REPLENISH_BATCH_SIZE: usize = 100;
    pub const NPC_COUNT: usize = 10;

    // ── Guest profiles ───────────────────────────────────────────────────
    pub const GUEST_PROFILES_MIN: usize = 2;
    pub const GUEST_PROFILES_MAX: usize = 4;

    // ── Session history ──────────────────────────────────────────────────
    pub const GUEST_SESSION_HISTORY_WEEKS: u32 = 156; // 3 years
    pub const GUEST_SESSIONS_PER_WEEK_MIN: usize = 3;
    pub const GUEST_SESSIONS_PER_WEEK_MAX: usize = 6;

    // ── Session time bounds ──────────────────────────────────────────────
    pub const SESSION_START_HOUR_MIN: i64 = 7;
    pub const SESSION_START_HOUR_MAX: i64 = 21;
    pub const SESSION_DURATION_MIN_MINS: i64 = 30;
    pub const SESSION_DURATION_MAX_MINS: i64 = 240;

    // ── Session assignment weights (cumulative, 0.0–1.0) ─────────────────
    /// Probability that a session is assigned task + project
    pub const SESSION_TASK_PROJECT_WEIGHT: f64 = 0.6;
    /// Cumulative probability for project-only (remaining ~20% = category-only)
    pub const SESSION_PROJECT_WEIGHT: f64 = 0.8;

    /// Chance that an individual task is marked completed during initial seeding
    /// (before the guaranteed completed-project step runs)
    pub const TASK_INITIAL_COMPLETION_CHANCE: f64 = 0.3;

    // ── Session tags ─────────────────────────────────────────────────────
    pub const SESSION_TAG_CHANCE: f64 = 0.5;
    pub const SESSION_TAGS_MAX: usize = 2;

    // ── Completed-project feed event data ────────────────────────────────
    pub const TASK_COMPLETION_HOURS_MIN: f64 = 5.0;
    pub const TASK_COMPLETION_HOURS_MAX: f64 = 25.0;
    pub const PROJECT_TASK_MINUTES_MIN: f64 = 60.0;
    pub const PROJECT_TASK_MINUTES_MAX: f64 = 600.0;
    pub const PROJECT_TOTAL_SESSIONS_MIN: i64 = 20;
    pub const PROJECT_TOTAL_SESSIONS_MAX: i64 = 80;

    // ── Session template ─────────────────────────────────────────────────
    pub const TEMPLATE_HISTORY_WEEKS: i64 = 156;
    pub const TEMPLATE_FUTURE_WEEKS: i64 = 52;
    pub const TEMPLATE_FILL_PAST_WEEKS: u32 = 4;
    pub const TEMPLATE_RECURRING_MIN: usize = 3;
    pub const TEMPLATE_RECURRING_MAX: usize = 4;

    // ── NPC seeding ──────────────────────────────────────────────────────
    pub const NPC_SESSION_HISTORY_WEEKS: u32 = 13; // ~3 months
    pub const NPC_SESSIONS_PER_WEEK_MIN: usize = 2;
    pub const NPC_SESSIONS_PER_WEEK_MAX: usize = 4;
    pub const NPC_PROJECT_CHANCE: f64 = 0.5;
    pub const NPC_PROJECTS_MAX: usize = 2;
    pub const NPC_TASK_HOURS_MIN: f64 = 3.0;
    pub const NPC_TASK_HOURS_MAX: f64 = 20.0;
    pub const NPC_TASK_MINUTES_MIN: f64 = 60.0;
    pub const NPC_TASK_MINUTES_MAX: f64 = 400.0;
    pub const NPC_TOTAL_SESSIONS_MIN: i64 = 10;
    pub const NPC_TOTAL_SESSIONS_MAX: i64 = 50;

    // ── Bulk-insert chunk sizes ───────────────────────────────────────────
    pub const BULK_SESSION_CHUNK_SIZE: usize = 500;
    pub const BULK_TAG_LINK_CHUNK_SIZE: usize = 1000;
}
