export interface AvatarConfig {
  hatId: string;   // 'none' | 'wizard_hat' | 'grad_cap' | 'crown' | 'cap'
  petId: string;   // 'none' | 'cat' | 'owl' | 'dragon' | 'robot'
  themeId: string; // 'default' | 'space' | 'jungle' | 'neon' | 'gold'
}

export interface AccessoryItem {
  id: string;
  name: string;
  category: 'hat' | 'pet' | 'theme';
  icon: string;
  requiredPoints: number;
  description: string;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'math' | 'english' | 'cognition' | 'streak' | 'general';
  unlockedAt?: string;
}
