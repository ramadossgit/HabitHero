import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { GameProps } from '../../types/game';
import GameShell from '../../../shared/GameShell';
import { SoundManager } from '../../../shared/SoundManager';

const GOAL = 8;
const FACTS = [
  '💧 Water helps your brain think faster!',
  '🧠 Your body is 60% water!',
  '⚡ Drinking water gives you energy!',
  '✨ Water keeps your skin healthy!',
  '💪 Water helps your muscles grow strong!',
  '🌟 Staying hydrated helps you focus!',
];

const WaterTrackerEngine: React.FC<GameProps> = ({ game, onComplete, onExit }) => {
  const [taps, setTaps]         = useState(0);
  const [fact, setFact]         = useState<string|null>(null);
  const [done, setDone]         = useState(false);
  const [score, setScore]       = useState(0);
  const waterAnim               = useRef(new Animated.Value(0)).current;
  const factOpacity             = useRef(new Animated.Value(0)).current;
  const splashAnim              = useRef(new Animated.Value(1)).current;
  const bubbles                 = useRef([...Array(5)].map(() => ({ y: new Animated.Value(0), op: new Animated.Value(0) }))).current;

  const animateBubbles = () => {
    bubbles.forEach((b, i) => {
      b.y.setValue(0); b.op.setValue(0);
      Animated.sequence([
        Animated.delay(i * 120),
        Animated.parallel([
          Animated.timing(b.op, { toValue:1, duration:200, useNativeDriver:false }),
          Animated.timing(b.y,  { toValue:-60-(i*10), duration:800, useNativeDriver:false }),
          Animated.timing(b.op, { toValue:0, duration:800, useNativeDriver:false }),
        ]),
      ]).start();
    });
  };

  const showFact = (index: number) => {
    const factText = FACTS[index % FACTS.length];
    setFact(factText);
    factOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(factOpacity, { toValue:1, duration:400, useNativeDriver:false }),
      Animated.delay(2200),
      Animated.timing(factOpacity, { toValue:0, duration:400, useNativeDriver:false }),
    ]).start(() => setFact(null));
  };

  const drinkWater = () => {
    if (done) return;
    const newTaps = taps + 1;
    setTaps(newTaps);
    const newScore = score + 10;
    setScore(newScore);
    SoundManager.play('success');
    Animated.timing(waterAnim, { toValue: newTaps / GOAL, duration:600, useNativeDriver:false }).start();
    animateBubbles();
    // Splash button anim
    Animated.sequence([
      Animated.timing(splashAnim, { toValue:0.92, duration:80, useNativeDriver:false }),
      Animated.timing(splashAnim, { toValue:1.05, duration:80, useNativeDriver:false }),
      Animated.timing(splashAnim, { toValue:1,    duration:80, useNativeDriver:false }),
    ]).start();
    if (newTaps % 2 === 0) showFact(newTaps / 2);
    if (newTaps >= GOAL) {
      setDone(true);
      SoundManager.play('win');
      setTimeout(() => onComplete(newScore), 1000);
    }
  };

  const fillHeight = waterAnim.interpolate({ inputRange:[0,1], outputRange:['0%','100%'] });
  const pct = Math.round((taps / GOAL) * 100);

  return (
    <GameShell game={game} progress={taps / GOAL} onExit={onExit} onTimeUp={() => onComplete(score)}>
      <Text style={s.title}>Stay Hydrated! 💧</Text>
      <Text style={s.glasses}>Glasses: {taps}/{GOAL} 🥤</Text>

      {/* Bottle */}
      <View style={s.bottleOuter}>
        {/* Neck */}
        <View style={s.neck} />
        {/* Body */}
        <View style={s.body}>
          {/* Water fill */}
          <Animated.View style={[s.water, { height: fillHeight }]}>
            {/* Bubbles */}
            {bubbles.map((b, i) => (
              <Animated.View key={i} style={[s.bubble, {
                left: 20 + i * 18,
                transform:[{ translateY: b.y }],
                opacity: b.op,
              }]} />
            ))}
          </Animated.View>
          <Text style={s.pctText}>{pct}%</Text>
        </View>
      </View>

      {/* Fact card */}
      {fact && (
        <Animated.View style={[s.factCard, { opacity: factOpacity }]}>
          <Text style={s.factText}>{fact}</Text>
        </Animated.View>
      )}

      {/* Button */}
      <Animated.View style={{ transform:[{ scale: splashAnim }] }}>
        <TouchableOpacity style={[s.drinkBtn, done && s.drinkBtnDone]} onPress={drinkWater} disabled={done}>
          <Text style={s.drinkBtnText}>{done ? '🎉 Fully Hydrated!' : 'Drink Water 💧'}</Text>
        </TouchableOpacity>
      </Animated.View>

      {done && <Text style={s.doneMsg}>Amazing! You drank all your water! ⭐</Text>}
    </GameShell>
  );
};

const s = StyleSheet.create({
  title:       { fontSize:22, fontWeight:'800', color:'#0277BD', marginBottom:4 },
  glasses:     { fontSize:16, fontWeight:'700', color:'#555', marginBottom:16 },
  bottleOuter: { alignItems:'center', marginBottom:16 },
  neck:        { width:50, height:40, backgroundColor:'#FFF', borderWidth:3, borderColor:'#1565C0', borderBottomWidth:0, borderRadius:8, borderBottomLeftRadius:0, borderBottomRightRadius:0 },
  body:        { width:150, height:260, borderWidth:3, borderColor:'#1565C0', borderRadius:20, overflow:'hidden', backgroundColor:'#E3F2FD', justifyContent:'center', alignItems:'center' },
  water:       { position:'absolute', bottom:0, left:0, right:0, backgroundColor:'#42A5F5', borderBottomLeftRadius:16, borderBottomRightRadius:16 },
  bubble:      { position:'absolute', bottom:10, width:12, height:12, borderRadius:6, backgroundColor:'rgba(255,255,255,0.6)' },
  pctText:     { fontSize:28, fontWeight:'900', color:'#1565C0', zIndex:2, textShadowColor:'rgba(255,255,255,0.8)', textShadowOffset:{width:1,height:1}, textShadowRadius:2 },
  factCard:    { backgroundColor:'#E1F5FE', borderRadius:16, padding:14, marginBottom:12, width:'100%', borderLeftWidth:4, borderLeftColor:'#0277BD' },
  factText:    { fontSize:15, fontWeight:'600', color:'#01579B', textAlign:'center' },
  drinkBtn:    { backgroundColor:'#1565C0', borderRadius:30, paddingHorizontal:32, paddingVertical:18, alignItems:'center', marginBottom:8 },
  drinkBtnDone:{ backgroundColor:'#4CAF50' },
  drinkBtnText:{ color:'#FFF', fontSize:20, fontWeight:'800' },
  doneMsg:     { fontSize:16, fontWeight:'700', color:'#4CAF50', textAlign:'center', marginTop:6 },
});

export default WaterTrackerEngine;
