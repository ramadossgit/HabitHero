import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { GameProps } from '../../types/game';
import GameShell from '../../../shared/GameShell';
import { SoundManager } from '../../../shared/SoundManager';

const { width: SW } = Dimensions.get('window');

const PUZZLES: Record<string, {title:string; grid:string[][]}[]> = {
  easy: [
    { title:'Garden',  grid:[['🌻','🌷'],['🌱','🌺']] },
    { title:'Farm',    grid:[['🐄','🐔'],['🌾','🐷']] },
    { title:'Ocean',   grid:[['🐳','🐠'],['🦀','🐚']] },
  ],
  medium: [
    { title:'Safari',  grid:[['🦁','🐘','🦒'],['🌴','🦓','🌿'],['🐒','🦏','🌅']] },
    { title:'Space',   grid:[['🌟','🚀','🌙'],['🪐','👨‍🚀','☄️'],['🌍','🛸','⭐']] },
  ],
  hard: [
    { title:'City',    grid:[['🏢','🏗️','🏠','🏫'],['🚗','🚌','🚕','🚲'],['🌳','🏪','🏥','⛪'],['🚶','🐕','🏃','🌺']] },
  ],
};

const COLORS = ['#FFE0B2','#B2EBF2','#C8E6C9','#E1BEE7','#FFCDD2','#D1C4E9','#DCEDC8','#B2DFDB','#F8BBD0','#CFD8DC'];

function shuffle<T>(arr: T[]): T[] {
  const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a;
}

const JigsawEngine: React.FC<GameProps> = ({ game, onComplete, onExit }) => {
  const diff = game.difficulty || 'easy';
  const puzzleSet = PUZZLES[diff] || PUZZLES.easy;

  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [score, setScore] = useState(0);

  const puzzle = puzzleSet[puzzleIdx];
  const rows = puzzle.grid.length;
  const cols = puzzle.grid[0].length;
  const cellSize = Math.floor((SW - 60) / cols);

  // flat list of pieces: {id, emoji, row, col}
  const allPieces = puzzle.grid.flatMap((row, ri) => row.map((emoji, ci) => ({ id:`${ri}-${ci}`, emoji, row:ri, col:ci })));

  const [placed, setPlaced] = useState<Record<string, string>>({});   // gridKey -> emoji
  const [available, setAvailable] = useState<typeof allPieces>(() => shuffle([...allPieces]));
  const [selected, setSelected] = useState<typeof allPieces[0] | null>(null);

  const totalPieces = allPieces.length;
  const placedCount = Object.keys(placed).length;
  const progress = (puzzleIdx + placedCount / totalPieces) / puzzleSet.length;

  const selectPiece = (piece: typeof allPieces[0]) => {
    if (selected?.id === piece.id) { setSelected(null); return; }
    setSelected(piece);
  };

  const tapCell = (ri: number, ci: number) => {
    if (!selected) return;
    const key = `${ri}-${ci}`;
    if (placed[key]) return; // already filled
    const correct = selected.row === ri && selected.col === ci;
    if (correct) {
      SoundManager.play('success');
      setPlaced(prev => ({ ...prev, [key]: selected.emoji }));
      setAvailable(prev => prev.filter(p => p.id !== selected.id));
      setSelected(null);
      const newPlaced = placedCount + 1;
      const newScore = score + 10;
      setScore(newScore);
      if (newPlaced === totalPieces) {
        SoundManager.play('win');
        setTimeout(() => {
          const nextIdx = puzzleIdx + 1;
          if (nextIdx < puzzleSet.length) {
            setPuzzleIdx(nextIdx);
            setPlaced({});
            const nextPieces = puzzleSet[nextIdx].grid.flatMap((row, ri) => row.map((emoji, ci) => ({ id:`${ri}-${ci}`, emoji, row:ri, col:ci })));
            setAvailable(shuffle([...nextPieces]));
          } else {
            onComplete(newScore + 20);
          }
        }, 800);
      }
    } else {
      SoundManager.play('fail');
      setSelected(null);
    }
  };

  return (
    <GameShell game={game} progress={progress} onExit={onExit} onTimeUp={() => onComplete(score)}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems:'center' }}>
        <Text style={s.title}>{puzzle.title}</Text>
        <Text style={s.subtitle}>{placedCount}/{totalPieces} pieces placed</Text>

        {/* Reference */}
        <View style={s.refBox}>
          {puzzle.grid.map((row, ri) => (
            <View key={ri} style={s.refRow}>
              {row.map((emoji, ci) => <Text key={ci} style={s.refEmoji}>{emoji}</Text>)}
            </View>
          ))}
        </View>

        {/* Main Grid */}
        <View style={[s.grid, { gap:4 }]}>
          {puzzle.grid.map((row, ri) => (
            <View key={ri} style={[s.gridRow, { gap:4 }]}>
              {row.map((_, ci) => {
                const key = `${ri}-${ci}`;
                const emoji = placed[key];
                return (
                  <TouchableOpacity key={ci} style={[s.cell, { width:cellSize, height:cellSize }, emoji ? s.filledCell : s.emptyCell]}
                    onPress={() => tapCell(ri, ci)}>
                    <Text style={{ fontSize: cellSize * 0.5 }}>{emoji ?? '?'}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Piece Tray */}
        <Text style={s.trayLabel}>Tap a piece, then tap its spot:</Text>
        <View style={s.tray}>
          {available.map((piece, i) => (
            <TouchableOpacity key={piece.id} style={[s.piece, { backgroundColor: COLORS[i % COLORS.length] }, selected?.id === piece.id && s.pieceSelected]}
              onPress={() => selectPiece(piece)}>
              <Text style={s.pieceEmoji}>{piece.emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.scoreText}>Score: {score}</Text>
        <View style={{ height: 20 }} />
      </ScrollView>
    </GameShell>
  );
};

const s = StyleSheet.create({
  title: { fontSize:22, fontWeight:'800', color:'#333', marginBottom:4 },
  subtitle: { fontSize:14, color:'#888', fontWeight:'600', marginBottom:8 },
  refBox: { backgroundColor:'#FFF8E1', borderRadius:12, padding:8, marginBottom:12, gap:2 },
  refRow: { flexDirection:'row', gap:2 },
  refEmoji: { fontSize:16 },
  grid: { marginBottom:12 },
  gridRow: { flexDirection:'row' },
  cell: { borderRadius:8, alignItems:'center', justifyContent:'center' },
  emptyCell: { backgroundColor:'#F5F5F5', borderWidth:2, borderStyle:'dashed', borderColor:'#BDBDBD' },
  filledCell: { backgroundColor:'#E8F5E9', borderWidth:2, borderColor:'#4CAF50' },
  trayLabel: { fontSize:13, fontWeight:'700', color:'#666', marginBottom:8, alignSelf:'flex-start' },
  tray: { flexDirection:'row', flexWrap:'wrap', gap:8, justifyContent:'center', width:'100%', marginBottom:8 },
  piece: { width:60, height:60, borderRadius:12, alignItems:'center', justifyContent:'center' },
  pieceSelected: { borderWidth:3, borderColor:'#2196F3' },
  pieceEmoji: { fontSize:28 },
  scoreText: { fontSize:16, fontWeight:'700', color:'#FF8F00' },
});

export default JigsawEngine;
