import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, PanResponder,
  PanResponderGestureState, GestureResponderEvent, TouchableOpacity, Platform,
} from 'react-native';
import { GameProps } from '../../types/game';
import GameShell from '../../../shared/GameShell';
import { SoundManager } from '../../../shared/SoundManager';

const { width: SW, height: SH } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface DragItem {
  id: string;
  emoji: string;
  label: string;
  targetId: string;
  bg: string;
}

interface DropTarget {
  id: string;
  emoji: string;
  label: string;
  bg: string;
}

interface LevelData {
  items: DragItem[];
  targets: DropTarget[];
}

type Variant = 'shapes' | 'emotions' | 'healthyplate';

interface TargetRect {
  x: number; y: number; w: number; h: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT POOLS (large pools for 15 levels)
// ═══════════════════════════════════════════════════════════════════════════════

const SHAPES_ITEMS: DragItem[] = [
  { id: 'star',      emoji: '⭐', label: 'Star',      targetId: 'star',      bg: '#FFF9C4' },
  { id: 'heart',     emoji: '💖', label: 'Heart',     targetId: 'heart',     bg: '#FCE4EC' },
  { id: 'diamond',   emoji: '💎', label: 'Diamond',   targetId: 'diamond',   bg: '#E3F2FD' },
  { id: 'flower',    emoji: '🌸', label: 'Flower',    targetId: 'flower',    bg: '#F3E5F5' },
  { id: 'moon',      emoji: '🌙', label: 'Moon',      targetId: 'moon',      bg: '#E8EAF6' },
  { id: 'sun',       emoji: '☀️', label: 'Sun',       targetId: 'sun',       bg: '#FFFDE7' },
  { id: 'rainbow',   emoji: '🌈', label: 'Rainbow',   targetId: 'rainbow',   bg: '#F1F8E9' },
  { id: 'butterfly', emoji: '🦋', label: 'Butterfly', targetId: 'butterfly', bg: '#E0F7FA' },
  { id: 'crown',     emoji: '👑', label: 'Crown',     targetId: 'crown',     bg: '#FFF8E1' },
  { id: 'clover',    emoji: '🍀', label: 'Clover',    targetId: 'clover',    bg: '#E8F5E9' },
];

const SHAPES_TARGETS: DropTarget[] = [
  { id: 'star',      emoji: '✨', label: 'Star',      bg: '#FFFDE7' },
  { id: 'heart',     emoji: '💗', label: 'Heart',     bg: '#FFF0F5' },
  { id: 'diamond',   emoji: '💠', label: 'Diamond',   bg: '#E8F4FD' },
  { id: 'flower',    emoji: '🌺', label: 'Flower',    bg: '#FFF0FF' },
  { id: 'moon',      emoji: '🌛', label: 'Moon',      bg: '#EDE7F6' },
  { id: 'sun',       emoji: '🔆', label: 'Sun',       bg: '#FFF9C4' },
  { id: 'rainbow',   emoji: '🎨', label: 'Rainbow',   bg: '#F9FBE7' },
  { id: 'butterfly', emoji: '🐛', label: 'Butterfly', bg: '#E0F2F1' },
  { id: 'crown',     emoji: '👸', label: 'Crown',     bg: '#FFF3E0' },
  { id: 'clover',    emoji: '🌿', label: 'Clover',    bg: '#F1F8E9' },
];

const EMOTION_ITEMS: DragItem[] = [
  { id: 'happy',     emoji: '😄', label: 'Happy',     targetId: 'happy',     bg: '#FFF9C4' },
  { id: 'sad',       emoji: '😢', label: 'Sad',       targetId: 'sad',       bg: '#E3F2FD' },
  { id: 'love',      emoji: '🥰', label: 'Love',      targetId: 'love',      bg: '#FCE4EC' },
  { id: 'surprised', emoji: '🤩', label: 'Wow!',      targetId: 'surprised', bg: '#E8F5E9' },
  { id: 'angry',     emoji: '😤', label: 'Angry',     targetId: 'angry',     bg: '#FFEBEE' },
  { id: 'scared',    emoji: '😨', label: 'Scared',    targetId: 'scared',    bg: '#EDE7F6' },
  { id: 'silly',     emoji: '🤪', label: 'Silly',     targetId: 'silly',     bg: '#FFF3E0' },
  { id: 'sleepy',    emoji: '😴', label: 'Sleepy',    targetId: 'sleepy',    bg: '#E8EAF6' },
  { id: 'excited',   emoji: '🥳', label: 'Excited',   targetId: 'excited',   bg: '#F1F8E9' },
  { id: 'cool',      emoji: '😎', label: 'Cool',      targetId: 'cool',      bg: '#E0F7FA' },
];

const EMOTION_TARGETS: DropTarget[] = [
  { id: 'happy',     emoji: '🌞', label: 'Happy',     bg: '#FFFDE7' },
  { id: 'sad',       emoji: '🌧️', label: 'Sad',       bg: '#E8F4FD' },
  { id: 'love',      emoji: '💕', label: 'Love',      bg: '#FFF0F5' },
  { id: 'surprised', emoji: '🎉', label: 'Wow!',      bg: '#F1F8E9' },
  { id: 'angry',     emoji: '🌋', label: 'Angry',     bg: '#FBE9E7' },
  { id: 'scared',    emoji: '👻', label: 'Scared',    bg: '#F3E5F5' },
  { id: 'silly',     emoji: '🎪', label: 'Silly',     bg: '#FFF8E1' },
  { id: 'sleepy',    emoji: '🌙', label: 'Sleepy',    bg: '#EDE7F6' },
  { id: 'excited',   emoji: '🎊', label: 'Excited',   bg: '#F9FBE7' },
  { id: 'cool',      emoji: '🕶️', label: 'Cool',      bg: '#E0F2F1' },
];

const FOOD_ITEMS: DragItem[] = [
  { id: 'apple',      emoji: '🍎', label: 'Apple',      targetId: 'fruits',     bg: '#FFEBEE' },
  { id: 'banana',     emoji: '🍌', label: 'Banana',     targetId: 'fruits',     bg: '#FFFDE7' },
  { id: 'strawberry', emoji: '🍓', label: 'Strawberry', targetId: 'fruits',     bg: '#FCE4EC' },
  { id: 'orange',     emoji: '🍊', label: 'Orange',     targetId: 'fruits',     bg: '#FFF3E0' },
  { id: 'broccoli',   emoji: '🥦', label: 'Broccoli',   targetId: 'vegetables', bg: '#E8F5E9' },
  { id: 'carrot',     emoji: '🥕', label: 'Carrot',     targetId: 'vegetables', bg: '#FFF8E1' },
  { id: 'corn',       emoji: '🌽', label: 'Corn',       targetId: 'vegetables', bg: '#F9FBE7' },
  { id: 'bread',      emoji: '🍞', label: 'Bread',      targetId: 'grains',     bg: '#FFF8E1' },
  { id: 'rice',       emoji: '🍚', label: 'Rice',       targetId: 'grains',     bg: '#FAFAFA' },
  { id: 'chicken',    emoji: '🍗', label: 'Chicken',    targetId: 'protein',    bg: '#FBE9E7' },
  { id: 'fish',       emoji: '🐟', label: 'Fish',       targetId: 'protein',    bg: '#E0F7FA' },
  { id: 'egg',        emoji: '🥚', label: 'Egg',        targetId: 'protein',    bg: '#FFFDE7' },
  { id: 'milk',       emoji: '🥛', label: 'Milk',       targetId: 'dairy',      bg: '#F5F5F5' },
  { id: 'cheese',     emoji: '🧀', label: 'Cheese',     targetId: 'dairy',      bg: '#FFF9C4' },
];

const FOOD_TARGETS: DropTarget[] = [
  { id: 'fruits',     emoji: '🍓', label: 'Fruits',   bg: '#FFF0F0' },
  { id: 'vegetables', emoji: '🥬', label: 'Veggies',  bg: '#F0FFF0' },
  { id: 'grains',     emoji: '🌾', label: 'Grains',   bg: '#FFFFF0' },
  { id: 'protein',    emoji: '🥩', label: 'Protein',  bg: '#FFF5F0' },
  { id: 'dairy',      emoji: '🥛', label: 'Dairy',    bg: '#F5F5FF' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 15-LEVEL PROGRESSION TABLE
// ═══════════════════════════════════════════════════════════════════════════════

interface LevelConfig {
  itemCount: number;
  targetCount: number;
}

const LEVEL_TABLE: LevelConfig[] = [
  { itemCount: 2, targetCount: 2 },  // L1  - Very easy
  { itemCount: 2, targetCount: 2 },  // L2
  { itemCount: 3, targetCount: 3 },  // L3
  { itemCount: 3, targetCount: 3 },  // L4
  { itemCount: 4, targetCount: 4 },  // L5
  { itemCount: 4, targetCount: 4 },  // L6
  { itemCount: 5, targetCount: 4 },  // L7  - Multi-item targets
  { itemCount: 5, targetCount: 4 },  // L8
  { itemCount: 6, targetCount: 4 },  // L9
  { itemCount: 6, targetCount: 4 },  // L10
  { itemCount: 7, targetCount: 4 },  // L11
  { itemCount: 7, targetCount: 4 },  // L12
  { itemCount: 8, targetCount: 4 },  // L13 - Hard
  { itemCount: 8, targetCount: 4 },  // L14
  { itemCount: 8, targetCount: 4 },  // L15 - Grand finale
];

const TOTAL_LEVELS = LEVEL_TABLE.length;

// ═══════════════════════════════════════════════════════════════════════════════
// LEVEL DATA GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildLevel(variant: Variant, level: number): LevelData {
  const config = LEVEL_TABLE[Math.min(level - 1, LEVEL_TABLE.length - 1)];
  let allItems: DragItem[];
  let allTargets: DropTarget[];

  if (variant === 'shapes') {
    allItems = SHAPES_ITEMS;
    allTargets = SHAPES_TARGETS;
  } else if (variant === 'emotions') {
    allItems = EMOTION_ITEMS;
    allTargets = EMOTION_TARGETS;
  } else {
    allItems = FOOD_ITEMS;
    allTargets = FOOD_TARGETS;
  }

  // For shapes/emotions: 1-to-1 mapping, pick targetCount targets, then pick items that match
  // For healthyplate: many-to-1 mapping, pick targetCount targets, then pick items for those targets
  if (variant === 'healthyplate') {
    const targets = shuffle(allTargets).slice(0, config.targetCount);
    const targetIds = new Set(targets.map(t => t.id));
    const eligible = allItems.filter(i => targetIds.has(i.targetId));
    const items = shuffle(eligible).slice(0, config.itemCount);
    return { items: shuffle(items), targets: shuffle(targets) };
  } else {
    // 1-to-1: pick targets, then matching items
    const targets = shuffle(allTargets).slice(0, config.targetCount);
    const targetIds = targets.map(t => t.id);
    const matchingItems = targetIds.map(tid =>
      allItems.find(i => i.targetId === tid)!
    ).filter(Boolean);

    // If we need more items than targets, add extra items for some targets
    let items = [...matchingItems];
    if (config.itemCount > config.targetCount) {
      const extra = shuffle(allItems.filter(i =>
        targetIds.includes(i.targetId) && !items.find(x => x.id === i.id)
      ));
      // For 1:1 variants, just add from the already-selected targets
      // (In practice, shapes/emotions have 1:1, so just pick more targets)
      const moreTargets = shuffle(allTargets).filter(t => !targetIds.includes(t.id))
        .slice(0, config.itemCount - config.targetCount);
      for (const mt of moreTargets) {
        targets.push(mt);
        const mi = allItems.find(i => i.targetId === mt.id);
        if (mi) items.push(mi);
      }
    }

    return {
      items: shuffle(items).slice(0, config.itemCount),
      targets: shuffle(targets),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCORING
// ═══════════════════════════════════════════════════════════════════════════════

const CORRECT_POINTS = 10;
const WRONG_PENALTY = 3;
const PERFECT_BONUS = 15;

// ═══════════════════════════════════════════════════════════════════════════════
// ENCOURAGING MESSAGES (emotionally safe)
// ═══════════════════════════════════════════════════════════════════════════════

const CORRECT_MSGS = ['Great job! ✨', 'Super! 🌟', 'You got it! 💫', 'Awesome! ⭐', 'Perfect! 🎉'];
const WRONG_MSGS = ['Almost! Try again 💪', 'So close! 🌈', 'Keep going! 💖', "You're learning! 🌟"];
const LEVEL_MSGS = [
  'Great Start! 🌟', 'Wonderful! 💫', 'Amazing! ⭐', 'Super Star! 🏆',
  'Fantastic! 🎉', 'Brilliant! 💎', 'Incredible! 🌈', 'Outstanding! 🦋',
  'Phenomenal! 👑', 'Legendary! 🔥', 'Mind-blowing! 🚀', 'Spectacular! 🎊',
  'Magnificent! 💖', 'Extraordinary! ✨', 'Champion! 🏆',
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLLISION DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

const HIT_TOLERANCE = 25; // Extra tolerance in pixels for kid-friendly hit detection

function isOverTarget(
  itemCenterX: number, itemCenterY: number,
  target: TargetRect,
): boolean {
  return (
    itemCenterX >= target.x - HIT_TOLERANCE &&
    itemCenterX <= target.x + target.w + HIT_TOLERANCE &&
    itemCenterY >= target.y - HIT_TOLERANCE &&
    itemCenterY <= target.y + target.h + HIT_TOLERANCE
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DRAGGABLE ITEM COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface DraggableItemProps {
  item: DragItem;
  isMatched: boolean;
  size: number;
  onDrop: (itemId: string, dx: number, dy: number, pageX: number, pageY: number) => void;
  snapOffset: { x: number; y: number } | null;
}

const DraggableItem: React.FC<DraggableItemProps> = React.memo(({
  item, isMatched, size, onDrop, snapOffset,
}) => {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [dragging, setDragging] = useState(false);
  const itemRef = useRef<View>(null);
  const startPagePos = useRef({ x: 0, y: 0 });

  // Mirrors so the once-attached web pointer handlers always see fresh values
  const isMatchedRef = useRef(isMatched);
  isMatchedRef.current = isMatched;
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;
  const snapOffsetRef = useRef(snapOffset);
  snapOffsetRef.current = snapOffset;

  // If snapped to target, animate to offset
  useEffect(() => {
    if (snapOffset) {
      Animated.spring(pan, {
        toValue: snapOffset,
        friction: 6,
        tension: 80,
        useNativeDriver: false,
      }).start();
    }
  }, [snapOffset]);

  // ── WEB: drive dragging with native Pointer Events ──
  // react-native-web's responder pipeline silently drops PanResponder
  // gestures in this bundle (nodes register but grants never fire), which
  // made every drag game unplayable in the browser. Pointer events unify
  // mouse + touch, and setPointerCapture keeps the gesture alive even
  // when the finger leaves the card. PanResponder still handles native.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = itemRef.current as any;
    if (!node || typeof node.addEventListener !== 'function') return;

    const drag = { active: false, startX: 0, startY: 0 };

    const down = (e: PointerEvent) => {
      if (isMatchedRef.current || drag.active) return;
      e.preventDefault();
      try { node.setPointerCapture(e.pointerId); } catch { /* older browsers */ }
      drag.active = true;
      drag.startX = e.pageX;
      drag.startY = e.pageY;
      setDragging(true);
      SoundManager.play('tap');
      Animated.spring(scaleAnim, { toValue: 1.15, friction: 5, useNativeDriver: false }).start();
      pan.setOffset({
        x: (pan.x as any)._value || 0,
        y: (pan.y as any)._value || 0,
      });
      pan.setValue({ x: 0, y: 0 });
    };
    const move = (e: PointerEvent) => {
      if (!drag.active) return;
      pan.setValue({ x: e.pageX - drag.startX, y: e.pageY - drag.startY });
    };
    const up = (e: PointerEvent) => {
      if (!drag.active) return;
      drag.active = false;
      pan.flattenOffset();
      setDragging(false);
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: false }).start();
      onDropRef.current(item.id, e.pageX - drag.startX, e.pageY - drag.startY, e.pageX, e.pageY);
      // Wrong/missed drops bounce home; a correct drop receives its
      // snapOffset from the engine right after and that spring wins
      setTimeout(() => {
        if (!isMatchedRef.current && !snapOffsetRef.current) {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 6, tension: 80, useNativeDriver: false }).start();
        }
      }, 60);
    };

    node.addEventListener('pointerdown', down);
    node.addEventListener('pointermove', move);
    node.addEventListener('pointerup', up);
    node.addEventListener('pointercancel', up);
    return () => {
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', up);
      node.removeEventListener('pointercancel', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isMatched,
      onMoveShouldSetPanResponder: () => !isMatched,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        setDragging(true);
        startPagePos.current = {
          x: evt.nativeEvent.pageX,
          y: evt.nativeEvent.pageY,
        };
        SoundManager.play('tap');
        Animated.spring(scaleAnim, {
          toValue: 1.15,
          friction: 5,
          useNativeDriver: false,
        }).start();
        // Reset pan to current value to avoid jumps
        pan.setOffset({
          x: (pan.x as any)._value || 0,
          y: (pan.y as any)._value || 0,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_evt: GestureResponderEvent, gesture: PanResponderGestureState) => {
        pan.flattenOffset();
        setDragging(false);
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: false,
        }).start();
        onDrop(
          item.id,
          gesture.dx, gesture.dy,
          gesture.moveX, gesture.moveY,
        );
      },
    })
  ).current;

  if (isMatched && snapOffset) {
    return (
      <Animated.View
        style={[
          st.itemCard,
          {
            width: size, height: size + 10,
            backgroundColor: item.bg,
            opacity: 0.4,
            transform: [...pan.getTranslateTransform()],
          },
        ]}
      >
        <Text style={st.matchedCheck}>✅</Text>
      </Animated.View>
    );
  }

  if (isMatched) {
    return (
      <View style={[st.itemCard, { width: size, height: size + 10, backgroundColor: item.bg, opacity: 0.3 }]}>
        <Text style={st.matchedCheck}>✅</Text>
      </View>
    );
  }

  return (
    <Animated.View
      ref={itemRef}
      {...(Platform.OS === 'web' ? null : panResponder.panHandlers)}
      style={[
        st.itemCard,
        {
          width: size, height: size + 10,
          backgroundColor: item.bg,
          transform: [
            ...pan.getTranslateTransform(),
            { scale: scaleAnim },
          ],
          zIndex: dragging ? 999 : 1,
          elevation: dragging ? 20 : 4,
          shadowOpacity: dragging ? 0.3 : 0.12,
        },
        // On the mobile web the browser turns touch-drags into page
        // scrolls (touchcancel kills the PanResponder) unless the
        // draggable opts out of native touch handling
        { touchAction: 'none', userSelect: 'none' } as any,
      ]}
    >
      <Text style={[st.itemEmoji, { fontSize: size * 0.45 }]}>{item.emoji}</Text>
      <Text style={st.itemLabel}>{item.label}</Text>
    </Animated.View>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

const DragDropEngine: React.FC<GameProps> = ({ game, onComplete, onExit }) => {
  const variant: Variant = (game.initialData?.variant as Variant) || 'shapes';

  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [levelData, setLevelData] = useState<LevelData>(() => buildLevel(variant, 1));
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [snapOffsets, setSnapOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [wrongTargetId, setWrongTargetId] = useState<string | null>(null);

  // Layout positions (measured via onLayout)
  const targetRects = useRef<Record<string, TargetRect>>({});
  const itemRects = useRef<Record<string, TargetRect>>({});
  const targetAreaOffset = useRef({ x: 0, y: 0 });
  const itemAreaOffset = useRef({ x: 0, y: 0 });
  const containerOffset = useRef({ x: 0, y: 0 });
  // On the web, refs are DOM nodes: read exact page rects at drop time
  // instead of chaining cached onLayout offsets (which miss the centered
  // row's position and go stale on scroll/resize)
  const targetNodes = useRef<Record<string, any>>({});
  // Item WRAPPER nodes give each item's rest position (the drag transform
  // lives on the child, so the wrapper's rect is unaffected by dragging)
  const itemNodes = useRef<Record<string, any>>({});

  // Sparkle animation for level complete
  const sparkleAnims = useRef(
    Array.from({ length: 8 }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  // Target shake animation
  const targetShakes = useRef<Record<string, Animated.Value>>({});
  const getTargetShake = (id: string) => {
    if (!targetShakes.current[id]) {
      targetShakes.current[id] = new Animated.Value(0);
    }
    return targetShakes.current[id];
  };

  // Feedback message timeout
  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>();
  const showFeedback = (msg: string) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedbackMsg(msg);
    feedbackTimer.current = setTimeout(() => setFeedbackMsg(null), 1200);
  };

  const progress = ((level - 1) + (matchedIds.length / levelData.items.length)) / TOTAL_LEVELS;

  // ── Handle Drop ──
  const handleDrop = useCallback((
    itemId: string, dx: number, dy: number, pageX: number, pageY: number,
  ) => {
    const item = levelData.items.find(i => i.id === itemId);
    if (!item || matchedIds.includes(itemId)) return;

    // Check each target for overlap using page coordinates. Iterate the
    // level's targets (NOT the onLayout cache — react-native-web's layout
    // events don't fire reliably in this bundle, which left the cache
    // empty and made every drop a silent miss). On web the ref IS the DOM
    // node, so live getBoundingClientRect is exact; native falls back to
    // the cached layout rects.
    let hitTarget: string | null = null;
    for (const t of levelData.targets) {
      const tid = t.id;
      let targetInPage: { x: number; y: number; w: number; h: number } | null = null;
      const node = targetNodes.current[tid];
      if (node && typeof node.getBoundingClientRect === "function") {
        // Web: exact current position (drop pageX/pageY includes scroll)
        const r = node.getBoundingClientRect();
        targetInPage = {
          x: r.left + window.scrollX,
          y: r.top + window.scrollY,
          w: r.width,
          h: r.height,
        };
      } else if (targetRects.current[tid]) {
        // Native: convert the cached layout rect to page coordinates
        const rect = targetRects.current[tid];
        targetInPage = {
          x: containerOffset.current.x + targetAreaOffset.current.x + rect.x,
          y: containerOffset.current.y + targetAreaOffset.current.y + rect.y,
          w: rect.w,
          h: rect.h,
        };
      }

      if (targetInPage && isOverTarget(pageX, pageY, targetInPage)) {
        hitTarget = tid;
        break;
      }
    }

    if (hitTarget && item.targetId === hitTarget) {
      // ── CORRECT MATCH ──
      SoundManager.play('success');
      showFeedback(pickRandom(CORRECT_MSGS));

      const newMatched = [...matchedIds, itemId];
      setMatchedIds(newMatched);
      const newScore = score + CORRECT_POINTS * (1 + (level - 1) * 0.1);
      setScore(Math.round(newScore));

      // Calculate snap offset: where the target is relative to the item's
      // natural position. Web reads live DOM rects (both client-space, so
      // scroll cancels out); native uses the cached layout rects.
      const targetNode = targetNodes.current[hitTarget];
      const itemNode = itemNodes.current[itemId];
      if (targetNode?.getBoundingClientRect && itemNode?.getBoundingClientRect) {
        const tRect = targetNode.getBoundingClientRect();
        const iRect = itemNode.getBoundingClientRect();
        setSnapOffsets(prev => ({
          ...prev,
          [itemId]: {
            x: (tRect.left + tRect.width / 2) - (iRect.left + iRect.width / 2),
            y: (tRect.top + tRect.height / 2) - (iRect.top + iRect.height / 2),
          },
        }));
      } else {
        const targetRect = targetRects.current[hitTarget];
        const itemRect = itemRects.current[itemId];
        if (targetRect && itemRect) {
          const snapX = (targetAreaOffset.current.x + targetRect.x + targetRect.w / 2) -
                        (itemAreaOffset.current.x + itemRect.x + itemRect.w / 2);
          const snapY = (targetAreaOffset.current.y + targetRect.y + targetRect.h / 2) -
                        (itemAreaOffset.current.y + itemRect.y + itemRect.h / 2);
          setSnapOffsets(prev => ({ ...prev, [itemId]: { x: snapX, y: snapY } }));
        }
      }

      // Check level complete
      if (newMatched.length === levelData.items.length) {
        const perfectBonus = mistakes === 0 ? PERFECT_BONUS : 0;
        const finalScore = Math.round(newScore) + perfectBonus;
        setScore(finalScore);

        setTimeout(() => {
          if (level >= TOTAL_LEVELS) {
            SoundManager.play('win');
            setTimeout(() => onComplete(finalScore), 1500);
          } else {
            setShowLevelComplete(true);
            SoundManager.play('win');
            sparkleAnims.forEach((sa, i) => {
              Animated.sequence([
                Animated.delay(i * 80),
                Animated.parallel([
                  Animated.timing(sa.scale, { toValue: 1.5, duration: 400, useNativeDriver: false }),
                  Animated.timing(sa.opacity, { toValue: 1, duration: 200, useNativeDriver: false }),
                ]),
                Animated.timing(sa.opacity, { toValue: 0, duration: 300, useNativeDriver: false }),
              ]).start();
            });
          }
        }, 500);
      }
    } else if (hitTarget) {
      // ── WRONG TARGET ──
      SoundManager.play('fail');
      showFeedback(pickRandom(WRONG_MSGS));
      setMistakes(m => m + 1);
      setScore(s => Math.max(0, s - WRONG_PENALTY));
      setWrongTargetId(hitTarget);

      // Shake the wrong target
      const shake = getTargetShake(hitTarget);
      Animated.sequence([
        Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: false }),
        Animated.timing(shake, { toValue: -10, duration: 50, useNativeDriver: false }),
        Animated.timing(shake, { toValue: 6, duration: 50, useNativeDriver: false }),
        Animated.timing(shake, { toValue: -6, duration: 50, useNativeDriver: false }),
        Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: false }),
      ]).start(() => setWrongTargetId(null));

      // Bounce item back
      // (PanResponder already released, Animated.ValueXY will spring back
      //  because we don't set a snapOffset for wrong drops)
    } else {
      // ── MISSED ALL TARGETS - bounce back ──
      // Item springs back automatically since no snapOffset is set
    }
  }, [levelData, matchedIds, score, level, mistakes, onComplete]);

  // ── Advance to next level ──
  const goNextLevel = () => {
    const nextLvl = level + 1;
    setLevel(nextLvl);
    setLevelData(buildLevel(variant, nextLvl));
    setMatchedIds([]);
    setSnapOffsets({});
    setMistakes(0);
    setShowLevelComplete(false);
    setFeedbackMsg(null);
    setWrongTargetId(null);
    targetRects.current = {};
    itemRects.current = {};
    sparkleAnims.forEach(sa => {
      sa.scale.setValue(0);
      sa.opacity.setValue(0);
    });
  };

  // ── RESPONSIVE SIZING ──
  const maxTargetsPerRow = Math.min(levelData.targets.length, 4);
  const TARGET_SIZE = Math.min(Math.floor((SW - 50 - maxTargetsPerRow * 8) / maxTargetsPerRow), 100);
  const ITEM_SIZE = Math.min(Math.floor((SW - 50 - 4 * 8) / 4), 82);

  // Min touch target: 48dp per Apple/Google guidelines (our minimum is 70px+)

  // ── Level Complete Overlay ──
  if (showLevelComplete) {
    const sparkleEmojis = ['✨', '🌟', '⭐', '💫', '🎉', '🎊', '🌈', '💖'];
    return (
      <GameShell game={game} progress={progress} onExit={onExit} onTimeUp={() => onComplete(score)} timerKey={level} timerRunning={false}>
        <View style={st.levelCompleteBg}>
          {sparkleAnims.map((a, i) => (
            <Animated.Text key={i} style={[st.sparkleFloat, {
              top: `${10 + (i % 4) * 20}%`, left: `${5 + (i % 5) * 20}%`,
              opacity: a.opacity, transform: [{ scale: a.scale }],
            }]}>{sparkleEmojis[i]}</Animated.Text>
          ))}
          <Text style={st.levelCompleteEmoji}>🎉</Text>
          <Text style={st.levelCompleteTitle}>{LEVEL_MSGS[level - 1] || 'Amazing!'}</Text>
          <Text style={st.levelCompleteScore}>Score: {score}</Text>
          <Text style={st.levelCompleteLevel}>Level {level} of {TOTAL_LEVELS}</Text>
          {mistakes === 0 && <Text style={st.perfectBadge}>Perfect! +{PERFECT_BONUS} bonus 🌟</Text>}
          <View style={st.nextBtnWrap}>
            {/* Whole button is tappable (a bare Text onPress had a tiny hit area) */}
            <TouchableOpacity
              onPress={goNextLevel}
              activeOpacity={0.8}
              style={[st.nextBtn, { backgroundColor: game.themeColors?.primary || '#4CAF50' }]}
              testID="game-next-level"
            >
              <Text style={st.nextBtnText}>Next Level →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </GameShell>
    );
  }

  // ── Instruction ──
  const instructions: Record<Variant, string> = {
    shapes: 'Drag each shape to its matching spot!',
    emotions: 'Drag each face to the matching feeling!',
    healthyplate: 'Drag each food to the right plate!',
  };

  return (
    <GameShell game={game} progress={progress} onExit={onExit} onTimeUp={() => onComplete(score)} timerKey={level}>
      <View
        style={st.container}
        onLayout={(e) => {
          const { x, y } = e.nativeEvent.layout;
          // Measure page position of container
          (e.target as any).measureInWindow?.((px: number, py: number) => {
            containerOffset.current = { x: px, y: py };
          });
        }}
      >
        {/* Header */}
        <View style={st.headerRow}>
          <View style={st.levelBadge}>
            <Text style={st.levelText}>Level {level}/{TOTAL_LEVELS}</Text>
          </View>
          <View style={st.scoreBadge}>
            <Text style={st.scoreText}>⭐ {score}</Text>
          </View>
        </View>

        <Text style={st.instruction}>{instructions[variant]}</Text>

        {/* Feedback message */}
        {feedbackMsg && (
          <View style={st.feedbackBubble}>
            <Text style={st.feedbackText}>{feedbackMsg}</Text>
          </View>
        )}

        {/* DROP TARGETS */}
        <View
          style={st.targetArea}
          onLayout={(e) => {
            targetAreaOffset.current = {
              x: e.nativeEvent.layout.x,
              y: e.nativeEvent.layout.y,
            };
          }}
        >
          <View style={st.targetRow}>
            {levelData.targets.map(t => {
              const shake = getTargetShake(t.id);
              const isWrong = wrongTargetId === t.id;
              const hasMatch = matchedIds.some(mid => {
                const item = levelData.items.find(i => i.id === mid);
                return item?.targetId === t.id;
              });
              return (
                <Animated.View
                  // level in the key forces a fresh mount per level so no
                  // animation/ref state leaks between levels
                  key={`${level}-${t.id}`}
                  ref={(node: any) => { targetNodes.current[t.id] = node; }}
                  onLayout={(e) => {
                    const { x, y, width, height } = e.nativeEvent.layout;
                    targetRects.current[t.id] = { x, y, w: width, h: height };
                  }}
                  style={[
                    st.targetCard,
                    {
                      width: TARGET_SIZE, height: TARGET_SIZE + 20,
                      backgroundColor: t.bg,
                      borderColor: hasMatch ? '#4CAF50' : isWrong ? '#FFAB91' : '#E0E0E0',
                      borderStyle: hasMatch ? 'solid' : 'dashed',
                      transform: [{ translateX: shake }],
                    },
                  ]}
                >
                  <Text style={[st.targetEmoji, { fontSize: TARGET_SIZE * 0.38 }]}>{t.emoji}</Text>
                  <Text style={st.targetLabel}>{t.label}</Text>
                  {hasMatch && <Text style={st.targetCheck}>✅</Text>}
                </Animated.View>
              );
            })}
          </View>
        </View>

        {/* DRAGGABLE ITEMS */}
        <View
          style={st.itemArea}
          onLayout={(e) => {
            itemAreaOffset.current = {
              x: e.nativeEvent.layout.x,
              y: e.nativeEvent.layout.y,
            };
          }}
        >
          <View style={st.itemRow}>
            {levelData.items.map(item => (
              <View
                // level in the key remounts each draggable: their internal
                // pan Animated values must not carry over between levels
                key={`${level}-${item.id}`}
                ref={(node: any) => { itemNodes.current[item.id] = node; }}
                onLayout={(e) => {
                  const { x, y, width, height } = e.nativeEvent.layout;
                  itemRects.current[item.id] = { x, y, w: width, h: height };
                }}
              >
                <DraggableItem
                  item={item}
                  isMatched={matchedIds.includes(item.id)}
                  size={ITEM_SIZE}
                  onDrop={handleDrop}
                  snapOffset={snapOffsets[item.id] || null}
                />
              </View>
            ))}
          </View>
        </View>
      </View>
    </GameShell>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const st = StyleSheet.create({
  container: {
    flex: 1, width: '100%', paddingTop: 4,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 4, marginBottom: 6,
  },
  levelBadge: {
    backgroundColor: '#FF9800', paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: 20,
  },
  levelText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  scoreBadge: {
    backgroundColor: '#7C4DFF', paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: 20,
  },
  scoreText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  instruction: {
    fontSize: 16, fontWeight: '800', textAlign: 'center', color: '#5D4037',
    marginBottom: 8, paddingHorizontal: 12,
  },
  feedbackBubble: {
    position: 'absolute', top: 70, alignSelf: 'center', zIndex: 500,
    backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 24, elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 6,
  },
  feedbackText: {
    fontSize: 18, fontWeight: '800', color: '#4CAF50', textAlign: 'center',
  },
  targetArea: {
    flex: 3, width: '100%', justifyContent: 'center', alignItems: 'center',
  },
  targetRow: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8,
  },
  targetCard: {
    borderRadius: 20, borderWidth: 3, alignItems: 'center',
    justifyContent: 'center', elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  targetEmoji: { marginBottom: 2 },
  targetLabel: {
    fontSize: 12, fontWeight: '700', color: '#666', textAlign: 'center',
  },
  targetCheck: { position: 'absolute', top: 4, right: 4, fontSize: 14 },
  itemArea: {
    flex: 2, width: '100%', justifyContent: 'center', alignItems: 'center',
    paddingBottom: 8, borderTopWidth: 2, borderTopColor: '#EEE', marginTop: 8,
  },
  itemRow: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8,
    paddingTop: 10,
  },
  itemCard: {
    borderRadius: 18, borderWidth: 2.5, borderColor: '#E0E0E0',
    alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 5,
  },
  itemEmoji: { marginBottom: 2 },
  itemLabel: {
    fontSize: 11, fontWeight: '700', color: '#5D4037', textAlign: 'center',
  },
  matchedCheck: { fontSize: 28 },

  // Level complete
  levelCompleteBg: {
    flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFDE7', borderRadius: 24, padding: 24,
  },
  levelCompleteEmoji: { fontSize: 64, marginBottom: 8 },
  levelCompleteTitle: {
    fontSize: 28, fontWeight: '900', color: '#388E3C', marginBottom: 6,
    textAlign: 'center',
  },
  levelCompleteScore: {
    fontSize: 20, fontWeight: '700', color: '#5D4037', marginBottom: 4,
  },
  levelCompleteLevel: {
    fontSize: 14, fontWeight: '600', color: '#999', marginBottom: 12,
  },
  perfectBadge: {
    fontSize: 16, fontWeight: '800', color: '#FF9800', marginBottom: 12,
  },
  nextBtnWrap: { marginTop: 8 },
  nextBtn: {
    paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30,
  },
  nextBtnText: {
    color: '#FFF', fontSize: 18, fontWeight: '800', textAlign: 'center',
  },
  sparkleFloat: { position: 'absolute', fontSize: 32 },
});

export default DragDropEngine;
