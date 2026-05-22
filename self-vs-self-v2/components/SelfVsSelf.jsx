"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Check, Trash2, Skull, Crown, Flame, X, Settings, Edit2, Swords, Trophy, Sunrise, Moon, XCircle, Play, Square, AlertTriangle, Zap, Heart, Timer, CalendarPlus, Sun } from 'lucide-react';

const STORAGE_KEY = 'self_vs_self_v8';

const DEFAULT_CATEGORIES = [
  { id: 'life', label: '生活', emoji: '🏠', color: 'from-yellow-500 to-amber-600' },
  { id: 'body', label: '身体', emoji: '💪', color: 'from-red-600 to-orange-600' },
  { id: 'work', label: '仕事', emoji: '💼', color: 'from-blue-600 to-indigo-600' },
  { id: 'study', label: '勉強', emoji: '📚', color: 'from-green-600 to-emerald-600' },
];

const DEFAULT_BAD_CATEGORIES = [
  { id: 'sns', label: 'SNS', emoji: '📱' },
  { id: 'game', label: 'ゲーム', emoji: '🎮' },
  { id: 'slack', label: 'ダラダラ', emoji: '🛋️' },
];

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

const QUOTES = {
  idle: [
    'KEEP GOING. それしかねえだろ。',
    'NO EXCUSES. 言い訳考える時間で1個やれ。',
    'MOVE NOW. 快適さはお前を鈍らせる。',
    'WAR STARTS HERE. 今日も戦いだ。',
    'NO ONE\'S COMING. 自分でやれ。',
    'EMBRACE THE PAIN. 痛みは友達だ。',
    'BREAK THE LIMIT. 限界を決めてるのはお前自身だ。',
    'SHUT UP AND MOVE. 頭の声を黙らせろ。',
    'BEAT YESTERDAY\'S YOU. 昨日の自分を超えろ。',
    'NEVER QUIT. これだけ覚えとけ。',
    'DISCIPLINE OVER MOTIVATION. やる気は嘘。規律だけが本物。',
    'GO HARDER. お前はまだ本気を出してない。',
    'NO MERCY. 自分の弱さに容赦するな。',
    'HARDEN UP. 立て。今すぐだ。',
    'COMFORT TRAPS YOU. 快適なベッドは甘い罠だ。',
    'EVERY DAY COUNTS. 今日サボったら明日のお前が今日を恨むぞ。',
    'NO WITNESS, NO MATTER. 誰も見てない時に何をするかが全てだ。',
    'FORGE YOUR MIND. 心を鋼にしろ。',
    'CHASE THE PAIN. 痛みから逃げるな。探しに行け。',
    'EAT THE FROG. 一日一回、嫌なことをやれ。',
    'YOUR MIRROR IS YOUR ENEMY. お前は鏡の中の敵と戦ってる。',
    'BEST EFFORT. 最高じゃなくていい。最善を尽くせ。',
    'FUCK YOUR FEELINGS. 気分なんか関係ねえ。やれ。',
    'BEAT THE WEAK YOU. 弱い自分を毎日少しずつ超えろ。',
    'YOU ARE ON YOUR OWN. 誰もお前を救わない。',
    'OWN IT. お前の人生はお前の責任だ。',
    'ONE MORE STEP. 小さい一歩でいい。だが止まるな。',
    'DO THE HARD THING. 嫌なことをやれ。それが成長だ。',
    'KEEP GOING. これは挨拶じゃない。命令だ。',
    'SWEAT. PUSH. RISE. 汗かいて、踏ん張って、立ち上がれ。',
    'THE WORLD WON\'T WAIT. 世界はお前を待たない。',
    '99% DON\'T DO THIS. 誰もやらないことをやれ。',
    'PROVE YOURSELF. 自分に証明しろ。',
    'CRUSH IT TODAY. 今日も潰せ。',
    'WAKE THE BEAST. お前の中の獣を起こせ。',
    'MIND OVER BODY. 体じゃない。心が全てだ。',
    'NO RETREAT. 後退はない。前か立ち止まるかだ。',
    'BE UNCOMFORTABLE. 居心地悪い場所に行け。',
    'WAR EVERY DAY. 毎日が戦いだ。',
  ],
  taskAdded: [
    'LIST IS NOTHING. 書いただけじゃ意味ねえ。',
    'NOW EXECUTE. 書いた。次は？やれ。',
    'PLANNERS LOSE. 計画立てるだけのやつは負ける。',
    'STEP IN THE RING. 戦場に上がった。逃げるな。',
  ],
  taskStart: [
    'EXECUTE. 始めたな。途中でやめるな。',
    'LOCK IN. 集中しろ。',
    'CLOCK IS RUNNING. 時計は動いてる。長くやれ。',
    'NOW IS EVERYTHING. 今この瞬間が全てだ。',
  ],
  smallWin: [
    'NOT ENOUGH. まだ甘い。続けろ。',
    'NEXT STEP. 一歩。次の一歩。',
    'DON\'T SETTLE. これで満足するな。',
    'WARM UP. ウォームアップだ。',
  ],
  mediumWin: [
    'GOOD. NOT ENOUGH. いいぞ。だがまだ足りない。',
    'THE DEMON\'S SHAKING. お前の中の悪魔が震えてる。',
    'KEEP MOVING. 止まったら負けだ。',
  ],
  bigWin: [
    'THAT\'S IT! 毎日それをやれ！',
    'COMFORT ZONE DESTROYED. 快適ゾーン破壊した。',
    'GO HARDER! まだいけるだろ！',
    'YOU CHANGED TODAY. お前は今日、自分を変えた。',
  ],
  longSession: [
    'DEEP WORK. 長くやったな。それが本物だ。',
    'PROOF OF FOCUS. 集中の証明だ。',
    'TIME INVESTED. 時間をかけた。それが結果になる。',
    'THIS MAKES THE DIFFERENCE. 深く潜った。それが差を生む。',
  ],
  beatYesterday: [
    'YESTERDAY YOU WAS WEAK. 昨日のお前は弱かった。今日は強い。',
    'PAST DEFEATED. 過去の自分を倒した。明日はもっと強くなれ。',
    'WIN. DON\'T SETTLE. 勝った。だが満足するな。',
    'BEAT THE OLD YOU. これを毎日続けろ。',
  ],
  newBest: [
    'NEW RECORD! 限界を上書きした！',
    'NEW BASELINE. これが新しい最低ラインだ。',
    'YOU ARE NEW. お前は今、別人になった。',
  ],
  combo: [
    'CONSISTENCY WINS. 継続だ。それが本物の強さだ。',
    'REPEAT IT. 同じことを繰り返せ。それが規律だ。',
    'EVERY DAY. 昨日もやった。今日もやった。明日もやれ。',
    'YOU\'RE BECOMING SOMEONE ELSE. お前は別人になりつつある。',
  ],
  bigCombo: [
    'YOU ARE DIFFERENT NOW. お前は別格になった。',
    'NO ONE CAN COPY THIS. 誰にも真似できない。',
    'LEGEND TERRITORY. 伝説の領域だ。止まるな。',
  ],
  failed: [
    'YOU RAN. 逃げたな。次は逃げるな。',
    'AT LEAST YOU FACED IT. 負けを認めるだけマシだ。',
    'THE DEMON\'S LAUGHING. お前の中の悪魔が笑ってる。',
    'NO HIDING. 失敗を隠すな。それが弱さの始まりだ。',
    'LOST TODAY. WIN TOMORROW. 明日は同じ場所で勝て。',
  ],
  wakeUp: [
    'HARDEN UP! 起きたな。次は何をやる？',
    'FIRST WIN. ベッドを離れた。最初の戦いに勝った。',
    'MOVE. DON\'T THINK. 起きた。動け。考えるな。',
    'ESCAPE THE TRAP. 布団は甘い罠だ。脱出したな。',
  ],
  wakeUpEarly: [
    'WINNER\'S HOUR. これが勝者の起床時間だ！',
    '99% ARE STILL SLEEPING. お前は別格だ。',
    'BEFORE THE SUN. 太陽より先に起きた。',
    'NO ONE\'S HERE. 誰も入れない領域。',
  ],
  wakeUpLate: [
    'HALF DAY GONE. 半日無駄にした。',
    'OVERSLEPT. 認めろ。明日は5時に起きろ。',
    'BED WON. 次は勝て。',
  ],
  sleep: [
    'BATTLE DONE. 一日を戦い切ったか。明日はもっと戦え。',
    'REST. DON\'T QUIT. 寝ろ。ただし負けたまま寝るな。',
    'RECOVERY IS A WEAPON. 回復は弱さじゃない。武器だ。',
  ],
  sleepEarly: [
    'PRO RHYTHM. 早寝、早起き。プロのリズムだ。',
    'DISCIPLINE. 22時前に寝るやつは強い。',
    'PHONE DOWN. それが勝者の選択だ。',
  ],
  sleepLate: [
    'YOU\'RE HURTING TOMORROW. 明日の自分の足を引っ張る気か。',
    'GO TO SLEEP. こんな時間まで何してた。',
    'NIGHT OWL = WEAK. 夜更かしは弱さの証明だ。',
  ],
  badStart: [
    'KEEP IT SHORT. 短く終わらせろ。',
    'CLOCK IS YOUR ENEMY. 長引くほどダメージだ。',
    'STOP IN 5. 5分以内に止めろ。',
    'CUT IT OFF. 早く止めろ。',
  ],
  badShort: [
    'SHORT BURST. 短く終わらせた。だが繰り返すな。',
    'THAT\'S OK. 一瞬で済んだ。それが正解だ。',
    'UNDER 5. 許容範囲だ。だが油断するな。',
  ],
  badMedium: [
    'TOO LONG. 次はもっと短くしろ。',
    'YOU LOST A TASK. その時間でタスク1個できたぞ。',
    'TIME THIEF. 時間泥棒だ。気づけ。',
  ],
  badLong: [
    'YOU JUST LOST TO YOURSELF. 自分に負けた。',
    'HOURS GONE. それがお前の人生か？',
    'BIG LOSS. 大きな痛手だ。明日取り返せ。',
    'WEAKNESS WON. 記録して次は勝て。',
  ],
  recovery: [
    'YOU GOT BACK UP. それが強さだ。',
    'FALL. RISE. それが本物だ。',
    'CAUGHT UP. だが油断するな。',
    'RECOVERY MODE. 負けっぱなしじゃ終わらない。',
    'NEVER QUIT. 弱さに屈しなかった。',
  ],
  // 明日のタスク予約
  scheduled: [
    'PLAN AHEAD. 計画した。あとは実行だけだ。',
    'TOMORROW IS YOURS. 明日の自分にバトンを渡したな。',
    'COMMIT. 約束した。逃げるな。',
    'STRATEGIC MOVE. 賢い動きだ。だが実行が全てだ。',
  ],
  // 予約タスクを実行
  scheduledDone: [
    'PROMISE KEPT. 約束を守った。それが本物だ。',
    'YOU SHOWED UP. 昨日の自分に裏切らなかった。',
    'EXECUTED THE PLAN. 計画通り実行した。完璧だ。',
    'CONSISTENCY PAYS. 言ったことをやった。それが信用だ。',
  ],
  // 前倒し実行（明日のタスクを今日のうちに）
  earlyExecution: [
    'AHEAD OF SCHEDULE! 明日の自分に贈り物だ！',
    'CRUSHED IT EARLY. 予定より早い。最強だ。',
    'OVERACHIEVER. 言われる前にやった。それが超一流。',
    'FUTURE SELF WINS. 明日のお前が今日のお前に感謝してる。',
    'DOMINATING. 計画を超えた。それが本物の規律だ。',
  ],
};

const randomQuote = (key, exclude = null) => {
  const arr = QUOTES[key] || QUOTES.idle;
  if (arr.length === 1) return arr[0];
  let q;
  do {
    q = arr[Math.floor(Math.random() * arr.length)];
  } while (q === exclude);
  return q;
};

const getTodayStr = () => new Date().toDateString();

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
  
  // ダメな行為の開始ダイアログ
  const [badStartDialog, setBadStartDialog] = useState(null); // { categoryId, customMode, customLabel, customEmoji } | null
  const [badCustomMinutes, setBadCustomMinutes] = useState('');
  // ダメな行為の履歴（カスタム入力したものの候補）
  const [badHistory, setBadHistory] = useState([]); // [{label, emoji, usedAt}]
  
  // ボーナスポップアップ
  const [bonusPopup, setBonusPopup] = useState(null); // { items: [{label, points, color, emoji}], totalPoints }
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showBadSettings, setShowBadSettings] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [editingBadCat, setEditingBadCat] = useState(null);
  const [catForm, setCatForm] = useState({ label: '', emoji: '🎯', color: COLOR_OPTIONS[0].value });
  const [badCatForm, setBadCatForm] = useState({ label: '', emoji: '📱' });

  // データ読み込み
  useEffect(() => {
    const load = async () => {
      try {
        const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null; const result = stored ? { value: stored } : null;
        if (result && result.value) {
          const d = JSON.parse(result.value);
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
              newHistory = newHistory.slice(0, 30);

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

            setCategories(d.categories || DEFAULT_CATEGORIES);
            setBadCategories(d.badCategories || DEFAULT_BAD_CATEGORIES);
            // 未完了タスクは持ち越し。forTomorrow=trueだったタスクは「今日が予定日」になる
            setTasks((d.tasks || [])
              .filter(t => !t.completed && !t.failed)
              .map(t => t.forTomorrow ? { ...t, forTomorrow: false, scheduledFor: 'today' } : t)
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
            setCategories(d.categories || DEFAULT_CATEGORIES);
            setBadCategories(d.badCategories || DEFAULT_BAD_CATEGORIES);
            setTasks(d.tasks || []);
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
      setCoachQuote(randomQuote('idle'));
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
          todayRecoveryTotal, damageHealed, activeTaskTimer, sleepGoal
        }));
      } catch (e) { console.error(e); }
    })();
  }, [categories, badCategories, tasks, todayPower, totalPower, bestDay, yesterdayPower, currentDate, streak, winCount, lossCount, history, opponentType, wakeTime, sleepTime, failedCount, taskCombos, taskMaxDurations, taskHistory, activeBadTask, badHistory, todayDamages, todayDamageTotal, todayRecoveryTotal, damageHealed, activeTaskTimer, sleepGoal, isLoading]);

  // ダメタスクのタイマー（秒単位でリアルタイム更新＋通知）
  useEffect(() => {
    if (!activeBadTask) { setCurrentBadTimer(0); setCurrentBadSeconds(0); return; }
    const limitSec = (activeBadTask.limitMinutes || 0) * 60;
    let warned = false, over = false;
    const notify = (title, body) => {
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
    setCoachQuote(randomQuote(key, coachQuote));
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

  // タスクが今日のポイントに加えた分（削除・失敗・取り消し時に差し引く用）
  const reversibleTaskPoints = (t) => (t.completed ? (t.powerEarned || 0) : 0) + (t.partialDone ? (t.partialPower || 0) : 0) + (t.planBonus || 0);

  const addTask = (forTomorrow = false) => {
    if (!newTask.trim() || categories.length === 0) return;
    const task = {
      id: Date.now().toString(),
      text: newTask.trim(),
      categoryId: newCategoryId,
      difficulty: newDifficulty,
      completed: false,
      forTomorrow,
      planBonus: forTomorrow ? 5 : 0,
    };
    setTasks([task, ...tasks]);
    addToHistory(newTask, newCategoryId, newDifficulty);
    setNewTask('');
    
    if (forTomorrow) {
      // 計画ボーナス +5 PWR
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
    // 着手ボーナス（初回スタート時のみ）
    const t = tasks.find(x => x.id === id);
    if (t && !t.partialDone && !t.completed) {
      const startBonus = Math.max(2, Math.round(DIFFICULTIES[t.difficulty].power * 0.2));
      setTodayPower(todayPower + startBonus);
      setTotalPower(totalPower + startBonus);
      setTasks(tasks.map(x => x.id === id ? { ...x, partialDone: true, partialPower: startBonus } : x));
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
    completeTask(activeTaskTimer.taskId, elapsed);
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
    
    // 予約タスク実行ボーナス（昨日予約 → 今日実行）
    const scheduledBonus = t.scheduledFor === 'today' ? 10 : 0;
    
    // 前倒しボーナス（明日予約のタスクを今日のうちに実行）
    const earlyBonus = t.forTomorrow ? 15 : 0;
    
    const finalPower = taskPower + recovery + scheduledBonus + earlyBonus;

    const newTodayPower = todayPower + finalPower;
    const newTotalPower = totalPower + finalPower;
    const oppPower = opponent.power;
    const wasLosing = oppPower > 0 && todayPower < oppPower;
    const nowWinning = newTodayPower >= oppPower;
    const newBestCheck = newTodayPower > bestDay.power;

    setTodayPower(newTodayPower);
    setTotalPower(newTotalPower);
    setTasks(tasks.map(x => x.id === id ? {
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
    } : x));
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

  // 未完了で終了 — 着手ボーナスを付与し、タスクは一覧に残す（完了にはしない）
  const partialComplete = (id) => {
    const t = tasks.find(x => x.id === id);
    if (!t || t.completed) return;
    if (activeTaskTimer && activeTaskTimer.taskId === id) setActiveTaskTimer(null);
    if (t.partialDone) return;
    const partialPower = Math.max(2, Math.round(DIFFICULTIES[t.difficulty].power * 0.2));
    setTodayPower(todayPower + partialPower);
    setTotalPower(totalPower + partialPower);
    setTasks(tasks.map(x => x.id === id ? { ...x, partialDone: true, partialPower } : x));
    triggerCoach('smallWin');
  };

  const failTask = (id) => {
    const t = tasks.find(x => x.id === id);
    if (!t || t.completed || t.failed) return;
    if (activeTaskTimer && activeTaskTimer.taskId === id) setActiveTaskTimer(null);
    const rev = reversibleTaskPoints(t);
    if (rev !== 0) { setTodayPower(todayPower - rev); setTotalPower(totalPower - rev); }
    setTasks(tasks.map(x => x.id === id ? { ...x, failed: true, partialDone: false, planBonus: 0 } : x));
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

  const deleteCompletedTask = (id) => {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    if (!confirm('この完了タスクを削除？獲得ポイントも取り消されます')) return;
    const rev = reversibleTaskPoints(t);
    setTodayPower(todayPower - rev);
    setTotalPower(totalPower - rev);
    setTasks(tasks.filter(x => x.id !== id));
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
    const totalDamage = damage + overPenalty;
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
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
    }, ...todayDamages]);
    setTodayDamageTotal(todayDamageTotal + totalDamage);
    setTodayPower(todayPower - totalDamage);
    setTotalPower(totalPower - totalDamage);
    setActiveBadTask(null);
    
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

  const activeTasks = tasks.filter(t => !t.completed && !t.failed);
  const completedTasks = tasks.filter(t => t.completed);
  const failedTasks = tasks.filter(t => t.failed);

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
            <div className="text-4xl flex-shrink-0">{coachIntense ? '😤' : '👨🏿‍🦲'}</div>
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
                <div className={`mt-3 rounded-xl border py-2 text-center text-sm font-bold ${diff >= 0 ? 'border-green-700 bg-green-950/40 text-green-400' : 'border-red-800 bg-red-950/40 text-red-400'}`}>
                  {yesterdayPower === 0 ? '初日 — 基準を作れ' : diff >= 0 ? `▲ 今日が +${diff} リードしている` : `▼ 昨日に ${Math.abs(diff)} 負けている`}
                </div>
              </>
            );
          })()}
        </div>

        {/* 今日のバランス（プラス / マイナス） */}
        <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          {(() => {
            const evts = [];
            tasks.forEach(t => {
              if (t.completed) evts.push({ label: t.text, points: (t.powerEarned || 0) + (t.partialDone ? (t.partialPower || 0) : 0) });
              else if (t.partialDone) evts.push({ label: t.text + '（着手）', points: t.partialPower || 0 });
            });
            if (wakeTime) evts.push({ label: `${wakeTime.time} 起床`, points: wakeTime.power || 0 });
            if (sleepTime) evts.push({ label: `${sleepTime.time} 就寝`, points: sleepTime.power || 0 });
            todayDamages.forEach(d => { const disp = getBadDisplay(d); evts.push({ label: `${disp.emoji} ${disp.label} ${formatDuration(d.minutes)}`, points: -(d.damage || 0) }); });
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
                      {plusTotal >= minusTotal
                        ? <span className="text-green-400 font-bold">プラス優勢 — 差 +{plusTotal - minusTotal}</span>
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
            <div className="flex gap-2">
              <button onClick={() => addTask(false)} disabled={!newTask.trim()} className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black tracking-wider py-3 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-95 shadow-md">
                ➕ 今日のタスク
              </button>
              <button onClick={() => addTask(true)} disabled={!newTask.trim()} className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black tracking-wider py-3 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-95 shadow-md flex items-center justify-center gap-1">
                <CalendarPlus className="w-4 h-4" />
                明日 +5
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
          {/* 明日のタスク（予約） */}
          {activeTasks.filter(t => t.forTomorrow).length > 0 && (
            <div className="mb-2">
              <div className="text-xs text-cyan-300 tracking-[0.2em] mb-2 font-black uppercase flex items-center gap-1.5 px-1">
                <CalendarPlus className="w-3.5 h-3.5" />
                明日やる予定 ({activeTasks.filter(t => t.forTomorrow).length}) 
                <span className="text-yellow-400 text-[10px] ml-auto">⚡ 今やると+15ボーナス</span>
              </div>
              {activeTasks.filter(t => t.forTomorrow).map(task => {
                const cat = getCategory(task.categoryId);
                const diff = DIFFICULTIES[task.difficulty];
                return (
                  <div key={task.id} className="bg-gradient-to-br from-blue-900/40 to-cyan-900/30 border-2 border-blue-600/60 rounded-xl p-3 flex items-center gap-2 mb-2">
                    <button onClick={() => completeTask(task.id)} className="w-9 h-9 rounded-lg border-2 border-cyan-500 hover:border-yellow-400 hover:bg-yellow-500/20 bg-blue-800/50 flex items-center justify-center transition active:scale-90 flex-shrink-0" title="今すぐ実行（前倒しボーナス+15）">
                      <Check className="w-4 h-4 text-cyan-300" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-cyan-50 break-words tracking-wide">{task.text}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded bg-gradient-to-r ${cat.color} text-white font-bold`}>{cat.emoji} {cat.label}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded border border-cyan-600 text-cyan-200 font-black tracking-wider">明日: +{diff.power}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500 text-black font-black tracking-wider">⚡ 今やる +15</span>
                      </div>
                    </div>
                    <button onClick={() => deleteTask(task.id)} className="p-1 text-cyan-700 hover:text-red-400 flex-shrink-0" title="削除">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {activeTasks.filter(t => !t.forTomorrow).map(task => {
            const cat = getCategory(task.categoryId);
            const diff = DIFFICULTIES[task.difficulty];
            const key = getTaskKey(task.text, task.categoryId);
            const currentCombo = taskCombos[key]?.count || 0;
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            const nextCombo = taskCombos[key]?.lastDate === yesterday ? currentCombo + 1 : (taskCombos[key]?.lastDate === getTodayStr() ? currentCombo : 1);
            const bonus = getComboBonus(nextCombo);
            const projectedPower = Math.round(diff.power * bonus.mult) + (task.scheduledFor === 'today' ? 10 : 0);
            const isTiming = activeTaskTimer?.taskId === task.id;
            const isScheduled = task.scheduledFor === 'today';
            return (
              <div key={task.id} className={`bg-zinc-950 border ${isTiming ? 'border-white' : isScheduled ? 'border-cyan-700' : 'border-zinc-800'} rounded-xl p-3 flex items-center gap-2`}>
                <button onClick={() => completeTask(task.id)} disabled={isTiming} className="w-9 h-9 rounded-lg border-2 border-zinc-700 hover:border-white hover:bg-white/5 flex items-center justify-center transition active:scale-90 flex-shrink-0 disabled:opacity-30" title="完了">
                  <Check className="w-4 h-4 text-zinc-600" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white break-words tracking-wide">{task.text}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {isScheduled && <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-700 text-white font-black tracking-wider uppercase">📅 予約済み</span>}
                    <span className={`text-[9px] px-1.5 py-0.5 rounded bg-gradient-to-r ${cat.color} text-white font-bold`}>{cat.emoji} {cat.label}</span>
                    {task.partialDone && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-900/50 border border-amber-700 text-amber-300 font-bold">着手 +{task.partialPower}</span>}
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
                        <span className="text-sm text-green-400 font-black">残り {formatDuration(remaining)}</span>
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
            <button onClick={recordSleep} className={`border-2 rounded-xl p-3 text-left transition active:scale-95 ${sleepTime ? 'bg-zinc-950 border-white' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-600'}`}>
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
            <button onClick={recordWakeUp} className={`border-2 rounded-xl p-3 text-left transition active:scale-95 ${wakeTime ? 'bg-zinc-950 border-white' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-600'}`}>
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
              <div className="text-xs text-zinc-400 mb-4">宣言した時間をオーバーすると追加ペナルティ</div>
              
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
                        <div className={`text-sm font-black tracking-wider ${h.won ? 'text-green-400' : 'text-red-400'}`}>{h.won ? '⚔️ WIN' : '☠️ LOSS'}</div>
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
