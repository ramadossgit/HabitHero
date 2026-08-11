import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { GameProps } from '../../types/game';
import GameShell from '../../../shared/GameShell';
import { SoundManager } from '../../../shared/SoundManager';

const ROUTINES = [
  { id: 'handwash', title: 'Hand Washing', icon: '🧼',
    steps: ['Turn on water 💧','Wet your hands 👐','Apply soap 🧴','Scrub for 20 seconds ⏱️','Rinse hands 🚿','Dry with towel 🧻'] },
  { id: 'brushteeth', title: 'Brushing Teeth', icon: '🦷',
    steps: ['Get toothbrush 🪥','Add toothpaste 🦷','Brush top teeth ⬆️','Brush bottom teeth ⬇️','Brush tongue 👅','Rinse mouth 💧'] },
  { id: 'bedtime', title: 'Bedtime Routine', icon: '🛏️',
    steps: ['Put on pajamas 👕','Brush teeth 🪥','Read a story 📖','Say goodnight 🌙','Turn off lights 💡','Close eyes 😴'] },
];

const CARD_COLORS = ['#FFE0B2','#B2EBF2','#C8E6C9','#E1BEE7','#FFCDD2','#D1C4E9'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a;
}

const SequenceEngine: React.FC<GameProps> = ({ game, onComplete, onExit }) => {
  const [routineIdx, setRoutineIdx] = useState(0);
  const [shuffled, setShuffled] = useState(() => shuffle(ROUTINES[0].steps));
  const [slots, setSlots] = useState<(string|null)[]>(Array(ROUTINES[0].steps.length).fill(null));
  const [selected, setSelected] = useState<string|null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const shakeAnims = useRef(ROUTINES[0].steps.map(() => new Animated.Value(0))).current;

  const routine = ROUTINES[routineIdx];
  const progress = routineIdx / ROUTINES.length;
  const allFilled = slots.every(s => s !== null);

  const handleStepTap = useCallback((step: string) => {
    if (checked) return;
    if (slots.includes(step)) {
      setSlots(prev => prev.map(s => s === step ? null : s));
      return;
    }
    if (selected === step) { setSelected(null); return; }
    setSelected(step);
    const nextEmpty = slots.indexOf(null);
    if (nextEmpty !== -1) {
      setSlots(prev => { const n=[...prev]; n[nextEmpty]=step; return n; });
      setSelected(null);
    }
  }, [checked, slots, selected]);

  const handleCheck = useCallback(() => {
    setChecked(true);
    const correct = slots.every((s, i) => s === routine.steps[i]);
    if (correct) {
      SoundManager.play('win');
      const pts = score + 25;
      setScore(pts);
      setTimeout(() => {
        if (routineIdx < ROUTINES.length - 1) {
          const next = routineIdx + 1;
          setRoutineIdx(next);
          setShuffled(shuffle(ROUTINES[next].steps));
          setSlots(Array(ROUTINES[next].steps.length).fill(null));
          setChecked(false);
        } else { setDone(true); setTimeout(() => onComplete(pts), 800); }
      }, 1200);
    } else {
      SoundManager.play('fail');
      slots.forEach((s, i) => {
        if (s !== routine.steps[i]) {
          Animated.sequence([
            Animated.timing(shakeAnims[i], { toValue: 10, duration: 50, useNativeDriver: false }),
            Animated.timing(shakeAnims[i], { toValue: -10, duration: 50, useNativeDriver: false }),
            Animated.timing(shakeAnims[i], { toValue: 6, duration: 50, useNativeDriver: false }),
            Animated.timing(shakeAnims[i], { toValue: 0, duration: 50, useNativeDriver: false }),
          ]).start();
        }
      });
      setTimeout(() => setChecked(false), 1000);
    }
  }, [slots, routine, routineIdx, score, shakeAnims, onComplete]);

  if (done) return (
    <GameShell game={game} progress={1} onExit={onExit}>
      <View style={s.doneBox}><Text style={s.doneEmoji}>🎉</Text><Text style={s.doneText}>All Done!</Text><Text style={s.doneScore}>Score: {score}</Text></View>
    </GameShell>
  );

  const available = shuffled.filter(step => !slots.includes(step));

  return (
    <GameShell game={game} progress={progress} onExit={onExit} onTimeUp={() => onComplete(score)}>
      <View style={s.header}>
        <Text style={s.headerIcon}>{routine.icon}</Text>
        <Text style={s.headerTitle}>{routine.title}</Text>
        <Text style={s.routineCount}>{routineIdx + 1}/{ROUTINES.length}</Text>
      </View>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.label}>Arrange in correct order:</Text>
        {routine.steps.map((_, i) => {
          const placed = slots[i];
          const isWrong = checked && placed !== null && placed !== routine.steps[i];
          const isRight = checked && placed !== null && placed === routine.steps[i];
          return (
            <Animated.View key={i} style={{ transform: [{ translateX: shakeAnims[i] }] }}>
              <TouchableOpacity
                style={[s.slot, placed ? s.slotFilled : s.slotEmpty, isWrong && s.slotWrong, isRight && s.slotRight]}
                onPress={() => placed && !checked && setSlots(prev => { const n=[...prev]; n[i]=null; return n; })}
              >
                <Text style={s.slotNum}>{i + 1}</Text>
                <Text style={s.slotText}>{placed ?? '   tap a step below   '}</Text>
                {isRight && <Text style={s.check}>✓</Text>}
                {isWrong && <Text style={s.cross}>✗</Text>}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
        <Text style={[s.label, { marginTop: 16 }]}>Steps (tap to place):</Text>
        {available.map((step, i) => (
          <TouchableOpacity key={step} style={[s.stepCard, { backgroundColor: CARD_COLORS[i % CARD_COLORS.length] }, selected === step && s.stepSelected]}
            onPress={() => handleStepTap(step)}>
            <Text style={s.stepText}>{step}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[s.checkBtn, !allFilled && s.checkBtnDisabled]} onPress={allFilled ? handleCheck : undefined}>
          <Text style={s.checkBtnText}>Check Order ✓</Text>
        </TouchableOpacity>
        <View style={{ height: 20 }} />
      </ScrollView>
    </GameShell>
  );
};

const s = StyleSheet.create({
  header: { flexDirection:'row', alignItems:'center', marginBottom:12, gap:8 },
  headerIcon: { fontSize:28 },
  headerTitle: { fontSize:20, fontWeight:'800', color:'#333', flex:1 },
  routineCount: { fontSize:14, color:'#888', fontWeight:'700' },
  scroll: { flex:1, width:'100%' },
  label: { fontSize:14, fontWeight:'700', color:'#666', marginBottom:8 },
  slot: { flexDirection:'row', alignItems:'center', borderRadius:12, padding:12, marginBottom:6, gap:10 },
  slotEmpty: { borderWidth:2, borderStyle:'dashed', borderColor:'#BDBDBD', backgroundColor:'#FAFAFA' },
  slotFilled: { backgroundColor:'#E3F2FD', borderWidth:2, borderColor:'#90CAF9' },
  slotWrong: { backgroundColor:'#FFCDD2', borderColor:'#E53935' },
  slotRight: { backgroundColor:'#C8E6C9', borderColor:'#4CAF50' },
  slotNum: { fontSize:16, fontWeight:'800', color:'#888', width:24 },
  slotText: { flex:1, fontSize:14, color:'#333', fontWeight:'600' },
  check: { fontSize:18, color:'#4CAF50' },
  cross: { fontSize:18, color:'#E53935' },
  stepCard: { borderRadius:12, padding:14, marginBottom:6 },
  stepSelected: { borderWidth:2, borderColor:'#2196F3' },
  stepText: { fontSize:14, fontWeight:'600', color:'#333' },
  checkBtn: { backgroundColor:'#4CAF50', borderRadius:16, padding:16, alignItems:'center', marginTop:20 },
  checkBtnDisabled: { backgroundColor:'#BDBDBD' },
  checkBtnText: { color:'#FFF', fontSize:18, fontWeight:'800' },
  doneBox: { alignItems:'center', justifyContent:'center', flex:1 },
  doneEmoji: { fontSize:80 },
  doneText: { fontSize:28, fontWeight:'800', color:'#333', marginTop:16 },
  doneScore: { fontSize:22, color:'#4CAF50', fontWeight:'700', marginTop:8 },
});

export default SequenceEngine;
