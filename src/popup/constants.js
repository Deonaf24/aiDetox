export const DEFAULT_DAILY_GOAL = 10;

export const STORAGE_KEYS = {
  usesBeforePrompt: "aidetox_uses_before_prompt",
  limitPeriod: "aidetox_limit_period",
  alwaysAsk: "aidetox_always_ask",
  unlockDelay: "aidetox_unlock_delay",
  minChars: "aidetox_min_chars",
  checkReason: "aidetox_check_reason",
  dailyGoal: "aidetox_daily_goal",
};

export const DEFAULT_SETTINGS = {
  usesBeforePrompt: 0,
  limitPeriod: "hour",
  alwaysAsk: false,
  unlockDelay: 10,
  minChars: 10,
  checkReason: false,
  dailyGoal: DEFAULT_DAILY_GOAL,
};

export const FN_LEADERBOARDS = (supabaseUrl) => `${supabaseUrl}/functions/v1/leaderboards`;
