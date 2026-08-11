import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, Dimensions, Animated, Easing,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { UserProvider, useUser } from './store/userStore';
import { RewardProvider, useRewards } from './rewards/RewardContext';
import GameLauncher from './shared/GameLauncher';
import { GameConfig, GameCategory } from './games/types/game';
import { SoundManager } from './shared/SoundManager';

const { width: SW } = Dimensions.get('window');
const CARD_W = (SW - 48) / 2;

// ─── 23 Game Catalog ──────────────────────────────────────────────────────────
export const ALL_GAMES: GameConfig[] = [
  // ── Ages 3-5 (Preschool) ──────────────────────────────────────────────────
  {
    id: 'shape-match',
    engine: 'dragdrop',
    title: 'Shape Match Adventure',
    ageGroup: '3-5',
    difficulty: 'easy',
    category: 'preschool',
    icon: '🔷',
    rewardPoints: 50,
    timeLimit: 90,
    themeColors: { primary: '#FF7043', secondary: '#FFE0B2', background: '#FFF3E0', accent: '#FF9800' },
    initialData: { variant: 'shapes' },
  },
  {
    id: 'color-pop',
    engine: 'tappop',
    title: 'Color Pop Balloons',
    ageGroup: '3-5',
    difficulty: 'easy',
    category: 'preschool',
    icon: '🎈',
    rewardPoints: 60,
    timeLimit: 60,
    themeColors: { primary: '#E91E63', secondary: '#FCE4EC', background: '#FFF0F5', accent: '#FF4081' },
  },
  {
    id: 'animal-sound-quiz',
    engine: 'quiz',
    title: 'Animal Sound Quiz',
    ageGroup: '3-5',
    difficulty: 'easy',
    category: 'preschool',
    icon: '🦁',
    rewardPoints: 50,
    timeLimit: 60,
    themeColors: { primary: '#8BC34A', secondary: '#DCEDC8', background: '#F1F8E9', accent: '#4CAF50' },
    initialData: { variant: 'sound' },
  },
  {
    id: 'emotion-faces',
    engine: 'dragdrop',
    title: 'Emotion Faces',
    ageGroup: '3-5',
    difficulty: 'easy',
    category: 'preschool',
    icon: '😊',
    rewardPoints: 50,
    themeColors: { primary: '#FF9800', secondary: '#FFE0B2', background: '#FFFDE7', accent: '#FFC107' },
    initialData: { variant: 'emotions' },
  },
  {
    id: 'healthy-plate',
    engine: 'dragdrop',
    title: 'Healthy Plate Builder',
    ageGroup: '3-5',
    difficulty: 'easy',
    category: 'preschool',
    icon: '🥗',
    rewardPoints: 60,
    themeColors: { primary: '#4CAF50', secondary: '#C8E6C9', background: '#F1F8E9', accent: '#66BB6A' },
    initialData: { variant: 'healthyplate' },
  },
  // ── Ages 6-8 (Elementary) ─────────────────────────────────────────────────
  {
    id: 'math-runner',
    engine: 'mathrunner',
    title: 'Math Hero Dash',
    ageGroup: '6-8',
    difficulty: 'medium',
    category: 'elementary',
    icon: '➕',
    rewardPoints: 100,
    timeLimit: 120,
    themeColors: { primary: '#1565C0', secondary: '#BBDEFB', background: '#E3F2FD', accent: '#2196F3' },
  },
  {
    id: 'word-builder',
    engine: 'wordbuilder',
    title: 'Word Builder Blocks',
    ageGroup: '6-8',
    difficulty: 'medium',
    category: 'elementary',
    icon: '📝',
    rewardPoints: 100,
    timeLimit: 120,
    themeColors: { primary: '#6A1B9A', secondary: '#E1BEE7', background: '#F3E5F5', accent: '#9C27B0' },
  },
  {
    id: 'memory-flip',
    engine: 'memory',
    title: 'Memory Flip Quest',
    ageGroup: '6-8',
    difficulty: 'medium',
    category: 'elementary',
    icon: '🃏',
    rewardPoints: 100,
    timeLimit: 120,
    themeColors: { primary: '#00695C', secondary: '#B2DFDB', background: '#E0F2F1', accent: '#009688' },
  },
  {
    id: 'hygiene-hero',
    engine: 'sequence',
    title: 'Hygiene Hero',
    ageGroup: '6-8',
    difficulty: 'easy',
    category: 'elementary',
    icon: '🪥',
    rewardPoints: 80,
    themeColors: { primary: '#0288D1', secondary: '#B3E5FC', background: '#E1F5FE', accent: '#03A9F4' },
  },
  {
    id: 'quiz-spinner',
    engine: 'quiz',
    title: 'Quiz Spinner',
    ageGroup: '6-8',
    difficulty: 'medium',
    category: 'elementary',
    icon: '🎡',
    rewardPoints: 100,
    timeLimit: 90,
    themeColors: { primary: '#F57C00', secondary: '#FFE0B2', background: '#FFF8E1', accent: '#FF9800' },
    initialData: { variant: 'spinner' },
  },
  // ── Ages 9-12 (Pre-Teen) ──────────────────────────────────────────────────
  {
    id: 'logic-grid',
    engine: 'logicgrid',
    title: 'Logic Grid Puzzle',
    ageGroup: '9-12',
    difficulty: 'hard',
    category: 'preteen',
    icon: '🔎',
    rewardPoints: 150,
    timeLimit: 300,
    themeColors: { primary: '#37474F', secondary: '#CFD8DC', background: '#ECEFF1', accent: '#607D8B' },
  },
  {
    id: 'eco-city',
    engine: 'citybuilder',
    title: 'Eco City Builder',
    ageGroup: '9-12',
    difficulty: 'medium',
    category: 'preteen',
    icon: '🏙️',
    rewardPoints: 120,
    themeColors: { primary: '#2E7D32', secondary: '#C8E6C9', background: '#F1F8E9', accent: '#43A047' },
  },
  {
    id: 'coding-maze',
    engine: 'codinglite',
    title: 'Coding Lite Maze',
    ageGroup: '9-12',
    difficulty: 'medium',
    category: 'preteen',
    icon: '💻',
    rewardPoints: 150,
    themeColors: { primary: '#1A237E', secondary: '#C5CAE9', background: '#E8EAF6', accent: '#3F51B5' },
  },
  {
    id: 'finance-fun',
    engine: 'finance',
    title: 'Finance Fun',
    ageGroup: '9-12',
    difficulty: 'medium',
    category: 'preteen',
    icon: '💰',
    rewardPoints: 120,
    themeColors: { primary: '#E65100', secondary: '#FFE0B2', background: '#FFF3E0', accent: '#FF6D00' },
  },
  {
    id: 'trivia-battle',
    engine: 'quiz',
    title: 'Trivia Battle',
    ageGroup: '9-12',
    difficulty: 'hard',
    category: 'preteen',
    icon: '🏆',
    rewardPoints: 150,
    timeLimit: 60,
    themeColors: { primary: '#880E4F', secondary: '#F8BBD9', background: '#FCE4EC', accent: '#E91E63' },
    initialData: { variant: 'battle' },
  },
  // ── Puzzles ───────────────────────────────────────────────────────────────
  {
    id: 'jigsaw',
    engine: 'jigsaw',
    title: 'Jigsaw World',
    ageGroup: '6-8',
    difficulty: 'medium',
    category: 'puzzle',
    icon: '🧩',
    rewardPoints: 120,
    themeColors: { primary: '#AD1457', secondary: '#F8BBD9', background: '#FCE4EC', accent: '#E91E63' },
  },
  {
    id: 'pattern-unlock',
    engine: 'pattern',
    title: 'Pattern Unlock',
    ageGroup: '6-8',
    difficulty: 'medium',
    category: 'puzzle',
    icon: '🔮',
    rewardPoints: 100,
    timeLimit: 120,
    themeColors: { primary: '#4527A0', secondary: '#D1C4E9', background: '#EDE7F6', accent: '#673AB7' },
  },
  {
    id: 'maze-escape',
    engine: 'maze',
    title: 'Maze Escape',
    ageGroup: '6-8',
    difficulty: 'medium',
    category: 'puzzle',
    icon: '🌀',
    rewardPoints: 100,
    themeColors: { primary: '#006064', secondary: '#B2EBF2', background: '#E0F7FA', accent: '#00BCD4' },
  },
  {
    id: 'spot-diff',
    engine: 'spotdiff',
    title: 'Spot the Difference',
    ageGroup: '6-8',
    difficulty: 'medium',
    category: 'puzzle',
    icon: '🔍',
    rewardPoints: 100,
    timeLimit: 120,
    themeColors: { primary: '#1B5E20', secondary: '#C8E6C9', background: '#F1F8E9', accent: '#4CAF50' },
  },
  {
    id: 'sudoku',
    engine: 'sudoku',
    title: 'Sudoku Junior',
    ageGroup: '9-12',
    difficulty: 'hard',
    category: 'puzzle',
    icon: '🔢',
    rewardPoints: 150,
    timeLimit: 300,
    themeColors: { primary: '#1A237E', secondary: '#C5CAE9', background: '#E8EAF6', accent: '#5C6BC0' },
  },
  // ── Wellness ──────────────────────────────────────────────────────────────
  {
    id: 'water-tracker',
    engine: 'watertracker',
    title: 'Water Tracker Quest',
    ageGroup: '6-8',
    difficulty: 'easy',
    category: 'wellness',
    icon: '💧',
    rewardPoints: 80,
    themeColors: { primary: '#0277BD', secondary: '#B3E5FC', background: '#E1F5FE', accent: '#039BE5' },
  },
  {
    id: 'sleep-guardian',
    engine: 'sleepguardian',
    title: 'Sleep Guardian',
    ageGroup: '6-8',
    difficulty: 'easy',
    category: 'wellness',
    icon: '🌙',
    rewardPoints: 80,
    themeColors: { primary: '#283593', secondary: '#C5CAE9', background: '#E8EAF6', accent: '#5C6BC0' },
  },
  {
    id: 'breathing',
    engine: 'breathing',
    title: 'Breathing Balloon',
    ageGroup: '3-5',
    difficulty: 'easy',
    category: 'wellness',
    icon: '🫧',
    rewardPoints: 60,
    themeColors: { primary: '#00796B', secondary: '#B2DFDB', background: '#E0F2F1', accent: '#26A69A' },
  },
];

// ─── Category Filter Tabs ─────────────────────────────────────────────────────
type FilterTab = 'all' | GameCategory;

const TABS: { key: FilterTab; label: string; emoji: string; color: string }[] = [
  { key: 'all',        label: 'All Games', emoji: '🎮', color: '#4A90E2' },
  { key: 'preschool',  label: 'Ages 3-5',  emoji: '🌈', color: '#FF7043' },
  { key: 'elementary', label: 'Ages 6-8',  emoji: '⭐', color: '#1565C0' },
  { key: 'preteen',    label: 'Ages 9-12', emoji: '🚀', color: '#880E4F' },
  { key: 'puzzle',     label: 'Puzzles',   emoji: '🧩', color: '#4527A0' },
  { key: 'wellness',   label: 'Wellness',  emoji: '💚', color: '#2E7D32' },
];

const CAT_COLOR: Record<string, string> = {
  preschool: '#FF7043', elementary: '#1565C0',
  preteen: '#880E4F', puzzle: '#4527A0', wellness: '#2E7D32',
};

// ─── Completion Screen with Sparkles & Sound ─────────────────────────────────
const SPARKLE_EMOJIS = ['✨', '🌟', '⭐', '🎉', '🎊', '💫', '🏆', '🥳', '🌈', '💖'];
const NUM_SPARKLES = 12;

const CompletionScreen = ({
  score, game, onBack,
}: { score: number; game: GameConfig; onBack: () => void }) => {
  const stars = score >= game.rewardPoints ? 3 : score >= game.rewardPoints * 0.6 ? 2 : 1;
  const msgs = ['Good Try! 💪', 'Nice Work! 🌟', 'Amazing! 🎉'];

  // Play win sound on mount
  const hasPlayedSound = useRef(false);
  useEffect(() => {
    if (!hasPlayedSound.current) {
      hasPlayedSound.current = true;
      SoundManager.play('win');
    }
  }, []);

  // Card entrance animation
  const cardScale = useRef(new Animated.Value(0.3)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  // Star animations (pop in one by one)
  const starAnims = useRef([1, 2, 3].map(() => new Animated.Value(0))).current;

  // Sparkle animations
  const sparkleAnims = useRef(
    Array.from({ length: NUM_SPARKLES }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
      rotation: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // 1. Card pops in
    Animated.parallel([
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: false,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();

    // 2. Stars pop in sequentially
    const starDelay = 400;
    starAnims.forEach((anim, idx) => {
      if (idx < stars) {
        setTimeout(() => {
          Animated.spring(anim, {
            toValue: 1,
            friction: 4,
            tension: 100,
            useNativeDriver: false,
          }).start();
        }, starDelay + idx * 250);
      }
    });

    // 3. Sparkles burst outward
    sparkleAnims.forEach((sp, idx) => {
      const angle = (idx / NUM_SPARKLES) * Math.PI * 2;
      const dist = 100 + Math.random() * 80;
      const delay = 200 + Math.random() * 600;

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(sp.x, {
            toValue: Math.cos(angle) * dist,
            duration: 1200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(sp.y, {
            toValue: Math.sin(angle) * dist - 40,
            duration: 1200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.sequence([
            Animated.timing(sp.opacity, { toValue: 1, duration: 200, useNativeDriver: false }),
            Animated.timing(sp.opacity, { toValue: 0, duration: 1000, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.spring(sp.scale, { toValue: 1.2, friction: 4, useNativeDriver: false }),
            Animated.timing(sp.scale, { toValue: 0, duration: 800, useNativeDriver: false }),
          ]),
          Animated.timing(sp.rotation, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: false,
          }),
        ]).start();
      }, delay);
    });
  }, []);

  return (
    <View style={cs.bg}>
      {/* Sparkles layer */}
      {sparkleAnims.map((sp, idx) => {
        const rot = sp.rotation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${180 + Math.random() * 180}deg`],
        });
        return (
          <Animated.Text
            key={idx}
            style={{
              position: 'absolute',
              fontSize: 24 + Math.random() * 12,
              opacity: sp.opacity,
              transform: [
                { translateX: sp.x },
                { translateY: sp.y },
                { scale: sp.scale },
                { rotate: rot },
              ],
            }}
          >
            {SPARKLE_EMOJIS[idx % SPARKLE_EMOJIS.length]}
          </Animated.Text>
        );
      })}

      <Animated.View style={[
        cs.card,
        { borderTopColor: game.themeColors.primary },
        { transform: [{ scale: cardScale }], opacity: cardOpacity },
      ]}>
        <Text style={cs.gameIcon}>{game.icon}</Text>
        <Text style={cs.title}>{msgs[stars - 1]}</Text>
        <View style={cs.starsRow}>
          {[1, 2, 3].map(i => (
            <Animated.Text
              key={i}
              style={[
                cs.star,
                i <= stars && cs.starLit,
                {
                  transform: [{ scale: i <= stars ? starAnims[i - 1] : 1 }],
                  opacity: i <= stars ? starAnims[i - 1] : 0.3,
                },
              ]}
            >
              {i <= stars ? '⭐' : '☆'}
            </Animated.Text>
          ))}
        </View>
        <View style={[cs.scoreBubble, { backgroundColor: game.themeColors.background }]}>
          <Text style={cs.scoreLabel}>Score</Text>
          <Text style={[cs.scoreVal, { color: game.themeColors.primary }]}>{score}</Text>
        </View>
        <Text style={cs.pointsMsg}>+{score} points earned!</Text>
        <TouchableOpacity
          style={[cs.backBtn, { backgroundColor: game.themeColors.primary }]}
          onPress={onBack}
        >
          <Text style={cs.backBtnText}>Back to Menu 🏠</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// ─── Game Card ────────────────────────────────────────────────────────────────
const GameCard = ({
  game, unlocked, onPress,
}: { game: GameConfig; unlocked: boolean; onPress: () => void }) => {
  const catColor = CAT_COLOR[game.category] || '#555';
  return (
    <TouchableOpacity
      style={[gc.card, { borderTopColor: game.themeColors.primary }]}
      onPress={onPress}
      activeOpacity={unlocked ? 0.75 : 1}
    >
      {!unlocked && (
        <View style={gc.lockOverlay}>
          <Text style={gc.lockEmoji}>🔒</Text>
          <Text style={gc.lockText}>Complete a habit!</Text>
        </View>
      )}
      <View style={[gc.iconBg, { backgroundColor: game.themeColors.secondary }]}>
        <Text style={gc.icon}>{game.icon}</Text>
      </View>
      <Text style={gc.title} numberOfLines={2}>{game.title}</Text>
      <View style={[gc.ageBadge, { backgroundColor: catColor + '20', borderColor: catColor + '60' }]}>
        <Text style={[gc.ageBadgeText, { color: catColor }]}>{game.ageGroup}</Text>
      </View>
      <Text style={[gc.pts, { color: game.themeColors.primary }]}>+{game.rewardPoints} pts</Text>
    </TouchableOpacity>
  );
};

// ─── Daily Habits Strip ───────────────────────────────────────────────────────
const HABITS = [
  { id: 'brush-teeth', label: 'Brush Teeth', emoji: '🦷' },
  { id: 'drink-water', label: 'Drink Water', emoji: '💧' },
  { id: 'sleep-time',  label: 'Sleep Time',  emoji: '🌙' },
  { id: 'read-book',   label: 'Read a Book', emoji: '📚' },
  { id: 'exercise',    label: 'Exercise',    emoji: '🏃' },
];

// ─── Main Menu ────────────────────────────────────────────────────────────────
const MainMenu = ({ onSelectGame }: { onSelectGame: (g: GameConfig) => void }) => {
  const { points } = useUser();
  const { completedHabitIds, completeHabit, isGameUnlocked } = useRewards();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const filteredGames = activeTab === 'all'
    ? ALL_GAMES
    : ALL_GAMES.filter(g => g.category === activeTab);

  const doneCount = completedHabitIds.filter(id => HABITS.some(h => h.id === id)).length;

  return (
    <SafeAreaView style={mm.safe}>
      {/* Hero Header */}
      <View style={mm.heroHeader}>
        <View style={mm.heroLeft}>
          <Text style={mm.heroTitle}>Habit Hero 🦸</Text>
          <Text style={mm.heroSub}>
            {doneCount === 0
              ? 'Complete habits to unlock games!'
              : doneCount < HABITS.length
              ? `${doneCount}/${HABITS.length} habits done today!`
              : 'All habits done! Amazing! 🌟'}
          </Text>
        </View>
        <View style={mm.pointsBubble}>
          <Text style={mm.pointsNum}>{points}</Text>
          <Text style={mm.pointsUnit}>⭐ pts</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={mm.scroll}>
        {/* Daily Habits */}
        <View style={mm.section}>
          <Text style={mm.sectionTitle}>Today's Habits</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={mm.habitRow}>
            {HABITS.map(h => {
              const done = completedHabitIds.includes(h.id);
              return (
                <TouchableOpacity
                  key={h.id}
                  style={[mm.habitChip, done && mm.habitDone]}
                  onPress={() => completeHabit(h.id)}
                >
                  <Text style={mm.habitEmoji}>{h.emoji}</Text>
                  <Text style={[mm.habitLabel, done && mm.habitLabelDone]}>{h.label}</Text>
                  {done && <Text style={mm.checkMark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Category Tabs */}
        <View style={mm.section}>
          <Text style={mm.sectionTitle}>Mini Games ({filteredGames.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={mm.tabRow}>
            {TABS.map(tab => {
              const active = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[mm.tab, active && { backgroundColor: tab.color, borderColor: tab.color }]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Text style={mm.tabEmoji}>{tab.emoji}</Text>
                  <Text style={[mm.tabLabel, active && mm.tabLabelActive]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 2-Column Game Grid */}
        <View style={mm.grid}>
          {filteredGames.map(game => (
            <GameCard
              key={game.id}
              game={game}
              unlocked={isGameUnlocked(game.id)}
              onPress={() => {
                if (isGameUnlocked(game.id)) onSelectGame(game);
              }}
            />
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Game Screen Wrapper ──────────────────────────────────────────────────────
const GameScreenWrapper = ({
  game, onComplete, onBack,
}: { game: GameConfig; onComplete: (s: number) => void; onBack: () => void }) => {
  const { addPoints } = useUser();
  const handleComplete = (score: number) => {
    addPoints(score);
    onComplete(score);
  };
  return <GameLauncher gameConfig={game} onComplete={handleComplete} onExit={onBack} />;
};

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activeGame, setActiveGame] = useState<GameConfig | null>(null);
  const [lastResult, setLastResult] = useState<{ score: number; game: GameConfig } | null>(null);

  return (
    <UserProvider>
      <RewardProvider>
        <View style={{ flex: 1, backgroundColor: '#F8F9FF' }}>
          <StatusBar style="auto" />
          {lastResult ? (
            <CompletionScreen
              score={lastResult.score}
              game={lastResult.game}
              onBack={() => { setLastResult(null); setActiveGame(null); }}
            />
          ) : activeGame ? (
            <GameScreenWrapper
              game={activeGame}
              onComplete={score => setLastResult({ score, game: activeGame })}
              onBack={() => setActiveGame(null)}
            />
          ) : (
            <MainMenu onSelectGame={setActiveGame} />
          )}
        </View>
      </RewardProvider>
    </UserProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const mm = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FF' },
  scroll: { flex: 1 },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 18,
    paddingTop: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroLeft:      { flex: 1, marginRight: 12 },
  heroTitle:     { fontSize: 26, fontWeight: '900', color: '#FFF' },
  heroSub:       { fontSize: 12, color: '#DDEEFF', marginTop: 3 },
  pointsBubble:  { backgroundColor: '#FFF', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', minWidth: 72 },
  pointsNum:     { fontSize: 22, fontWeight: '900', color: '#F57C00' },
  pointsUnit:    { fontSize: 11, color: '#999', marginTop: -2 },
  section:       { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle:  { fontSize: 17, fontWeight: '800', color: '#222', marginBottom: 12 },
  habitRow:      { gap: 10, paddingBottom: 4 },
  habitChip:     {
    alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1.5,
    borderColor: '#DDD', minWidth: 86, gap: 3,
  },
  habitDone:       { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  habitEmoji:      { fontSize: 22 },
  habitLabel:      { fontSize: 11, fontWeight: '600', color: '#555', textAlign: 'center' },
  habitLabelDone:  { color: '#2E7D32' },
  checkMark:       { fontSize: 11, color: '#4CAF50', fontWeight: '900' },
  tabRow:          { gap: 8, paddingBottom: 4 },
  tab:             {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E0E0E0',
  },
  tabEmoji:        { fontSize: 15 },
  tabLabel:        { fontSize: 12, fontWeight: '700', color: '#555' },
  tabLabelActive:  { color: '#FFF' },
  grid:            { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, paddingTop: 12 },
});

const gc = StyleSheet.create({
  card: {
    width: CARD_W, backgroundColor: '#FFF', borderRadius: 20, padding: 14,
    alignItems: 'center', borderTopWidth: 5,
    elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8,
    overflow: 'hidden',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.85)',
    zIndex: 10, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  lockEmoji:     { fontSize: 28 },
  lockText:      { fontSize: 10, color: '#888', fontWeight: '600', textAlign: 'center', paddingHorizontal: 8 },
  iconBg:        { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  icon:          { fontSize: 36 },
  title:         { fontSize: 13, fontWeight: '800', color: '#222', textAlign: 'center', marginBottom: 7, lineHeight: 17 },
  ageBadge:      { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, marginBottom: 6 },
  ageBadgeText:  { fontSize: 10, fontWeight: '700' },
  pts:           { fontSize: 12, fontWeight: '700' },
});

const cs = StyleSheet.create({
  bg:          { flex: 1, backgroundColor: 'rgba(30,30,60,0.88)', alignItems: 'center', justifyContent: 'center' },
  card:        {
    backgroundColor: '#FFF', borderRadius: 28, padding: 32, alignItems: 'center',
    width: SW * 0.86, borderTopWidth: 6,
    elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12,
  },
  gameIcon:    { fontSize: 52, marginBottom: 8 },
  title:       { fontSize: 24, fontWeight: '900', color: '#222', marginBottom: 16 },
  starsRow:    { flexDirection: 'row', gap: 6, marginBottom: 20 },
  star:        { fontSize: 36, color: '#DDD' },
  starLit:     { color: '#FFC107' },
  scoreBubble: { borderRadius: 20, paddingHorizontal: 32, paddingVertical: 12, alignItems: 'center', marginBottom: 12 },
  scoreLabel:  { fontSize: 13, color: '#888', fontWeight: '600' },
  scoreVal:    { fontSize: 52, fontWeight: '900', lineHeight: 60 },
  pointsMsg:   { fontSize: 17, fontWeight: '700', color: '#4CAF50', marginBottom: 24 },
  backBtn:     { borderRadius: 30, paddingHorizontal: 36, paddingVertical: 15 },
  backBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
});
