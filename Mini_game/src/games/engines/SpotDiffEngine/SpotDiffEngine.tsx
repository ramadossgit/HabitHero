import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { GameProps } from '../../types/game';
import GameShell from '../../../shared/GameShell';
import { SoundManager } from '../../../shared/SoundManager';

const { width: SW } = Dimensions.get('window');

const LEVELS = [
  { title:'Park Scene', rows:3, cols:3,
    original:[['🌳','🌸','🦋'],['🐕','🏃','🌻'],['🌿','🦆','☀️']],
    modified: [['🌳','🌺','🦋'],['🐕','🏃','🌻'],['🌿','🐦','☀️']],
    diffs:[{r:0,c:1},{r:2,c:1}] },
  { title:'Kitchen Scene', rows:4, cols:3,
    original:[['🍎','🍕','🧁'],['🥗','🍳','🥤'],['🍪','🎂','🍩'],['🥄','🍽️','🥢']],
    modified: [['🍎','🍕','🧁'],['🥗','🍳','🧃'],['🍪','🎂','🍩'],['🥄','🍴','🥢']],
    diffs:[{r:1,c:2},{r:3,c:1}] },
  { title:'Space Scene', rows:4, cols:4,
    original:[['🌟','🚀','🌙','⭐'],['🪐','👨‍🚀','☄️','🌍'],['🛸','🌕','🔭','💫'],['🌌','⚡','🛰️','🌠']],
    modified: [['🌟','🚀','🌙','🌟'],['🪐','👨‍🚀','☄️','🌍'],['🛸','🌑','🔭','💫'],['🌌','⚡','🛰️','🌟']],
    diffs:[{r:0,c:3},{r:2,c:1},{r:3,c:3}] },
];

const SpotDiffEngine: React.FC<GameProps> = ({ game, onComplete, onExit }) => {
  const [levelIdx, setLevelIdx] = useState(0);
  const [found, setFound]       = useState<Set<string>>(new Set());
  const [score, setScore]       = useState(0);
  const [wrongTap, setWrongTap] = useState<string|null>(null);
  const wrongAnim               = useRef(new Animated.Value(0)).current;

  const level    = LEVELS[levelIdx];
  const total    = level.diffs.length;
  const progress = (levelIdx + found.size / total) / LEVELS.length;
  const cellSize = Math.floor((SW - 48) / level.cols);

  const tapCell = (ri: number, ci: number) => {
    const key = `${ri}-${ci}`;
    if (found.has(key)) return;
    const isDiff = level.diffs.some(d => d.r===ri && d.c===ci);
    if (isDiff) {
      SoundManager.play('success');
      const nf = new Set([...found, key]);
      setFound(nf);
      const pts = score + 12;
      setScore(pts);
      if (nf.size === total) {
        SoundManager.play('win');
        setTimeout(() => {
          const nextIdx = levelIdx + 1;
          if (nextIdx < LEVELS.length) {
            setLevelIdx(nextIdx); setFound(new Set());
          } else { onComplete(pts + 16); }
        }, 900);
      }
    } else {
      setWrongTap(key);
      Animated.sequence([
        Animated.timing(wrongAnim, { toValue:1, duration:80, useNativeDriver:false }),
        Animated.timing(wrongAnim, { toValue:0, duration:200, useNativeDriver:false }),
      ]).start(() => setWrongTap(null));
    }
  };

  const renderGrid = (grid: string[][], isRight: boolean) => (
    <View style={[s.gridWrapper, isRight && s.gridRight]}>
      <Text style={s.gridLabel}>{isRight ? 'Spot Changes 🔍' : 'Original'}</Text>
      {grid.map((row, ri) => (
        <View key={ri} style={{ flexDirection:'row', gap:2, marginBottom:2 }}>
          {row.map((emoji, ci) => {
            const key = `${ri}-${ci}`;
            const isFound = found.has(key);
            const isWrong = wrongTap === key;
            return (
              <TouchableOpacity key={ci}
                style={[{ width:cellSize, height:cellSize, alignItems:'center', justifyContent:'center', borderRadius:6, borderWidth:1, borderColor:'#E0E0E0', backgroundColor:'#FAFAFA' },
                  isFound && { borderColor:'#4CAF50', borderWidth:3, backgroundColor:'#E8F5E9' },
                  isWrong && { backgroundColor:'#FFCDD2' }]}
                onPress={() => tapCell(ri, ci)}>
                <Text style={{ fontSize: cellSize * 0.55 }}>{emoji}</Text>
                {isFound && <Text style={s.foundMark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );

  return (
    <GameShell game={game} progress={progress} onExit={onExit} onTimeUp={() => onComplete(score)}>
      <Text style={s.title}>{level.title}</Text>
      <Text style={s.counter}>Found: {found.size}/{total} differences</Text>
      <View style={s.row}>
        {renderGrid(level.original, false)}
        {renderGrid(level.modified, true)}
      </View>
      <Text style={s.hint}>Tap on a difference in either scene!</Text>
      <Text style={s.scoreText}>Score: {score}</Text>
    </GameShell>
  );
};

const s = StyleSheet.create({
  title:      { fontSize:20, fontWeight:'800', color:'#00897B', marginBottom:4 },
  counter:    { fontSize:14, fontWeight:'700', color:'#555', marginBottom:10 },
  row:        { flexDirection:'row', gap:8, width:'100%' },
  gridWrapper:{ flex:1 },
  gridRight:  {},
  gridLabel:  { fontSize:11, fontWeight:'700', color:'#666', marginBottom:4, textAlign:'center' },
  foundMark:  { position:'absolute', bottom:2, right:2, fontSize:10, color:'#4CAF50', fontWeight:'900' },
  hint:       { fontSize:12, color:'#888', fontStyle:'italic', marginTop:8, textAlign:'center' },
  scoreText:  { fontSize:16, fontWeight:'700', color:'#00897B', marginTop:6 },
});

export default SpotDiffEngine;
