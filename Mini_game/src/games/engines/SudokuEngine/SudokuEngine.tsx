import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { GameProps } from '../../types/game';
import GameShell from '../../../shared/GameShell';
import { SoundManager } from '../../../shared/SoundManager';

const { width: SW } = Dimensions.get('window');

const PUZZLES4 = [
  { symbols:['🍎','🍊','🍇','🍋'],
    given:   [['🍎',null,null,'🍋'],[null,'🍋','🍎',null],[null,'🍎','🍋',null],['🍋',null,null,'🍎']],
    solution:[['🍎','🍇','🍊','🍋'],['🍊','🍋','🍎','🍇'],['🍇','🍎','🍋','🍊'],['🍋','🍊','🍇','🍎']] },
  { symbols:['⭐','🌙','☀️','🌈'],
    given:   [[null,'🌙','☀️',null],['☀️',null,null,'🌙'],['🌙',null,null,'☀️'],[null,'☀️','🌙',null]],
    solution:[['🌈','🌙','☀️','⭐'],['☀️','⭐','🌈','🌙'],['🌙','🌈','⭐','☀️'],['⭐','☀️','🌙','🌈']] },
];

const PUZZLE9 = {
  symbols:['1','2','3','4','5','6','7','8','9'],
  given:[
    ['5','3',null,null,'7',null,null,null,null],
    ['6',null,null,'1','9','5',null,null,null],
    [null,'9','8',null,null,null,null,'6',null],
    ['8',null,null,null,'6',null,null,null,'3'],
    ['4',null,null,'8',null,'3',null,null,'1'],
    ['7',null,null,null,'2',null,null,null,'6'],
    [null,'6',null,null,null,null,'2','8',null],
    [null,null,null,'4','1','9',null,null,'5'],
    [null,null,null,null,'8',null,null,'7','9'],
  ],
  solution:[
    ['5','3','4','6','7','8','9','1','2'],
    ['6','7','2','1','9','5','3','4','8'],
    ['1','9','8','3','4','2','5','6','7'],
    ['8','5','9','7','6','1','4','2','3'],
    ['4','2','6','8','5','3','7','9','1'],
    ['7','1','3','9','2','4','8','5','6'],
    ['9','6','1','5','3','7','2','8','4'],
    ['2','8','7','4','1','9','6','3','5'],
    ['3','4','5','2','8','6','1','7','9'],
  ],
};

const SYMBOL_COLORS = ['#FFE0B2','#B2EBF2','#C8E6C9','#E1BEE7','#FFCDD2','#D1C4E9','#DCEDC8','#B2DFDB','#FFF9C4'];

const SudokuEngine: React.FC<GameProps> = ({ game, onComplete, onExit }) => {
  const is9x9 = game.difficulty === 'hard';
  const puzzleData = is9x9 ? PUZZLE9 : PUZZLES4[0];
  const size = is9x9 ? 9 : 4;
  const cellSize = Math.floor((SW - 32) / size);

  const [userGrid, setUserGrid] = useState<(string|null)[][]>(() =>
    (puzzleData.given as (string|null)[][]).map(row => [...row])
  );
  const [selected, setSelected] = useState<{r:number;c:number}|null>(null);
  const [errors, setErrors]     = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [score, setScore]       = useState(0);

  const isGiven = (r: number, c: number) => puzzleData.given[r][c] !== null;
  const progress = (() => {
    let filled = 0, total = 0;
    for (let r=0;r<size;r++) for (let c=0;c<size;c++) if (!isGiven(r,c)) { total++; if (userGrid[r][c]) filled++; }
    return total > 0 ? filled/total : 0;
  })();

  const selectCell = (r: number, c: number) => {
    if (isGiven(r,c)) return;
    setSelected(sel => sel?.r===r&&sel?.c===c ? null : {r,c});
  };

  const placeSymbol = (sym: string|null) => {
    if (!selected) return;
    const { r, c } = selected;
    const ng = userGrid.map(row => [...row]);
    ng[r][c] = sym;
    setUserGrid(ng);
    setErrors(new Set());
  };

  const checkSolution = () => {
    const newErrors = new Set<string>();
    let allCorrect = true;
    for (let r=0;r<size;r++) for (let c=0;c<size;c++) {
      if (!isGiven(r,c)) {
        if (userGrid[r][c] !== puzzleData.solution[r][c]) { newErrors.add(`${r}-${c}`); allCorrect = false; }
      }
    }
    setErrors(newErrors);
    if (allCorrect) {
      SoundManager.play('win');
      onComplete(Math.max(150 - mistakes*15, 30));
    } else {
      SoundManager.play('fail');
      setMistakes(m => m + 1);
    }
  };

  const allFilled = userGrid.every((row, r) => row.every((cell, c) => isGiven(r,c) || cell !== null));

  return (
    <GameShell game={game} progress={progress} onExit={onExit} onTimeUp={() => onComplete(score)}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems:'center' }}>
        <View style={s.header}>
          <Text style={s.mistakesText}>Mistakes: {mistakes}</Text>
          <Text style={s.info}>{is9x9 ? '9×9' : '4×4'} Puzzle</Text>
        </View>

        {/* Grid */}
        <View style={[s.grid, { borderWidth:2, borderColor:'#1A237E' }]}>
          {userGrid.map((row, ri) => (
            <View key={ri} style={{ flexDirection:'row' }}>
              {row.map((cell, ci) => {
                const given    = isGiven(ri,ci);
                const isSel    = selected?.r===ri && selected?.c===ci;
                const isErr    = errors.has(`${ri}-${ci}`);
                const boxBorderR = !is9x9 ? (ci===1?2:0) : (ci===2||ci===5?2:0);
                const boxBorderB = !is9x9 ? (ri===1?2:0) : (ri===2||ri===5?2:0);
                return (
                  <TouchableOpacity key={ci}
                    style={[{ width:cellSize, height:cellSize, alignItems:'center', justifyContent:'center',
                      borderWidth:0.5, borderColor:'#BDBDBD',
                      borderRightWidth: boxBorderR || 0.5,
                      borderBottomWidth: boxBorderB || 0.5,
                      borderRightColor: boxBorderR ? '#1A237E' : '#BDBDBD',
                      borderBottomColor: boxBorderB ? '#1A237E' : '#BDBDBD',
                    },
                      given ? s.givenCell : s.emptyCell,
                      isSel && s.selectedCell,
                      isErr && s.errorCell,
                    ]}
                    onPress={() => selectCell(ri,ci)}>
                    <Text style={[s.cellText, { fontSize: cellSize * (is9x9 ? 0.42 : 0.48) }, given && s.givenText]}>
                      {cell ?? ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Symbol Palette */}
        <View style={s.palette}>
          {puzzleData.symbols.map((sym, i) => (
            <TouchableOpacity key={sym} style={[s.symBtn, { backgroundColor: SYMBOL_COLORS[i % SYMBOL_COLORS.length] }]}
              onPress={() => placeSymbol(sym)}>
              <Text style={[s.symText, { fontSize: is9x9 ? 14 : 20 }]}>{sym}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[s.symBtn, { backgroundColor:'#FFCDD2' }]} onPress={() => placeSymbol(null)}>
            <Text style={s.symText}>🗑️</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[s.checkBtn, !allFilled && s.checkBtnDisabled]} onPress={allFilled ? checkSolution : undefined}>
          <Text style={s.checkBtnText}>Check ✓</Text>
        </TouchableOpacity>
        <View style={{ height:20 }} />
      </ScrollView>
    </GameShell>
  );
};

const s = StyleSheet.create({
  header:       { flexDirection:'row', justifyContent:'space-between', width:'100%', marginBottom:10 },
  mistakesText: { fontSize:14, fontWeight:'700', color:'#E53935' },
  info:         { fontSize:14, fontWeight:'700', color:'#1A237E' },
  grid:         { marginBottom:16, borderColor:'#1A237E' },
  givenCell:    { backgroundColor:'#E3F2FD' },
  emptyCell:    { backgroundColor:'#FFF' },
  selectedCell: { backgroundColor:'#FFF9C4', borderColor:'#FFC107', borderWidth:2 },
  errorCell:    { backgroundColor:'#FFCDD2' },
  cellText:     { fontWeight:'600', color:'#333' },
  givenText:    { fontWeight:'900', color:'#1A237E' },
  palette:      { flexDirection:'row', flexWrap:'wrap', gap:6, justifyContent:'center', marginBottom:12, width:'100%' },
  symBtn:       { width:42, height:42, borderRadius:10, alignItems:'center', justifyContent:'center' },
  symText:      { fontSize:18, fontWeight:'700' },
  checkBtn:     { backgroundColor:'#1A237E', borderRadius:16, paddingHorizontal:32, paddingVertical:14, alignItems:'center' },
  checkBtnDisabled: { backgroundColor:'#BDBDBD' },
  checkBtnText: { color:'#FFF', fontSize:18, fontWeight:'800' },
});

export default SudokuEngine;
