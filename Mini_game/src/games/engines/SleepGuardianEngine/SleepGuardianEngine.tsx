import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { GameProps } from '../../types/game';
import GameShell from '../../../shared/GameShell';
import { SoundManager } from '../../../shared/SoundManager';

const CHARACTERS = [
  { name:'Luna', emoji:'👧', color:'#E91E63',
    steps:[{action:'Put on pajamas',item:'👕'},{action:'Brush teeth',item:'🪥'},{action:'Read a story',item:'📖'},{action:'Turn off light',item:'💡'},{action:'Go to sleep',item:'🛏️'}] },
  { name:'Max', emoji:'👦', color:'#2196F3',
    steps:[{action:'Take a bath',item:'🛁'},{action:'Drink warm milk',item:'🥛'},{action:'Put on pajamas',item:'👕'},{action:'Say goodnight',item:'👋'},{action:'Go to sleep',item:'🛏️'}] },
  { name:'Bella', emoji:'🧒', color:'#9C27B0',
    steps:[{action:'Tidy up toys',item:'🧸'},{action:'Brush teeth',item:'🪥'},{action:'Hug teddy bear',item:'🐻'},{action:'Turn off light',item:'💡'},{action:'Go to sleep',item:'🛏️'}] },
];

const SleepGuardianEngine: React.FC<GameProps> = ({ game, onComplete, onExit }) => {
  const [charIdx, setCharIdx]     = useState(0);
  const [stepIdx, setStepIdx]     = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const [wrong, setWrong]         = useState<number|null>(null);
  const [asleep, setAsleep]       = useState(false);
  const [score, setScore]         = useState(0);
  const shakeAnim                 = useRef(new Animated.Value(0)).current;
  const charAnim                  = useRef(new Animated.Value(1)).current;

  const char  = CHARACTERS[charIdx];
  const steps = char.steps;
  const totalSteps = CHARACTERS.reduce((s, c) => s + c.steps.length, 0);
  const doneSteps  = CHARACTERS.slice(0, charIdx).reduce((s, c) => s + c.steps.length, 0) + completed.length;
  const progress   = doneSteps / totalSteps;

  const tapItem = (itemIdx: number) => {
    if (asleep) return;
    if (itemIdx === stepIdx) {
      SoundManager.play('success');
      const nc = [...completed, itemIdx];
      setCompleted(nc);
      const ns = score + 5; setScore(ns);
      if (nc.length === steps.length) {
        setAsleep(true);
        Animated.sequence([
          Animated.timing(charAnim, { toValue:1.2, duration:300, useNativeDriver:false }),
          Animated.timing(charAnim, { toValue:1,   duration:300, useNativeDriver:false }),
        ]).start();
        SoundManager.play('win');
        setTimeout(() => {
          const next = charIdx + 1;
          if (next < CHARACTERS.length) {
            setCharIdx(next); setStepIdx(0); setCompleted([]); setAsleep(false); charAnim.setValue(1);
          } else { onComplete(ns); }
        }, 1400);
      } else { setStepIdx(itemIdx + 1); }
    } else {
      setWrong(itemIdx);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue:8,  duration:50, useNativeDriver:false }),
        Animated.timing(shakeAnim, { toValue:-8, duration:50, useNativeDriver:false }),
        Animated.timing(shakeAnim, { toValue:0,  duration:50, useNativeDriver:false }),
      ]).start(() => setWrong(null));
    }
  };

  // Show items in 2 rows of 3 (or flexible)
  return (
    <GameShell game={game} progress={progress} onExit={onExit} onTimeUp={() => onComplete(score)}>
      {/* Character banner */}
      <View style={[s.banner, { backgroundColor: char.color + '22', borderColor: char.color }]}>
        <Animated.Text style={[s.charEmoji, { transform:[{scale:charAnim}] }]}>
          {asleep ? '😴' : char.emoji}
        </Animated.Text>
        <View style={s.bannerInfo}>
          <Text style={[s.charName, { color: char.color }]}>Bedtime for {char.name}!</Text>
          <Text style={s.instruction}>
            {asleep ? '😴 Sweet dreams!' : `Next: ${steps[stepIdx].action}`}
          </Text>
        </View>
        <Text style={s.charCount}>{charIdx+1}/{CHARACTERS.length}</Text>
      </View>

      {/* Step progress dots */}
      <View style={s.dots}>
        {steps.map((_, i) => (
          <View key={i} style={[s.dot, completed.includes(i) ? { backgroundColor: char.color } : s.dotEmpty]} />
        ))}
      </View>

      {/* Bedroom scene */}
      <View style={[s.bedroom, { backgroundColor:'#1A237E22' }]}>
        <Text style={s.bedroomLabel}>🌙 Bedroom</Text>
        <View style={s.itemsGrid}>
          {steps.map((step, i) => {
            const isDone  = completed.includes(i);
            const isCurr  = i === stepIdx && !asleep;
            const isWrong = wrong === i;
            return (
              <Animated.View key={i} style={{ transform:[{translateX: isWrong ? shakeAnim : 0}] }}>
                <TouchableOpacity style={[s.itemBtn,
                    isDone  ? [s.itemDone, { borderColor: char.color }] : s.itemPending,
                    isCurr  && s.itemCurrent,
                    isWrong && s.itemWrong,
                  ]} onPress={() => tapItem(i)}>
                  <Text style={s.itemEmoji}>{isDone ? '✅' : step.item}</Text>
                  <Text style={s.itemLabel} numberOfLines={2}>{step.action}</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </View>

      {!asleep && <Text style={s.hintText}>👆 Tap the correct next step!</Text>}
      <Text style={s.scoreText}>Score: {score}</Text>
    </GameShell>
  );
};

const s = StyleSheet.create({
  banner:      { flexDirection:'row', alignItems:'center', borderRadius:16, borderWidth:2, padding:12, marginBottom:10, gap:10, width:'100%' },
  charEmoji:   { fontSize:40 },
  bannerInfo:  { flex:1 },
  charName:    { fontSize:16, fontWeight:'800' },
  instruction: { fontSize:13, color:'#555', fontWeight:'600' },
  charCount:   { fontSize:13, color:'#888', fontWeight:'700' },
  dots:        { flexDirection:'row', gap:8, marginBottom:12 },
  dot:         { width:14, height:14, borderRadius:7 },
  dotEmpty:    { backgroundColor:'#E0E0E0' },
  bedroom:     { width:'100%', borderRadius:16, padding:12, marginBottom:8 },
  bedroomLabel:{ fontSize:13, fontWeight:'700', color:'#5C6BC0', marginBottom:10, textAlign:'center' },
  itemsGrid:   { flexDirection:'row', flexWrap:'wrap', gap:8, justifyContent:'center' },
  itemBtn:     { width:90, height:90, borderRadius:16, borderWidth:2, alignItems:'center', justifyContent:'center', padding:6 },
  itemPending: { backgroundColor:'#303F9F', borderColor:'#5C6BC0' },
  itemDone:    { backgroundColor:'#2E7D32', borderWidth:2 },
  itemCurrent: { backgroundColor:'#FF6F00', borderColor:'#FFD54F', borderWidth:3 },
  itemWrong:   { backgroundColor:'#C62828', borderColor:'#EF9A9A' },
  itemEmoji:   { fontSize:30 },
  itemLabel:   { fontSize:9, color:'#FFF', textAlign:'center', fontWeight:'600', marginTop:2 },
  hintText:    { fontSize:12, color:'#888', fontStyle:'italic', marginBottom:4 },
  scoreText:   { fontSize:15, fontWeight:'700', color:'#7C4DFF' },
});

export default SleepGuardianEngine;
