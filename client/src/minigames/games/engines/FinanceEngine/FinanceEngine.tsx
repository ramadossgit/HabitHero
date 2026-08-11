import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { GameProps } from '../../types/game';
import GameShell from '../../../shared/GameShell';
import { SoundManager } from '../../../shared/SoundManager';

const ROUNDS = [
  { title:'School Shopping', budget:100, items:[
    {id:'i1',name:'Notebook',emoji:'📓',price:15,type:'need'},{id:'i2',name:'Toy Car',emoji:'🚗',price:25,type:'want'},
    {id:'i3',name:'Pencils',emoji:'✏️',price:10,type:'need'},{id:'i4',name:'Candy Bar',emoji:'🍫',price:5,type:'want'},
    {id:'i5',name:'Lunch Box',emoji:'🍱',price:20,type:'need'},{id:'i6',name:'Stickers',emoji:'⭐',price:8,type:'want'},
    {id:'i7',name:'Backpack',emoji:'🎒',price:35,type:'need'},{id:'i8',name:'Video Game',emoji:'🎮',price:40,type:'want'},
  ]},
  { title:'Grocery Trip', budget:80, items:[
    {id:'i9',name:'Apples',emoji:'🍎',price:10,type:'need'},{id:'i10',name:'Ice Cream',emoji:'🍦',price:12,type:'want'},
    {id:'i11',name:'Bread',emoji:'🍞',price:8,type:'need'},{id:'i12',name:'Cookies',emoji:'🍪',price:15,type:'want'},
    {id:'i13',name:'Milk',emoji:'🥛',price:10,type:'need'},{id:'i14',name:'Chips',emoji:'🥔',price:8,type:'want'},
    {id:'i15',name:'Vegetables',emoji:'🥦',price:12,type:'need'},{id:'i16',name:'Cake',emoji:'🎂',price:20,type:'want'},
  ]},
  { title:'Weekend Fun', budget:60, items:[
    {id:'i17',name:'Library Book',emoji:'📚',price:0,type:'need'},{id:'i18',name:'Movie Ticket',emoji:'🎬',price:15,type:'want'},
    {id:'i19',name:'Art Supplies',emoji:'🎨',price:20,type:'need'},{id:'i20',name:'Toy Drone',emoji:'🚁',price:45,type:'want'},
    {id:'i21',name:'Running Shoes',emoji:'👟',price:30,type:'need'},{id:'i22',name:'Bubble Gum',emoji:'🫧',price:3,type:'want'},
  ]},
];

const FinanceEngine: React.FC<GameProps> = ({ game, onComplete, onExit }) => {
  const [roundIdx, setRoundIdx] = useState(0);
  const [itemIdx, setItemIdx] = useState(0);
  const [budget, setBudget] = useState(ROUNDS[0].budget);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalDecisions, setTotalDecisions] = useState(0);
  const [feedback, setFeedback] = useState<'correct'|'wrong'|null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<{name:string;emoji:string;correct:boolean}[]>([]);

  const round = ROUNDS[roundIdx];
  const item = round.items[itemIdx];
  const progress = roundIdx / ROUNDS.length;

  const decide = (choice: 'need'|'want'|'skip') => {
    if (choice === 'skip') {
      advance(false, 0);
      return;
    }
    const correct = choice === item.type;
    const pts = correct ? 10 : 0;
    const newBudget = budget - item.price;
    SoundManager.play(correct ? 'success' : 'fail');
    setFeedback(correct ? 'correct' : 'wrong');
    setSummaryData(prev => [...prev, { name: item.name, emoji: item.emoji, correct }]);
    setCorrectCount(c => c + (correct ? 1 : 0));
    setTotalDecisions(t => t + 1);
    setBudget(Math.max(0, newBudget));
    setScore(s => s + pts);
    setTimeout(() => { setFeedback(null); advance(true, newBudget); }, 600);
  };

  const advance = (bought: boolean, newBudget: number) => {
    const nextIdx = itemIdx + 1;
    if (nextIdx >= round.items.length || (bought && newBudget <= 0)) {
      setShowSummary(true);
    } else {
      setItemIdx(nextIdx);
    }
  };

  const nextRound = () => {
    const nextRound = roundIdx + 1;
    if (nextRound >= ROUNDS.length) { onComplete(score); return; }
    setRoundIdx(nextRound);
    setItemIdx(0);
    setBudget(ROUNDS[nextRound].budget);
    setShowSummary(false);
    setSummaryData([]);
    setCorrectCount(0);
    setTotalDecisions(0);
  };

  const priceColor = item?.price <= 10 ? '#4CAF50' : item?.price <= 25 ? '#FF9800' : '#E53935';
  const budgetPct = budget / round.budget;

  if (showSummary) return (
    <GameShell game={game} progress={progress} onExit={onExit}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={s.summaryTitle}>Round Complete! 🎉</Text>
        <Text style={s.summarySubtitle}>Saved: ${budget} 🪙</Text>
        <Text style={s.summaryAccuracy}>Accuracy: {totalDecisions > 0 ? Math.round(correctCount/totalDecisions*100) : 0}%</Text>
        <Text style={s.summaryStar}>{correctCount/Math.max(totalDecisions,1) >= 0.7 ? '⭐⭐⭐' : correctCount/Math.max(totalDecisions,1) >= 0.5 ? '⭐⭐' : '⭐'}</Text>
        {summaryData.map((d,i) => (
          <View key={i} style={s.summaryItem}>
            <Text style={s.summaryEmoji}>{d.emoji}</Text>
            <Text style={s.summaryName}>{d.name}</Text>
            <Text style={d.correct ? s.summaryGood : s.summaryBad}>{d.correct ? '✅' : '❌'}</Text>
          </View>
        ))}
        <TouchableOpacity style={s.nextBtn} onPress={nextRound}>
          <Text style={s.nextBtnText}>{roundIdx < ROUNDS.length - 1 ? 'Next Round →' : 'Finish! 🎉'}</Text>
        </TouchableOpacity>
        <View style={{ height: 20 }} />
      </ScrollView>
    </GameShell>
  );

  return (
    <GameShell game={game} progress={progress} onExit={onExit} onTimeUp={() => onComplete(score)}>
      {/* Wallet */}
      <View style={s.wallet}>
        <Text style={s.walletTitle}>📦 {round.title}</Text>
        <View style={s.budgetRow}>
          <Text style={s.budgetText}>🪙 Budget: ${budget}</Text>
          <Text style={s.itemCount}>{itemIdx + 1}/{round.items.length}</Text>
        </View>
        <View style={s.budgetTrack}>
          <View style={[s.budgetFill, { width: `${budgetPct * 100}%`, backgroundColor: budgetPct > 0.5 ? '#4CAF50' : budgetPct > 0.25 ? '#FF9800' : '#E53935' }]} />
        </View>
      </View>

      {/* Item Card */}
      <View style={[s.itemCard, feedback === 'correct' && s.itemCorrect, feedback === 'wrong' && s.itemWrong]}>
        <Text style={s.itemEmoji}>{item.emoji}</Text>
        <Text style={s.itemName}>{item.name}</Text>
        <View style={[s.priceBadge, { backgroundColor: priceColor }]}>
          <Text style={s.priceText}>${item.price}</Text>
        </View>
        {feedback && <Text style={s.feedbackText}>{feedback === 'correct' ? '✅ Correct! +10' : '❌ Try again!'}</Text>}
      </View>

      {/* Buttons */}
      <View style={s.btnRow}>
        <TouchableOpacity style={[s.btn, s.needBtn]} onPress={() => decide('need')}>
          <Text style={s.btnText}>Need ✅</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, s.skipBtn]} onPress={() => decide('skip')}>
          <Text style={s.btnText}>Skip ❌</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, s.wantBtn]} onPress={() => decide('want')}>
          <Text style={s.btnText}>Want 💫</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.scoreText}>Score: {score}</Text>
    </GameShell>
  );
};

const s = StyleSheet.create({
  wallet: { backgroundColor:'#FFF8E1', borderRadius:14, padding:12, marginBottom:12, width:'100%' },
  walletTitle: { fontSize:14, fontWeight:'800', color:'#F57F17', marginBottom:4 },
  budgetRow: { flexDirection:'row', justifyContent:'space-between', marginBottom:6 },
  budgetText: { fontSize:18, fontWeight:'800', color:'#E65100' },
  itemCount: { fontSize:14, color:'#888', fontWeight:'700' },
  budgetTrack: { height:8, backgroundColor:'#FFE0B2', borderRadius:4, overflow:'hidden' },
  budgetFill: { height:'100%', borderRadius:4 },
  itemCard: { backgroundColor:'#FFF', borderRadius:20, padding:24, alignItems:'center', width:'100%',
    elevation:6, shadowColor:'#000', shadowOffset:{width:0,height:3}, shadowOpacity:0.12, shadowRadius:6, marginBottom:16 },
  itemCorrect: { backgroundColor:'#E8F5E9' },
  itemWrong: { backgroundColor:'#FFEBEE' },
  itemEmoji: { fontSize:60, marginBottom:8 },
  itemName: { fontSize:22, fontWeight:'800', color:'#333', marginBottom:8 },
  priceBadge: { paddingHorizontal:16, paddingVertical:6, borderRadius:20 },
  priceText: { color:'#FFF', fontSize:18, fontWeight:'800' },
  feedbackText: { fontSize:16, fontWeight:'700', marginTop:10 },
  btnRow: { flexDirection:'row', gap:8, width:'100%', marginBottom:8 },
  btn: { flex:1, borderRadius:14, padding:14, alignItems:'center' },
  needBtn: { backgroundColor:'#4CAF50' },
  skipBtn: { backgroundColor:'#9E9E9E' },
  wantBtn: { backgroundColor:'#2196F3' },
  btnText: { color:'#FFF', fontSize:15, fontWeight:'800' },
  scoreText: { fontSize:14, fontWeight:'700', color:'#F57F17', textAlign:'center' },
  summaryTitle: { fontSize:26, fontWeight:'800', color:'#333', textAlign:'center', marginBottom:4 },
  summarySubtitle: { fontSize:18, color:'#F57F17', textAlign:'center', fontWeight:'700', marginBottom:4 },
  summaryAccuracy: { fontSize:16, color:'#555', textAlign:'center', marginBottom:4 },
  summaryStar: { fontSize:32, textAlign:'center', marginBottom:16 },
  summaryItem: { flexDirection:'row', alignItems:'center', backgroundColor:'#FFF8E1', borderRadius:10, padding:10, marginBottom:6, gap:10 },
  summaryEmoji: { fontSize:24 },
  summaryName: { flex:1, fontSize:14, fontWeight:'600', color:'#333' },
  summaryGood: { fontSize:20 },
  summaryBad: { fontSize:20 },
  nextBtn: { backgroundColor:'#F57F17', borderRadius:16, padding:16, alignItems:'center', marginTop:16 },
  nextBtnText: { color:'#FFF', fontSize:18, fontWeight:'800' },
});

export default FinanceEngine;
