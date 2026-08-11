import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { GameProps } from '../../types/game';
import GameShell from '../../../shared/GameShell';
import { SoundManager } from '../../../shared/SoundManager';

type Phase = 'inhale'|'hold'|'exhale'|'rest';

const PHASES: Phase[] = ['inhale','hold','exhale','rest'];
const DURATIONS: Record<Phase,number> = { inhale:4000, hold:4000, exhale:4000, rest:1000 };
const PHASE_TEXT: Record<Phase,string> = { inhale:'Breathe In... 🌬️', hold:'Hold... 🤍', exhale:'Breathe Out... 💨', rest:'Ready...' };
const PHASE_COLORS: Record<Phase,string> = { inhale:'#BBDEFB', hold:'#D1C4E9', exhale:'#C8E6C9', rest:'#F5F5F5' };
const TARGET_CYCLES = 5;

const BreathingEngine: React.FC<GameProps> = ({ game, onComplete, onExit }) => {
  const [phase,   setPhase]   = useState<Phase>('rest');
  const [cycles,  setCycles]  = useState(0);
  const [started, setStarted] = useState(false);
  const [timer,   setTimer]   = useState(0);
  const [score,   setScore]   = useState(0);

  const balloonScale = useRef(new Animated.Value(0.5)).current;
  const bgColor      = useRef(new Animated.Value(0)).current;
  const phaseRef     = useRef<Phase>('rest');
  const cycleRef     = useRef(0);
  const anim         = useRef<Animated.CompositeAnimation|null>(null);
  const timerRef     = useRef<ReturnType<typeof setInterval>|null>(null);

  useEffect(() => { return () => { anim.current?.stop(); if (timerRef.current) clearInterval(timerRef.current); }; }, []);

  const startBreathing = () => {
    setStarted(true);
    runPhase('inhale');
  };

  const runPhase = (ph: Phase) => {
    phaseRef.current = ph;
    setPhase(ph);
    setTimer(Math.round(DURATIONS[ph]/1000));
    if (timerRef.current) clearInterval(timerRef.current);
    let t = Math.round(DURATIONS[ph]/1000);
    timerRef.current = setInterval(() => { t--; setTimer(t); if (t<=0 && timerRef.current) clearInterval(timerRef.current); }, 1000);

    // Balloon animation
    anim.current?.stop();
    let toScale = ph==='inhale' ? 1.0 : ph==='hold' ? 1.0 : 0.5;
    anim.current = Animated.timing(balloonScale, { toValue: toScale, duration: DURATIONS[ph], useNativeDriver:false });
    if (ph==='hold') {
      anim.current = Animated.loop(Animated.sequence([
        Animated.timing(balloonScale, { toValue:1.06, duration:500, useNativeDriver:false }),
        Animated.timing(balloonScale, { toValue:0.98, duration:500, useNativeDriver:false }),
      ]));
    }
    anim.current.start();

    setTimeout(() => {
      const next = nextPhase(ph);
      if (next === 'inhale') {
        const nc = cycleRef.current + 1;
        cycleRef.current = nc;
        setCycles(nc);
        setScore(nc * 12);
        if (nc >= TARGET_CYCLES) {
          SoundManager.play('win');
          setTimeout(() => onComplete(nc * 12), 600);
          return;
        }
      }
      runPhase(next);
    }, DURATIONS[ph]);
  };

  const nextPhase = (ph: Phase): Phase => {
    if (ph==='inhale') return 'hold';
    if (ph==='hold')   return 'exhale';
    if (ph==='exhale') return 'rest';
    return 'inhale';
  };

  const bgStyle = { backgroundColor: PHASE_COLORS[phase] };

  return (
    <GameShell game={game} progress={cycles / TARGET_CYCLES} onExit={onExit}>
      <View style={[s.container, bgStyle]}>
        {/* Phase text */}
        <Text style={[s.phaseText, { color: phase==='inhale'?'#1565C0':phase==='hold'?'#6A1B9A':'#2E7D32' }]}>
          {PHASE_TEXT[phase]}
        </Text>

        {/* Timer */}
        {started && timer > 0 && <Text style={s.timerText}>{timer}s</Text>}

        {/* Balloon */}
        <Animated.View style={[s.balloon, { transform:[{ scale: balloonScale }] }]}>
          <View style={[s.balloonInner, { backgroundColor:
            phase==='inhale'?'#FF7043':phase==='hold'?'#AB47BC':'#66BB6A' }]}>
            <Text style={s.balloonEmoji}>🎈</Text>
          </View>
          <View style={s.string} />
        </Animated.View>

        {/* Cycle counter */}
        <View style={s.cycleRow}>
          {[...Array(TARGET_CYCLES)].map((_, i) => (
            <View key={i} style={[s.cycleDot, i < cycles ? s.cycleDotDone : s.cycleDotEmpty]} />
          ))}
        </View>
        <Text style={s.cycleText}>Cycle {Math.min(cycles + (started?1:0), TARGET_CYCLES)} of {TARGET_CYCLES}</Text>

        {/* Instructions */}
        {!started ? (
          <View style={s.startBox}>
            <Text style={s.startMsg}>Take 5 slow, deep breaths with the balloon 🎈</Text>
            <TouchableOpacity style={s.startBtn} onPress={startBreathing}>
              <Text style={s.startBtnText}>Start Breathing ▶️</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={s.guideTxt}>
            {phase==='inhale' ? 'Slowly breathe in as the balloon grows...' :
             phase==='hold'   ? 'Hold your breath gently...' :
             phase==='exhale' ? 'Slowly let the air out...' : 'Almost ready...'}
          </Text>
        )}
      </View>
    </GameShell>
  );
};

const s = StyleSheet.create({
  container:     { flex:1, width:'100%', alignItems:'center', justifyContent:'center', borderRadius:20, padding:16 },
  phaseText:     { fontSize:26, fontWeight:'900', marginBottom:4, textAlign:'center' },
  timerText:     { fontSize:42, fontWeight:'900', color:'rgba(0,0,0,0.3)', marginBottom:8 },
  balloon:       { alignItems:'center', marginBottom:24 },
  balloonInner:  { width:180, height:180, borderRadius:90, alignItems:'center', justifyContent:'center',
    elevation:8, shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.2, shadowRadius:8 },
  balloonEmoji:  { fontSize:80 },
  string:        { width:3, height:60, backgroundColor:'#888', borderRadius:2 },
  cycleRow:      { flexDirection:'row', gap:10, marginBottom:8 },
  cycleDot:      { width:16, height:16, borderRadius:8 },
  cycleDotDone:  { backgroundColor:'#FF7043' },
  cycleDotEmpty: { backgroundColor:'#E0E0E0' },
  cycleText:     { fontSize:14, fontWeight:'700', color:'#555', marginBottom:12 },
  startBox:      { alignItems:'center', gap:12, marginTop:8 },
  startMsg:      { fontSize:16, color:'#555', textAlign:'center', lineHeight:24, paddingHorizontal:16 },
  startBtn:      { backgroundColor:'#FF7043', borderRadius:30, paddingHorizontal:32, paddingVertical:16 },
  startBtnText:  { color:'#FFF', fontSize:18, fontWeight:'800' },
  guideTxt:      { fontSize:15, color:'#666', textAlign:'center', fontStyle:'italic', paddingHorizontal:16, lineHeight:22 },
});

export default BreathingEngine;
