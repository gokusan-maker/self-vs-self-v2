"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Check, Trash2, Skull, Crown, Flame, X, Settings, Edit2, Swords, Trophy, Sunrise, Moon, XCircle, Play, Square, AlertTriangle, Zap, Heart, Timer, CalendarPlus, Sun } from 'lucide-react';

const STORAGE_KEY = 'self_vs_self_v8';

const DEFAULT_CATEGORIES = [
  { id: 'life', label: '生活', emoji: '🏠', color: 'from-yellow-500 to-amber-600' },
  { id: 'body', label: '健康', emoji: '💪', color: 'from-red-600 to-orange-600' },
  { id: 'work', label: '仕事', emoji: '💼', color: 'from-blue-600 to-indigo-600' },
  { id: 'study', label: '勉強', emoji: '📚', color: 'from-green-600 to-emerald-600' },
];

const DEFAULT_BAD_CATEGORIES = [
  { id: 'sns', label: 'SNS', emoji: '📱' },
  { id: 'game', label: 'ゲーム', emoji: '🎮' },
  { id: 'video', label: '動画', emoji: '📺' },
  { id: 'slack', label: 'ダラダラ', emoji: '🛋️' },
];

// 既存ユーザーのデータにも「動画」カテゴリを反映
const withVideoCat = (bc) => (bc.some(c => c.id === 'video') ? bc : [...bc.slice(0, 2), { id: 'video', label: '動画', emoji: '📺' }, ...bc.slice(2)]);

const COLOR_OPTIONS = [
  { label: '赤', value: 'from-red-600 to-orange-600' },
  { label: '黄', value: 'from-yellow-500 to-amber-600' },
  { label: '緑', value: 'from-green-600 to-emerald-600' },
  { label: '青', value: 'from-blue-600 to-indigo-600' },
  { label: '紫', value: 'from-purple-600 to-pink-600' },
  { label: '桃', value: 'from-pink-600 to-rose-600' },
  { label: '空', value: 'from-cyan-600 to-sky-600' },
  { label: '灰', value: 'from-slate-600 to-gray-600' },
];

const EMOJI_OPTIONS = ['💪', '☀️', '🥗', '💼', '📚', '🏃', '🧘', '💧', '😴', '🚭', '🎯', '🔥', '⚔️', '🧠', '💰', '🎨'];
const BAD_EMOJI_OPTIONS = ['📱', '🍔', '🛋️', '📲', '🍺', '🍷', '🚬', '🎮', '📺', '🍰', '🍕', '💤', '☕', '🍪', '🥤', '🎰'];

const DIFFICULTIES = {
  small: { label: '小', power: 5, color: 'bg-zinc-800 text-zinc-300 border-zinc-600' },
  medium: { label: '中', power: 15, color: 'bg-blue-900/60 text-blue-200 border-blue-600' },
  large: { label: '大', power: 30, color: 'bg-red-900/60 text-red-200 border-red-600' },
};

const RANKS = [
  { name: 'WEAK', min: 0 },
  { name: 'SOFT', min: 100 },
  { name: 'AVERAGE', min: 300 },
  { name: 'TOUGH', min: 700 },
  { name: 'WARRIOR', min: 1500 },
  { name: 'SAVAGE', min: 3000 },
  { name: 'UNCOMMON', min: 5000 },
  { name: 'LEGEND', min: 10000 },
];

const getWakePower = (date) => {
  const totalMin = date.getHours() * 60 + date.getMinutes();
  if (totalMin < 5 * 60) return { power: 30, label: '激烈' };
  if (totalMin < 6 * 60) return { power: 25, label: '超早起き' };
  if (totalMin < 7 * 60) return { power: 20, label: '早起き' };
  if (totalMin < 8 * 60) return { power: 15, label: '普通' };
  if (totalMin < 9 * 60) return { power: 10, label: '遅め' };
  if (totalMin < 10 * 60) return { power: 5, label: '寝坊' };
  return { power: 0, label: '完全寝坊' };
};

const getSleepPower = (date) => {
  const h = date.getHours();
  let totalMin = h * 60 + date.getMinutes();
  if (h < 12) totalMin += 24 * 60;
  if (totalMin < 22 * 60) return { power: 30, label: '激烈' };
  if (totalMin < 23 * 60) return { power: 25, label: '超早寝' };
  if (totalMin < 24 * 60) return { power: 20, label: '早寝' };
  if (totalMin < 25 * 60) return { power: 15, label: '普通' };
  if (totalMin < 26 * 60) return { power: 10, label: '夜更かし' };
  if (totalMin < 27 * 60) return { power: 5, label: '深夜' };
  return { power: 0, label: '徹夜寸前' };
};

// ダメタスクの時間ペナルティ
const getDamage = (minutes) => {
  if (minutes <= 5) return { damage: 2, label: '一瞬' };
  if (minutes <= 15) return { damage: 5, label: '短時間' };
  if (minutes <= 30) return { damage: 15, label: '油断' };
  if (minutes <= 60) return { damage: 30, label: '時間泥棒' };
  if (minutes <= 120) return { damage: 60, label: '大ダメージ' };
  if (minutes <= 180) return { damage: 100, label: '深刻' };
  return { damage: Math.min(200, 100 + Math.floor((minutes - 180) / 30) * 20), label: '危険水域' };
};

// 宣言した時間をオーバーした場合の追加ペナルティ
const getOverPenalty = (overMinutes) => {
  if (overMinutes <= 0) return { penalty: 0, label: null };
  if (overMinutes <= 5) return { penalty: 10, label: '宣言オーバー +5分' };
  if (overMinutes <= 15) return { penalty: 25, label: '宣言オーバー +15分' };
  if (overMinutes <= 30) return { penalty: 50, label: '宣言オーバー +30分' };
  if (overMinutes <= 60) return { penalty: 100, label: '宣言オーバー +1時間' };
  return { penalty: Math.min(300, 100 + Math.floor((overMinutes - 60) / 30) * 50), label: '制御不能オーバー' };
};

// 良タスク継続時間ボーナス（タスクポイントに加算）
const getDurationBonus = (minutes) => {
  if (minutes < 15) return { bonus: 0, label: null };
  if (minutes < 30) return { bonus: 5, label: '+15分' };
  if (minutes < 60) return { bonus: 15, label: '+30分' };
  if (minutes < 120) return { bonus: 30, label: '+1時間' };
  if (minutes < 180) return { bonus: 50, label: '+2時間' };
  return { bonus: 50 + Math.floor((minutes - 180) / 30) * 15, label: '+3時間〜' };
};

// コンボボーナス（連続日数）
const getComboBonus = (combo) => {
  if (combo >= 30) return { mult: 6.0, label: '🔥神域' };
  if (combo >= 21) return { mult: 4.0, label: '🔥伝説' };
  if (combo >= 14) return { mult: 3.0, label: '🔥覇者' };
  if (combo >= 10) return { mult: 2.5, label: '🔥猛者' };
  if (combo >= 7) return { mult: 2.0, label: '🔥継続' };
  if (combo >= 5) return { mult: 1.5, label: '🔥連続' };
  if (combo >= 3) return { mult: 1.25, label: '🔥3連' };
  if (combo >= 2) return { mult: 1.1, label: '🔥2連' };
  return { mult: 1.0, label: null };
};

// リカバリーボーナス計算
const getRecoveryBonus = (damageRemaining, taskPower) => {
  if (damageRemaining <= 0) return 0;
  // ダメージが残ってる時、タスクポイントの50%を回復ボーナスとして追加（上限あり）
  return Math.min(damageRemaining, Math.ceil(taskPower * 0.5));
};

// 同タスクの過去最長時間を超えた時のボーナス
const getLongerBonus = (currentMin, prevMaxMin) => {
  if (!prevMaxMin || currentMin <= prevMaxMin) return { bonus: 0, label: null };
  const diff = currentMin - prevMaxMin;
  if (currentMin >= prevMaxMin * 2) return { bonus: 50, label: '🔥 2倍超え' };
  if (diff >= 60) return { bonus: 30, label: '⏱️ +1時間超' };
  if (diff >= 30) return { bonus: 15, label: '⏱️ +30分超' };
  if (diff >= 10) return { bonus: 5, label: '⏱️ +10分超' };
  return { bonus: 0, label: null };
};

const getTaskKey = (text, categoryId) => `${categoryId}::${text.trim().toLowerCase()}`;

// 厳しいコーチのセリフ
const QUOTES = {
  idle: [
    'START NOW. 今動け。お前なら必ずできる。',
    'NO EXCUSES. 言い訳の数だけ可能性を捨ててる。やれ。',
    'YOU GOT THIS. 楽じゃない。でもお前なら越えられる。',
    'FACE IT. 逃げてる課題、今日こそ正面から見ろ。',
    'ONE STEP. 完璧じゃなくていい。一歩でいい。踏み出せ。',
    'TIME IS REAL. 迷ってる今も時間は減ってる。だから今だ。',
    'BEAT YESTERDAY. 昨日の自分を超えろ。お前にはできる。',
    'DISCIPLINE WINS. やる気は消える。規律が残る。積み上げろ。',
    'HARD IS THE WAY. 楽な道に成長はない。きつい方を選べ。',
    'RISE NOW. 倒れたか。なら立て。何度でも立てる男だろ。',
    'OWN YOUR DAY. 今日はお前のものだ。受け身で終わらせるな。',
    'PROVE IT. 誰にでもない、自分に証明しろ。やれる男だと。',
    'NO ZERO DAYS. 何もしない日は作るな。小さくても動け。',
    'STOP SCROLLING. その指で人生は変わらない。顔を上げろ。',
    'REALITY CHECK. 動かなければ何も変わらない。だから動け。',
    'YOU PROMISED. 昨日の自分との約束だ。守れる男だろ。',
    'KILL LATER. 「明日から」を今すぐ終わらせろ。今ならできる。',
    'SMALL WINS STACK. 小さく勝て。それを積めばお前は変わる。',
    'MOTION OVER MOOD. 気分は当てにするな。体を先に動かせ。',
    'FINISH WHAT YOU START. 始めたなら終わらせろ。やれる。',
    'THE WORK IS QUIET. 地味な努力こそ本物だ。黙って続けろ。',
    'CHOOSE GROWTH. 楽と成長、お前はもう答えを知ってる。',
    'FEAR FADES WITH ACTION. 動けば恐怖は消える。まず一歩だ。',
    'STAY HUNGRY. 満足するな。お前の伸びしろはまだある。',
    'TODAY DECIDES. 今日の選択が一年後のお前を作る。',
    'NO ONE SAVES YOU. 助けは来ない。でもお前は自分を救える。',
    'GET UNCOMFORTABLE. 居心地の悪さは成長のサインだ。進め。',
    'BREAK THE LOOP. ダラダラの輪を今ここで断て。できる。',
    'SHOW UP. 才能より、現れることだ。今日も現れろ。',
    'NO NEGOTIATION. 自分と交渉するな。決めたならやれ。',
    'YOU VS YOU. 敵は他人じゃない。昨日のお前だ。今日勝て。',
    'EAT THE FROG. 一番嫌なことを最初にやれ。お前なら片付く。',
    'CONSISTENCY IS KING. 才能より継続。続けられる男になれ。',
    'BUILD THE HABIT. 一回じゃ変わらない。毎日だ。続けろ。',
    'FUTURE YOU IS WATCHING. 一年後のお前が今を見てる。応えろ。',
    'PAIN IS TUITION. きつさは成長の授業料だ。払う価値がある。',
    'ATTACK THE DAY. 一日を待つな。お前から仕掛けろ。',
    'STAND TALL. 背筋を伸ばせ。今日を支配する顔をしろ。',
    'EARN YOUR REST. 休みは働いた者の権利だ。まず働け。',
    'DELETE THE NOISE. 言い訳も雑念も消せ。やることは一つだ。',
    'YOU ARE CAPABLE. お前には力がある。あとは使うだけだ。',
    'MOVE BEFORE YOU THINK. 考える前に動け。考えは逃げ道を作る。',
    'HARD THING FIRST. きついことから手をつけろ。後が楽になる。',
    'READY NEVER COMES. 準備が整う日は来ない。今のお前でやれ。',
    'PROGRESS, NOT PERFECTION. 完璧を待つな。前進しろ。',
    'KEEP THE PROMISE. 自分への約束を守れ。それが信用の土台だ。',
    'ONE MORE REP. もう一回。その一回がお前を変える。',
    'BE THE EXCEPTION. みんなと同じなら結果も同じだ。抜け出せ。',
    'SILENCE THE DOUBT. 迷いは黙らせろ。お前は動ける男だ。',
    'WIN THE MORNING. 朝を制すれば一日を制す。今すぐ動け。',
  ],
  taskAdded: [
    'LIST IS A START. 書いたな。だが書いただけだ。次は実行だ。',
    'NOW EXECUTE. 計画はできた。お前ならやり切れる。動け。',
    'PAPER MEANS NOTHING. 紙の決意に価値はない。行動が証明する。',
    'CLOCK STARTED. 書いた瞬間から時計は動いてる。始めろ。',
    'COMMIT TO IT. 決めたなら逃げるな。お前ならできる。',
    'STEP IN. 戦場に上がった。あとは戦うだけだ。',
  ],
  taskStart: [
    'LOCKED IN. 始めたな。最後までやり切れる男だ。',
    'STAY FOCUSED. 集中しろ。今この瞬間にすべてを置け。',
    'NO DISTRACTIONS. 手を止めるな。気を散らすな。やれる。',
    'DIVE DEEP. 浅くやるな。底まで潜れ。深さが差を生む。',
    'THE CLOCK IS YOURS. 時間は味方だ。長く積め。',
    'PROVE IT NOW. 始めた。あとは実行で証明しろ。',
  ],
  smallWin: [
    'GOOD START. 一歩踏み出した。その調子だ、続けろ。',
    'KEEP STACKING. 一個でいい。だが止まるな。積み上げろ。',
    'MOMENTUM BUILDS. 流れはここから。次の一歩へ。',
    'THIS IS THE BASE. これが土台だ。お前ならもっと積める。',
    'NOT DONE YET. まだ序盤だ。お前の本気はこれからだ。',
    'ONE DOWN. 一個片付けた。次へ行こう、できるはずだ。',
  ],
  mediumWin: [
    'SOLID WORK. いい仕事だ。だがお前はもっとやれる。',
    'HALFWAY THERE. 半分来た。ここからが本番だ、続けろ。',
    'KEEP PUSHING. 止まるな。お前の足はまだ動く。',
    'STEADY PROGRESS. 着実だ。この積み重ねが必ず効く。',
    'YOU ARE BUILDING. 一段ずつ上げてる。その調子だ。',
    'RAISE IT. ここでもう一段上げろ。お前ならいける。',
  ],
  bigWin: [
    'THIS IS THE STANDARD. これがお前の基準だ。明日も出せ。',
    'YOU CHANGED TODAY. 今日、お前は自分を変えた。誇れ。',
    'REAL PROGRESS. これは本物だ。お前の力を見たぞ。',
    'NOW REPEAT IT. 一回で満足するな。明日も同じ強さでいけ。',
    'IMPRESSIVE. 今日のお前は本物だ。この感覚を覚えとけ。',
    'COMFORT ZONE BROKEN. 快適圏を破った。まだ伸びる。',
  ],
  longSession: [
    'DEEP WORK. 長く潜ったな。それができる男だ。',
    'PROOF OF FOCUS. 集中を続けた証明だ。お前は本物だ。',
    'ENDURANCE WINS. 続けられる者が勝つ。お前はその一人だ。',
    'TIME WELL SPENT. かけた時間は必ず結果になる。',
    'BUILT DIFFERENT. 長丁場をこなす心を作ったな。',
    'THIS IS THE EDGE. この粘りが差になる。続けろ。',
  ],
  beatYesterday: [
    'YOU BEAT YESTERDAY. 昨日の自分を超えた。それが成長だ。',
    'PROGRESS PROVEN. 前進した。お前は伸びてる、間違いない。',
    'WIN, DO NOT SETTLE. 勝った。だが満足するな。明日も超えろ。',
    'ONE UP. 昨日に勝った。次は今日のお前が相手だ。',
    'THE GAP GROWS. 過去との差が開いてる。お前は変わってる。',
    'KEEP CLIMBING. 昨日を超えた。その登りを止めるな。',
  ],
  newBest: [
    'NEW RECORD. 自己ベスト更新だ。お前の限界が上がった。',
    'NEW BASELINE. これが新しい基準だ。ここから始めろ。',
    'YOU LEVELED UP. お前は一段上がった。誇っていい。',
    'CEILING BROKEN. 天井を破った。お前にはまだ先がある。',
    'PROVE IT AGAIN. 一度の最高で終わるな。もう一度出せる。',
  ],
  combo: [
    'CONSISTENCY WINS. 続けてる。それが本物の強さだ。',
    'KEEP THE CHAIN. その連続を切らすな。お前ならできる。',
    'EVERY DAY COUNTS. 昨日も今日もやった。明日もだ。',
    'YOU ARE BECOMING SOMEONE. お前は変わりつつある。続けろ。',
    'MOMENTUM IS REAL. 流れができた。乗り続けろ。',
    'DISCIPLINE SHOWS. 継続できてる。それがお前の証明だ。',
  ],
  bigCombo: [
    'YOU ARE DIFFERENT NOW. お前は別格になった。止まるな。',
    'RARE TERRITORY. ここまで続く者は少ない。お前はやってる。',
    'FORGED IN STEEL. 鋼の習慣ができた。これがお前の土台だ。',
    'STAY HARD. ここまで来た。最後まで緩めるな。',
    'LEGEND MODE. 伝説の領域だ。お前ならまだ伸ばせる。',
  ],
  failed: [
    'YOU FELL. SO RISE. 倒れた。だが終わりじゃない。立て。',
    'FACE IT HONESTLY. 負けは認めろ。認めた者だけが次に勝てる。',
    'TOMORROW, WIN HERE. 明日、同じ場所で勝て。お前ならできる。',
    'REMEMBER THIS. この悔しさを忘れるな。力に変えろ。',
    'ONE LOSS IS NOT YOU. 一度の負けがお前のすべてじゃない。',
    'GET BACK UP. 倒れた。で？立て。お前は立てる男だ。',
    'LEARN AND MOVE. 原因を見ろ。直せ。お前なら立て直せる。',
  ],
  wakeUp: [
    'FIRST WIN. ベッドを出た。今日最初の勝利だ。',
    'MOVE, DO NOT THINK. 起きた。考える前に動け。',
    'DAY STARTS NOW. 起きた瞬間から勝負だ。お前ならやれる。',
    'YOU ESCAPED THE TRAP. 布団の罠を抜けた。いい入りだ。',
    'NOW BUILD ON IT. 起きたな。この勢いで一日を作れ。',
    'NO SNOOZE. 二度寝に勝った。その判断力で一日いけ。',
  ],
  wakeUpEarly: [
    'WINNER HOUR. これが勝者の時間だ。お前は掴んだ。',
    'AHEAD OF THE WORLD. 世界より先に動いた。差を作ったな。',
    'BEFORE THE SUN. 太陽より早く起きた。本物の規律だ。',
    'STOLEN TIME. 他人より長く生きてる。使い切れ。',
    'STRONG START. 最高の入りだ。この一日、お前のものだ。',
  ],
  wakeUpLate: [
    'LATE, BUT NOT LOST. 出遅れた。だが今からでも取り返せる。',
    'OWN IT. 寝坊は認めろ。明日は早く起きられる男だ。',
    'CATCH UP NOW. 遅れた分、今から動け。お前なら詰められる。',
    'RESET TODAY. 朝はずれた。だが一日はまだ長い。立て直せ。',
    'TOMORROW, EARLIER. 次は早く起きろ。お前にはできる。',
  ],
  sleep: [
    'BATTLE DONE. 一日を戦い切ったな。ゆっくり休め。',
    'REST IS A WEAPON. 回復は弱さじゃない。明日のための武器だ。',
    'REVIEW AND REST. 今日を振り返って、それから寝ろ。',
    'RECHARGE. 明日もう一度戦うために、しっかり休め。',
    'WELL FOUGHT. よくやった。明日のお前にバトンを渡せ。',
  ],
  sleepEarly: [
    'PRO RHYTHM. 早寝早起き。プロのリズムを掴んでる。',
    'SMART MOVE. 明日の自分に投資したな。賢い判断だ。',
    'DISCIPLINE. 早く休むのも規律だ。お前はできてる。',
    'PHONE DOWN. 画面を閉じた。それが勝者の選択だ。',
    'WELL EARNED. 働いた者の休息だ。胸を張って寝ろ。',
  ],
  sleepLate: [
    'LATE NIGHT. 遅いな。明日のお前のために、今すぐ寝ろ。',
    'FIX THE RHYTHM. リズムが乱れてる。明日こそ整えられる。',
    'PHONE DOWN NOW. 画面を閉じろ。その判断はお前にできる。',
    'TOMORROW NEEDS YOU. 明日の自分のために休め。',
    'RESET TONIGHT. 今夜から立て直せ。お前ならできる。',
  ],
  badStart: [
    'KEEP IT SHORT. 短く終わらせろ。お前ならコントロールできる。',
    'TIMER ON. 時間を決めた。守れる男だろ。',
    'STOP IN 5. 5分で切れ。それができればお前の勝ちだ。',
    'YOU KNOW BETTER. これが何か分かってる。長引かせるな。',
    'CONTROL IT. 主導権はお前にある。早めに切れ。',
    'SHORT AND DONE. さっと済ませて戻れ。お前ならできる。',
  ],
  badShort: [
    'GOOD STOP. よく止めた。その自制が本物の強さだ。',
    'UNDER CONTROL. 許容範囲だ。コントロールできてる。',
    'BACK TO WORK. 短く終えたな。さあ戻ろう。',
    'THAT IS DISCIPLINE. 一瞬で切り上げた。お前はやれてる。',
    'WELL HANDLED. うまく抑えた。次もその調子だ。',
  ],
  badMedium: [
    'A BIT LONG. 少し長かった。次はもっと早く切れる。',
    'NOTICE THE PATTERN. ズルズルの原因を見ろ。直せるはずだ。',
    'TIME MATTERS. その時間でタスク一個できた。次は活かせ。',
    'CUT EARLIER NEXT TIME. 次は早めに切れ。お前ならできる。',
    'LEARN FROM IT. 長引いた。だが気づけば次は変えられる。',
  ],
  badLong: [
    'THAT WAS COSTLY. 大きな時間を失った。だが取り返せる。',
    'FEEL THE WEIGHT. この時間の重さを忘れるな。次の力にしろ。',
    'TOMORROW, FIGHT BACK. 明日この分を取り返せ。お前ならやれる。',
    'BE HONEST. 長すぎた。認めろ。認めれば次は変えられる。',
    'ONE SLIP, NOT THE END. 一度の崩れで終わりじゃない。立て直せ。',
    'RECLAIM IT. 失った時間は明日の行動で取り返せ。',
  ],
  recovery: [
    'YOU GOT BACK UP. 立ち直ったな。それがお前の強さだ。',
    'FALL, THEN RISE. 倒れて立つ。それを繰り返せる男だ。',
    'BACK IN THE FIGHT. まだ終わってない。お前は戻ってきた。',
    'NEVER QUIT. 弱さに屈しなかった。その粘りが本物だ。',
    'CAUGHT UP. 追いついた。だが気を抜くな、まだいける。',
    'STILL STANDING. まだ立ってる。なら勝ち目はある。',
  ],
  scheduled: [
    'PLAN SET. 計画した。あとは実行だ。お前ならやり切れる。',
    'COMMIT TO IT. 約束したな。逃げずに守れる男だ。',
    'TOMORROW IS YOURS. 明日の自分にバトンを渡した。応えろ。',
    'SMART MOVE. 先を見て動いた。だが実行こそが全てだ。',
    'HONOR THE PLAN. 立てた予定は必ず実行しろ。できるはずだ。',
  ],
  scheduledDone: [
    'PROMISE KEPT. 約束を守った。それがお前の信用になる。',
    'YOU SHOWED UP. 昨日の自分を裏切らなかった。立派だ。',
    'EXECUTED THE PLAN. 計画通りやり切った。本物の規律だ。',
    'RELIABLE. 言ったことをやる男だ。それが強さだ。',
    'CONSISTENCY PAYS. 守り続けろ。それがお前を作る。',
  ],
  earlyExecution: [
    'AHEAD OF SCHEDULE. 予定より早い。明日の自分への贈り物だ。',
    'CRUSHED IT EARLY. 前倒しでやり切った。最高の動きだ。',
    'OVERACHIEVER. 言われる前にやった。それが一流の証だ。',
    'FUTURE SELF WINS. 明日のお前が今日のお前に感謝してる。',
    'REAL DISCIPLINE. 計画を超えた。お前はやれる男だ。',
  ],
};

// 優しいコーチ（前向き・ポジティブ系）のセリフ
const QUOTES_POSITIVE = {
  idle: [
    'LET\'S GO! 今日もきっといい一日になるよ！',
    'YOU\'VE GOT THIS. 小さな一歩でも立派な前進だ！',
    'SHINE TODAY. 君ならできる、信じてるよ！',
    'GOOD VIBES. 焦らなくていい、自分のペースで！',
    'FRESH START. いつだって今からがスタートだ！',
    'KEEP SMILING. 頑張ってる自分を褒めてあげよう！',
    'ONE STEP. 完璧じゃなくていい、まずやってみよう！',
    'YOU MATTER. 君の積み重ねは必ず実を結ぶよ！',
    'TAKE IT EASY. 疲れたら休んでいい、それも前進！',
    'BELIEVE. うまくいかない日も、君の価値は変わらない！',
    'SMALL IS BIG. 小さな一歩を、ちゃんと数えよう！',
    'YOU\'RE ENOUGH. 今のままの君でも十分すごい！',
    'GENTLE START. 軽い気持ちでひとつ始めてみよう！',
    'PROUD ALREADY. ここに向き合えてる時点でえらい！',
    'KEEP GOING. ゆっくりでいい、続けることが力だよ！',
    'BRIGHT DAY. 今日もきっといいことがあるよ！',
    'YOUR PACE. 誰かと比べなくていい、君は君だ！',
    'NICE TO SEE YOU. また来てくれたね、それだけで嬉しい！',
    'TINY WINS. 今日できそうな小さなことから！',
    'WARM HEART. 自分にやさしくいこう、ね！',
    'YOU CAN REST. 頑張りすぎないことも大事だよ！',
    'TRUST YOURSELF. 君は思ってるよりずっと強い！',
    'STEP BY STEP. 一歩ずつでちゃんと前に進んでる！',
    'GOOD ENOUGH. 70点で上等、まず動こう！',
    'CHEERING YOU. ずっと君を応援してるよ！',
    'NEW CHANCE. 今この瞬間からやり直せる！',
    'BE KIND TO YOU. 自分を責めないであげてね！',
    'YOU SHOWED UP. 開いてくれた、それがもう一歩目！',
    'LIGHT STEPS. 重く考えず、ふっと始めよう！',
    'GROWING. 気づかないうちに君は成長してるよ！',
    'HELLO AGAIN. 今日も一緒に頑張ろうね！',
    'SOFT POWER. 無理しない強さも本物の強さ！',
    'ONE THING. ひとつでいい、それで十分だよ！',
    'YOU\'RE TRYING. 挑もうとしてる、それが素敵だ！',
    'CALM MIND. 落ち着いて、できることからね！',
    'HOPE. 今日が昨日より少し良ければ大成功！',
    'KEEP THE SPARK. 君のやる気の火、大事にしよう！',
    'NO RUSH. 急がなくていい、止まらなければOK！',
    'SHINE ON. 君のペースで輝けばいいんだ！',
    'PROUD OF YOU. ここまで来た君を誇りに思うよ！',
    'FRESH AIR. 深呼吸して、軽くいこう！',
    'YOU CHOSE GROWTH. 成長しようとする君が好きだ！',
    'LITTLE BY LITTLE. 少しずつでちゃんと積み上がる！',
    'WARM START. 気楽にスタートしてみよう！',
    'YOU\'RE DOING FINE. 君は十分よくやってるよ！',
    'GOOD MORNING SOUL. 心にいい一日をあげよう！',
    'KEEP IT LIGHT. 楽しめる範囲でいこうね！',
    'STILL HERE. 続けてる君、本当にすごい！',
    'BRAVE YOU. 向き合うのは勇気がいる、えらいよ！',
    'SMILE FIRST. まず笑顔、それから一歩！',
    'YOU\'LL BLOOM. 君はこれから花開くよ！',
    'TRUST THE PROCESS. 積み重ねは裏切らないよ！',
    'KIND TO START. やさしい気持ちで始めよう！',
    'YOU\'RE NOT ALONE. 一人じゃないよ、一緒に！',
    'GOOD CHOICE. 今日もやろうとしてる、その心が宝物！',
    'EASY DOES IT. 力まないで、ゆるくいこう！',
    'HAPPY STEPS. 楽しみながら進もうね！',
    'YOU\'RE GROWING. 昨日より少し前へ、それで十分！',
    'BREATHE. 焦らず、ひと呼吸おいてからね！',
    'CELEBRATE SMALL. 小さな達成も思いきり喜ぼう！',
    'YOUR DAY. 今日は君のための一日だよ！',
    'SO PROUD. 何もできなくても、来てくれて嬉しい！',
    'KEEP HOPE. 大丈夫、きっとうまくいくよ！',
    'GENTLE PUSH. ほんの少しだけ、背中を押すね！',
    'YOU\'RE CAPABLE. 君にはちゃんと力があるよ！',
    'NICE ENERGY. いい調子、その気持ちで！',
    'REST IS OK. 休む日があってもいいんだよ！',
    'ONE SMILE. 笑って、肩の力を抜こう！',
    'YOU\'RE LOVED. 頑張る君を、ちゃんと見てるよ！',
    'STEADY HEART. あわてないで、君のリズムで！',
    'BRIGHT FUTURE. 続ければ未来は明るいよ！',
    'JUST BEGIN. 完璧を待たず、まず始めよう！',
    'WARMTH WINS. やさしさは弱さじゃない、強さだよ！',
    'TODAY COUNTS. 今日の小さな努力も全部宝物！',
    'YOU GOT FAR. ここまで来られたね、すごいよ！',
  ],
  taskAdded: [
    'NICE PLAN! 計画を立てた、それだけで素晴らしい！',
    'GREAT START. 書き出せたね、もう半分成功だ！',
    'LOVE IT. やることが見えた、あとは楽しもう！',
    'GOOD THINKING. ちゃんと考えられたね、えらい！',
    'ONE BY ONE. 焦らずひとつずつでいいよ！',
    'WELL DONE. 動き出した君が素敵だ！',
  ],
  taskStart: [
    'HERE WE GO! 始めた君は最高にかっこいい！',
    'FOCUS TIME. 今この瞬間を大切にいこう！',
    'YOU STARTED. 一番むずかしい一歩を踏み出せたね！',
    'GREAT MOVE. 始められた、それがもうすごい！',
    'ENJOY IT. 楽しみながらやってみよう！',
    'PROUD! やる気を行動に変えられたね！',
  ],
  smallWin: [
    'WELL DONE! 小さな一歩、ちゃんと前進だよ！',
    'NICE! その調子、無理せずいこう！',
    'PROUD OF YOU. ひとつできた、えらい！',
    'GOOD JOB. 積み重なってるよ、その調子！',
    'KEEP IT UP. いい流れだね、楽しんで！',
    'YAY! ひとつ達成、自分を褒めよう！',
  ],
  mediumWin: [
    'AWESOME! しっかりやり切ったね、すごい！',
    'GREAT JOB. 着実に進んでる、その調子！',
    'KEEP IT UP. いい流れだよ、楽しんでこう！',
    'WONDERFUL. ちゃんと前に進めたね！',
    'SO GOOD. 君の頑張り、ちゃんと届いてるよ！',
    'NICE WORK. 自分を誇っていいよ！',
  ],
  bigWin: [
    'AMAZING!! 大きな一歩、本当によく頑張った！',
    'YOU DID IT! 今日の君は輝いてるよ！',
    'INCREDIBLE. この調子なら何でもできる！',
    'SO PROUD!! 心から尊敬するよ、すごい！',
    'BRILLIANT! 大きな達成、おめでとう！',
    'SHINING! 今日の君は最高だ！',
  ],
  longSession: [
    'DEEP FOCUS! じっくり取り組めたね、立派だよ！',
    'GREAT EFFORT. 長く続けられた自分を誇ろう！',
    'SO PROUD. 集中力、ちゃんと育ってるよ！',
    'WONDERFUL. これだけ向き合えた、すごい！',
    'STRONG HEART. 続ける力がついてきたね！',
    'WELL DONE. 長い時間、本当によく頑張った！',
  ],
  beatYesterday: [
    'NEW YOU! 昨日の自分を超えた、最高だ！',
    'GROWING! 着実に成長してる、すごいよ！',
    'BEYOND! 一歩リード、その調子でいこう！',
    'PROGRESS! 昨日より前へ進めたね！',
    'SO GOOD. ちゃんと伸びてるよ、誇って！',
    'KEEP RISING. 少しずつ強くなってる！',
  ],
  newBest: [
    'RECORD!! 自己ベスト更新、本当にすごい！',
    'BRAND NEW. 新しい自分に出会えたね！',
    'SHINING! 今日の君は過去最高だ！',
    'WONDERFUL!! 限界を更新したね、おめでとう！',
    'SO PROUD. 君の努力が形になったよ！',
  ],
  combo: [
    'STREAK! 続けられてる、それが一番の才能！',
    'CONSISTENT. 毎日の積み重ね、誇っていいよ！',
    'KEEP GOING. 継続できる君は本物だ！',
    'GREAT RHYTHM. いいリズムができてるね！',
    'SO STEADY. コツコツ続く君が素敵だ！',
    'WELL DONE. その継続、ちゃんとすごいよ！',
  ],
  bigCombo: [
    'LEGEND! ここまで続けた君は本当にすごい！',
    'UNSTOPPABLE! 君の継続力は宝物だよ！',
    'WOW!! こんなに続けられるなんて最高！',
    'AMAZING HABIT. 立派な習慣が育ったね！',
    'SO PROUD!! 続けた君を心から尊敬するよ！',
  ],
  failed: [
    'IT\'S OK. 認めて記録できた、それも勇気だよ！',
    'NO WORRIES. 今日はそういう日、明日また一緒に！',
    'STILL GREAT. 向き合えた君を尊敬するよ！',
    'NEXT TIME. うまくいかない日もある、大丈夫！',
    'BE KIND. 自分を責めないであげてね！',
    'YOU\'RE OK. 失敗しても君の価値は変わらないよ！',
    'TOMORROW. ひと休みして、また挑戦しよう！',
  ],
  wakeUp: [
    'GOOD MORNING! 起きられたね、いい一日にしよう！',
    'NICE WAKE-UP. 朝のスタート、よく頑張った！',
    'FRESH! 起きた君、もう今日の勝者だ！',
    'WELL DONE. ベッドから出られたね、えらい！',
    'NEW DAY. 今日も君のペースでいこう！',
    'SMILE. いい朝だね、深呼吸しよう！',
  ],
  wakeUpEarly: [
    'EARLY BIRD! 早起き最高、すばらしい！',
    'WONDERFUL! 静かな朝を手に入れたね！',
    'SHINING MORNING. 早起きできた君は輝いてる！',
    'GREAT START. 朝の時間、いい使い方だね！',
    'SO PROUD. 早起き、本当によく頑張った！',
  ],
  wakeUpLate: [
    'NO PROBLEM. 今からでも十分間に合うよ！',
    'IT\'S FINE. ゆっくりでも一日は始められる！',
    'STILL GOOD. 起きられたことが大事、いこう！',
    'DON\'T WORRY. 遅れた分は気にしないで、今からね！',
    'FRESH NOW. 今この瞬間からがスタートだよ！',
  ],
  sleep: [
    'GOOD NIGHT. 一日おつかれさま、よく頑張った！',
    'REST WELL. しっかり休むのも大切な力だよ！',
    'SWEET DREAMS. 今日の自分をねぎらってあげて！',
    'WELL DONE. 今日も一日えらかったね！',
    'RELAX. ゆっくり休んで、また明日ね！',
  ],
  sleepEarly: [
    'GREAT RHYTHM! 早寝できた、体が喜んでるよ！',
    'WONDERFUL. 早めに休めた君は賢い！',
    'PERFECT. いい睡眠リズム、その調子！',
    'SO GOOD. 自分を大事にできたね！',
    'NICE CHOICE. 早く休む、いい判断だよ！',
  ],
  sleepLate: [
    'IT\'S OK. 今日はゆっくり休んでね！',
    'NO BLAME. 遅くなった日もある、大丈夫！',
    'REST NOW. 明日のために、もう休もう！',
    'TAKE CARE. 体を大事に、おやすみなさい！',
    'DON\'T WORRY. 気にしないで、ゆっくり寝てね！',
  ],
  badStart: [
    'EASY DOES IT. 短く切り上げれば大丈夫だよ！',
    'YOU GOT THIS. 自分で気づけてる、それが第一歩！',
    'TAKE A BREATH. 少しならOK、上手に切り上げよう！',
    'NO GUILT. 息抜きも必要、でも時間は決めようね！',
    'YOU\'RE AWARE. 気づけてる君はえらいよ！',
    'SET A LIMIT. ちょっとだけ、と決めていこう！',
  ],
  badShort: [
    'NICE STOP! 短く終われたね、コントロールできてる！',
    'WELL HANDLED. ちゃんと切り上げられた、えらい！',
    'GOOD JOB. すぐ戻ってこれた、その調子！',
    'GREAT CONTROL. 自分を上手に扱えてるよ！',
    'PROUD! 短く済ませられたね、すごい！',
  ],
  badMedium: [
    'IT\'S OK. 気づけたから次はもっと短くできる！',
    'NO WORRIES. ここから立て直していこう！',
    'NEXT ONE. 大丈夫、また切り替えればいい！',
    'YOU NOTICED. 気づけた、それが大事な一歩！',
    'FRESH START. ここからまた頑張ろうね！',
  ],
  badLong: [
    'STILL OK. 記録できたこと自体がえらいよ！',
    'TOMORROW. 今日はここまで、明日また一緒に！',
    'BE KIND. 自分を責めないで、次にいこう！',
    'NO BLAME. 誰にでもある日だよ、大丈夫！',
    'RESET. ここで切り替えれば、もう前進だよ！',
    'YOU\'RE OK. 君の価値は今日のことで変わらない！',
  ],
  recovery: [
    'YOU BOUNCED BACK! 立て直せた君、本当に強い！',
    'GREAT COMEBACK. 諦めなかったね、すごいよ！',
    'PROUD! 落ちても戻ってこれた、それが力だ！',
    'WONDERFUL. もう一度立ち上がれたね！',
    'SO STRONG. 折れずに続ける君が素敵だ！',
    'KEEP GOING. ちゃんと持ち直せたよ！',
  ],
  scheduled: [
    'NICE PLANNING! 先を見据えられたね、賢い！',
    'GOOD MOVE. 未来の自分が喜んでるよ！',
    'WELL DONE. 計画した君、もう一歩リードだ！',
    'GREAT IDEA. 先に決めておくの、いいね！',
    'SO SMART. 未来の自分への贈り物だね！',
  ],
  scheduledDone: [
    'PROMISE KEPT! 約束を守れた、誇っていいよ！',
    'AMAZING. 計画どおりできたね、最高！',
    'SO RELIABLE. 言ったことをやれる君は素敵だ！',
    'WONDERFUL. 自分との約束、守れたね！',
    'PROUD! 計画を実行できた、すごいよ！',
  ],
  earlyExecution: [
    'AHEAD!! 前倒しできるなんてすごい！',
    'WONDERFUL. 未来の自分への贈り物だね！',
    'BRILLIANT. 早めに動けた君は輝いてる！',
    'SO GOOD. 予定より早く、立派だよ！',
    'AMAZING. 先回りできる君、最高だ！',
  ],
};

const QUOTE_SETS = { strict: QUOTES, positive: QUOTES_POSITIVE };

// セリフ履歴：コーチタイプ×カテゴリごとに使い切るまで同じセリフを出さない
const quoteHistory = {};
const randomQuote = (key, style = 'strict') => {
  const set = QUOTE_SETS[style] || QUOTES;
  const arr = set[key] || set.idle;
  if (arr.length <= 1) return arr[0];
  const hk = style + '|' + key;
  let used = quoteHistory[hk] || [];
  let pool = arr.filter(q => !used.includes(q));
  if (pool.length === 0) { used = []; pool = arr.slice(); }
  const q = pool[Math.floor(Math.random() * pool.length)];
  quoteHistory[hk] = [...used, q];
  return q;
};

const getTodayStr = () => new Date().toDateString();

// 日付指定スケジュール用ヘルパー（ローカルタイムの YYYY-MM-DD）
const dateAfter = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const todayISO = () => dateAfter(0);
const WEEKDAY_JP = ['日', '月', '火', '水', '木', '金', '土'];
const formatSchedDate = (iso) => {
  if (!iso) return '今日';
  if (iso === todayISO()) return '今日';
  if (iso === dateAfter(1)) return '明日';
  const [y, m, d] = iso.split('-').map(Number);
  const w = WEEKDAY_JP[new Date(y, m - 1, d).getDay()];
  return `${m}/${d}(${w})`;
};

// 繰り返し（定期タスク）
const REPEAT_OPTIONS = [['none', 'なし'], ['daily', '毎日'], ['weekly', '毎週']];
const repeatLabel = (r) => (r === 'daily' ? '🔁 毎日' : r === 'weekly' ? '🔁 毎週' : '');

const formatDuration = (minutes) => {
  if (minutes < 1) return '0分';
  if (minutes < 60) return `${minutes}分`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
};

// 秒数を HH:MM:SS 形式に（タイマーのリアルタイム表示用）
const formatHMS = (totalSeconds) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
};

// 時刻文字列 "HH:MM" を分換算
const timeStrToMinutes = (str) => {
  if (!str || typeof str !== 'string' || !str.includes(':')) return null;
  const [h, m] = str.split(':').map((x) => parseInt(x, 10));
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
};

// 予定時刻と実際の時刻の差（分）からポイントを算出（就寝/起床共通）
const getScheduleScore = (actualMin, targetMin) => {
  if (targetMin == null) return { power: 0, label: '予定未設定', diff: 0 };
  let diff = Math.abs(actualMin - targetMin);
  if (diff > 720) diff = 1440 - diff;
  if (diff <= 30) return { power: 15, label: '予定どおり', diff };
  if (diff <= 60) return { power: 5, label: 'ほぼ予定どおり', diff };
  return { power: -10, label: '予定から大きくズレ', diff };
};

const DEFAULT_SLEEP_GOAL = { bedtime: '23:30', wakeup: '06:30' };

export default function SelfVsSelf() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [badCategories, setBadCategories] = useState(DEFAULT_BAD_CATEGORIES);
  const [tasks, setTasks] = useState([]);
  const [todayPower, setTodayPower] = useState(0);
  const [totalPower, setTotalPower] = useState(0);
  const [bestDay, setBestDay] = useState({ date: null, power: 0 });
  const [yesterdayPower, setYesterdayPower] = useState(0);
  const [currentDate, setCurrentDate] = useState(getTodayStr());
  const [streak, setStreak] = useState(0);
  const [winCount, setWinCount] = useState(0);
  const [lossCount, setLossCount] = useState(0);
  const [history, setHistory] = useState([]);
  const [opponentType, setOpponentType] = useState('yesterday');
  const [wakeTime, setWakeTime] = useState(null);
  const [sleepTime, setSleepTime] = useState(null);
  const [failedCount, setFailedCount] = useState(0);
  const [taskCombos, setTaskCombos] = useState({});
  // タスクごとの過去最長時間 { taskKey: minutes }
  const [taskMaxDurations, setTaskMaxDurations] = useState({});
  // 過去入力したタスクテキストの履歴（候補表示用）
  const [taskHistory, setTaskHistory] = useState([]);
  const [activeBadTask, setActiveBadTask] = useState(null);
  const [todayDamages, setTodayDamages] = useState([]);
  const [todayDamageTotal, setTodayDamageTotal] = useState(0);
  const [todayRecoveryTotal, setTodayRecoveryTotal] = useState(0);
  const [damageHealed, setDamageHealed] = useState(0); // 回復済みダメージ
  const [currentBadTimer, setCurrentBadTimer] = useState(0);
  const [currentBadSeconds, setCurrentBadSeconds] = useState(0);
  const [activeTaskTimer, setActiveTaskTimer] = useState(null); // {taskId, startedAt}
  const [currentTaskTimer, setCurrentTaskTimer] = useState(0);
  const [currentTaskSeconds, setCurrentTaskSeconds] = useState(0);
  const activeTimerRef = useRef(null); // 秒単位（リアルタイム表示用）
  const [sleepGoal, setSleepGoal] = useState(DEFAULT_SLEEP_GOAL); // { bedtime, wakeup } "HH:MM"
  const [editingSleepGoal, setEditingSleepGoal] = useState(false);
  // 悪いタスク開始前の代替提案ポップアップ
  const [redirectPopup, setRedirectPopup] = useState(null); // { badCategoryId | customMode info }
  const [newTask, setNewTask] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('life');
  const [newDifficulty, setNewDifficulty] = useState('medium');
  const [newScheduledDate, setNewScheduledDate] = useState(''); // '' = 今日 / YYYY-MM-DD = 予定日
  const [newRepeat, setNewRepeat] = useState('none'); // none | daily | weekly（繰り返し）
  const [appNotice, setAppNotice] = useState(null); // LINE風アプリ内通知バナー { id, title, body }
  
  // クイックスタート用
  const [quickText, setQuickText] = useState('');
  const [badQuickText, setBadQuickText] = useState('');
  const [editingDoneId, setEditingDoneId] = useState(null);
  const [choosingTaskId, setChoosingTaskId] = useState(null);
  const [editDoneText, setEditDoneText] = useState('');
  const [quickCategoryId, setQuickCategoryId] = useState('life');
  const [quickDifficulty, setQuickDifficulty] = useState('medium');
  const [isLoading, setIsLoading] = useState(true);
  const [coachQuote, setCoachQuote] = useState(() => randomQuote('idle'));
  const [coachIntense, setCoachIntense] = useState(false);
  const [coachStyle, setCoachStyle] = useState('strict'); // strict（厳しい） | positive（優しい）
  
  // ダメな行為の開始ダイアログ
  const [badStartDialog, setBadStartDialog] = useState(null); // { categoryId, customMode, customLabel, customEmoji } | null
  const [badCustomMinutes, setBadCustomMinutes] = useState('');
  // ダメな行為の履歴（カスタム入力したものの候補）
  const [badHistory, setBadHistory] = useState([]); // [{label, emoji, usedAt}]
  
  // ボーナスポップアップ
  const [bonusPopup, setBonusPopup] = useState(null); // { items: [{label, points, color, emoji}], totalPoints }
  const [badResultPopup, setBadResultPopup] = useState(null); // 悪いタスク終了時の結果ポップアップ
  const [showSettings, setShowSettings] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showBadSettings, setShowBadSettings] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [editingBadCat, setEditingBadCat] = useState(null);
  const [catForm, setCatForm] = useState({ label: '', emoji: '🎯', color: COLOR_OPTIONS[0].value });
  const [badCatForm, setBadCatForm] = useState({ label: '', emoji: '📱' });

  // データ読み込み
  useEffect(() => {
    const load = async () => {
      let loadedCoachStyle = 'strict';
      try {
        const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null; const result = stored ? { value: stored } : null;
        if (result && result.value) {
          const d = JSON.parse(result.value);
          loadedCoachStyle = d.coachStyle || 'strict';
          const today = getTodayStr();

          if (d.currentDate !== today) {
            const yesterdayStr = new Date(Date.now() - 86400000).toDateString();
            const wasYesterday = d.currentDate === yesterdayStr;

            let newHistory = [...(d.history || [])];
            let newWin = d.winCount || 0;
            let newLoss = d.lossCount || 0;
            let newStreak = d.streak || 0;
            let newBest = d.bestDay || { date: null, power: 0 };

            if (d.currentDate && (d.todayPower > 0 || d.wakeTime || d.sleepTime || (d.failedCount || 0) > 0 || (d.todayDamageTotal || 0) > 0)) {
              const opp = d.opponentType === 'best' ? (d.bestDay?.power || 0) : (d.yesterdayPower || 0);
              const won = d.todayPower >= opp && opp > 0;

              newHistory.unshift({
                date: d.currentDate,
                power: d.todayPower || 0,
                opponent: opp,
                won,
                wakeTime: d.wakeTime || null,
                sleepTime: d.sleepTime || null,
                failedCount: d.failedCount || 0,
                damageTotal: d.todayDamageTotal || 0,
                recoveryTotal: d.todayRecoveryTotal || 0,
              });
              newHistory = newHistory.slice(0, 15);

              if (opp > 0) {
                if (won) newWin++;
                else newLoss++;
              }
              if (d.todayPower > newBest.power) newBest = { date: d.currentDate, power: d.todayPower };
              if (wasYesterday && d.todayPower > 0) newStreak = (d.streak || 0) + 1;
              else if (d.todayPower > 0) newStreak = 1;
              else newStreak = 0;
            } else {
              newStreak = 0;
            }

            setCategories((d.categories || DEFAULT_CATEGORIES).map(c => (c.id === 'body' && c.label === '身体') ? { ...c, label: '健康' } : c));
            setBadCategories(withVideoCat(d.badCategories || DEFAULT_BAD_CATEGORIES));
            // 未完了タスクは持ち越し。forTomorrow=trueだったタスクは「今日が予定日」になる
            setTasks((d.tasks || [])
              .filter(t => !t.completed && !t.failed)
              .map(t => {
                const ti = todayISO();
                if (t.scheduledDate) {
                  // 予定日が到来したら「今日のタスク（約束達成ボーナス対象）」に昇格
                  if (t.scheduledDate <= ti) return { ...t, forTomorrow: false, scheduledFor: 'today' };
                  return t; // まだ未来 → 持ち越し
                }
                return t.forTomorrow ? { ...t, forTomorrow: false, scheduledFor: 'today' } : t;
              })
            );
            setYesterdayPower(d.todayPower || 0);
            setTodayPower(0);
            setTotalPower(d.totalPower || 0);
            setBestDay(newBest);
            setStreak(newStreak);
            setWinCount(newWin);
            setLossCount(newLoss);
            setHistory(newHistory);
            setCurrentDate(today);
            setOpponentType(d.opponentType || 'yesterday');
            setWakeTime(null);
            setSleepTime(null);
            setFailedCount(0);
            setTaskCombos(d.taskCombos || {});
            setTaskMaxDurations(d.taskMaxDurations || {});
            setTaskHistory(d.taskHistory || []);
            setActiveBadTask(null);
            setBadHistory(d.badHistory || []);
            setTodayDamages([]);
            setTodayDamageTotal(0);
            setTodayRecoveryTotal(0);
            setDamageHealed(0);
            setActiveTaskTimer(null);
            setSleepGoal(d.sleepGoal || DEFAULT_SLEEP_GOAL);
          } else {
            setCategories((d.categories || DEFAULT_CATEGORIES).map(c => (c.id === 'body' && c.label === '身体') ? { ...c, label: '健康' } : c));
            setBadCategories(withVideoCat(d.badCategories || DEFAULT_BAD_CATEGORIES));
            setTasks((d.tasks || []).map(t => {
              let nt = t;
              if (t.partialDone && !t.partialDate && !t.completed && !t.failed) nt = { ...nt, partialDate: todayISO() };
              if ((t.planBonus || 0) > 0 && !t.planBonusDate) nt = { ...nt, planBonusDate: todayISO() };
              return nt;
            }));
            setTodayPower(d.todayPower || 0);
            setTotalPower(d.totalPower || 0);
            setBestDay(d.bestDay || { date: null, power: 0 });
            setYesterdayPower(d.yesterdayPower || 0);
            setStreak(d.streak || 0);
            setWinCount(d.winCount || 0);
            setLossCount(d.lossCount || 0);
            setHistory(d.history || []);
            setCurrentDate(d.currentDate || today);
            setOpponentType(d.opponentType || 'yesterday');
            setWakeTime(d.wakeTime || null);
            setSleepTime(d.sleepTime || null);
            setFailedCount(d.failedCount || 0);
            setTaskCombos(d.taskCombos || {});
            setTaskMaxDurations(d.taskMaxDurations || {});
            setTaskHistory(d.taskHistory || []);
            setActiveBadTask(d.activeBadTask || null);
            setBadHistory(d.badHistory || []);
            setTodayDamages(d.todayDamages || []);
            setTodayDamageTotal(d.todayDamageTotal || 0);
            setTodayRecoveryTotal(d.todayRecoveryTotal || 0);
            setDamageHealed(d.damageHealed || 0);
            setActiveTaskTimer(d.activeTaskTimer || null);
            setSleepGoal(d.sleepGoal || DEFAULT_SLEEP_GOAL);
          }
        }
      } catch (e) {
        console.log('No saved data');
      }
      setCoachStyle(loadedCoachStyle);
      setCoachQuote(randomQuote('idle', loadedCoachStyle));
      setIsLoading(false);
    };
    load();
  }, []);

  // 自動保存
  useEffect(() => {
    if (isLoading) return;
    (async () => {
      try {
        if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify({
          categories, badCategories, tasks, todayPower, totalPower, bestDay, yesterdayPower,
          currentDate, streak, winCount, lossCount, history, opponentType,
          wakeTime, sleepTime, failedCount, taskCombos, taskMaxDurations, taskHistory,
          activeBadTask, badHistory, todayDamages, todayDamageTotal,
          todayRecoveryTotal, damageHealed, activeTaskTimer, sleepGoal, coachStyle
        }));
      } catch (e) { console.error(e); }
    })();
  }, [categories, badCategories, tasks, todayPower, totalPower, bestDay, yesterdayPower, currentDate, streak, winCount, lossCount, history, opponentType, wakeTime, sleepTime, failedCount, taskCombos, taskMaxDurations, taskHistory, activeBadTask, badHistory, todayDamages, todayDamageTotal, todayRecoveryTotal, damageHealed, activeTaskTimer, sleepGoal, coachStyle, isLoading]);

  // 「今日の自分」をイベント合計（今日のバランス）に常に一致させる — ズレを自動補正
  useEffect(() => {
    if (isLoading) return;
    const net = buildTodayEvents().reduce((s, e) => s + e.points, 0);
    if (net !== todayPower) {
      setTotalPower(totalPower - todayPower + net);
      setTodayPower(net);
    }
  }, [tasks, wakeTime, sleepTime, todayDamages, todayPower, totalPower, isLoading]);

  // ダメタスクのタイマー（秒単位でリアルタイム更新＋通知）
  useEffect(() => {
    if (!activeBadTask) { setCurrentBadTimer(0); setCurrentBadSeconds(0); return; }
    const limitSec = (activeBadTask.limitMinutes || 0) * 60;
    let warned = false, over = false;
    const notify = (title, body) => {
      // LINE風のアプリ内バナー（OS通知の許可状態に関わらず必ず表示）
      const nid = Date.now() + Math.random();
      setAppNotice({ id: nid, title, body });
      setTimeout(() => setAppNotice((cur) => (cur && cur.id === nid ? null : cur)), 6000);
      try {
        if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;
        const opts = { body, icon: '/icon-192.png', badge: '/icon-192.png', tag: 'svs-bad-timer', renotify: true };
        if ('serviceWorker' in navigator && navigator.serviceWorker) {
          navigator.serviceWorker.ready
            .then((reg) => reg.showNotification(title, opts))
            .catch(() => { try { new Notification(title, opts); } catch (e) {} });
        } else {
          new Notification(title, opts);
        }
      } catch (e) {}
    };
    const update = () => {
      const sec = Math.floor((Date.now() - activeBadTask.startedAt) / 1000);
      setCurrentBadSeconds(sec);
      setCurrentBadTimer(Math.floor(sec / 60));
      if (limitSec > 0) {
        const label = getBadDisplay(activeBadTask).label;
        if (!warned && limitSec > 60 && sec >= limitSec - 60 && sec < limitSec) {
          warned = true;
          notify('まもなく宣言時間', `「${label}」の宣言時間まであと1分です`);
        }
        if (!over && sec >= limitSec) {
          over = true;
          notify('宣言時間オーバー', `「${label}」が宣言した${activeBadTask.limitMinutes}分を過ぎています。早く止めましょう`);
        }
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeBadTask]);

  // 良タスクのタイマー（秒単位でリアルタイム更新）
  useEffect(() => {
    if (!activeTaskTimer) { setCurrentTaskTimer(0); setCurrentTaskSeconds(0); return; }
    const update = () => {
      const sec = Math.floor((Date.now() - activeTaskTimer.startedAt) / 1000);
      setCurrentTaskSeconds(sec);
      setCurrentTaskTimer(Math.floor(sec / 60));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeTaskTimer]);

  // タスク開始時、実行中カードへ自動スクロール
  useEffect(() => {
    if (activeTaskTimer && activeTimerRef.current) {
      setTimeout(() => {
        if (activeTimerRef.current) activeTimerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [activeTaskTimer]);

  // サービスワーカー登録（通知・PWAインストール用） — next-pwaの自動登録が効かないため手動登録
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((e) => console.log('SW register failed', e));
    }
  }, []);

  // PWAインストール用イベントを捕捉
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    if (typeof window !== 'undefined') window.addEventListener('beforeinstallprompt', handler);
    return () => { if (typeof window !== 'undefined') window.removeEventListener('beforeinstallprompt', handler); };  }, []);

  useEffect(() => {
    if (categories.length > 0 && !categories.find(c => c.id === newCategoryId)) {
      setNewCategoryId(categories[0].id);
    }
    if (categories.length > 0 && !categories.find(c => c.id === quickCategoryId)) {
      setQuickCategoryId(categories[0].id);
    }
  }, [categories, newCategoryId, quickCategoryId]);

  const getCategory = (id) => categories.find(c => c.id === id) || categories[0] || DEFAULT_CATEGORIES[0];
  const getBadCategory = (id) => badCategories.find(c => c.id === id) || badCategories[0] || DEFAULT_BAD_CATEGORIES[0];
  
  // ダメタスクの表示用ラベル取得（カスタムも対応）
  const getBadDisplay = (item) => {
    if (item.customLabel) {
      return { label: item.customLabel, emoji: item.customEmoji || '⚠️' };
    }
    const bc = getBadCategory(item.categoryId);
    return { label: bc.label, emoji: bc.emoji };
  };

  // === 習慣的なタスク（繰り返し）===
  const isHabitTask = (t) => !!(t.repeat && t.repeat !== 'none');
  const habitDoneToday = (t) => t.habitDoneDate === todayISO();
  const habitDue = (t) => {
    if (habitDoneToday(t)) return false;
    if (t.repeat === 'weekly') {
      if (!t.habitDoneDate) return true;
      return (Date.now() - new Date(t.habitDoneDate).getTime()) / 86400000 >= 7;
    }
    return true; // daily
  };

  // 今日のイベント一覧（タスク・起床/就寝・ダメージ）— 「今日のバランス」と「今日の自分」で共通利用
  const buildTodayEvents = () => {
    const evts = [];
    tasks.forEach(t => {
      if (t.failed) return;
      if (isHabitTask(t)) {
        const ti2 = todayISO();
        let hp = 0;
        if (t.habitDoneDate === ti2) hp += t.habitPower || 0;
        if (t.habitPartialDate === ti2) hp += t.habitPartialPower || 0;
        if (hp !== 0) evts.push({ label: '🔁 ' + t.text, points: hp });
        return;
      }
      const p = (t.completed ? (t.powerEarned || 0) : 0) + (t.partialDate === todayISO() ? (t.partialPower || 0) : 0) + (t.planBonusDate === todayISO() ? (t.planBonus || 0) : 0);
      if (!t.completed && p === 0) return;
      let label = t.text;
      if (!t.completed) label += t.partialDone ? '（着手）' : '（計画）';
      evts.push({ label, points: p });
    });
    if (wakeTime) evts.push({ label: `${wakeTime.time} 起床`, points: wakeTime.power || 0 });
    if (sleepTime) evts.push({ label: `${sleepTime.time} 就寝`, points: sleepTime.power || 0 });
    todayDamages.forEach(d => { const disp = getBadDisplay(d); evts.push({ label: `${disp.emoji} ${disp.label} ${formatDuration(d.minutes)}`, points: -(d.damage || 0) }); });
    return evts;
  };
  // 「今日の自分」= 今日のイベント合計（= 今日のバランスの差し引き）。両者を常に一致させる
  const todayNetComputed = buildTodayEvents().reduce((s, e) => s + e.points, 0);

  const getRank = () => {
    let r = RANKS[0];
    for (const rank of RANKS) if (totalPower >= rank.min) r = rank;
    return r;
  };

  const getOpponent = () => {
    if (opponentType === 'best') return { power: bestDay.power, label: '自己ベスト' };
    return { power: yesterdayPower, label: '昨日の自分' };
  };

  const opponent = getOpponent();
  const isWinning = todayPower >= opponent.power && opponent.power > 0;
  const battleProgress = opponent.power > 0 ? Math.min(100, (todayPower / opponent.power) * 100) : 100;
  const rank = getRank();
  const weeklyPoints = (() => {
    const weekAgo = Date.now() - 6 * 86400000;
    return todayPower + history.reduce((acc, h) => {
      const t = new Date(h.date).getTime();
      return (!isNaN(t) && t >= weekAgo) ? acc + (h.power || 0) : acc;
    }, 0);
  })();
  const damageRemaining = Math.max(0, todayDamageTotal - damageHealed);

  const triggerCoach = (key, intense = false) => {
    setCoachQuote(randomQuote(key, coachStyle));
    setCoachIntense(intense);
    setTimeout(() => setCoachIntense(false), 4000);
  };

  // 履歴に追加（重複なし、最新を先頭に、最大50件）
  const addToHistory = (text, categoryId, difficulty) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const filtered = taskHistory.filter(h => h.text.toLowerCase() !== trimmed.toLowerCase());
    setTaskHistory([{ text: trimmed, categoryId, difficulty, usedAt: Date.now() }, ...filtered].slice(0, 50));
  };

  // バトル履歴を1件削除
  const deleteHistoryEntry = (idx) => {
    setHistory(history.filter((_, i) => i !== idx));
  };

  // タスクが今日のポイントに加えた分（削除・失敗・取り消し時に差し引く用）
  // タスクが今日のポイントに加えた実額。gained を持つならそれが正（旧データはフォールバック計算）
  const reversibleTaskPoints = (t) => {
    if (typeof t.gained === 'number') return t.gained;
    return (t.completed ? (t.powerEarned || 0) : 0) + (t.partialDone ? (t.partialPower || 0) : 0) + (t.planBonusDate === todayISO() ? (t.planBonus || 0) : 0);
  };

  const addTask = (scheduledDate = '') => {
    if (!newTask.trim() || categories.length === 0) return;
    const isHabit = newRepeat !== 'none';
    let task;
    if (isHabit) {
      // 習慣的なタスク（毎日/毎週）— 予定日は持たず、くり返し表示される
      task = {
        id: Date.now().toString(),
        text: newTask.trim(),
        categoryId: newCategoryId,
        difficulty: newDifficulty,
        completed: false,
        repeat: newRepeat,
        habitDoneDate: null,
      };
    } else {
      const sd = scheduledDate || '';
      const isFuture = sd && sd > todayISO();
      task = {
        id: Date.now().toString(),
        text: newTask.trim(),
        categoryId: newCategoryId,
        difficulty: newDifficulty,
        completed: false,
        scheduledDate: sd || null,
        forTomorrow: isFuture,
        planBonus: isFuture ? 5 : 0,
        planBonusDate: isFuture ? todayISO() : null,
        repeat: 'none',
        gained: isFuture ? 5 : 0,
      };
    }
    setTasks([task, ...tasks]);
    addToHistory(newTask, newCategoryId, newDifficulty);
    setNewTask('');
    setNewScheduledDate('');
    setNewRepeat('none');

    if (!isHabit && task.planBonus > 0) {
      setTodayPower(todayPower + 5);
      setTotalPower(totalPower + 5);
      triggerCoach('scheduled', true);
    } else {
      triggerCoach('taskAdded');
    }
  };

  // タスク開始（時間計測）
  const startTask = (id) => {
    if (activeTaskTimer) return;
    setActiveTaskTimer({ taskId: id, startedAt: Date.now() });
    triggerCoach('taskStart');
    // 着手ボーナス（取りかかるたびに加算。未完了で再挑戦しても何度でも入る）
    const t = tasks.find(x => x.id === id);
    if (t && !t.completed && !isHabitTask(t)) {
      const startBonus = Math.max(2, Math.round(DIFFICULTIES[t.difficulty].power * 0.2));
      const ti = todayISO();
      const newPartial = (t.partialDate === ti ? (t.partialPower || 0) : 0) + startBonus;
      setTodayPower(todayPower + startBonus);
      setTotalPower(totalPower + startBonus);
      setTasks(tasks.map(x => x.id === id ? { ...x, partialDone: true, partialPower: newPartial, partialDate: ti, gained: (x.gained || 0) + startBonus } : x));
    }
  };

  // クイックスタート（タスクを作って即タイマー開始）
  const quickStart = () => {
    if (!quickText.trim() || activeTaskTimer) return;
    const startBonus = Math.max(2, Math.round(DIFFICULTIES[quickDifficulty].power * 0.2));
    const task = {
      id: Date.now().toString(),
      text: quickText.trim(),
      categoryId: quickCategoryId,
      difficulty: quickDifficulty,
      completed: false,
      partialDone: true,
      partialPower: startBonus,
      partialDate: todayISO(),
      gained: startBonus,
    };
    setTasks([task, ...tasks]);
    setActiveTaskTimer({ taskId: task.id, startedAt: Date.now() });
    setTodayPower(todayPower + startBonus);
    setTotalPower(totalPower + startBonus);
    addToHistory(quickText, quickCategoryId, quickDifficulty);
    setQuickText('');
    triggerCoach('taskStart', true);
  };

  // タスク終了（時間計測ありの場合）
  const stopTaskTimer = () => {
    if (!activeTaskTimer) return;
    const t = tasks.find(x => x.id === activeTaskTimer.taskId);
    if (!t) { setActiveTaskTimer(null); return; }
    const elapsed = Math.floor((Date.now() - activeTaskTimer.startedAt) / 60000);
    if (isHabitTask(t)) {
      if (!habitDoneToday(t)) toggleHabit(t.id);
    } else {
      completeTask(activeTaskTimer.taskId, elapsed);
    }
    setActiveTaskTimer(null);
  };

  // タスクタイマーキャンセル
  const cancelTaskTimer = () => {
    if (!activeTaskTimer) return;
    if (!confirm('タイマーを取り消す？(タスクは未完了のまま)')) return;
    setActiveTaskTimer(null);
  };

  // タスク完了
  const completeTask = (id, durationMinutes = null) => {
    const t = tasks.find(x => x.id === id);
    if (!t || t.completed) return;

    const basePower = DIFFICULTIES[t.difficulty].power;
    const key = getTaskKey(t.text, t.categoryId);
    const today = getTodayStr();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    // コンボ計算
    const existing = taskCombos[key];
    let newCombo;
    if (existing && existing.lastDate === yesterday) newCombo = existing.count + 1;
    else if (existing && existing.lastDate === today) newCombo = existing.count;
    else newCombo = 1;
    const bonus = getComboBonus(newCombo);

    // 継続時間ボーナス
    const durationBonus = durationMinutes !== null ? getDurationBonus(durationMinutes) : { bonus: 0, label: null };
    
    // 過去最長時間を超えたボーナス
    const prevMaxDuration = taskMaxDurations[key] || 0;
    const longerBonus = durationMinutes !== null ? getLongerBonus(durationMinutes, prevMaxDuration) : { bonus: 0, label: null };

    // 基本ポイント = (basePower * combo倍率) + 継続ボーナス + 超過ボーナス
    const taskPower = Math.round(basePower * bonus.mult) + durationBonus.bonus + longerBonus.bonus;

    // リカバリーボーナス
    const recovery = 0; // 良いタスクと悪いタスクの差分で算出（回復ボーナス廃止）
    
    // 予約タスク実行ボーナス（予定日ちょうどに実行）
    const ti = todayISO();
    const scheduledBonus = ((t.scheduledDate && t.scheduledDate === ti) || t.scheduledFor === 'today') ? 10 : 0;
    
    // 前倒しボーナス（予定日より前に実行）
    const earlyBonus = (t.scheduledDate && t.scheduledDate > ti) ? 15 : 0;
    
    const finalPower = taskPower + recovery + scheduledBonus + earlyBonus;

    const newTodayPower = todayPower + finalPower;
    const newTotalPower = totalPower + finalPower;
    const oppPower = opponent.power;
    const wasLosing = oppPower > 0 && todayPower < oppPower;
    const nowWinning = newTodayPower >= oppPower;
    const newBestCheck = newTodayPower > bestDay.power;

    setTodayPower(newTodayPower);
    setTotalPower(newTotalPower);
    const updatedTasks = tasks.map(x => x.id === id ? {
      ...x,
      completed: true,
      comboAtCompletion: newCombo,
      powerEarned: finalPower,
      durationMinutes,
      recoveryBonus: recovery,
      scheduledBonus,
      earlyBonus,
      longerBonus: longerBonus.bonus,
      longerLabel: longerBonus.label,
      gained: (x.gained || 0) + finalPower,
    } : x);
    setTasks(updatedTasks);
    setTaskCombos({ ...taskCombos, [key]: { count: newCombo, lastDate: today } });
    
    // 過去最長時間を更新
    if (durationMinutes !== null && durationMinutes > prevMaxDuration) {
      setTaskMaxDurations({ ...taskMaxDurations, [key]: durationMinutes });
    }

    if (recovery > 0) {
      setTodayRecoveryTotal(todayRecoveryTotal + recovery);
      setDamageHealed(damageHealed + recovery);
    }

    // セリフ判定（優先度順）
    if (earlyBonus > 0) triggerCoach('earlyExecution', true);
    else if (scheduledBonus > 0) triggerCoach('scheduledDone', true);
    else if (wasLosing && nowWinning && oppPower > 0) triggerCoach('beatYesterday', true);
    else if (newBestCheck && newTodayPower > 0 && bestDay.power > 0) triggerCoach('newBest', true);
    else if (recovery > 0 && damageRemaining > 0) triggerCoach('recovery', true);
    else if (newCombo >= 10) triggerCoach('bigCombo', true);
    else if (newCombo >= 3) triggerCoach('combo', true);
    else if (durationMinutes !== null && durationMinutes >= 30) triggerCoach('longSession', true);
    else if (t.difficulty === 'large') triggerCoach('bigWin', true);
    else if (t.difficulty === 'medium') triggerCoach('mediumWin');
    else triggerCoach('smallWin');
    
    // ボーナスポップアップ判定
    const bonusItems = [];
    if (earlyBonus > 0) bonusItems.push({ label: '前倒し実行', points: earlyBonus, color: 'from-yellow-400 to-orange-500', emoji: '⚡' });
    if (scheduledBonus > 0) bonusItems.push({ label: '約束達成', points: scheduledBonus, color: 'from-cyan-400 to-blue-500', emoji: '📅' });
    if (longerBonus.bonus > 0) bonusItems.push({ label: longerBonus.label, points: longerBonus.bonus, color: 'from-purple-400 to-pink-500', emoji: '⏱️' });
    if (durationBonus.bonus > 0) bonusItems.push({ label: `継続 ${durationBonus.label}`, points: durationBonus.bonus, color: 'from-emerald-400 to-green-500', emoji: '🎯' });
    if (recovery > 0) bonusItems.push({ label: 'リカバリー', points: recovery, color: 'from-pink-400 to-rose-500', emoji: '❤️' });
    if (newCombo >= 2) {
      const comboBonusValue = Math.round(basePower * bonus.mult) - basePower;
      if (comboBonusValue > 0) bonusItems.push({ label: `${newCombo}日連続 ×${bonus.mult}`, points: comboBonusValue, color: 'from-orange-400 to-red-500', emoji: '🔥' });
    }
    if (newBestCheck && newTodayPower > 0 && bestDay.power > 0) {
      bonusItems.push({ label: '自己ベスト更新！', points: 0, color: 'from-yellow-400 via-pink-400 to-purple-500', emoji: '👑', isSpecial: true });
    }
    
    if (bonusItems.length > 0) {
      setBonusPopup({
        items: bonusItems,
        basePoints: basePower,
        totalPoints: finalPower,
        taskText: t.text,
      });
    }
  };

  // 定期的なタスクに「着手」— 未完了でも手をつけたポイントを加算
  const habitPartial = (id) => {
    const t = tasks.find(x => x.id === id);
    if (!t || !isHabitTask(t)) return;
    const today = todayISO();
    if (t.habitDoneDate === today || t.habitPartialDate === today) return;
    const partialPower = Math.max(2, Math.round(DIFFICULTIES[t.difficulty].power * 0.2));
    setTasks(tasks.map(x => x.id === id ? { ...x, habitPartialDate: today, habitPartialPower: partialPower } : x));
    triggerCoach('smallWin');
  };

  // 習慣タスクの完了 / 取り消し（毎日・毎週くり返し）
  const toggleHabit = (id) => {
    const t = tasks.find(x => x.id === id);
    if (!t || !isHabitTask(t)) return;
    const today = todayISO();
    if (t.habitDoneDate === today) {
      setTasks(tasks.map(x => x.id === id ? { ...x, habitDoneDate: null, habitPower: 0 } : x));
      return;
    }
    const basePower = DIFFICULTIES[t.difficulty].power;
    const key = getTaskKey(t.text, t.categoryId);
    const todayStr = getTodayStr();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const existing = taskCombos[key];
    let newCombo;
    if (existing && existing.lastDate === yesterday) newCombo = existing.count + 1;
    else if (existing && existing.lastDate === todayStr) newCombo = existing.count;
    else newCombo = 1;
    const cb = getComboBonus(newCombo);
    const pts = Math.round(basePower * cb.mult);
    setTasks(tasks.map(x => x.id === id ? { ...x, habitDoneDate: today, habitPower: pts, habitComboAt: newCombo } : x));
    setTaskCombos({ ...taskCombos, [key]: { count: newCombo, lastDate: todayStr } });
    if (newCombo >= 10) triggerCoach('bigCombo', true);
    else if (newCombo >= 3) triggerCoach('combo', true);
    else triggerCoach('smallWin');
    const items = [];
    if (newCombo >= 2) {
      const cv = pts - basePower;
      if (cv > 0) items.push({ label: `${newCombo}日連続 ×${cb.mult}`, points: cv, color: 'from-orange-400 to-red-500', emoji: '🔥' });
    }
    setBonusPopup({ items, basePoints: basePower, totalPoints: pts, taskText: t.text });
  };

  // 未完了で終了 — 着手ボーナスを付与し、タスクは一覧に残す（完了にはしない）
  const partialComplete = (id) => {
    const t = tasks.find(x => x.id === id);
    if (!t || t.completed) return;
    if (activeTaskTimer && activeTaskTimer.taskId === id) setActiveTaskTimer(null);
    if (t.partialDone) return;
    const partialPower = Math.max(2, Math.round(DIFFICULTIES[t.difficulty].power * 0.2));
    setTodayPower(todayPower + partialPower);
    setTotalPower(totalPower + partialPower);
    setTasks(tasks.map(x => x.id === id ? { ...x, partialDone: true, partialPower, gained: (x.gained || 0) + partialPower } : x));
    triggerCoach('smallWin');
  };

  const failTask = (id) => {
    const t = tasks.find(x => x.id === id);
    if (!t || t.completed || t.failed) return;
    if (activeTaskTimer && activeTaskTimer.taskId === id) setActiveTaskTimer(null);
    const rev = reversibleTaskPoints(t);
    if (rev !== 0) { setTodayPower(todayPower - rev); setTotalPower(totalPower - rev); }
    setTasks(tasks.map(x => x.id === id ? { ...x, failed: true, partialDone: false, planBonus: 0, gained: 0 } : x));
    setFailedCount(failedCount + 1);
    const key = getTaskKey(t.text, t.categoryId);
    if (taskCombos[key]) {
      const newCombos = { ...taskCombos };
      delete newCombos[key];
      setTaskCombos(newCombos);
    }
    triggerCoach('failed', true);
  };

  const deleteTask = (id) => {
    if (activeTaskTimer && activeTaskTimer.taskId === id) setActiveTaskTimer(null);
    const t = tasks.find(x => x.id === id);
    if (t) {
      const rev = reversibleTaskPoints(t);
      if (rev !== 0) { setTodayPower(todayPower - rev); setTotalPower(totalPower - rev); }
    }
    setTasks(tasks.filter(x => x.id !== id));
  };

  const uncompleteTask = (id) => {
    const t = tasks.find(x => x.id === id);
    if (!t || !t.completed) return;
    if (!confirm('このタスクを未完了に戻す？獲得ポイントも取り消されます')) return;
    const rev = reversibleTaskPoints(t);
    setTodayPower(todayPower - rev);
    setTotalPower(totalPower - rev);
    setTasks(tasks.map(x => x.id === id ? { id: x.id, text: x.text, categoryId: x.categoryId, difficulty: x.difficulty, completed: false } : x));
  };

  // 「未完了」ボタン — 完了を解除してタスクを一覧に残す（予定日・くり返し等は維持）
  const markTaskIncomplete = (id) => {
    const ti = todayISO();
    setTasks(tasks.map(x => {
      if (x.id !== id || !x.completed) return x;
      const keep = (x.partialDate === ti ? (x.partialPower || 0) : 0) + (x.planBonus || 0);
      return { ...x, completed: false, powerEarned: 0, completedDuration: undefined, gained: keep };
    }));
  };

  const deleteCompletedTask = (id) => {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    if (!confirm('この完了タスクを削除？獲得ポイントも取り消されます')) return;
    const rev = reversibleTaskPoints(t);
    setTodayPower(todayPower - rev);
    setTotalPower(totalPower - rev);
    setTasks(tasks.filter(x => x.id !== id));
  };

  const doInstall = async () => {
    if (installPrompt) {
      try { installPrompt.prompt(); await installPrompt.userChoice; } catch (e) {}
      setInstallPrompt(null);
    } else {
      alert('このブラウザでは、メニューから「ホーム画面に追加」または「アプリをインストール」を選んでください。\n\niPhone: Safariの共有ボタン →「ホーム画面に追加」\nAndroid: Chromeのメニュー(\u22ee) →「アプリをインストール」');
    }
  };

  const resetToday = () => {
    if (!confirm('今日の記録をリセットしますか？\n今日のタスク・記録・今日の自分のポイントがすべて消えます（累計・過去の履歴は残ります）')) return;
    setTotalPower(Math.max(0, totalPower - todayPower));
    setTodayPower(0);
    setTasks([]);
    setWakeTime(null);
    setSleepTime(null);
    setFailedCount(0);
    setTodayDamages([]);
    setTodayDamageTotal(0);
    setTodayRecoveryTotal(0);
    setDamageHealed(0);
    setActiveTaskTimer(null);
    setActiveBadTask(null);
    setShowSettings(false);
  };

  const saveEditDone = () => {
    if (!editDoneText.trim()) { setEditingDoneId(null); return; }
    setTasks(tasks.map(x => x.id === editingDoneId ? { ...x, text: editDoneText.trim() } : x));
    setEditingDoneId(null);
  };

  const deleteDamage = (index) => {
    const d = todayDamages[index];
    if (!d) return;
    if (!confirm('この記録を削除？マイナス分も取り消されます')) return;
    const dmg = d.damage || 0;
    setTodayPower(todayPower + dmg);
    setTotalPower(totalPower + dmg);
    setTodayDamageTotal(Math.max(0, todayDamageTotal - dmg));
    setTodayDamages(todayDamages.filter((_, i) => i !== index));
  };

  const recordWakeUp = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    const actualMin = now.getHours() * 60 + now.getMinutes();
    const targetMin = timeStrToMinutes(sleepGoal.wakeup);
    const { power, label } = getScheduleScore(actualMin, targetMin);
    const prevPower = wakeTime ? (wakeTime.power || 0) : 0;
    setWakeTime({ time: timeStr, power, label, target: sleepGoal.wakeup });
    setTodayPower(todayPower - prevPower + power);
    setTotalPower(totalPower - prevPower + power);
    if (power >= 15) triggerCoach('wakeUpEarly', true);
    else if (power >= 5) triggerCoach('wakeUp', true);
    else triggerCoach('wakeUpLate', true);
  };

  const recordSleep = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    const actualMin = now.getHours() * 60 + now.getMinutes();
    const targetMin = timeStrToMinutes(sleepGoal.bedtime);
    const { power, label } = getScheduleScore(actualMin, targetMin);
    const prevPower = sleepTime ? (sleepTime.power || 0) : 0;
    setSleepTime({ time: timeStr, power, label, target: sleepGoal.bedtime });
    setTodayPower(todayPower - prevPower + power);
    setTotalPower(totalPower - prevPower + power);
    if (power >= 15) triggerCoach('sleepEarly', true);
    else if (power >= 5) triggerCoach('sleep', true);
    else triggerCoach('sleepLate', true);
  };

  const resetWakeUp = () => {
    if (!wakeTime) return;
    const p = wakeTime.power || 0;
    if (!confirm(`起床記録を取り消す？(-${p} POWER)`)) return;
    setWakeTime(null);
    setTodayPower(todayPower - p);
    setTotalPower(totalPower - p);
  };
  const resetSleep = () => {
    if (!sleepTime) return;
    const p = sleepTime.power || 0;
    if (!confirm(`就寝記録を取り消す？(-${p} POWER)`)) return;
    setSleepTime(null);
    setTodayPower(todayPower - p);
    setTotalPower(totalPower - p);
  };

  // ダメタスク選択 → まず「代わりの良いタスク」ポップアップを表示
  const startBadTask = (categoryId) => {
    if (activeBadTask) return;
    setRedirectPopup({ mode: 'category', categoryId });
  };

  // ダメタスク新規入力モード → 代替提案ポップアップ
  const startBadTaskCustom = (text) => {
    if (activeBadTask) return;
    setRedirectPopup({ mode: 'custom', customText: typeof text === 'string' ? text : '' });
  };

  // 過去履歴から → 代替提案ポップアップ
  const startBadTaskFromHistory = (h) => {
    if (activeBadTask) return;
    setRedirectPopup({ mode: 'history', historyItem: h });
  };

  // 代替提案ポップアップで「やっぱり悪いタスクを記録する」を選んだ時
  const proceedToBadTask = () => {
    if (!redirectPopup) return;
    const rp = redirectPopup;
    setRedirectPopup(null);
    setBadCustomMinutes('');
    if (rp.mode === 'category') {
      setBadStartDialog({ categoryId: rp.categoryId, customMode: false });
    } else if (rp.mode === 'history') {
      setBadStartDialog({ categoryId: null, customMode: true, customLabel: rp.historyItem.label, customEmoji: rp.historyItem.emoji });
    } else {
      setBadStartDialog({ categoryId: null, customMode: true, customLabel: rp.customText || '', customEmoji: '📱' });
    }
  };

  // 代替提案ポップアップから良いタスクをワンクリック開始
  const startGoodFromRedirect = (text, categoryId) => {
    if (activeTaskTimer) { setRedirectPopup(null); return; }
    const startBonus = Math.max(2, Math.round(DIFFICULTIES['medium'].power * 0.2));
    const task = {
      id: Date.now().toString(),
      text: text.trim(),
      categoryId: categoryId || (categories[0] && categories[0].id) || 'life',
      difficulty: 'medium',
      completed: false,
      partialDone: true,
      partialPower: startBonus,
      partialDate: todayISO(),
      gained: startBonus,
    };
    setTasks([task, ...tasks]);
    setActiveTaskTimer({ taskId: task.id, startedAt: Date.now() });
    setTodayPower(todayPower + startBonus);
    setTotalPower(totalPower + startBonus);
    addToHistory(text, task.categoryId, 'medium');
    setRedirectPopup(null);
    triggerCoach('taskStart', true);
  };

  // ダメタスク本当に開始（制限時間設定後）
  const confirmStartBadTask = (limitMinutes) => {
    if (!badStartDialog || !limitMinutes || limitMinutes < 1) return;
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    } catch (e) {}
    
    let taskInfo;
    if (badStartDialog.customMode) {
      // カスタム入力の場合
      const label = (badStartDialog.customLabel || '').trim();
      if (!label) return;
      
      taskInfo = {
        categoryId: null,
        customLabel: label,
        customEmoji: badStartDialog.customEmoji || '⚠️',
      };
      
      // 履歴に追加（重複なし、最新を先頭に、最大30件）
      const filtered = badHistory.filter(h => h.label.toLowerCase() !== label.toLowerCase());
      setBadHistory([{ label, emoji: badStartDialog.customEmoji, usedAt: Date.now() }, ...filtered].slice(0, 30));
    } else {
      taskInfo = { categoryId: badStartDialog.categoryId };
    }
    
    setActiveBadTask({ 
      ...taskInfo,
      startedAt: Date.now(),
      limitMinutes,
    });
    setBadStartDialog(null);
    triggerCoach('badStart', true);
  };

  const stopBadTask = () => {
    if (!activeBadTask) return;
    const elapsed = Math.floor((Date.now() - activeBadTask.startedAt) / 60000);
    const { damage } = getDamage(elapsed);
    const limitMin = activeBadTask.limitMinutes || 0;
    const overMin = limitMin > 0 ? Math.max(0, elapsed - limitMin) : 0;
    const { penalty: overPenalty, label: overLabel } = getOverPenalty(overMin);
    // 宣言時間より早く切り上げた場合はダメージを50%軽減（踏みとどまった報酬）
    const endedEarly = limitMin > 0 && elapsed < limitMin;
    const earlyReduction = endedEarly ? Math.round(damage * 0.5) : 0;
    const totalDamage = Math.max(0, damage + overPenalty - earlyReduction);
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    const disp = getBadDisplay(activeBadTask);
    setTodayDamages([{ 
      categoryId: activeBadTask.categoryId, 
      customLabel: activeBadTask.customLabel,
      customEmoji: activeBadTask.customEmoji,
      minutes: elapsed, 
      damage: totalDamage, 
      time: timeStr,
      limitMinutes: limitMin,
      overMinutes: overMin,
      overPenalty,
      earlyReduction,
    }, ...todayDamages]);
    setTodayDamageTotal(todayDamageTotal + totalDamage);
    setTodayPower(todayPower - totalDamage);
    setTotalPower(totalPower - totalDamage);
    setActiveBadTask(null);
    
    // 結果ポップアップ（良いタスクのボーナス演出と同じ形式）
    setBadResultPopup({
      label: disp.label,
      emoji: disp.emoji,
      minutes: elapsed,
      baseDamage: damage,
      overPenalty,
      earlyReduction,
      totalDamage,
      endedEarly,
    });
    
    if (overMin > 0) triggerCoach('badLong', true);
    else if (elapsed <= 5) triggerCoach('badShort');
    else if (elapsed <= 30) triggerCoach('badMedium', true);
    else triggerCoach('badLong', true);
  };

  const cancelBadTask = () => {
    if (!activeBadTask) return;
    if (!confirm('記録せずに取り消す？')) return;
    setActiveBadTask(null);
  };

  const openCategoryEditor = (cat = null) => {
    if (cat) {
      setEditingCat(cat.id);
      setCatForm({ label: cat.label, emoji: cat.emoji, color: cat.color });
    } else {
      setEditingCat('new');
      setCatForm({ label: '', emoji: '🎯', color: COLOR_OPTIONS[0].value });
    }
  };
  const saveCategory = () => {
    if (!catForm.label.trim()) return;
    if (editingCat === 'new') {
      setCategories([...categories, { id: 'cat_' + Date.now(), label: catForm.label.trim(), emoji: catForm.emoji, color: catForm.color }]);
    } else {
      setCategories(categories.map(c => c.id === editingCat ? { ...c, label: catForm.label.trim(), emoji: catForm.emoji, color: catForm.color } : c));
    }
    setEditingCat(null);
  };
  const deleteCategory = (id) => {
    if (categories.length <= 1) return;
    if (tasks.some(t => t.categoryId === id && !t.completed)) {
      if (!confirm('このカテゴリに未完了タスクがあります。削除しますか？')) return;
    }
    setCategories(categories.filter(c => c.id !== id));
    setTasks(tasks.filter(t => t.categoryId !== id));
  };

  const openBadCategoryEditor = (cat = null) => {
    if (cat) {
      setEditingBadCat(cat.id);
      setBadCatForm({ label: cat.label, emoji: cat.emoji });
    } else {
      setEditingBadCat('new');
      setBadCatForm({ label: '', emoji: '📱' });
    }
  };
  const saveBadCategory = () => {
    if (!badCatForm.label.trim()) return;
    if (editingBadCat === 'new') {
      setBadCategories([...badCategories, { id: 'bad_' + Date.now(), label: badCatForm.label.trim(), emoji: badCatForm.emoji }]);
    } else {
      setBadCategories(badCategories.map(c => c.id === editingBadCat ? { ...c, label: badCatForm.label.trim(), emoji: badCatForm.emoji } : c));
    }
    setEditingBadCat(null);
  };
  const deleteBadCategory = (id) => setBadCategories(badCategories.filter(c => c.id !== id));

  const _ti = todayISO();
  // 予定日（未設定は今日扱い）で昇順 = 日付が近い順
  const _byDate = (a, b) => {
    const da = a.scheduledDate || _ti;
    const db = b.scheduledDate || _ti;
    return da < db ? -1 : da > db ? 1 : 0;
  };
  const habitTasks = tasks.filter(t => isHabitTask(t));
  // 予定タスク: 完了・未完了の両方を表示（このセクション内に残す）
  const futureTasks = tasks.filter(t => !isHabitTask(t) && !t.failed && t.scheduledDate).sort(_byDate);
  const activeTasks = tasks.filter(t => !isHabitTask(t) && !t.completed && !t.failed && !t.scheduledDate).sort(_byDate);
  const completedTasks = tasks.filter(t => !isHabitTask(t) && t.completed && !t.scheduledDate);
  const failedTasks = tasks.filter(t => !isHabitTask(t) && t.failed);

  // 今日の戦闘時間（タイマー計測したタスクの合計）と敗北時間（ダメタスク合計）
  const battleMinutes = completedTasks.reduce((sum, t) => sum + (t.durationMinutes || 0), 0)
    + (activeTaskTimer ? currentTaskTimer : 0);
  const defeatMinutes = todayDamages.reduce((sum, d) => sum + (d.minutes || 0), 0)
    + (activeBadTask ? currentBadTimer : 0);
  const totalTrackedMinutes = battleMinutes + defeatMinutes;
  const battleRatio = totalTrackedMinutes > 0 ? (battleMinutes / totalTrackedMinutes) * 100 : 0;
  const defeatRatio = totalTrackedMinutes > 0 ? (defeatMinutes / totalTrackedMinutes) * 100 : 0;

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-black text-white"><div className="text-xl animate-pulse">LOADING...</div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-zinc-900 to-slate-950 text-white pb-24">
      {/* LINE風アプリ内通知バナー */}
      {appNotice && (
        <div className="fixed top-0 left-0 right-0 z-[80] flex justify-center px-3 pt-3 pointer-events-none">
          <style>{`@keyframes svsSlideDown{from{transform:translateY(-130%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
          <div
            onClick={() => setAppNotice(null)}
            style={{ animation: 'svsSlideDown 0.32s ease-out' }}
            className="pointer-events-auto w-full max-w-md bg-white text-zinc-900 rounded-2xl shadow-2xl ring-1 ring-black/10 overflow-hidden cursor-pointer"
          >
            <div className="flex items-start gap-2.5 p-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center text-lg flex-shrink-0">⚔️</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black text-zinc-500 tracking-wide">SELF vs SELF</span>
                  <span className="text-[10px] text-zinc-400">今</span>
                </div>
                <div className="font-black text-sm text-zinc-900 leading-tight mt-0.5 break-words">{appNotice.title}</div>
                <div className="text-xs text-zinc-600 leading-snug mt-0.5 break-words">{appNotice.body}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-500 tracking-widest">VS 過去の自分</div>
            <div className="text-lg font-black tracking-tight">
              <span className="text-red-500">今週 {weeklyPoints}pt</span>
              <span className="text-zinc-600 text-sm ml-2">累計 {totalPower}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowHistory(true)} className="p-2 text-zinc-400 hover:text-white"><Trophy className="w-5 h-5" /></button>
            <button onClick={() => setShowSettings(true)} className="p-2 text-zinc-400 hover:text-white"><Settings className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4">
        {/* コーチ */}
        <div className={`mb-4 rounded-2xl border-2 ${coachIntense ? 'border-red-500 animate-pulse' : 'border-zinc-700'} bg-gradient-to-br from-zinc-900 to-black p-4`}>
          <div className="flex gap-3 items-start">
            <div className="text-4xl flex-shrink-0">{coachStyle === 'positive' ? (coachIntense ? '🤩' : '😊') : (coachIntense ? '😤' : '👨🏿‍🦲')}</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-red-500 font-bold tracking-wider mb-1">COACH / コーチ</div>
              <div className={`font-bold leading-tight ${coachIntense ? 'text-red-300 text-lg' : 'text-zinc-200'}`}>「{coachQuote}」</div>
            </div>
          </div>
        </div>

        {/* 自己ベスト / 昨日の自分 / 今日の自分 の比較 */}
        <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3">
          {(() => {
            const cmpMax = Math.max(bestDay.power, yesterdayPower, todayPower, 1);
            const diff = todayPower - yesterdayPower;
            return (
              <>
                <div className="flex gap-2 mb-3">
                  <div className="flex-1 rounded-xl border border-yellow-700/60 bg-yellow-950/30 py-2 text-center">
                    <div className="text-[10px] text-yellow-400 font-bold">👑 自己ベスト</div>
                    <div className="text-2xl font-black font-mono text-yellow-400">{bestDay.power}</div>
                  </div>
                  <div className="flex-1 rounded-xl border border-orange-700/60 bg-orange-950/30 py-2 text-center">
                    <div className="text-[10px] text-orange-400 font-bold">💀 昨日の自分</div>
                    <div className="text-2xl font-black font-mono text-orange-400">{yesterdayPower}</div>
                  </div>
                  <div className="flex-1 rounded-xl border border-green-700/60 bg-green-950/30 py-2 text-center">
                    <div className="text-[10px] text-green-400 font-bold">⚡ 今日の自分</div>
                    <div className="text-2xl font-black font-mono text-green-400">{todayPower}</div>
                  </div>
                </div>
                <div className="flex justify-between text-[11px] mb-1"><span className="text-green-400">今日の自分</span><span className="text-green-400 font-mono">{todayPower}</span></div>
                <div className="h-3 bg-black rounded-full overflow-hidden mb-2"><div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${(todayPower / cmpMax) * 100}%` }} /></div>
                <div className="flex justify-between text-[11px] mb-1"><span className="text-orange-400">昨日の自分</span><span className="text-orange-400 font-mono">{yesterdayPower}</span></div>
                <div className="h-3 bg-black rounded-full overflow-hidden"><div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${(yesterdayPower / cmpMax) * 100}%` }} /></div>
                <div className={`mt-3 rounded-xl border py-2 text-center text-sm font-bold ${diff >= 0 ? 'border-green-700 bg-green-950/40 text-green-400' : 'border-amber-700 bg-amber-950/40 text-amber-300'}`}>
                  {yesterdayPower === 0
                    ? '初日 — 基準を作れ'
                    : diff < 0
                      ? `昨日の自分まで あと ${Math.abs(diff)} ポイント`
                      : bestDay.power - todayPower > 0
                        ? `自己ベストまで あと ${bestDay.power - todayPower} ポイント`
                        : '自己ベスト更新中 — この調子だ'}
                </div>
              </>
            );
          })()}
        </div>

        {/* 今日のバランス（プラス / マイナス） */}
        <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          {(() => {
            const evts = buildTodayEvents();
            const plusTotal = evts.filter(e => e.points > 0).reduce((s, e) => s + e.points, 0);
            const minusTotal = evts.filter(e => e.points < 0).reduce((s, e) => s - e.points, 0);
            const sum = plusTotal + minusTotal;
            const plusPct = sum > 0 ? (plusTotal / sum) * 100 : 50;
            return (
              <>
                <div className="text-xs text-zinc-500 font-bold tracking-wider mb-2">今日のバランス（どちらが優勢か）</div>
                {sum === 0 ? (
                  <div className="text-center py-3 text-zinc-600 text-xs">タスクや記録をするとバランスが表示される</div>
                ) : (
                  <>
                    <div className="flex h-7 rounded-lg overflow-hidden">
                      {plusTotal > 0 && <div className="bg-green-600 flex items-center justify-center text-white text-xs font-black" style={{ width: `${plusPct}%` }}>PLUS +{plusTotal}</div>}
                      {minusTotal > 0 && <div className="bg-red-600 flex items-center justify-center text-white text-xs font-black" style={{ width: `${100 - plusPct}%` }}>−{minusTotal}</div>}
                    </div>
                    <div className="text-xs mt-1.5">
                      {plusTotal >= minusTotal                        ? <span className="text-green-400 font-bold">プラス優勢 — 差 +{plusTotal - minusTotal}</span>
                        : <span className="text-red-400 font-bold">マイナス優勢 — 差 −{minusTotal - plusTotal}</span>}
                    </div>
                    <div className="mt-2 border-t border-zinc-800 pt-2 space-y-0.5">
                      {(() => {
                        const plus = evts.filter(e => e.points >= 0);
                        const minus = evts.filter(e => e.points < 0);
                        const rows = Math.max(plus.length, minus.length);
                        return Array.from({ length: rows }).map((_, i) => (
                          <div key={i} className="flex justify-between items-center text-xs gap-3">
                            <span className="text-zinc-300 truncate min-w-0">
                              {plus[i] && <><span className="text-green-400">●</span> {plus[i].label} <span className="text-green-400 font-mono">+{plus[i].points}</span></>}
                            </span>
                            <span className="text-red-400 truncate min-w-0 text-right">
                              {minus[i] && <>{minus[i].label} <span className="font-mono">−{Math.abs(minus[i].points)}</span> <span>●</span></>}
                            </span>
                          </div>
                        ));
                      })()}
                    </div>
                  </>
                )}
              </>
            );
          })()}
        </div>

        {/* タスク追加 */}
        <div className="mb-6 rounded-2xl border-2 border-blue-600 bg-gradient-to-br from-blue-950/40 to-zinc-950/30 overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2.5 flex items-center gap-2">
            <span className="text-base">📅</span>
            <span className="text-sm text-white font-black tracking-wider">スケジュール作成</span>
          </div>
          <div className="p-4">
            <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} placeholder="ENTER TASK..." className="w-full bg-black border border-zinc-800 px-3 py-2.5 mb-2 focus:border-white focus:outline-none placeholder-zinc-700 tracking-wider uppercase text-sm" />
            
            {taskHistory.length > 0 && (() => {
              const filtered = newTask.trim()
                ? taskHistory.filter(h => h.text.toLowerCase().includes(newTask.trim().toLowerCase()) && h.text.toLowerCase() !== newTask.trim().toLowerCase())
                : taskHistory;
              if (filtered.length === 0) return null;
              return (
                <div className="mb-3 flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {filtered.slice(0, 8).map((h, i) => {
                    const cat = getCategory(h.categoryId);
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setNewTask(h.text);
                          setNewCategoryId(h.categoryId);
                          setNewDifficulty(h.difficulty);
                        }}
                        className="px-2 py-1 border border-zinc-800 hover:border-zinc-600 bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-400 hover:text-white transition flex items-center gap-1 tracking-wider"
                      >
                        <span className="text-zinc-600">↻</span>
                        <span className="truncate max-w-[120px]">{h.text}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })()}
            
            <div className="flex flex-wrap gap-1.5 mb-3">
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setNewCategoryId(cat.id)} className={`px-3 py-2 rounded-lg text-sm font-bold transition border-2 ${newCategoryId === cat.id ? `bg-gradient-to-r ${cat.color} text-white border-transparent shadow-lg scale-105` : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-zinc-500'}`}>
                  {cat.emoji} {cat.label}
                </button>
              ))}
              <button onClick={() => { setShowSettings(true); openCategoryEditor(); }} className="px-3 py-2 rounded-lg text-zinc-500 border-2 border-dashed border-zinc-700 hover:text-white hover:border-zinc-500">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-1.5 mb-3">
              {Object.entries(DIFFICULTIES).map(([k, v]) => (
                <button key={k} onClick={() => setNewDifficulty(k)} className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition ${newDifficulty === k ? v.color + ' scale-105 shadow-md' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                  {v.label} +{v.power}
                </button>
              ))}
            </div>
            {newRepeat === 'none' && (
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <button onClick={() => setNewScheduledDate('')} className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold border-2 transition ${!newScheduledDate ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-transparent shadow-md scale-105' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500'}`}>
                今日
              </button>
              <button onClick={() => setNewScheduledDate((prev) => prev || dateAfter(1))} className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold border-2 transition ${newScheduledDate ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-transparent shadow-md scale-105' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500'}`}>
                日付を指定
              </button>
              {newScheduledDate && (
                <input
                  type="date"
                  value={newScheduledDate}
                  min={dateAfter(1)}
                  onChange={e => setNewScheduledDate(e.target.value)}
                  className="bg-zinc-800 border-2 border-zinc-700 rounded-lg px-2 py-1 text-[11px] text-white focus:border-cyan-600 outline-none"
                />
              )}
            </div>
            )}
            {/* 繰り返し（定期的なタスク） */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className="text-[10px] text-zinc-500 font-bold mr-0.5">🔁 繰り返し</span>
              {REPEAT_OPTIONS.map(([val, label]) => (
                <button key={val} onClick={() => setNewRepeat(val)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border-2 transition ${newRepeat === val ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent shadow-md scale-105' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500'}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => addTask(newScheduledDate)} disabled={!newTask.trim()} className={`flex-1 text-white font-black tracking-wider py-3 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-95 shadow-md flex items-center justify-center gap-1.5 ${newRepeat !== 'none' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500' : (newScheduledDate && newScheduledDate > todayISO() ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500' : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500')}`}>
                {newRepeat !== 'none' ? (
                  <>🔁 定期的なタスクを追加（{newRepeat === 'daily' ? '毎日' : '毎週'}）</>
                ) : newScheduledDate && newScheduledDate > todayISO() ? (
                  <><CalendarPlus className="w-4 h-4" />{formatSchedDate(newScheduledDate)}に予定を追加 （計画+5）</>
                ) : (
                  <>➕ 今日のタスクを追加</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* タスクリスト */}
        <div className="space-y-2 mb-8">
          {activeTasks.length === 0 && completedTasks.length === 0 && failedTasks.length === 0 && (
            <div className="border border-dashed border-zinc-800 p-8 text-center">
              <div className="text-zinc-600 text-[10px] tracking-[0.3em] uppercase font-black">No Tasks Queued</div>
              <div className="text-zinc-700 text-[9px] tracking-wider uppercase mt-1">Define Your Mission</div>
            </div>
          )}
          {/* 予定タスク（日付指定） */}
          {futureTasks.length > 0 && (
            <div className="mb-2">
              <div className="text-xs text-cyan-300 tracking-[0.2em] mb-2 font-black uppercase flex items-center gap-1.5 px-1">
                <CalendarPlus className="w-3.5 h-3.5" />
                予定タスク ({futureTasks.length})
                <span className="text-yellow-400 text-[10px] ml-auto">⚡ 今やると+15ボーナス</span>
              </div>
              {Object.entries(futureTasks.reduce((g, t) => { (g[t.scheduledDate] = g[t.scheduledDate] || []).push(t); return g; }, {}))
                .sort((a, b) => (a[0] < b[0] ? -1 : 1))
                .map(([dateStr, dayTasks]) => (
                  <div key={dateStr} className="mb-2">
                    <div className="text-[10px] text-cyan-400 font-black tracking-wider mb-1 px-1 uppercase">📅 {formatSchedDate(dateStr)} の予定</div>
                    {dayTasks.map(task => {
                      const cat = getCategory(task.categoryId);
                      const diff = DIFFICULTIES[task.difficulty];
                      const fDone = task.completed;
                      return (
                        <div key={task.id} className={`rounded-xl p-3 flex items-center gap-2 mb-2 border-2 ${fDone ? 'bg-zinc-900/60 border-zinc-800' : 'bg-gradient-to-br from-blue-900/40 to-cyan-900/30 border-blue-600/60'}`}>
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            <button onClick={() => completeTask(task.id)} className={`px-2.5 py-1.5 rounded-md border text-[10px] font-black tracking-wider transition active:scale-90 whitespace-nowrap ${fDone ? 'border-cyan-400 bg-cyan-600 text-white' : 'border-cyan-600 text-cyan-300 hover:bg-cyan-600/20'}`} title="完了（前倒しボーナス+15）">完了</button>
                            <button onClick={() => markTaskIncomplete(task.id)} className={`px-2.5 py-1.5 rounded-md border text-[10px] font-black tracking-wider transition active:scale-90 whitespace-nowrap ${!fDone ? 'border-zinc-500 bg-zinc-700 text-white' : 'border-zinc-700 text-zinc-400 hover:bg-zinc-700/40'}`} title="未完了で終了（一覧に継続）">未完了で終了</button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-bold break-words tracking-wide ${fDone ? 'text-zinc-500 line-through' : 'text-cyan-50'}`}>{task.text}</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded bg-gradient-to-r ${cat.color} text-white font-bold`}>{cat.emoji} {cat.label}</span>
                              {fDone
                                ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-700 text-white font-black tracking-wider">✓ 完了 +{task.powerEarned || 0}</span>
                                : <span className="text-[9px] px-1.5 py-0.5 rounded border border-cyan-600 text-cyan-200 font-black tracking-wider">予定日: +{diff.power}</span>}
                              {task.partialDate === _ti && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-900/50 border border-amber-700 text-amber-300 font-bold">着手 +{task.partialPower}</span>}
                              {!fDone && task.scheduledDate > _ti && <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500 text-black font-black tracking-wider">⚡ 今やる +15</span>}
                            </div>
                          </div>
                          {!activeTaskTimer && !fDone && (
                            <button onClick={() => startTask(task.id)} className="w-9 h-9 rounded-lg border border-cyan-700 hover:border-cyan-400 hover:bg-cyan-500/10 flex items-center justify-center transition active:scale-90 flex-shrink-0" title="タイマー開始">
                              <Play className="w-3.5 h-3.5 text-cyan-300" />
                            </button>
                          )}
                          <button onClick={() => deleteTask(task.id)} className="p-1 text-cyan-700 hover:text-red-400 flex-shrink-0" title="削除">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}
            </div>
          )}

          {/* 最新のタスク */}
          {activeTasks.length > 0 && (
            <div className="mb-2">
              <div className="text-xs text-zinc-300 tracking-[0.2em] mb-2 font-black uppercase flex items-center gap-1.5 px-1">
                📋 最新のタスク ({activeTasks.length})
              </div>
          {activeTasks.map(task => {
            const cat = getCategory(task.categoryId);
            const diff = DIFFICULTIES[task.difficulty];
            const key = getTaskKey(task.text, task.categoryId);
            const currentCombo = taskCombos[key]?.count || 0;
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            const nextCombo = taskCombos[key]?.lastDate === yesterday ? currentCombo + 1 : (taskCombos[key]?.lastDate === getTodayStr() ? currentCombo : 1);
            const bonus = getComboBonus(nextCombo);
            const isSchedToday = task.scheduledFor === 'today' || task.scheduledDate === _ti;
            const projectedPower = Math.round(diff.power * bonus.mult) + (isSchedToday ? 10 : 0);
            const isTiming = activeTaskTimer?.taskId === task.id;
            const isScheduled = isSchedToday;
            return (
              <div key={task.id} className={`bg-zinc-950 border ${isTiming ? 'border-white' : isScheduled ? 'border-cyan-700' : 'border-zinc-800'} rounded-xl p-3 flex items-center gap-2`}>
                <button onClick={() => completeTask(task.id)} disabled={isTiming} className="w-9 h-9 rounded-lg border-2 border-zinc-700 hover:border-white hover:bg-white/5 flex items-center justify-center transition active:scale-90 flex-shrink-0 disabled:opacity-30" title="完了">
                  <Check className="w-4 h-4 text-zinc-600" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white break-words tracking-wide">{task.text}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {isScheduled && <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-700 text-white font-black tracking-wider uppercase">📅 予約済み</span>}
                    {task.repeat && task.repeat !== 'none' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-700 text-white font-black tracking-wider">{repeatLabel(task.repeat)}</span>}
                    <span className={`text-[9px] px-1.5 py-0.5 rounded bg-gradient-to-r ${cat.color} text-white font-bold`}>{cat.emoji} {cat.label}</span>
                    {task.partialDate === _ti && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-900/50 border border-amber-700 text-amber-300 font-bold">着手 +{task.partialPower}</span>}
                    <span className="text-[9px] px-1.5 py-0.5 rounded border border-zinc-700 text-zinc-400 font-black tracking-wider">+{projectedPower}</span>
                    {bonus.label && <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-900/40 border border-orange-700 text-orange-300 font-bold">{bonus.label} x{bonus.mult}</span>}
                    {isScheduled && <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-900/50 text-cyan-300 font-black tracking-wider">+10 実行</span>}
                    {taskMaxDurations[key] > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-900/40 border border-purple-700 text-purple-300 font-bold">⏱️ ベスト{formatDuration(taskMaxDurations[key])} 超で +ボーナス</span>
                    )}
                  </div>
                </div>
                {!isTiming && !activeTaskTimer && (
                  <button onClick={() => startTask(task.id)} className="w-9 h-9 rounded-lg border border-zinc-700 hover:border-white hover:bg-white/5 flex items-center justify-center transition active:scale-90 flex-shrink-0" title="タイマー開始">
                    <Play className="w-3.5 h-3.5 text-white" />
                  </button>
                )}
                <button onClick={() => failTask(task.id)} className="w-9 h-9 rounded-lg border border-zinc-800 hover:border-red-600 hover:bg-red-600/10 flex items-center justify-center transition active:scale-90 flex-shrink-0" title="敗北として記録">
                  <XCircle className="w-3.5 h-3.5 text-zinc-600" />
                </button>
                <button onClick={() => deleteTask(task.id)} className="p-1 text-zinc-700 hover:text-zinc-400 flex-shrink-0" title="削除">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
            </div>
          )}

          {/* 定期的なタスク（毎日・毎週くり返し） */}
          {habitTasks.length > 0 && (
            <div className="mb-2">
              <div className="text-xs text-purple-300 tracking-[0.2em] mb-2 font-black uppercase flex items-center gap-1.5 px-1">
                🔁 定期的なタスク ({habitTasks.length})
              </div>
              {habitTasks.map(task => {
                const cat = getCategory(task.categoryId);
                const diff = DIFFICULTIES[task.difficulty];
                const doneToday = habitDoneToday(task);
                const due = habitDue(task);
                const partialToday = task.habitPartialDate === todayISO();
                return (
                  <div key={task.id} className={`rounded-xl p-3 flex items-center gap-2 mb-2 border-2 ${doneToday ? 'bg-zinc-900/60 border-zinc-800' : 'bg-gradient-to-br from-purple-900/40 to-pink-900/20 border-purple-600/60'}`}>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button onClick={() => { if (!habitDoneToday(task)) toggleHabit(task.id); }} className={`px-2.5 py-1.5 rounded-md border text-[10px] font-black tracking-wider transition active:scale-90 whitespace-nowrap ${doneToday ? 'border-purple-400 bg-purple-600 text-white' : 'border-purple-500 text-purple-200 hover:bg-purple-500/20'}`} title="完了にする">完了</button>
                      <button onClick={() => { if (habitDoneToday(task)) toggleHabit(task.id); }} className={`px-2.5 py-1.5 rounded-md border text-[10px] font-black tracking-wider transition active:scale-90 whitespace-nowrap ${!doneToday ? 'border-zinc-500 bg-zinc-700 text-white' : 'border-zinc-700 text-zinc-400 hover:bg-zinc-700/40'}`} title="未完了で終了（一覧に継続）">未完了で終了</button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold break-words tracking-wide ${doneToday ? 'text-zinc-500 line-through' : 'text-purple-50'}`}>{task.text}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-700 text-white font-black tracking-wider">{repeatLabel(task.repeat)}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded bg-gradient-to-r ${cat.color} text-white font-bold`}>{cat.emoji} {cat.label}</span>
                        {doneToday
                          ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-600 text-white font-black tracking-wider">✓ 完了 +{task.habitPower || 0}</span>
                          : due
                            ? <span className="text-[9px] px-1.5 py-0.5 rounded border border-purple-500 text-purple-200 font-black tracking-wider">今日やる +{diff.power}</span>
                            : <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 font-bold tracking-wider">今週は完了済み</span>}
                        {partialToday && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-900/50 border border-amber-700 text-amber-300 font-bold">着手 +{task.habitPartialPower || 0}</span>}
                      </div>
                    </div>
                    {!activeTaskTimer && !doneToday && (
                      <button onClick={() => startTask(task.id)} className="w-9 h-9 rounded-lg border border-purple-700 hover:border-purple-400 hover:bg-purple-500/10 flex items-center justify-center transition active:scale-90 flex-shrink-0" title="タイマー開始">
                        <Play className="w-3.5 h-3.5 text-purple-300" />
                      </button>
                    )}
                    <button onClick={() => deleteTask(task.id)} className="p-1 text-zinc-600 hover:text-red-400 flex-shrink-0" title="削除">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {failedTasks.length > 0 && (
            <div className="pt-3 mt-3 border-t border-red-900/40">
              <div className="text-[10px] text-red-500 tracking-[0.3em] mb-2 font-black uppercase">⚠ Defeated ({failedTasks.length})</div>
              {failedTasks.map(task => {
                const cat = getCategory(task.categoryId);
                return (
                  <div key={task.id} className="bg-zinc-950 border border-red-900/60 p-3 flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 border-2 border-red-700 flex items-center justify-center flex-shrink-0">
                      <XCircle className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-zinc-400 break-words tracking-wide">{task.text}</div>
                      <div className="flex gap-1 mt-1">
                        <span className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-500 tracking-wider uppercase">{cat.label}</span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-red-900/40 text-red-400 font-black tracking-wider uppercase">Defeat</span>
                      </div>
                    </div>
                    <button onClick={() => deleteTask(task.id)} className="p-2 text-zinc-700 hover:text-red-500 flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* タスクタイマー進行中 */}
        {activeTaskTimer && (() => {
          const t = tasks.find(x => x.id === activeTaskTimer.taskId);
          if (!t) return null;
          const cat = getCategory(t.categoryId);
          const dBonus = getDurationBonus(currentTaskTimer);
          return (
            <div ref={activeTimerRef} className="mb-4 rounded-2xl border-2 border-green-500 bg-gradient-to-br from-green-900/30 to-emerald-950/30 p-4">
              <div className="flex items-center gap-3 mb-2">
                <Timer className="w-8 h-8 text-green-400 flex-shrink-0 animate-pulse" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-green-400 font-bold tracking-wider">▶ タスク進行中</div>
                  <div className="text-lg font-black text-white break-words">{cat.emoji} {t.text}</div>
                  <div className="text-green-300 text-sm flex items-baseline gap-2 flex-wrap">
                    <span className="font-mono text-2xl font-black text-white tracking-widest tabular-nums">{formatHMS(currentTaskSeconds)}</span>
                    {dBonus.bonus > 0 && <span className="text-pink-400">継続ボーナス +{dBonus.bonus}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={stopTaskTimer} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-black py-3 rounded-lg tracking-wider transition active:scale-95">
                  <Check className="w-4 h-4 inline mr-1" /> 完了
                </button>
                <button onClick={() => partialComplete(activeTaskTimer.taskId)} className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 font-bold py-3 rounded-lg tracking-wider transition active:scale-95">
                  未完了で終了
                </button>
                <button onClick={cancelTaskTimer} className="px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })()}

        {/* クイックスタート（今から始める） */}
        {!activeTaskTimer && !activeBadTask && (
          <div className="mb-4 rounded-2xl border-2 border-green-700 bg-gradient-to-br from-green-950/40 to-emerald-950/30 overflow-hidden shadow-lg">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 flex items-center justify-between">
              <div className="text-xs text-white font-black tracking-wider">良いタスク（今すぐやる）</div>
              <div className="text-[10px] text-green-100 tracking-wider">思いついたらすぐ開始</div>
            </div>
            <div className="p-4">
              <input
                type="text"
                value={quickText}
                onChange={(e) => setQuickText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && quickStart()}
                placeholder="何をやる？（例: 英語の勉強、ジムで筋トレ）"
                className="w-full bg-black border-2 border-green-800 rounded-lg px-3 py-3 mb-3 focus:border-green-500 focus:outline-none placeholder-zinc-600 text-white font-bold"
              />
              
              {taskHistory.length > 0 && (() => {
                const filtered = quickText.trim()
                  ? taskHistory.filter(h => h.text.toLowerCase().includes(quickText.trim().toLowerCase()) && h.text.toLowerCase() !== quickText.trim().toLowerCase())
                  : taskHistory;
                if (filtered.length === 0) return null;
                return (
                  <div className="mb-3 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {filtered.slice(0, 8).map((h, i) => {
                      const cat = getCategory(h.categoryId);
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            setQuickText(h.text);
                            setQuickCategoryId(h.categoryId);
                          }}
                          className="px-2 py-1 rounded-md bg-zinc-800/80 hover:bg-green-900/40 border border-zinc-700 hover:border-green-600 text-xs text-zinc-300 hover:text-green-200 transition flex items-center gap-1"
                        >
                          <span>{cat.emoji}</span>
                          <span className="truncate max-w-[120px]">{h.text}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              <div className="flex flex-wrap gap-1.5 mb-4">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setQuickCategoryId(cat.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-bold transition border-2 ${
                      quickCategoryId === cat.id
                        ? `bg-gradient-to-r ${cat.color} text-white border-transparent shadow-lg scale-105`
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-zinc-500'
                    }`}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5 mb-3">
                {Object.entries(DIFFICULTIES).map(([k, v]) => (
                  <button key={k} onClick={() => setQuickDifficulty(k)} className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition ${quickDifficulty === k ? v.color + ' scale-105 shadow-md' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                    {v.label} +{v.power}
                  </button>
                ))}
              </div>
              <button
                onClick={quickStart}
                disabled={!quickText.trim()}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-black tracking-wider py-4 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-95 shadow-lg flex items-center justify-center gap-2 text-base"
              >
                <Play className="w-6 h-6 fill-white" />
                🔥 開始（タイマー起動）
              </button>
              <div className="text-[10px] text-green-500 text-center mt-2 tracking-wider font-bold">
                ⏱️ 経過時間でポイント自動計算（長くやるほど高得点）
              </div>
            </div>
          </div>
        )}

        {/* 悪いタスクを登録 */}
        {!activeBadTask && (
          <div className="mb-4 rounded-2xl border-2 border-red-700 bg-gradient-to-br from-red-950/40 to-zinc-950/30 overflow-hidden">
            <div className="bg-gradient-to-r from-red-700 to-orange-700 px-4 py-2 flex items-center justify-between">
              <div className="text-xs text-white font-black tracking-wider">悪いタスク</div>
              <button onClick={() => setShowBadSettings(true)} className="text-red-100 hover:text-white"><Settings className="w-3.5 h-3.5" /></button>
            </div>
            <div className="p-4">
              <input
                type="text"
                value={badQuickText}
                onChange={(e) => setBadQuickText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && badQuickText.trim()) { startBadTaskCustom(badQuickText); setBadQuickText(''); } }}
                placeholder="何をしてしまう？（例: SNSをだらだら見る）"
                className="w-full bg-black border-2 border-red-900 rounded-lg px-3 py-3 mb-3 focus:border-red-500 focus:outline-none placeholder-zinc-600 text-white font-bold"
              />
              <div className="flex flex-wrap gap-1.5 mb-3">
                {badCategories.map(bc => (
                  <button key={bc.id} onClick={() => startBadTask(bc.id)} className="px-3 py-2 rounded-lg text-sm font-bold transition border-2 bg-red-950/40 text-red-200 border-red-800 hover:border-red-500 active:scale-95">
                    {bc.emoji} {bc.label}
                  </button>
                ))}
                <button onClick={() => { setShowBadSettings(true); openBadCategoryEditor(); }} className="px-3 py-2 rounded-lg text-red-500 border-2 border-dashed border-red-900 hover:text-red-300 hover:border-red-600">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => { if (badQuickText.trim()) { startBadTaskCustom(badQuickText); setBadQuickText(''); } }}
                disabled={!badQuickText.trim()}
                className="w-full bg-gradient-to-r from-red-700 to-orange-700 hover:from-red-600 hover:to-orange-600 text-white font-black tracking-wider py-3 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-95"
              >
                ⏱ 入力した内容で記録する
              </button>
              <div className="text-[10px] text-red-500/80 text-center mt-2 tracking-wider">押すと計測開始 → 経過時間でマイナス</div>
            </div>
          </div>
        )}

        {/* ダメタスク進行中 */}
        {activeBadTask && (() => {
          const limit = activeBadTask.limitMinutes || 0;
          const overMin = Math.max(0, currentBadTimer - limit);
          const isOver = overMin > 0;
          const remaining = Math.max(0, limit - currentBadTimer);
          const baseDmg = getDamage(currentBadTimer).damage;
          const { penalty: overPen, label: overL } = getOverPenalty(overMin);
          const totalDmg = baseDmg + overPen;
          return (
            <div className={`mb-4 rounded-2xl border-4 ${isOver ? 'border-red-500 animate-pulse' : 'border-orange-500'} bg-gradient-to-br from-red-950 to-zinc-950 shadow-xl overflow-hidden`}>
              <div className={`${isOver ? 'bg-red-600' : 'bg-orange-600'} text-white px-3 py-2 text-xs font-black tracking-wider flex items-center justify-between`}>
                <span>⚠️ ダメな行為 進行中</span>
                <span className="font-mono">{formatDuration(currentBadTimer)}</span>
              </div>
              <div className="p-4">
                <div className="text-2xl font-black text-white mb-1">{getBadDisplay(activeBadTask).emoji} {getBadDisplay(activeBadTask).label}</div>
                <div className="text-3xl font-black font-mono text-orange-300 tracking-widest tabular-nums mb-3">{formatHMS(currentBadSeconds)}</div>
                
                {limit > 0 && (
                  <div className={`mb-3 p-3 rounded-xl ${isOver ? 'bg-red-900/40 border-2 border-red-500' : 'bg-zinc-800/60 border border-zinc-700'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-zinc-300 font-bold">宣言: {formatDuration(limit)}</span>
                      {isOver ? (
                        <span className="text-sm text-red-400 font-black">⚠️ オーバー {formatDuration(overMin)}</span>
                      ) : (
                        <span className="text-sm text-green-400 font-black">残り {formatDuration(remaining)}・早く切り上げると減点50%カット</span>
                      )}
                    </div>
                    <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                      <div className={`h-full transition-all ${isOver ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${Math.min(100, (currentBadTimer / limit) * 100)}%` }} />
                    </div>
                  </div>
                )}
                
                <div className="mb-3">
                  <div className="text-2xl font-black text-red-400">
                    −{totalDmg} <span className="text-xs text-zinc-500 ml-1">予測ダメージ</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    基本 −{baseDmg}
                    {overPen > 0 && <span className="text-red-400 font-bold ml-2">+ オーバー罰則 −{overPen}</span>}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button onClick={stopBadTask} className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black py-3 rounded-xl tracking-wider transition active:scale-95 shadow-md">
                    ⏹ 終了して記録
                  </button>
                  <button onClick={cancelBadTask} className="px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-xl transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ダメージ状態 */}
        {damageRemaining > 0 && !activeBadTask && (
          <div className="mb-4 border border-zinc-700 bg-zinc-950 p-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-zinc-400 tracking-[0.25em] uppercase font-black">Damage Remaining</div>
              <div className="font-mono text-lg font-black text-red-500">−{damageRemaining}</div>
            </div>
            <div className="text-[9px] text-zinc-600 tracking-wider uppercase mt-1">Complete Tasks to Recover</div>
          </div>
        )}

        {/* 睡眠スケジュール */}
        <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-zinc-400 font-bold tracking-wider">睡眠スケジュール</div>
            <button onClick={() => setEditingSleepGoal(!editingSleepGoal)} className="text-zinc-500 hover:text-white text-[10px] flex items-center gap-1">
              予定を設定 <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
          {editingSleepGoal && (
            <div className="mb-2 grid grid-cols-2 gap-2 bg-black/40 rounded-lg p-2">
              <label className="text-[10px] text-zinc-400 block">
                就寝予定
                <input type="time" value={sleepGoal.bedtime} onChange={(e) => setSleepGoal({ ...sleepGoal, bedtime: e.target.value })} className="w-full bg-black border border-zinc-700 rounded px-2 py-1 mt-0.5 text-white text-sm focus:border-white focus:outline-none" />
              </label>
              <label className="text-[10px] text-zinc-400 block">
                起床予定
                <input type="time" value={sleepGoal.wakeup} onChange={(e) => setSleepGoal({ ...sleepGoal, wakeup: e.target.value })} className="w-full bg-black border border-zinc-700 rounded px-2 py-1 mt-0.5 text-white text-sm focus:border-white focus:outline-none" />
              </label>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button onClick={recordSleep} className={`relative border-2 rounded-xl p-3 text-left transition active:scale-95 ${sleepTime ? 'bg-zinc-950 border-white' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-600'}`}>
              {sleepTime && <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); resetSleep(); }} className="absolute top-1 right-1 p-1 text-zinc-500 hover:text-red-400" title="就寝記録を取り消す"><X className="w-3.5 h-3.5" /></span>}
              <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold"><Moon className="w-3.5 h-3.5" /> 就寝　予定 {sleepGoal.bedtime}</div>
              {sleepTime ? (
                <>
                  <div className="text-xl font-black font-mono text-white mt-1">{sleepTime.time}</div>
                  <div className={`text-[10px] font-bold mt-0.5 ${sleepTime.power >= 0 ? 'text-green-400' : 'text-red-400'}`}>{sleepTime.label} {sleepTime.power >= 0 ? '+' : ''}{sleepTime.power}</div>
                </>
              ) : (
                <div className="text-sm text-zinc-500 mt-1">タップで記録</div>
              )}
            </button>
            <button onClick={recordWakeUp} className={`relative border-2 rounded-xl p-3 text-left transition active:scale-95 ${wakeTime ? 'bg-zinc-950 border-white' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-600'}`}>
              {wakeTime && <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); resetWakeUp(); }} className="absolute top-1 right-1 p-1 text-zinc-500 hover:text-red-400" title="起床記録を取り消す"><X className="w-3.5 h-3.5" /></span>}
              <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold"><Sunrise className="w-3.5 h-3.5" /> 起床　予定 {sleepGoal.wakeup}</div>
              {wakeTime ? (
                <>
                  <div className="text-xl font-black font-mono text-white mt-1">{wakeTime.time}</div>
                  <div className={`text-[10px] font-bold mt-0.5 ${wakeTime.power >= 0 ? 'text-green-400' : 'text-red-400'}`}>{wakeTime.label} {wakeTime.power >= 0 ? '+' : ''}{wakeTime.power}</div>
                </>
              ) : (
                <div className="text-sm text-zinc-500 mt-1">タップで記録</div>
              )}
            </button>
          </div>
          <div className="bg-black/40 rounded-lg p-2 text-[10px] text-zinc-500 leading-relaxed">
            押した時刻と予定の差で自動加点 — <span className="text-green-400">±30分以内 +15</span> ／ <span className="text-green-400">±1時間以内 +5</span> ／ <span className="text-red-400">±1時間超 −10</span>
          </div>
        </div>

        {/* 今日のダメージログ */}
        {todayDamages.length > 0 && (
          <div className="mb-4 rounded-2xl border-2 border-red-900/60 bg-gradient-to-br from-red-950/30 to-zinc-900 p-3 shadow-md">
            <div className="text-xs text-red-400 font-black tracking-wider mb-2 flex items-center justify-between">
              <span>⚠️ 今日のダメージ ({todayDamages.length}件)</span>
              <span className="text-red-500">−{todayDamageTotal}</span>
            </div>
            <div className="space-y-1.5">
              {todayDamages.map((d, i) => {
                const disp = getBadDisplay(d);
                const wasOver = d.overMinutes > 0;
                return (
                  <div key={i} className={`p-2 rounded-lg ${wasOver ? 'bg-red-900/30 border border-red-800/60' : 'bg-zinc-800/50 border border-zinc-800'}`}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white font-bold">{disp.emoji} {disp.label}</span>
                      <span className="text-zinc-400 text-[10px]">{d.time} · {formatDuration(d.minutes)}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-red-400 font-black">−{d.damage}</span>
                        <button onClick={() => deleteDamage(i)} className="text-zinc-600 hover:text-red-400" title="削除"><Trash2 className="w-3.5 h-3.5" /></button>
                      </span>
                    </div>
                    {d.limitMinutes > 0 && (
                      <div className="text-[10px] mt-1 flex items-center gap-2">
                        <span className="text-zinc-500">宣言 {formatDuration(d.limitMinutes)}</span>
                        {wasOver ? (
                          <span className="text-red-400 font-bold">→ +{formatDuration(d.overMinutes)} オーバー（罰則 −{d.overPenalty}）</span>
                        ) : d.earlyReduction > 0 ? (
                          <span className="text-emerald-400 font-bold">✓ 早期終了 — 減少率50%カット（−{d.earlyReduction} 軽減）</span>
                        ) : (
                          <span className="text-green-400 font-bold">✓ 時間内</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}


          {completedTasks.length > 0 && (
            <div className="pt-3 mt-3 border-t border-zinc-800">
              <div className="text-[10px] text-zinc-500 tracking-[0.3em] mb-2 font-black uppercase">⬢ Completed ({completedTasks.length})</div>
              {completedTasks.map(task => {
                const cat = getCategory(task.categoryId);
                const editing = editingDoneId === task.id;
                return (
                  <div key={task.id} className="bg-zinc-950 border border-zinc-800/60 p-3 flex items-center gap-2 mb-2">
                    <div className="w-9 h-9 border-2 border-white flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {editing ? (
                        <input type="text" value={editDoneText} onChange={(e) => setEditDoneText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveEditDone()} autoFocus className="w-full bg-black border border-zinc-600 rounded px-2 py-1 text-white text-sm focus:border-white focus:outline-none" />
                      ) : (
                        <div className="font-bold line-through text-zinc-500 break-words tracking-wide">{task.text}</div>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 tracking-wider uppercase">{cat.label}</span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-white text-black font-black tracking-wider font-mono">+{task.powerEarned || 0}</span>
                        {task.durationMinutes !== null && task.durationMinutes !== undefined && (
                          <span className="text-[9px] px-1.5 py-0.5 border border-zinc-600 text-zinc-300 font-black tracking-wider font-mono">⏱ {formatDuration(task.durationMinutes)}</span>
                        )}
                        {task.comboAtCompletion >= 2 && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-white font-black tracking-wider uppercase">×{task.comboAtCompletion} STREAK</span>
                        )}
                        {task.scheduledBonus > 0 && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-cyan-700 text-white font-black tracking-wider uppercase">📅 +{task.scheduledBonus} 約束達成</span>
                        )}
                        {task.earlyBonus > 0 && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-yellow-500 text-black font-black tracking-wider uppercase">⚡ +{task.earlyBonus} 前倒し</span>
                        )}
                      </div>
                    </div>
                    {editing ? (
                      <button onClick={saveEditDone} className="text-[10px] px-2 py-1 rounded bg-white text-black font-black flex-shrink-0">保存</button>
                    ) : (
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button onClick={() => { setEditingDoneId(task.id); setEditDoneText(task.text); }} className="text-[10px] px-2 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500">編集</button>
                        <button onClick={() => uncompleteTask(task.id)} className="text-[10px] px-2 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-cyan-300 hover:border-cyan-700">戻す</button>
                        <button onClick={() => deleteCompletedTask(task.id)} className="text-[10px] px-2 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-700">削除</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        <div className="mt-8 text-center"><div className="text-zinc-700 text-xs tracking-[0.3em]">KEEP GOING</div></div>
      </div>

      {/* 代替提案ポップアップ（悪いタスク開始前） */}
      {redirectPopup && (() => {
        let badLabel = '悪いタスク';
        if (redirectPopup.mode === 'category') { const bc = getBadCategory(redirectPopup.categoryId); badLabel = `${bc.emoji} ${bc.label}`; }
        else if (redirectPopup.mode === 'history') { badLabel = `${redirectPopup.historyItem.emoji || '⚠️'} ${redirectPopup.historyItem.label}`; }
        const suggestions = taskHistory.slice(0, 3);
        return (
          <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur flex items-end sm:items-center justify-center p-4" onClick={() => setRedirectPopup(null)}>
            <div className="bg-gradient-to-br from-zinc-900 to-black border-2 border-green-500 rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="bg-green-600 text-white px-4 py-2.5 flex items-center justify-between">
                <span className="font-black tracking-wider text-sm">⚡ その前に — これを先にやろう</span>
                <button onClick={() => setRedirectPopup(null)} className="text-white hover:text-green-200"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-4">
                {taskHistory.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    {suggestions.map((h, i) => {
                      const cat = getCategory(h.categoryId);
                      return (
                        <div key={i} className="flex items-center justify-between bg-black border border-green-800 rounded-xl px-3 py-2.5">
                          <span className="text-white font-bold text-sm break-words mr-2">{cat.emoji} {h.text}</span>
                          <button onClick={() => startGoodFromRedirect(h.text, h.categoryId)} disabled={!!activeTaskTimer} className="flex-shrink-0 bg-green-600 hover:bg-green-500 text-white text-xs font-black px-3 py-1.5 rounded-lg disabled:opacity-40">▶ 開始</button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-zinc-500 text-xs text-center py-3 mb-1">良いタスクを実行すると、ここに代わりの候補が出ます。</div>
                )}
                <button onClick={proceedToBadTask} className="w-full text-center text-xs text-zinc-500 hover:text-red-400 py-2 border-t border-zinc-800">
                  やっぱり「{badLabel}」を記録する
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ダメな行為の制限時間設定ダイアログ */}
      {badStartDialog && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur flex items-end sm:items-center justify-center p-4" onClick={() => setBadStartDialog(null)}>
          <div className="bg-gradient-to-br from-zinc-900 to-black border-4 border-red-600 rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between">
              <div className="font-black tracking-wider">
                {badStartDialog.customMode ? (
                  <>⚠️ 弱さを記録</>
                ) : (
                  <>⚠️ {getBadCategory(badStartDialog.categoryId).emoji} {getBadCategory(badStartDialog.categoryId).label}</>
                )}
              </div>
              <button onClick={() => setBadStartDialog(null)} className="text-white hover:text-red-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              {/* カスタム入力モード時の名前入力 */}
              {badStartDialog.customMode && (
                <div className="mb-4">
                  <div className="text-sm text-white font-bold mb-2">📝 何の弱さ？</div>
                  <input
                    type="text"
                    value={badStartDialog.customLabel || ''}
                    onChange={(e) => setBadStartDialog({ ...badStartDialog, customLabel: e.target.value })}
                    placeholder="例: Twitter、お菓子、YouTube..."
                    className="w-full bg-black border-2 border-zinc-700 rounded-xl px-3 py-2.5 mb-3 focus:border-red-500 focus:outline-none placeholder-zinc-600 text-white font-bold"
                    maxLength={20}
                    autoFocus
                  />
                  
                  <div className="text-xs text-zinc-400 mb-2">絵文字を選ぶ:</div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {BAD_EMOJI_OPTIONS.map(e => (
                      <button
                        key={e}
                        onClick={() => setBadStartDialog({ ...badStartDialog, customEmoji: e })}
                        className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition ${badStartDialog.customEmoji === e ? 'bg-red-600 scale-110' : 'bg-zinc-800 hover:bg-zinc-700'}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="text-sm text-white font-bold mb-1">⏰ 何分以内で終わらせる？</div>
              <div className="text-xs text-zinc-400 mb-4">宣言した時間をオーバーすると追加ペナルティ／早く切り上げると減点50%カット</div>
              
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[1, 5, 15, 30, 60, 90].map(min => (
                  <button
                    key={min}
                    onClick={() => confirmStartBadTask(min)}
                    disabled={badStartDialog.customMode && !(badStartDialog.customLabel || '').trim()}
                    className="py-3 rounded-xl bg-zinc-800 hover:bg-red-900/40 border-2 border-zinc-700 hover:border-red-600 text-white font-black transition active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {min < 60 ? `${min}分` : `${min/60}時間`}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 mb-3">
                <input
                  type="number"
                  value={badCustomMinutes}
                  onChange={(e) => setBadCustomMinutes(e.target.value)}
                  placeholder="カスタム（分）"
                  className="flex-1 bg-black border-2 border-zinc-700 rounded-xl px-3 py-2.5 focus:border-red-500 focus:outline-none placeholder-zinc-600 text-white font-bold"
                  min="1"
                  max="600"
                />
                <button
                  onClick={() => confirmStartBadTask(parseInt(badCustomMinutes))}
                  disabled={!badCustomMinutes || parseInt(badCustomMinutes) < 1 || (badStartDialog.customMode && !(badStartDialog.customLabel || '').trim())}
                  className="px-5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl disabled:opacity-30 transition"
                >
                  開始
                </button>
              </div>

              <div className="bg-red-950/40 border border-red-900 rounded-xl p-3">
                <div className="text-[10px] text-red-300 font-bold tracking-wider mb-1">⚠️ オーバー時の罰則</div>
                <div className="text-[10px] text-red-200 space-y-0.5">
                  <div>+5分以内: −10 / +15分以内: −25</div>
                  <div>+30分以内: −50 / +60分以内: −100</div>
                  <div>+60分超: −100以上（制御不能）</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ボーナスポップアップ */}
      {bonusPopup && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur flex items-center justify-center p-4" onClick={() => setBonusPopup(null)}>
          <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            {/* 背景の輝き */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 rounded-3xl blur-2xl opacity-50 animate-pulse"></div>
            
            <div className="relative bg-gradient-to-br from-zinc-900 to-black border-4 border-yellow-400 rounded-3xl p-6 shadow-2xl">
              {/* ヘッダー */}
              <div className="text-center mb-4">
                <div className="text-5xl mb-2 animate-bounce">🎉</div>
                <div className="text-xs text-yellow-400 font-black tracking-[0.3em] uppercase mb-1">BONUS UNLOCKED</div>
                <div className="text-2xl font-black text-white">+{bonusPopup.totalPoints} PWR</div>
                <div className="text-xs text-zinc-400 mt-1 truncate px-4">{bonusPopup.taskText}</div>
              </div>
              
              {/* ボーナス内訳 */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center px-3 py-2 bg-zinc-800/50 rounded-lg">
                  <span className="text-xs text-zinc-400">基本ポイント</span>
                  <span className="text-sm font-black text-white">+{bonusPopup.basePoints}</span>
                </div>
                {bonusPopup.items.map((item, i) => (
                  <div key={i} className={`flex justify-between items-center px-3 py-2.5 rounded-lg bg-gradient-to-r ${item.color} shadow-lg ${item.isSpecial ? 'animate-pulse' : ''}`}>
                    <span className="flex items-center gap-2 text-sm font-bold text-white">
                      <span className="text-xl">{item.emoji}</span>
                      <span>{item.label}</span>
                    </span>
                    {item.points > 0 && <span className="text-base font-black text-white">+{item.points}</span>}
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => setBonusPopup(null)}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black font-black tracking-[0.2em] uppercase py-3 rounded-xl text-sm transition active:scale-95 shadow-lg"
              >
                CONTINUE ✊
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 悪いタスク終了の結果ポップアップ */}
      {badResultPopup && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur flex items-center justify-center p-4" onClick={() => setBadResultPopup(null)}>
          <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-orange-600 rounded-3xl blur-2xl opacity-40"></div>
            <div className="relative bg-gradient-to-br from-zinc-900 to-black border-4 border-red-600 rounded-3xl p-6 shadow-2xl">
              {/* ヘッダー */}
              <div className="text-center mb-4">
                <div className="text-5xl mb-2">{badResultPopup.emoji}</div>
                <div className="text-xs text-red-400 font-black tracking-[0.3em] uppercase mb-1">記録完了</div>
                <div className="text-3xl font-black text-red-400">−{badResultPopup.totalDamage} PWR</div>
                <div className="text-xs text-zinc-400 mt-1 truncate px-4">{badResultPopup.label}・{formatDuration(badResultPopup.minutes)}</div>
              </div>

              {/* マイナス内訳 */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center px-3 py-2 bg-zinc-800/50 rounded-lg">
                  <span className="text-xs text-zinc-400">基本ダメージ</span>
                  <span className="text-sm font-black text-red-400">−{badResultPopup.baseDamage}</span>
                </div>
                {badResultPopup.overPenalty > 0 && (
                  <div className="flex justify-between items-center px-3 py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 shadow-lg">
                    <span className="flex items-center gap-2 text-sm font-bold text-white">
                      <span className="text-xl">⏰</span>
                      <span>宣言オーバー罰則</span>
                    </span>
                    <span className="text-base font-black text-white">−{badResultPopup.overPenalty}</span>
                  </div>
                )}
                {badResultPopup.earlyReduction > 0 && (
                  <div className="flex justify-between items-center px-3 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg">
                    <span className="flex items-center gap-2 text-sm font-bold text-white">
                      <span className="text-xl">⏳</span>
                      <span>ポイント減少率低下（早期終了 −50%）</span>
                    </span>
                    <span className="text-base font-black text-white">+{badResultPopup.earlyReduction}</span>
                  </div>
                )}
              </div>

              {badResultPopup.endedEarly && (
                <div className="text-center text-[11px] text-emerald-400 font-bold mb-3">予定より早く切り上げた。踏みとどまったな。</div>
              )}

              <button
                onClick={() => setBadResultPopup(null)}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black tracking-[0.2em] uppercase py-3 rounded-xl text-sm transition active:scale-95 shadow-lg"
              >
                CONTINUE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 設定モーダル（良いカテゴリ） */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-end sm:items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="font-black tracking-wider">TASK CATEGORIES</h2>
              <button onClick={() => { setShowSettings(false); setEditingCat(null); }} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              {editingCat ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-zinc-500 tracking-wider mb-1 block">名前</label>
                    <input type="text" value={catForm.label} onChange={(e) => setCatForm({ ...catForm, label: e.target.value })} placeholder="例: 読書, 瞑想..." maxLength={10} className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 focus:border-red-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 tracking-wider mb-1 block">絵文字</label>
                    <div className="flex flex-wrap gap-1.5">
                      {EMOJI_OPTIONS.map(e => (
                        <button key={e} onClick={() => setCatForm({ ...catForm, emoji: e })} className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition ${catForm.emoji === e ? 'bg-red-600 scale-110' : 'bg-zinc-800 hover:bg-zinc-700'}`}>{e}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 tracking-wider mb-1 block">色</label>
                    <div className="grid grid-cols-4 gap-2">
                      {COLOR_OPTIONS.map(c => (
                        <button key={c.value} onClick={() => setCatForm({ ...catForm, color: c.value })} className={`h-10 rounded-lg bg-gradient-to-r ${c.value} text-white font-bold text-xs transition ${catForm.color === c.value ? 'ring-2 ring-white scale-105' : 'opacity-60'}`}>{c.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setEditingCat(null)} className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white">キャンセル</button>
                    <button onClick={saveCategory} disabled={!catForm.label.trim()} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 font-black disabled:opacity-30">保存</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center gap-2">
                      <div className={`flex-1 px-3 py-2.5 rounded-lg bg-gradient-to-r ${cat.color} font-bold flex items-center gap-2`}>
                        <span className="text-lg">{cat.emoji}</span><span>{cat.label}</span>
                      </div>
                      <button onClick={() => openCategoryEditor(cat)} className="p-2 text-zinc-400 hover:text-white"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => deleteCategory(cat.id)} disabled={categories.length <= 1} className="p-2 text-zinc-400 hover:text-red-500 disabled:opacity-30"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button onClick={() => openCategoryEditor()} className="w-full py-3 rounded-lg border-2 border-dashed border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 font-bold">+ 新しいカテゴリ</button>
                  <button onClick={() => { setShowSettings(false); setShowBadSettings(true); }} className="w-full mt-4 py-3 rounded-lg border-2 border-dashed border-red-900 text-red-500 hover:text-red-300 hover:border-red-700 font-bold">⚠ ダメな行為カテゴリを編集</button>
                  <div className="mt-6 pt-4 border-t border-zinc-800">
                    <div className="text-xs text-zinc-500 font-bold tracking-wider mb-2">コーチのタイプ</div>
                    <div className="flex gap-2">
                      <button onClick={() => setCoachStyle('strict')} className={`flex-1 py-3 rounded-lg border-2 font-bold transition ${coachStyle === 'strict' ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white border-transparent shadow-md' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>😤 厳しいコーチ</button>
                      <button onClick={() => setCoachStyle('positive')} className={`flex-1 py-3 rounded-lg border-2 font-bold transition ${coachStyle === 'positive' ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border-transparent shadow-md' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>😊 優しいコーチ</button>
                    </div>
                    <div className="text-[10px] text-zinc-600 mt-1.5">{coachStyle === 'strict' ? '本音でガンガン背中を押すスパルタタイプ' : '前向きに励まして応援してくれるタイプ'}</div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-zinc-800 space-y-2">
                    <button onClick={doInstall} className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-black">📲 アプリをインストール</button>
                    <button onClick={resetToday} className="w-full py-3 rounded-lg border border-zinc-700 text-zinc-400 hover:text-red-300 hover:border-red-700 font-bold">今日の記録をリセット</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 設定モーダル（悪いカテゴリ） */}
      {showBadSettings && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-end sm:items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-red-900/50">
              <h2 className="font-black tracking-wider text-red-400">⚠ BAD HABITS</h2>
              <button onClick={() => { setShowBadSettings(false); setEditingBadCat(null); }} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-3 mb-3 text-xs text-red-300">
                <div className="font-bold mb-1">時間別ペナルティ:</div>
                <div className="space-y-0.5 text-red-200">
                  <div>〜5分: -2 / 〜15分: -5 / 〜30分: -15</div>
                  <div>〜60分: -30 / 〜2時間: -60 / 〜3時間: -100</div>
                  <div>3時間〜: 指数的増加</div>
                </div>
              </div>
              {editingBadCat ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-zinc-500 tracking-wider mb-1 block">名前</label>
                    <input type="text" value={badCatForm.label} onChange={(e) => setBadCatForm({ ...badCatForm, label: e.target.value })} placeholder="例: ゲーム, YouTube..." maxLength={10} className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 focus:border-red-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 tracking-wider mb-1 block">絵文字</label>
                    <div className="flex flex-wrap gap-1.5">
                      {BAD_EMOJI_OPTIONS.map(e => (
                        <button key={e} onClick={() => setBadCatForm({ ...badCatForm, emoji: e })} className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition ${badCatForm.emoji === e ? 'bg-red-600 scale-110' : 'bg-zinc-800 hover:bg-zinc-700'}`}>{e}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setEditingBadCat(null)} className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white">キャンセル</button>
                    <button onClick={saveBadCategory} disabled={!badCatForm.label.trim()} className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 font-black disabled:opacity-30">保存</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {badCategories.map(cat => (
                    <div key={cat.id} className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 font-bold flex items-center gap-2">
                        <span className="text-lg">{cat.emoji}</span><span>{cat.label}</span>
                      </div>
                      <button onClick={() => openBadCategoryEditor(cat)} className="p-2 text-zinc-400 hover:text-white"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => deleteBadCategory(cat.id)} className="p-2 text-zinc-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button onClick={() => openBadCategoryEditor()} className="w-full py-3 rounded-lg border-2 border-dashed border-red-900 text-red-400 hover:text-red-300 hover:border-red-700 font-bold">+ 新しいダメ行為</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 履歴モーダル */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-end sm:items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="font-black tracking-wider">BATTLE LOG</h2>
              <button onClick={() => setShowHistory(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <div className="mb-4 p-3 bg-zinc-800/50 rounded-xl">
                <div className="text-xs text-zinc-500 tracking-wider mb-1">自己ベスト</div>
                <div className="text-2xl font-black text-yellow-400"><Crown className="w-5 h-5 inline mr-1" />{bestDay.power} PWR</div>
                {bestDay.date && <div className="text-xs text-zinc-500 mt-1">{new Date(bestDay.date).toLocaleDateString('ja-JP')}</div>}
              </div>

              {Object.entries(taskCombos).filter(([_, v]) => v.count >= 2).length > 0 && (
                <div className="mb-4 p-3 bg-orange-950/30 border border-orange-900/50 rounded-xl">
                  <div className="text-xs text-orange-400 tracking-wider mb-2 font-bold">🔥 継続中のコンボ</div>
                  <div className="space-y-1">
                    {Object.entries(taskCombos).filter(([_, v]) => v.count >= 2).sort((a, b) => b[1].count - a[1].count).slice(0, 10).map(([key, v]) => {
                      const text = key.split('::')[1];
                      const bonus = getComboBonus(v.count);
                      return (
                        <div key={key} className="flex justify-between text-sm bg-zinc-900/40 px-2 py-1.5 rounded">
                          <span className="truncate flex-1 mr-2">{text}</span>
                          <span className="text-orange-300 font-bold text-xs flex-shrink-0">{v.count}日連続 x{bonus.mult}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {history.length === 0 ? (
                <div className="text-center text-zinc-500 py-8">まだ履歴なし。今日が初日だ。</div>
              ) : (
                <div className="space-y-2">
                  {history.map((h, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${h.won ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <div>
                          <div className="text-xs text-zinc-500">{new Date(h.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' })}</div>
                          <div className="font-black">{h.power} <span className="text-zinc-500 text-sm">vs {h.opponent}</span></div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className={`text-sm font-black tracking-wider ${h.won ? 'text-green-400' : 'text-red-400'}`}>{h.won ? '⚔️ WIN' : '☠️ LOSS'}</div>
                          <button onClick={() => deleteHistoryEntry(i)} className="p-1 text-zinc-600 hover:text-red-400 transition" title="この履歴を削除">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {(h.wakeTime || h.sleepTime || h.failedCount > 0 || h.damageTotal > 0 || h.recoveryTotal > 0) && (
                        <div className="flex flex-wrap gap-2 text-xs pt-1 border-t border-zinc-800/50 mt-1">
                          {h.wakeTime && (
                            <span className="text-yellow-400">
                              <Sunrise className="w-3 h-3 inline mr-0.5" />
                              {typeof h.wakeTime === 'string' ? h.wakeTime : h.wakeTime.time}
                              {typeof h.wakeTime === 'object' && h.wakeTime.power > 0 && <span className="text-yellow-500 ml-0.5">(+{h.wakeTime.power})</span>}
                            </span>
                          )}
                          {h.sleepTime && (
                            <span className="text-indigo-400">
                              <Moon className="w-3 h-3 inline mr-0.5" />
                              {typeof h.sleepTime === 'string' ? h.sleepTime : h.sleepTime.time}
                              {typeof h.sleepTime === 'object' && h.sleepTime.power > 0 && <span className="text-indigo-500 ml-0.5">(+{h.sleepTime.power})</span>}
                            </span>
                          )}
                          {h.failedCount > 0 && <span className="text-red-400"><XCircle className="w-3 h-3 inline mr-0.5" />敗北{h.failedCount}</span>}
                          {h.damageTotal > 0 && <span className="text-red-500"><Zap className="w-3 h-3 inline mr-0.5" />-{h.damageTotal}</span>}
                          {h.recoveryTotal > 0 && <span className="text-pink-400"><Heart className="w-3 h-3 inline mr-0.5" />+{h.recoveryTotal}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}