import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, Dimensions } from 'react-native';
import { GameProps } from '../../types/game';
import GameShell from '../../../shared/GameShell';
import { SoundManager } from '../../../shared/SoundManager';

const { width: SW } = Dimensions.get('window');
const CELL = Math.floor((SW - 48) / 4);

const BUILDINGS = [
  { id:'solar',   emoji:'☀️', name:'Solar',   color:'#FFF9C4', effects:{ energy:15, pollution:-5,  food:0,  happiness:5  } },
  { id:'farm',    emoji:'🌾', name:'Farm',    color:'#F1F8E9', effects:{ energy:-5, pollution:0,   food:20, happiness:5  } },
  { id:'park',    emoji:'🌳', name:'Park',    color:'#C8E6C9', effects:{ energy:0,  pollution:-10, food:0,  happiness:15 } },
  { id:'factory', emoji:'🏭', name:'Factory', color:'#EFEBE9', effects:{ energy:10, pollution:20,  food:0,  happiness:-10} },
  { id:'house',   emoji:'🏠', name:'House',   color:'#E3F2FD', effects:{ energy:-10,pollution:5,   food:-5, happiness:10 } },
  { id:'wind',    emoji:'💨', name:'Wind',    color:'#E0F7FA', effects:{ energy:20, pollution:-5,  food:0,  happiness:0  } },
];

type Resources = { energy:number; pollution:number; food:number; happiness:number };

const clamp = (v:number) => Math.max(0, Math.min(100, v));

const CityBuilderEngine: React.FC<GameProps> = ({ game, onComplete, onExit }) => {
  const [grid, setGrid] = useState<(string|null)[][]>(Array(4).fill(null).map(() => Array(4).fill(null)));
  const [res, setRes] = useState<Resources>({ energy:30, pollution:20, food:30, happiness:50 });
  const [selectedBuilding, setSelectedBuilding] = useState<string|null>(null);
  const [turn, setTurn] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const barAnims = useRef({
    energy: new Animated.Value(30),
    pollution: new Animated.Value(20),
    food: new Animated.Value(30),
    happiness: new Animated.Value(50),
  }).current;

  const animateBars = (newRes: Resources) => {
    Object.keys(newRes).forEach(k => {
      Animated.timing((barAnims as any)[k], { toValue: (newRes as any)[k], duration: 400, useNativeDriver: false }).start();
    });
  };

  const placeBuilding = (row: number, col: number) => {
    if (!selectedBuilding || grid[row][col] || gameOver) return;
    const b = BUILDINGS.find(b => b.id === selectedBuilding)!;
    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = selectedBuilding;
    const newRes: Resources = {
      energy: clamp(res.energy + b.effects.energy),
      pollution: clamp(res.pollution + b.effects.pollution),
      food: clamp(res.food + b.effects.food),
      happiness: clamp(res.happiness + b.effects.happiness),
    };
    animateBars(newRes);
    setGrid(newGrid);
    setRes(newRes);
    setSelectedBuilding(null);
    const nextTurn = turn + 1;
    setTurn(nextTurn);
    SoundManager.play('success');
    if (nextTurn > 10) {
      const s = Math.max(0, newRes.energy + newRes.food + newRes.happiness - newRes.pollution);
      setScore(s);
      setGameOver(true);
      setTimeout(() => onComplete(s), 1500);
    }
  };

  const progress = turn / 10;
  const warning = res.pollution > 80;

  const resources = [
    { key:'energy',    label:'⚡ Energy',    color:'#FFC107', bg:'#FFF9C4' },
    { key:'pollution', label:'🏭 Pollution', color: res.pollution > 60 ? '#E53935' : '#757575', bg:'#F5F5F5' },
    { key:'food',      label:'🌾 Food',      color:'#4CAF50', bg:'#F1F8E9' },
    { key:'happiness', label:'😊 Happy',     color:'#E91E63', bg:'#FCE4EC' },
  ];

  return (
    <GameShell game={game} progress={progress} onExit={onExit} onTimeUp={() => onComplete(score)}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Resource Bars */}
        <View style={s.barsRow}>
          {resources.map(r => (
            <View key={r.key} style={[s.barContainer, { backgroundColor: r.bg }]}>
              <Text style={s.barLabel}>{r.label}</Text>
              <View style={s.barTrack}>
                <Animated.View style={[s.barFill, {
                  width: (barAnims as any)[r.key].interpolate({ inputRange:[0,100], outputRange:['0%','100%'] }),
                  backgroundColor: r.color
                }]} />
              </View>
              <Text style={s.barVal}>{Math.round((res as any)[r.key])}</Text>
            </View>
          ))}
        </View>
        {warning && <Text style={s.warning}>⚠️ Too much pollution!</Text>}
        <Text style={s.turnText}>Turn {turn}/10</Text>

        {/* Grid */}
        <View style={s.grid}>
          {grid.map((row, ri) => (
            <View key={ri} style={s.row}>
              {row.map((cell, ci) => {
                const b = cell ? BUILDINGS.find(b => b.id === cell) : null;
                return (
                  <TouchableOpacity key={ci} style={[s.cell, b ? { backgroundColor: b.color } : s.emptyCell]}
                    onPress={() => placeBuilding(ri, ci)}>
                    <Text style={s.cellEmoji}>{b ? b.emoji : '+'}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Building Palette */}
        <Text style={s.paletteLabel}>Select a building:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.palette}>
          {BUILDINGS.map(b => (
            <TouchableOpacity key={b.id} style={[s.buildingCard, { backgroundColor: b.color }, selectedBuilding === b.id && s.buildingSelected]}
              onPress={() => setSelectedBuilding(b.id === selectedBuilding ? null : b.id)}>
              <Text style={s.buildingEmoji}>{b.emoji}</Text>
              <Text style={s.buildingName}>{b.name}</Text>
              <Text style={s.buildingEffect}>
                {Object.entries(b.effects).filter(([,v]) => v !== 0).map(([k,v]) => `${v>0?'+':''}${v}${k[0].toUpperCase()}`).join(' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {gameOver && (
          <View style={s.gameOverBox}>
            <Text style={s.gameOverTitle}>🏙️ City Built!</Text>
            <Text style={s.gameOverScore}>Score: {score}</Text>
            <Text style={s.gameOverStar}>{score >= 150 ? '⭐⭐⭐' : score >= 80 ? '⭐⭐' : '⭐'}</Text>
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </GameShell>
  );
};

const s = StyleSheet.create({
  barsRow: { flexDirection:'row', flexWrap:'wrap', gap:6, marginBottom:8 },
  barContainer: { width:(SW-48)/2-4, borderRadius:10, padding:8 },
  barLabel: { fontSize:12, fontWeight:'700', color:'#555', marginBottom:4 },
  barTrack: { height:8, backgroundColor:'#E0E0E0', borderRadius:4, overflow:'hidden', marginBottom:2 },
  barFill: { height:'100%', borderRadius:4 },
  barVal: { fontSize:11, fontWeight:'700', color:'#555' },
  warning: { backgroundColor:'#FFCDD2', borderRadius:8, padding:8, textAlign:'center', fontSize:14, fontWeight:'700', color:'#C62828', marginBottom:6 },
  turnText: { textAlign:'center', fontSize:16, fontWeight:'800', color:'#333', marginBottom:10 },
  grid: { alignSelf:'center', gap:4, marginBottom:12 },
  row: { flexDirection:'row', gap:4 },
  cell: { width:CELL, height:CELL, borderRadius:8, alignItems:'center', justifyContent:'center' },
  emptyCell: { backgroundColor:'#F5F5F5', borderWidth:1, borderStyle:'dashed', borderColor:'#BDBDBD' },
  cellEmoji: { fontSize:CELL * 0.45 },
  paletteLabel: { fontSize:13, fontWeight:'700', color:'#666', marginBottom:6 },
  palette: { marginBottom:12 },
  buildingCard: { width:80, height:100, borderRadius:12, alignItems:'center', justifyContent:'center', marginRight:8, padding:6 },
  buildingSelected: { borderWidth:3, borderColor:'#2196F3' },
  buildingEmoji: { fontSize:28 },
  buildingName: { fontSize:11, fontWeight:'700', color:'#333', marginTop:2 },
  buildingEffect: { fontSize:9, color:'#555', marginTop:2, textAlign:'center' },
  gameOverBox: { backgroundColor:'#E8F5E9', borderRadius:16, padding:20, alignItems:'center', marginTop:10 },
  gameOverTitle: { fontSize:24, fontWeight:'800', color:'#2E7D32' },
  gameOverScore: { fontSize:20, fontWeight:'700', color:'#388E3C', marginTop:6 },
  gameOverStar: { fontSize:32, marginTop:6 },
});

export default CityBuilderEngine;
