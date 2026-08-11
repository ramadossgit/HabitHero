import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { GameProps } from '../../types/game';
import GameShell from '../../../shared/GameShell';
import { SoundManager } from '../../../shared/SoundManager';

const { width: SW } = Dimensions.get('window');

const MAZES = [
  { name:'Garden Path', size:7,
    grid:[[2,0,1,1,1,1,1],[1,0,0,0,1,0,1],[1,1,1,0,1,0,1],[1,0,0,0,0,0,1],[1,0,1,1,1,0,1],[1,0,0,0,0,0,1],[1,1,1,1,1,0,3]],
    stars:[{r:1,c:3},{r:3,c:1}] },
  { name:'Forest Trail', size:7,
    grid:[[2,0,0,1,1,1,1],[1,1,0,0,0,0,1],[1,1,1,1,1,0,1],[1,0,0,0,0,0,1],[1,0,1,0,1,1,1],[1,0,1,0,0,0,0],[1,0,1,1,1,1,3]],
    stars:[{r:1,c:4},{r:3,c:1},{r:5,c:4}] },
  { name:'Mountain Cave', size:9,
    grid:[[2,0,1,1,1,1,1,1,1],[1,0,0,0,0,0,1,0,1],[1,1,1,1,1,0,1,0,1],[1,0,0,0,0,0,0,0,1],[1,0,1,1,1,1,1,0,1],[1,0,0,0,0,0,1,0,1],[1,1,1,1,1,0,1,0,1],[1,0,0,0,0,0,0,0,1],[1,1,1,1,1,1,1,0,3]],
    stars:[{r:1,c:3},{r:3,c:1},{r:5,c:3},{r:7,c:2}] },
];

const MazeEngine: React.FC<GameProps> = ({ game, onComplete, onExit }) => {
  const [mazeIdx, setMazeIdx] = useState(0);
  const [pos, setPos]         = useState({ r:0, c:0 });
  const [moves, setMoves]     = useState(0);
  const [starsHit, setStarsHit] = useState(0);
  const [collected, setCollected] = useState<Set<string>>(new Set());
  const [score, setScore]     = useState(0);
  const [levelDone, setLevelDone] = useState(false);
  const bumpAnim              = useRef(new Animated.Value(0)).current;

  const maze     = MAZES[mazeIdx];
  const cellSize = Math.floor((SW - 40) / maze.size);
  const progress = mazeIdx / MAZES.length;
  const emojiSize = Math.max(12, cellSize * 0.55);

  const bump = () => Animated.sequence([
    Animated.timing(bumpAnim, { toValue:5,  duration:60, useNativeDriver:false }),
    Animated.timing(bumpAnim, { toValue:-5, duration:60, useNativeDriver:false }),
    Animated.timing(bumpAnim, { toValue:0,  duration:60, useNativeDriver:false }),
  ]).start();

  const move = (dr: number, dc: number) => {
    if (levelDone) return;
    const nr = pos.r + dr, nc = pos.c + dc;
    if (nr < 0 || nr >= maze.size || nc < 0 || nc >= maze.size || maze.grid[nr][nc] === 1) {
      bump(); SoundManager.play('fail'); return;
    }
    const nm = moves + 1;
    setMoves(nm); setPos({ r:nr, c:nc });
    const key = `${nr}-${nc}`;
    let newStars = starsHit;
    if (!collected.has(key) && maze.stars.some(s => s.r===nr && s.c===nc)) {
      setCollected(prev => new Set([...prev, key]));
      newStars = starsHit + 1; setStarsHit(newStars);
    }
    if (maze.grid[nr][nc] === 3) {
      SoundManager.play('win');
      const add = Math.max(100 - nm*2, 20) + newStars*10;
      const ns = score + add; setScore(ns); setLevelDone(true);
      setTimeout(() => {
        const next = mazeIdx + 1;
        if (next < MAZES.length) {
          setMazeIdx(next); setPos({r:0,c:0}); setMoves(0);
          setStarsHit(0); setCollected(new Set()); setLevelDone(false);
        } else { onComplete(ns); }
      }, 1200);
    }
  };

  return (
    <GameShell game={game} progress={progress} onExit={onExit} onTimeUp={() => onComplete(score)} timerKey={mazeIdx} timerRunning={!levelDone}>
      <View style={s.statusRow}>
        <Text style={s.mazeName}>{maze.name}</Text>
        <Text style={s.stat}>👣 {moves}</Text>
        <Text style={s.stat}>⭐ {starsHit}/{maze.stars.length}</Text>
      </View>

      {/* Grid */}
      <View style={{ gap:2, marginBottom:14, alignSelf:'center' }}>
        {maze.grid.map((row, ri) => (
          <View key={ri} style={{ flexDirection:'row', gap:2 }}>
            {row.map((cell, ci) => {
              const isPlayer = pos.r===ri && pos.c===ci;
              const hasStar  = !collected.has(`${ri}-${ci}`) && maze.stars.some(s=>s.r===ri&&s.c===ci);
              return (
                <View key={ci} style={[{ width:cellSize, height:cellSize, borderRadius:3, alignItems:'center', justifyContent:'center' },
                  cell===1 ? { backgroundColor:'#37474F' } : { backgroundColor:'#FFFDE7' }]}>
                  {isPlayer
                    ? <Animated.Text style={{ fontSize:emojiSize, transform:[{translateX:bumpAnim}] }}>🐱</Animated.Text>
                    : hasStar   ? <Text style={{ fontSize:emojiSize }}>⭐</Text>
                    : cell===3  ? <Text style={{ fontSize:emojiSize }}>🚪</Text>
                    : null}
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {levelDone && (
        <View style={s.doneBox}>
          <Text style={s.doneTxt}>🎉 Level Complete!</Text>
          <Text style={s.doneScore}>Score: {score}</Text>
        </View>
      )}

      {/* D-Pad */}
      <View style={s.dpad}>
        <TouchableOpacity style={s.dBtn} onPress={() => move(-1,0)}><Text style={s.dArrow}>⬆️</Text></TouchableOpacity>
        <View style={s.dRow}>
          <TouchableOpacity style={s.dBtn} onPress={() => move(0,-1)}><Text style={s.dArrow}>⬅️</Text></TouchableOpacity>
          <View style={s.dCenter}><Text style={{ fontSize:28 }}>🐱</Text></View>
          <TouchableOpacity style={s.dBtn} onPress={() => move(0,1)}><Text style={s.dArrow}>➡️</Text></TouchableOpacity>
        </View>
        <TouchableOpacity style={s.dBtn} onPress={() => move(1,0)}><Text style={s.dArrow}>⬇️</Text></TouchableOpacity>
      </View>
    </GameShell>
  );
};

const s = StyleSheet.create({
  statusRow: { flexDirection:'row', width:'100%', marginBottom:8, alignItems:'center' },
  mazeName:  { flex:1, fontSize:14, fontWeight:'800', color:'#2E7D32' },
  stat:      { fontSize:14, fontWeight:'700', color:'#555', marginLeft:10 },
  doneBox:   { backgroundColor:'#C8E6C9', borderRadius:12, padding:12, alignItems:'center', marginBottom:8, width:'100%' },
  doneTxt:   { fontSize:18, fontWeight:'800', color:'#2E7D32' },
  doneScore: { fontSize:15, fontWeight:'700', color:'#388E3C' },
  dpad:      { alignItems:'center', gap:6 },
  dRow:      { flexDirection:'row', gap:6, alignItems:'center' },
  dBtn:      { width:65, height:65, backgroundColor:'#E3F2FD', borderRadius:16, borderWidth:2, borderColor:'#90CAF9', alignItems:'center', justifyContent:'center' },
  dArrow:    { fontSize:28 },
  dCenter:   { width:65, height:65, alignItems:'center', justifyContent:'center' },
});

export default MazeEngine;
