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

type CellState = null | 'yes' | 'no';

interface Puzzle {
  id: string;
  title: string;
  rows: string[];
  cols: string[];
  clues: string[];
  solution: number[]; // solution[rowIndex] = colIndex that is 'yes'
}

// ---------------------------------------------------------------------------
// Embedded puzzle data
// ---------------------------------------------------------------------------

const puzzles: Puzzle[] = [
  {
    id: 'p1',
    title: 'Pet Owners',
    rows: ['Alex', 'Bella', 'Charlie'],
    cols: ['\uD83D\uDC15 Dog', '\uD83D\uDC31 Cat', '\uD83D\uDC30 Rabbit'],
    clues: [
      '\uD83D\uDCA1 Alex does not have a dog.',
      '\uD83D\uDCA1 Bella loves her rabbit.',
      '\uD83D\uDCA1 Charlie plays fetch with his pet.',
    ],
    solution: [1, 2, 0],
  },
  {
    id: 'p2',
    title: 'Favorite Colors',
    rows: ['Dana', 'Ethan', 'Fiona'],
    cols: ['\uD83D\uDD34 Red', '\uD83D\uDD35 Blue', '\uD83D\uDFE2 Green'],
    clues: [
      "\uD83D\uDCA1 Dana's favorite is not blue.",
      '\uD83D\uDCA1 Ethan loves the color of grass.',
      '\uD83D\uDCA1 Fiona likes the color of the sky.',
    ],
    solution: [0, 2, 1],
  },
  {
    id: 'p3',
    title: 'School Subjects',
    rows: ['Grace', 'Henry', 'Ivy'],
    cols: ['\uD83D\uDCD0 Math', '\uD83C\uDFA8 Art', '\uD83D\uDCDA Reading'],
    clues: [
      '\uD83D\uDCA1 Grace loves numbers.',
      "\uD83D\uDCA1 Henry doesn't like reading.",
      '\uD83D\uDCA1 Ivy always carries a book.',
    ],
    solution: [0, 1, 2],
  },
];

const GRID_SIZE = 3;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CELL_SIZE = 70;
const ROW_HEADER_WIDTH = 80;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createEmptyGrid(): CellState[][] {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => null),
  );
}

function isGridComplete(grid: CellState[][]): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    const yesCount = grid[r].filter((c) => c === 'yes').length;
    if (yesCount !== 1) return false;
  }
  return true;
}

function checkSolution(grid: CellState[][], solution: number[]): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    const yesCol = grid[r].indexOf('yes');
    if (yesCol !== solution[r]) return false;
  }
  return true;
}

function findWrongCells(grid: CellState[][], solution: number[]): Set<string> {
  const wrong = new Set<string>();
  for (let r = 0; r < GRID_SIZE; r++) {
    const yesCol = grid[r].indexOf('yes');
    if (yesCol !== -1 && yesCol !== solution[r]) {
      wrong.add(`${r},${yesCol}`);
    }
  }
  return wrong;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const LogicGridEngine: React.FC<GameProps> = ({ game, onComplete, onExit }) => {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [grid, setGrid] = useState<CellState[][]>(createEmptyGrid());
  const [score, setScore] = useState(0);
  const [wrongCells, setWrongCells] = useState<Set<string>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Animations
  const celebrationScale = useRef(new Animated.Value(0)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const wrongPulseAnim = useRef(new Animated.Value(1)).current;
  const titleSlideAnim = useRef(new Animated.Value(0)).current;
  const gridFadeAnim = useRef(new Animated.Value(1)).current;

  const currentPuzzle = puzzles[puzzleIndex];
  const progress = puzzles.length > 0 ? puzzleIndex / puzzles.length : 0;

  // Animate title slide-in on puzzle change
  useEffect(() => {
    titleSlideAnim.setValue(-30);
    gridFadeAnim.setValue(0);

    Animated.parallel([
      Animated.spring(titleSlideAnim, {
        toValue: 0,
        friction: 6,
        tension: 80,
        useNativeDriver: false,
      }),
      Animated.timing(gridFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }),
    ]).start();
  }, [puzzleIndex]);

  // Pulse animation for wrong cells
  useEffect(() => {
    if (wrongCells.size > 0) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(wrongPulseAnim, {
            toValue: 0.4,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(wrongPulseAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
        ]),
        { iterations: 3 },
      );
      pulseAnimation.start(() => {
        wrongPulseAnim.setValue(1);
        setWrongCells(new Set());
      });
    }
  }, [wrongCells]);

  // -----------------------------------------------------------------------
  // Cell tap: cycle null -> yes -> no -> null
  // When placing 'yes', auto-fill rest of row & col with 'no'
  // -----------------------------------------------------------------------
  const handleCellTap = useCallback(
    (row: number, col: number) => {
      if (showCelebration || isChecking || gameOver) return;

      setGrid((prev) => {
        const newGrid = prev.map((r) => [...r]);
        const currentVal = newGrid[row][col];

        if (currentVal === null) {
          // Set this cell to 'yes'
          newGrid[row][col] = 'yes';
          // Auto-fill rest of row with 'no'
          for (let c = 0; c < GRID_SIZE; c++) {
            if (c !== col && newGrid[row][c] !== 'yes') {
              newGrid[row][c] = 'no';
            }
          }
          // Auto-fill rest of column with 'no'
          for (let r = 0; r < GRID_SIZE; r++) {
            if (r !== row && newGrid[r][col] !== 'yes') {
              newGrid[r][col] = 'no';
            }
          }
        } else if (currentVal === 'yes') {
          // Revert: yes -> no, and undo auto-fills
          newGrid[row][col] = 'no';
          // Undo auto-fill for row
          for (let c = 0; c < GRID_SIZE; c++) {
            if (c !== col && newGrid[row][c] === 'no') {
              const otherYesInRow = newGrid[row].some(
                (v, ci) => ci !== col && ci !== c && v === 'yes',
              );
              if (!otherYesInRow) {
                newGrid[row][c] = null;
              }
            }
          }
          // Undo auto-fill for column
          for (let r = 0; r < GRID_SIZE; r++) {
            if (r !== row && newGrid[r][col] === 'no') {
              const otherYesInCol = newGrid.some(
                (rowArr, ri) => ri !== row && ri !== r && rowArr[col] === 'yes',
              );
              if (!otherYesInCol) {
                newGrid[r][col] = null;
              }
            }
          }
        } else {
          // 'no' -> null
          newGrid[row][col] = null;
        }

        // Clear wrong cell highlights on any interaction
        if (wrongCells.size > 0) {
          setWrongCells(new Set());
        }

        return newGrid;
      });

      SoundManager.play('tap');
    },
    [showCelebration, isChecking, gameOver, wrongCells],
  );

  // -----------------------------------------------------------------------
  // Check answer
  // -----------------------------------------------------------------------
  const handleCheckAnswer = useCallback(() => {
    if (!isGridComplete(grid) || isChecking || showCelebration || gameOver) return;

    setIsChecking(true);

    if (checkSolution(grid, currentPuzzle.solution)) {
      SoundManager.play('success');
      const newScore = score + 100;
      setScore(newScore);
      setShowCelebration(true);

      // Celebration animation
      celebrationScale.setValue(0);
      celebrationOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(celebrationScale, {
          toValue: 1,
          friction: 4,
          tension: 60,
          useNativeDriver: false,
        }),
        Animated.timing(celebrationOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();

      // Advance after delay
      setTimeout(() => {
        setShowCelebration(false);
        setIsChecking(false);
        celebrationOpacity.setValue(0);

        if (puzzleIndex < puzzles.length - 1) {
          setPuzzleIndex((i) => i + 1);
          setGrid(createEmptyGrid());
        } else {
          setGameOver(true);
          SoundManager.play('win');
          onComplete(newScore);
        }
      }, 1800);
    } else {
      SoundManager.play('fail');
      const wrong = findWrongCells(grid, currentPuzzle.solution);
      setWrongCells(wrong);
      setIsChecking(false);
    }
  }, [grid, isChecking, showCelebration, gameOver, currentPuzzle, score, puzzleIndex, onComplete]);

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------

  const canCheck = isGridComplete(grid) && !isChecking && !showCelebration && !gameOver;

  const renderCell = (row: number, col: number) => {
    const value = grid[row][col];
    const isWrong = wrongCells.has(`${row},${col}`);
    let bgColor = '#F0F0F0';
    let content = '';
    let contentColor = '#999';
    let contentSize = 24;

    if (value === 'yes') {
      bgColor = '#C8E6C9';
      content = '\u2713';
      contentColor = '#FFFFFF';
      contentSize = 28;
    } else if (value === 'no') {
      bgColor = '#FFEBEE';
      content = '\u2717';
      contentColor = '#999';
      contentSize = 24;
    }

    if (isWrong) {
      bgColor = '#EF5350';
      contentColor = '#FFFFFF';
    }

    return (
      <TouchableOpacity
        key={`cell-${row}-${col}`}
        onPress={() => handleCellTap(row, col)}
        activeOpacity={0.6}
      >
        <Animated.View
          style={[
            styles.cell,
            { backgroundColor: bgColor },
            isWrong && { opacity: wrongPulseAnim },
          ]}
        >
          {content !== '' && (
            <Text style={[styles.cellText, { color: contentColor, fontSize: contentSize }]}>
              {content}
            </Text>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // -----------------------------------------------------------------------
  // Main render
  // -----------------------------------------------------------------------

  return (
    <GameShell game={game} progress={progress} onExit={onExit} onTimeUp={() => onComplete(score)}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Puzzle title banner */}
        <Animated.View
          style={[
            styles.titleBanner,
            { transform: [{ translateY: titleSlideAnim }] },
          ]}
        >
          <Text style={styles.titleEmoji}>{'\uD83E\uDDE9'}</Text>
          <Text style={styles.titleText}>{currentPuzzle.title}</Text>
          <Text style={styles.puzzleCounter}>
            {puzzleIndex + 1} / {puzzles.length}
          </Text>
        </Animated.View>

        {/* Score display */}
        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>{'\u2B50'} Score:</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>

        {/* Grid area */}
        <Animated.View style={[styles.gridContainer, { opacity: gridFadeAnim }]}>
          {/* Column headers row */}
          <View style={styles.headerRow}>
            <View style={styles.cornerCell} />
            {currentPuzzle.cols.map((col, colIdx) => (
              <View key={`col-header-${colIdx}`} style={styles.colHeader}>
                <Text style={styles.colHeaderText} numberOfLines={2}>
                  {col}
                </Text>
              </View>
            ))}
          </View>

          {/* Grid rows with row headers */}
          {currentPuzzle.rows.map((rowName, rowIdx) => (
            <View key={`row-${rowIdx}`} style={styles.gridRow}>
              <View style={styles.rowHeader}>
                <Text style={styles.rowHeaderText} numberOfLines={1}>
                  {rowName}
                </Text>
              </View>
              {currentPuzzle.cols.map((_, colIdx) => renderCell(rowIdx, colIdx))}
            </View>
          ))}
        </Animated.View>

        {/* Clue section */}
        <View style={styles.clueSection}>
          <Text style={styles.clueSectionTitle}>Clues</Text>
          {currentPuzzle.clues.map((clue, idx) => (
            <View key={`clue-${idx}`} style={styles.clueCard}>
              <Text style={styles.clueText}>{clue}</Text>
            </View>
          ))}
        </View>

        {/* Check Answer button */}
        <TouchableOpacity
          style={[styles.checkButton, !canCheck && styles.checkButtonDisabled]}
          onPress={handleCheckAnswer}
          activeOpacity={canCheck ? 0.7 : 1}
          disabled={!canCheck}
        >
          <Text
            style={[styles.checkButtonText, !canCheck && styles.checkButtonTextDisabled]}
          >
            Check Answer {'\u2713'}
          </Text>
        </TouchableOpacity>

        {/* Celebration overlay */}
        {showCelebration && (
          <Animated.View
            style={[
              styles.celebrationOverlay,
              {
                opacity: celebrationOpacity,
                transform: [{ scale: celebrationScale }],
              },
            ]}
          >
            <Text style={styles.celebrationEmoji}>{'\uD83C\uDF89'}</Text>
            <Text style={styles.celebrationTitle}>Correct!</Text>
            <Text style={styles.celebrationSubtext}>+100 points</Text>
          </Animated.View>
        )}
      </ScrollView>
    </GameShell>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 40,
    width: '100%',
  },
  titleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5C6BC0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 12,
    width: '100%',
    elevation: 4,
    shadowColor: '#3949AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  titleEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
  },
  puzzleCounter: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C5CAE9',
    backgroundColor: '#3F51B5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 6,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5C6BC0',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3F51B5',
  },
  gridContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    marginBottom: 20,
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  cornerCell: {
    width: ROW_HEADER_WIDTH,
    height: 50,
  },
  colHeader: {
    width: CELL_SIZE,
    height: 50,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
    paddingHorizontal: 2,
    marginHorizontal: 2,
  },
  colHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5C6BC0',
    textAlign: 'center',
    lineHeight: 16,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  rowHeader: {
    width: ROW_HEADER_WIDTH,
    height: CELL_SIZE,
    justifyContent: 'center',
    paddingRight: 8,
  },
  rowHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3F51B5',
    textAlign: 'right',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  cellText: {
    fontWeight: '800',
  },
  clueSection: {
    width: '100%',
    marginBottom: 20,
  },
  clueSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#5C6BC0',
    marginBottom: 8,
    textAlign: 'center',
  },
  clueCard: {
    backgroundColor: '#FFF9C4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  clueText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5D4037',
    lineHeight: 22,
  },
  checkButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    width: 200,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginBottom: 20,
  },
  checkButtonDisabled: {
    backgroundColor: '#BDBDBD',
    elevation: 0,
    shadowOpacity: 0,
  },
  checkButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  checkButtonTextDisabled: {
    color: '#F5F5F5',
  },
  celebrationOverlay: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 48,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    borderWidth: 3,
    borderColor: '#5C6BC0',
  },
  celebrationEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  celebrationTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#4CAF50',
    marginBottom: 4,
  },
  celebrationSubtext: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5C6BC0',
  },
});

export default LogicGridEngine;
