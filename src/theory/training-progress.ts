// src/theory/training-progress.ts

export interface TrainingBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface TrainingStats {
  xp: number;
  level: number;
  streak: number;
  bestStreak: number;
  completedQuizzes: number;
  melodiesPracticed: number;
  recordingsMade: number;
  lastActiveDate: string;
  unlockedBadgeIds: string[];
}

export const INITIAL_BADGES: TrainingBadge[] = [
  {
    id: 'first_step',
    title: 'First Note (البداية)',
    description: 'Complete your first practice or quiz exercise',
    icon: '🎯',
    unlocked: false
  },
  {
    id: 'streak_5',
    title: 'Rhythmic Focus (تركيز الإيقاع)',
    description: 'Answer 5 memorization questions correctly in a row',
    icon: '🔥',
    unlocked: false
  },
  {
    id: 'streak_15',
    title: 'Maestro Streak (أستاذ المقامات)',
    description: 'Answer 15 questions correctly in a row',
    icon: '⚡',
    unlocked: false
  },
  {
    id: 'quarter_tone_ear',
    title: 'Sikah Specialist (أذن السيكاه)',
    description: 'Score 100% on quarter-tone interval ear training',
    icon: '👂',
    unlocked: false
  },
  {
    id: 'sight_reader',
    title: 'Prima Vista (قارئ النوتة)',
    description: 'Generate and review 5 sight-reading melodies',
    icon: '🎼',
    unlocked: false
  },
  {
    id: 'recording_artist',
    title: 'Taqsim Recordist (عازف التسجيل)',
    description: 'Record 3 performance takes with A/B comparison',
    icon: '🎙️',
    unlocked: false
  },
  {
    id: 'rast_virtuoso',
    title: 'Rast Master (سيّد الرست)',
    description: 'Master the scale degrees of Maqam Rast',
    icon: '👑',
    unlocked: false
  },
  {
    id: 'bayati_virtuoso',
    title: 'Bayati Heart (روح البياتي)',
    description: 'Master the scale degrees of Maqam Bayati',
    icon: '🌙',
    unlocked: false
  }
];

const STORAGE_KEY = 'arabic_maqamat_training_stats_v1';

export class TrainingStorage {
  public static getStats(): TrainingStats {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // safe fallback
    }

    return {
      xp: 0,
      level: 1,
      streak: 0,
      bestStreak: 0,
      completedQuizzes: 0,
      melodiesPracticed: 0,
      recordingsMade: 0,
      lastActiveDate: new Date().toISOString().split('T')[0],
      unlockedBadgeIds: []
    };
  }

  public static saveStats(stats: TrainingStats): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // safe fallback
    }
  }

  public static addXp(amount: number, stats: TrainingStats): TrainingStats {
    const newXp = stats.xp + amount;
    const newLevel = Math.floor(newXp / 100) + 1;
    const updated = {
      ...stats,
      xp: newXp,
      level: newLevel
    };
    this.saveStats(updated);
    return updated;
  }

  public static updateStreak(correct: boolean, stats: TrainingStats): TrainingStats {
    const today = new Date().toISOString().split('T')[0];
    const newStreak = correct ? stats.streak + 1 : 0;
    const newBest = Math.max(stats.bestStreak, newStreak);
    const updated = {
      ...stats,
      streak: newStreak,
      bestStreak: newBest,
      lastActiveDate: today
    };

    // Check badges
    const newBadges = [...stats.unlockedBadgeIds];
    if (newStreak >= 5 && !newBadges.includes('streak_5')) {
      newBadges.push('streak_5');
    }
    if (newStreak >= 15 && !newBadges.includes('streak_15')) {
      newBadges.push('streak_15');
    }
    updated.unlockedBadgeIds = newBadges;

    this.saveStats(updated);
    return updated;
  }
}
