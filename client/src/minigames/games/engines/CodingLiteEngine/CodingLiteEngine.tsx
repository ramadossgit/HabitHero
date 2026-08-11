import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { GameProps } from '../../types/game';
import GameShell from '../../../shared/GameShell';
import { SoundManager } from '../../../shared/SoundManager';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Direction = 'up' | 'down' | 'left' | 'right';

interface Position {
  row: number;
  col: number;
}

interface Level {
  name: string;
  maxCommands: number;
  hint: string;
  grid: number[][];
  start: Position;
  goal: Position;
}

// ---------------------------------------------------------------------------
// Cell convention: 0 = path/walkable, 1 = wall, 2 = start, 3 = goal
// ---------------------------------------------------------------------------
const levels: Level[] = [
  {
    name: 'First Steps',
    maxCommands: 6,
    hint: 'Go down, then right!',
    grid: [
      [2, 0, 1, 1, 1],
      [0, 0, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 0, 1],
      [1, 1, 1, 3, 1],
    ],
    start: { row: 0, col: 0 },
    goal: { row: 4, col: 3 },
  },
  {
    name: 'Zigzag',
    maxCommands: 8,
    hint: 'Follow the path!',
    grid: [
      [2, 1, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [1, 0, 0, 0, 1],
      [1, 0, 1, 1, 1],
      [1, 0, 0, 0, 3],
    ],
    start: { row: 0, col: 0 },
    goal: { row: 4, col: 4 },
  },
  {
    name: 'Around the Block',
    maxCommands: 8,
    hint: 'Go around the walls!',
    grid: [
      [2, 0, 0, 0, 1],
      [1, 1, 1, 0, 1],
      [1, 1, 1, 0, 1],
      [1, 1, 1, 0, 1],
      [1, 0, 0, 0, 3],
    ],
    start: { row: 0, col: 0 },
    goal: { row: 4, col: 4 },
  },
  {
    name: 'Snake Path',
    maxCommands: 12,
    hint: 'Wind through!',
    grid: [
      [2, 0, 0, 0, 1],
      [1, 1, 1, 0, 1],
      [0, 0, 0, 0, 1],
      [0, 1, 1, 1, 1],
      [0, 0, 0, 0, 3],
    ],
    start: { row: 0, col: 0 },
    goal: { row: 4, col: 4 },
  },
];

// ---------------------------------------------------------------------------
// Direction helpers
// ---------------------------------------------------------------------------
const DIRECTION_EMOJI: Record<Direction, string> = {
  up: '\u2B06\uFE0F',
  down: '\u2B07\uFE0F',
  left: '\u2B05\uFE0F',
  right: '\u27A1\uFE0F',
};

const DIRECTION_COLOR: Record<Direction, string> = {
  up: '#1E88E5',
  down: '#43A047',
  left: '#FB8C00',
  right: '#8E24AA',
};

const DIRECTION_DELTA: Record<Direction, Position> = {
  up: { row: -1, col: 0 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
  right: { row: 0, col: 1 },
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_SIZE = 5;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 60) / GRID_SIZE);
const CELL_GAP = 3;
const STEP_DURATION = 300;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const CodingLiteEngine = ({ game, onComplete, onExit }: GameProps) => {
  const colors = game.themeColors || {
    primary: '#1565C0',
    secondary: '#BBDEFB',
    background: '#E3F2FD',
    accent: '#4CAF50',
  };

  // -- State ----------------------------------------------------------------
  const [levelIndex, setLevelIndex] = useState(0);
  const [commands, setCommands] = useState<Direction[]>([]);
  const [playerPos, setPlayerPos] = useState<Position>(levels[0].start);
  const [isRunning, setIsRunning] = useState(false);
  const [executingIndex, setExecutingIndex] = useState<number | null>(null);
  const [errorIndex, setErrorIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'error' | 'success' | 'info'>('info');
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  // -- Refs -----------------------------------------------------------------
  const playerAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const goalScale = useRef(new Animated.Value(1)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const celebrationScale = useRef(new Animated.Value(0)).current;

  const currentLevel = levels[levelIndex];
  const isRunningRef = useRef(false);

  // -- Goal pulse animation -------------------------------------------------
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(goalScale, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(goalScale, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: false,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [goalScale]);

  // -- Reset level ----------------------------------------------------------
  const resetLevel = useCallback(
    (lvlIdx: number) => {
      const lvl = levels[lvlIdx];
      setCommands([]);
      setPlayerPos(lvl.start);
      setIsRunning(false);
      isRunningRef.current = false;
      setExecutingIndex(null);
      setErrorIndex(null);
      setMessage(null);
      playerAnim.setValue({
        x: lvl.start.col * (CELL_SIZE + CELL_GAP),
        y: lvl.start.row * (CELL_SIZE + CELL_GAP),
      });
    },
    [playerAnim],
  );

  // -- Initialize player position on level change --------------------------
  useEffect(() => {
    resetLevel(levelIndex);
  }, [levelIndex, resetLevel]);

  // -- Check walkable -------------------------------------------------------
  const isWalkable = (row: number, col: number, grid: number[][]): boolean => {
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return false;
    const cell = grid[row][col];
    return cell === 0 || cell === 2 || cell === 3;
  };

  // -- Add command ----------------------------------------------------------
  const addCommand = (dir: Direction) => {
    if (isRunning || commands.length >= currentLevel.maxCommands) return;
    setCommands((prev) => [...prev, dir]);
    setMessage(null);
    setErrorIndex(null);
  };

  // -- Remove command -------------------------------------------------------
  const removeCommand = (index: number) => {
    if (isRunning) return;
    setCommands((prev) => prev.filter((_, i) => i !== index));
    setMessage(null);
    setErrorIndex(null);
  };

  // -- Clear all commands ---------------------------------------------------
  const clearCommands = () => {
    if (isRunning) return;
    setCommands([]);
    setMessage(null);
    setErrorIndex(null);
    resetLevel(levelIndex);
  };

  // -- Show message ---------------------------------------------------------
  const showMessage = (text: string, type: 'error' | 'success' | 'info') => {
    setMessage(text);
    setMessageType(type);
    messageOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(messageOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.delay(2000),
      Animated.timing(messageOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }),
    ]).start(() => {
      if (!isRunningRef.current) {
        setMessage(null);
      }
    });
  };

  // -- Animate shake --------------------------------------------------------
  const animateShake = (): Promise<void> => {
    return new Promise((resolve) => {
      Animated.sequence([
        Animated.timing(shakeX, { toValue: 8, duration: 50, useNativeDriver: false }),
        Animated.timing(shakeX, { toValue: -8, duration: 50, useNativeDriver: false }),
        Animated.timing(shakeX, { toValue: 6, duration: 50, useNativeDriver: false }),
        Animated.timing(shakeX, { toValue: -6, duration: 50, useNativeDriver: false }),
        Animated.timing(shakeX, { toValue: 0, duration: 50, useNativeDriver: false }),
      ]).start(() => resolve());
    });
  };

  // -- Animate move ---------------------------------------------------------
  const animateMove = (toPos: Position): Promise<void> => {
    return new Promise((resolve) => {
      Animated.timing(playerAnim, {
        toValue: {
          x: toPos.col * (CELL_SIZE + CELL_GAP),
          y: toPos.row * (CELL_SIZE + CELL_GAP),
        },
        duration: STEP_DURATION,
        useNativeDriver: false,
      }).start(() => resolve());
    });
  };

  // -- Animate bounce back --------------------------------------------------
  const animateBounceBack = (fromPos: Position, badPos: Position): Promise<void> => {
    return new Promise((resolve) => {
      const midX =
        (fromPos.col * (CELL_SIZE + CELL_GAP) + badPos.col * (CELL_SIZE + CELL_GAP)) / 2;
      const midY =
        (fromPos.row * (CELL_SIZE + CELL_GAP) + badPos.row * (CELL_SIZE + CELL_GAP)) / 2;

      Animated.sequence([
        Animated.timing(playerAnim, {
          toValue: { x: midX, y: midY },
          duration: 120,
          useNativeDriver: false,
        }),
        Animated.timing(playerAnim, {
          toValue: {
            x: fromPos.col * (CELL_SIZE + CELL_GAP),
            y: fromPos.row * (CELL_SIZE + CELL_GAP),
          },
          duration: 120,
          useNativeDriver: false,
        }),
      ]).start(() => resolve());
    });
  };

  // -- Show completion overlay ----------------------------------------------
  const showCompletionOverlay = () => {
    overlayOpacity.setValue(0);
    celebrationScale.setValue(0);
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }),
      Animated.spring(celebrationScale, {
        toValue: 1,
        speed: 12,
        bounciness: 12,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // -- Run commands ---------------------------------------------------------
  const runCommands = async () => {
    if (isRunning || commands.length === 0) return;

    setIsRunning(true);
    isRunningRef.current = true;
    setMessage(null);
    setErrorIndex(null);

    // Reset player position to start
    const startPos = currentLevel.start;
    setPlayerPos(startPos);
    playerAnim.setValue({
      x: startPos.col * (CELL_SIZE + CELL_GAP),
      y: startPos.row * (CELL_SIZE + CELL_GAP),
    });

    let pos: Position = { ...startPos };

    for (let i = 0; i < commands.length; i++) {
      if (!isRunningRef.current) break;

      setExecutingIndex(i);

      const delta = DIRECTION_DELTA[commands[i]];
      const nextPos: Position = {
        row: pos.row + delta.row,
        col: pos.col + delta.col,
      };

      if (!isWalkable(nextPos.row, nextPos.col, currentLevel.grid)) {
        // Hit wall
        await animateBounceBack(pos, nextPos);
        await animateShake();
        setErrorIndex(i);
        SoundManager.play('fail');
        showMessage('Oops! Hit a wall!', 'error');
        setIsRunning(false);
        isRunningRef.current = false;
        setExecutingIndex(null);
        return;
      }

      // Valid move
      await animateMove(nextPos);
      pos = nextPos;
      setPlayerPos(pos);

      // Check if reached goal
      if (pos.row === currentLevel.goal.row && pos.col === currentLevel.goal.col) {
        setExecutingIndex(null);
        SoundManager.play('success');
        const newScore = score + 50;
        setScore(newScore);
        showMessage('Amazing! Level complete!', 'success');

        if (levelIndex < levels.length - 1) {
          // Next level after brief celebration
          setTimeout(() => {
            setLevelIndex((prev) => prev + 1);
          }, 1200);
        } else {
          // All levels complete
          setCompleted(true);
          setTimeout(() => {
            showCompletionOverlay();
          }, 400);
        }
        setIsRunning(false);
        isRunningRef.current = false;
        return;
      }

      // Brief pause between steps
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
    }

    // Ran out of commands without reaching goal
    setExecutingIndex(null);
    showMessage('Try again! You need more steps.', 'info');
    setIsRunning(false);
    isRunningRef.current = false;
  };

  // -- Handle finish --------------------------------------------------------
  const handleFinish = () => {
    onComplete(score);
  };

  // -- Progress -------------------------------------------------------------
  const progress = levels.length > 0 ? levelIndex / levels.length : 0;

  // -- Get message color ----------------------------------------------------
  const getMessageColor = (): string => {
    switch (messageType) {
      case 'error':
        return '#F44336';
      case 'success':
        return '#4CAF50';
      default:
        return '#1565C0';
    }
  };

  // -----------------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------------
  return (
    <GameShell
      game={game}
      progress={progress}
      onExit={onExit}
      onTimeUp={() => onComplete(score)}
      timerKey={levelIndex}
    >
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ---- Level info ---- */}
        <View style={styles.levelInfo}>
          <View style={styles.levelHeader}>
            <Text style={[styles.levelName, { color: colors.primary }]}>
              {currentLevel.name}
            </Text>
            <View style={[styles.levelBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.levelBadgeText}>
                Level {levelIndex + 1}/{levels.length}
              </Text>
            </View>
          </View>
          <Text style={styles.hintText}>{currentLevel.hint}</Text>
          <Text style={[styles.scoreText, { color: colors.primary }]}>
            Score: {score}
          </Text>
        </View>

        {/* ---- Maze grid ---- */}
        <Animated.View
          style={[
            styles.mazeContainer,
            { transform: [{ translateX: shakeX }] },
          ]}
        >
          <View
            style={[
              styles.maze,
              {
                width: GRID_SIZE * (CELL_SIZE + CELL_GAP) - CELL_GAP,
                height: GRID_SIZE * (CELL_SIZE + CELL_GAP) - CELL_GAP,
              },
            ]}
          >
            {/* Grid cells */}
            {currentLevel.grid.map((row, rowIdx) =>
              row.map((cell, colIdx) => {
                const isWall = cell === 1;
                const isGoal = cell === 3;
                return (
                  <View
                    key={`${rowIdx}-${colIdx}`}
                    style={[
                      styles.cell,
                      {
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        left: colIdx * (CELL_SIZE + CELL_GAP),
                        top: rowIdx * (CELL_SIZE + CELL_GAP),
                        backgroundColor: isWall ? '#37474F' : '#FFFDE7',
                        borderRadius: 6,
                      },
                    ]}
                  >
                    {isGoal && (
                      <Animated.Text
                        style={[
                          styles.goalEmoji,
                          { transform: [{ scale: goalScale }] },
                        ]}
                      >
                        {'\u2B50'}
                      </Animated.Text>
                    )}
                  </View>
                );
              }),
            )}

            {/* Player */}
            <Animated.View
              style={[
                styles.player,
                {
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  transform: [
                    { translateX: playerAnim.x },
                    { translateY: playerAnim.y },
                  ],
                },
              ]}
            >
              <Text style={styles.playerEmoji}>{'\uD83E\uDD16'}</Text>
            </Animated.View>
          </View>
        </Animated.View>

        {/* ---- Message ---- */}
        {message && (
          <Animated.View
            style={[
              styles.messageBanner,
              {
                opacity: messageOpacity,
                backgroundColor: getMessageColor() + '18',
                borderColor: getMessageColor(),
              },
            ]}
          >
            <Text style={[styles.messageText, { color: getMessageColor() }]}>
              {message}
            </Text>
          </Animated.View>
        )}

        {/* ---- Command sequence bar ---- */}
        <View style={styles.sequenceSection}>
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>
            Commands ({commands.length}/{currentLevel.maxCommands})
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sequenceBar}
          >
            {Array.from({ length: currentLevel.maxCommands }).map((_, idx) => {
              const cmd = commands[idx];
              const isExecuting = executingIndex === idx;
              const isError = errorIndex === idx;

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.commandSlot,
                    cmd
                      ? [
                          styles.commandSlotFilled,
                          { backgroundColor: DIRECTION_COLOR[cmd] + '20' },
                        ]
                      : styles.commandSlotEmpty,
                    isExecuting && styles.commandSlotExecuting,
                    isError && styles.commandSlotError,
                  ]}
                  onPress={() => cmd && removeCommand(idx)}
                  disabled={isRunning || !cmd}
                  activeOpacity={0.6}
                >
                  {cmd ? (
                    <Text style={styles.commandEmoji}>{DIRECTION_EMOJI[cmd]}</Text>
                  ) : (
                    <View style={styles.commandSlotDash} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ---- Command palette ---- */}
        <View style={styles.paletteSection}>
          <View style={styles.arrowRow}>
            {(['up', 'down', 'left', 'right'] as Direction[]).map((dir) => (
              <TouchableOpacity
                key={dir}
                style={[
                  styles.arrowButton,
                  {
                    backgroundColor: DIRECTION_COLOR[dir],
                    opacity:
                      isRunning || commands.length >= currentLevel.maxCommands
                        ? 0.4
                        : 1,
                  },
                ]}
                onPress={() => addCommand(dir)}
                disabled={isRunning || commands.length >= currentLevel.maxCommands}
                activeOpacity={0.7}
              >
                <Text style={styles.arrowEmoji}>{DIRECTION_EMOJI[dir]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.runButton,
                {
                  backgroundColor: colors.accent,
                  opacity: isRunning || commands.length === 0 ? 0.4 : 1,
                },
              ]}
              onPress={runCommands}
              disabled={isRunning || commands.length === 0}
              activeOpacity={0.7}
            >
              <Text style={styles.runButtonText}>
                {'\u25B6\uFE0F'} Run
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.clearButton,
                {
                  opacity: isRunning || commands.length === 0 ? 0.4 : 1,
                },
              ]}
              onPress={clearCommands}
              disabled={isRunning || commands.length === 0}
              activeOpacity={0.7}
            >
              <Text style={styles.clearButtonText}>
                {'\uD83D\uDDD1\uFE0F'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ---- Completion overlay ---- */}
      {completed && (
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Animated.View
            style={[
              styles.overlayCard,
              { transform: [{ scale: celebrationScale }] },
            ]}
          >
            <Text style={styles.overlayEmoji}>{'\uD83C\uDF89'}</Text>
            <Text style={styles.overlayTitle}>All Levels Complete!</Text>
            <Text style={styles.overlayScore}>Final Score: {score}</Text>
            <Text style={styles.overlaySubtext}>
              You solved all {levels.length} mazes!
            </Text>
            <TouchableOpacity
              style={[styles.overlayButton, { backgroundColor: colors.accent }]}
              onPress={handleFinish}
              activeOpacity={0.8}
            >
              <Text style={styles.overlayButtonText}>Continue</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}
    </GameShell>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 24,
  },

  // -- Level info --
  levelInfo: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  levelName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  hintText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#78909C',
    marginBottom: 2,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
  },

  // -- Maze --
  mazeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#263238',
    borderRadius: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  maze: {
    position: 'relative',
  },
  cell: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalEmoji: {
    fontSize: 24,
  },
  player: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  playerEmoji: {
    fontSize: 24,
  },

  // -- Message banner --
  messageBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
    alignSelf: 'center',
  },
  messageText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },

  // -- Sequence bar --
  sequenceSection: {
    width: '100%',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sequenceBar: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  commandSlot: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commandSlotEmpty: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CFD8DC',
    backgroundColor: '#ECEFF1',
  },
  commandSlotFilled: {
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  commandSlotExecuting: {
    borderColor: '#FFD600',
    borderWidth: 3,
    shadowColor: '#FFD600',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  commandSlotError: {
    borderColor: '#F44336',
    borderWidth: 3,
    backgroundColor: '#FFEBEE',
  },
  commandEmoji: {
    fontSize: 20,
  },
  commandSlotDash: {
    width: 14,
    height: 2,
    backgroundColor: '#B0BEC5',
    borderRadius: 1,
  },

  // -- Palette --
  paletteSection: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  arrowRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    justifyContent: 'center',
  },
  arrowButton: {
    width: 65,
    height: 65,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  arrowEmoji: {
    fontSize: 28,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runButton: {
    width: 120,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  runButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  clearButton: {
    width: 50,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF5350',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  clearButtonText: {
    fontSize: 20,
  },

  // -- Overlay --
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
    borderRadius: 16,
  },
  overlayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 40,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    width: '85%',
  },
  overlayEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  overlayTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  overlayScore: {
    fontSize: 22,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },
  overlaySubtext: {
    fontSize: 15,
    color: '#777',
    marginBottom: 20,
    textAlign: 'center',
  },
  overlayButton: {
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 30,
    marginTop: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    minHeight: 56,
    justifyContent: 'center',
  },
  overlayButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default CodingLiteEngine;
