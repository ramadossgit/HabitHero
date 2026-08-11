import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { GameProps } from '../../types/game';
import GameShell from '../../../shared/GameShell';
import { SoundManager } from '../../../shared/SoundManager';

const PATTERNS: Record<string, {sequence:string[];answer:string;options:string[]}[]> = {
  easy: [
    {sequence:['🔴','🔵','🔴','🔵','🔴'],answer:'🔵',options:['🔵','🟢','🔴','🟡']},
    {sequence:['⭐','⭐','🌙','⭐','⭐'],answer:'🌙',options:['⭐','🌙','☀️','🌟']},
    {sequence:['🐱','🐕','🐱','🐕','🐱'],answer:'🐕',options:['🐱','🐕','🐰','🐸']},
    {sequence:['1','2','3','4'],answer:'5',options:['5','6','4','7']},
    {sequence:['🍎','🍊','🍎','🍊','🍎'],answer:'🍊',options:['🍎','🍊','🍇','🍋']},
    {sequence:['😊','😊','😢','😊','😊'],answer:'😢',options:['😊','😢','😠','😴']},
  ],
  medium: [
    {sequence:['🔴','🔵','🟢','🔴','🔵'],answer:'🟢',options:['🔴','🔵','🟢','🟡']},
    {sequence:['2','4','6','8'],answer:'10',options:['10','9','12','11']},
    {sequence:['🌑','🌓','🌕','🌑','🌓'],answer:'🌕',options:['🌑','🌓','🌕','🌗']},
    {sequence:['A','B','C','D','E'],answer:'F',options:['F','G','E','H']},
    {sequence:['⬆️','➡️','⬇️','⬅️','⬆️'],answer:'➡️',options:['⬆️','➡️','⬇️','⬅️']},
    {sequence:['❤️','💛','💚','💙','❤️','💛'],answer:'💚',options:['💚','💙','❤️','💜']},
  ],
  hard: [
    {sequence:['1','3','5','7'],answer:'9',options:['8','9','10','11']},
    {sequence:['A','C','E','G'],answer:'I',options:['H','I','J','K']},
    {sequence:['1','1','2','3','5'],answer:'8',options:['7','8','6','10']},
    {sequence:['1','4','9','16'],answer:'25',options:['20','25','30','36']},
    {sequence:['🌑','🌒','🌓','🌔','🌕','🌖'],answer:'🌗',options:['🌑','🌘','🌗','🌕']},
    {sequence:['2','6','18','54'],answer:'162',options:['108','162','72','216']},
  ],
};

const OPTION_COLORS = ['#FFE0B2','#B2EBF2','#C8E6C9','#E1BEE7'];

const PatternEngine: React.FC<GameProps> = ({ game, onComplete, onExit }) => {
  const diff = game.difficulty || 'easy';
  const levels = PATTERNS[diff] || PATTERNS.easy;

  const [level, setLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selected, setSelected] = useState<string|null>(null);
  const [showResult, setShowResult] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const current = levels[level];
  const progress = level / levels.length;

  // Pulse the "?" item
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue:1.15, duration:600, useNativeDriver:false }),
      Animated.timing(pulseAnim, { toValue:0.9,  duration:600, useNativeDriver:false }),
    ])); loop.start(); return () => loop.stop();
  }, [level]);

  const choose = (opt: string) => {
    if (selected) return;
    setSelected(opt);
    setShowResult(true);
    const correct = opt === current.answer;
    SoundManager.play(correct ? 'success' : 'fail');
    const newStreak = correct ? streak + 1 : 0;
    setStreak(newStreak);
    const bonus = (correct && newStreak >= 3) ? 5 : 0;
    const pts = score + (correct ? 15 + bonus : 0);
    setScore(pts);
    setTimeout(() => {
      setSelected(null);
      setShowResult(false);
      pulseAnim.setValue(1);
      if (level < levels.length - 1) setLevel(l => l + 1);
      else { SoundManager.play('win'); onComplete(pts); }
    }, 900);
  };

  return (
    <GameShell game={game} progress={progress} onExit={onExit} onTimeUp={() => onComplete(score)} timerKey={level}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.levelText}>Level {level+1}/{levels.length}</Text>
        {streak >= 3 && <Text style={s.streak}>🔥×{streak}</Text>}
        <Text style={s.scoreText}>Score: {score}</Text>
      </View>

      {/* Pattern Row */}
      <View style={s.patternRow}>
        {current.sequence.map((item, i) => (
          <View key={i} style={s.patternItem}>
            <Text style={s.patternEmoji}>{item}</Text>
          </View>
        ))}
        <Animated.View style={[s.patternItem, s.questionItem, { transform:[{scale:pulseAnim}] }]}>
          <Text style={s.questionMark}>?</Text>
        </Animated.View>
      </View>

      <Text style={s.prompt}>What comes next?</Text>

      {/* Options */}
      <View style={s.optionsGrid}>
        {current.options.map((opt, i) => {
          let bg = OPTION_COLORS[i];
          let border = 'transparent';
          if (showResult && selected) {
            if (opt === current.answer) { bg='#C8E6C9'; border='#4CAF50'; }
            else if (opt === selected)  { bg='#FFCDD2'; border='#E53935'; }
          }
          return (
            <TouchableOpacity key={opt} style={[s.optionBtn, { backgroundColor:bg, borderColor:border, borderWidth:2 }]}
              onPress={() => choose(opt)} activeOpacity={0.7}>
              <Text style={s.optionText}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </GameShell>
  );
};

const s = StyleSheet.create({
  header: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', width:'100%', marginBottom:16 },
  levelText: { fontSize:14, fontWeight:'700', color:'#5C6BC0' },
  streak: { fontSize:18, fontWeight:'800' },
  scoreText: { fontSize:14, fontWeight:'700', color:'#9C27B0' },
  patternRow: { flexDirection:'row', flexWrap:'wrap', justifyContent:'center', gap:8, marginBottom:16, width:'100%' },
  patternItem: { width:58, height:58, borderRadius:12, backgroundColor:'#EDE7F6', alignItems:'center', justifyContent:'center' },
  patternEmoji: { fontSize:28 },
  questionItem: { backgroundColor:'#CE93D8' },
  questionMark: { fontSize:28, fontWeight:'900', color:'#FFF' },
  prompt: { fontSize:20, fontWeight:'800', color:'#333', marginBottom:20 },
  optionsGrid: { flexDirection:'row', flexWrap:'wrap', gap:12, justifyContent:'center', width:'100%' },
  optionBtn: { width:85, height:85, borderRadius:16, alignItems:'center', justifyContent:'center' },
  optionText: { fontSize:32 },
});

export default PatternEngine;
