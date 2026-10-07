// خداع: جريمة قتل في عمارة 64 — خادم اللعب الجماعي
// كل لاعب يدخل من جواله برمز الغرفة، والخادم يحفظ حالة اللعبة ويرسل لكل لاعب ما يحق له رؤيته فقط.

const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { pingInterval: 20000, pingTimeout: 25000 });

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/health", (req, res) => res.send("ok"));

/* ───────────── بيانات البطاقات ───────────── */
const parse = (s, prefix) =>
  s.split(",").map((x, i) => {
    const [ar, en] = x.split("|");
    return { id: prefix + i, ar: ar.trim(), en: en.trim() };
  });
const opts = (s) => parse(s, "o");

const MEANS = parse(
  "سم|Poison,سكين|Knife,حبل|Rope,مسدس|Pistol,مطرقة|Hammer,مقص|Scissors,حقنة|Syringe,وسادة|Pillow,زجاجة مكسورة|Broken Bottle,طوبة|Brick,سلك كهربائي|Electric Wire,فأس|Axe,خنجر|Dagger,كيس بلاستيك|Plastic Bag,مفتاح ربط|Wrench,صعق كهربائي|Electric Shock,ماء|Water,نار|Fire,شمعدان|Candlestick,سلسلة|Chain,حزام|Belt,وشاح|Scarf,ربطة عنق|Necktie,عتلة|Crowbar,مضرب غولف|Golf Club,مضرب بيسبول|Baseball Bat,موس حلاقة|Razor,قوس وسهم|Bow & Arrow,معول ثلج|Ice Pick,عيدان أكل|Chopsticks,حبوب منومة|Sleeping Pills,مبيد حشري|Pesticide,سيارة|Car,دفع من مرتفع|Push from Height,متفجرات|Explosives,أفعى|Snake,دمبل|Dumbbell,حجر|Rock,مزهرية|Vase,مكواة|Iron,ساطور|Cleaver,مقلاة|Frying Pan,غاز سام|Toxic Gas,مخدر|Anesthetic,إبرة خياطة|Sewing Needle,منشار|Saw,مجرفة|Shovel,سيف|Sword,مبيض|Bleach",
  "m"
);

const EVIDENCE = parse(
  "بصمة إصبع|Fingerprint,أحمر شفاه|Lipstick,عقب سيجارة|Cigarette Butt,شعرة|Hair,أثر حذاء|Shoe Print,زر|Button,خاتم|Ring,ساعة يد|Wristwatch,نظارة|Glasses,مفتاح|Key,إيصال|Receipt,رسالة|Letter,صورة|Photo,هاتف|Phone,عملة معدنية|Coin,تذكرة|Ticket,قفاز|Glove,قناع|Mask,بقعة دم|Blood Stain,طين|Mud,رمل|Sand,عطر|Perfume,كوب شاي|Teacup,مذكرات|Diary,خريطة|Map,قرط|Earring,ضمادة|Bandage,باروكة|Wig,ولاعة|Lighter,صحيفة|Newspaper,ريشة|Feather,وردة|Rose,حلوى|Candy,نرد|Dice,ورقة لعب|Playing Card,تقويم|Calendar,منديل|Tissue,قلادة|Necklace,دمية|Doll,حبر|Ink,طلاء|Paint,أرز|Rice,بطاقة مواصلات|Transit Card,بطاقة عمل|Business Card,دواء|Medicine,شريط لاصق|Tape,طباشير|Chalk,قبعة|Hat,سلسلة مفاتيح|Keychain,فاتورة كهرباء|Electric Bill,فانوس|Lantern,بطاقة مصعد|Elevator Card",
  "e"
);

const CAUSE = opts("اختناق|Suffocation,إصابة بالغة|Severe Injury,نزيف|Loss of Blood,مرض|Illness,تسمم|Poisoning,حادث|Accident");

const LOCATIONS = [
  { id: "L1", ar: "الشقة", en: "Apartment", opts: opts("غرفة المعيشة|Living Room,غرفة النوم|Bedroom,المخزن|Storeroom,الحمام|Bathroom,المطبخ|Kitchen,الشرفة|Balcony") },
  { id: "L2", ar: "مرافق العمارة", en: "Building Facilities", opts: opts("المصعد|Elevator,الدرج|Stairwell,المدخل|Lobby,القبو|Basement,غرفة الكهرباء|Electrical Room,غرفة الحارس|Guard Room") },
  { id: "L3", ar: "حول العمارة", en: "Around the Building", opts: opts("السطح|Rooftop,المواقف|Parking,خزان الماء|Water Tank,حاوية النفايات|Dumpster,البقالة|Grocery,الشارع|Street") },
  { id: "L4", ar: "خارج الحي", en: "Outside the District", opts: opts("مكتب|Office,مستشفى|Hospital,مطعم|Restaurant,حديقة|Park,سوق|Market,مستودع|Warehouse") },
];

const SCENES = [
  { id: "S1", ar: "حالة الجثة", en: "State of the Body", opts: opts("لا تزال دافئة|Still Warm,متيبسة|Stiff,متحللة|Decayed,ناقصة|Incomplete,سليمة|Intact,ملتوية|Twisted") },
  { id: "S2", ar: "تعابير الضحية", en: "Victim's Expression", opts: opts("هادئة|Peaceful,مقاومة|Struggling,خائفة|Fearful,متألمة|In Pain,فارغة|Blank,غاضبة|Angry") },
  { id: "S3", ar: "الطقس", en: "Weather", opts: opts("مشمس|Sunny,عاصف|Stormy,جاف|Dry,رطب|Humid,بارد|Cold,حار|Hot") },
  { id: "S4", ar: "وقت الوفاة", en: "Time of Death", opts: opts("الفجر|Dawn,الصباح|Morning,الظهر|Noon,العصر|Afternoon,المساء|Evening,منتصف الليل|Midnight") },
  { id: "S5", ar: "مدة الجريمة", en: "Duration of Crime", opts: opts("لحظية|Instant,قصيرة|Brief,تدريجية|Gradual,مطولة|Prolonged,عدة أيام|Few Days,مجهولة|Unknown") },
  { id: "S6", ar: "هوية الضحية", en: "Victim's Identity", opts: opts("طفل|Child,شاب|Youth,متوسط العمر|Middle-aged,مسن|Elderly,ذكر|Male,أنثى|Female") },
  { id: "S7", ar: "أثر على الجثة", en: "Hint on Corpse", opts: opts("الرأس|Head,الصدر|Chest,اليد|Hand,الساق|Leg,جزئي|Partial,كامل الجسد|All Over") },
  { id: "S8", ar: "ملابس الضحية", en: "Victim's Clothes", opts: opts("مرتبة|Neat,غير مرتبة|Untidy,فاخرة|Elegant,رثة|Shabby,غريبة|Bizarre,زي رسمي|Uniform") },
  { id: "S9", ar: "العلاقة الاجتماعية", en: "Social Relationship", opts: opts("أقارب|Relatives,أصدقاء|Friends,زملاء|Colleagues,جيران|Neighbors,أحباء|Lovers,غرباء|Strangers") },
  { id: "S10", ar: "حدث مفاجئ", en: "Sudden Incident", opts: opts("انقطاع الكهرباء|Power Failure,حريق|Fire,شجار|Conflict,فقدان غرض|Lost Item,صرخة|Scream,لا شيء|Nothing") },
  { id: "S11", ar: "أثر في المسرح", en: "Trace at the Scene", opts: opts("بصمات|Fingerprints,آثار أقدام|Footprints,كدمة|Bruise,بقعة دم|Blood Stain,سوائل|Body Fluid,ندبة|Scar") },
  { id: "S12", ar: "لاحظه الجيران", en: "Noticed by Neighbors", opts: opts("صوت|Sound,رائحة|Smell,ضوء|Light,حركة|Movement,ظل|Shadow,لا شيء|Nothing") },
  { id: "S13", ar: "الدافع", en: "Motive", opts: opts("كراهية|Hatred,سلطة|Power,مال|Money,حب|Love,غيرة|Jealousy,عدالة|Justice") },
  { id: "S14", ar: "بنية الضحية", en: "Victim's Build", opts: opts("ضخم|Large,نحيل|Thin,طويل|Tall,قصير|Short,مشوّه|Disfigured,رياضي|Fit") },
  { id: "S15", ar: "الانطباع العام", en: "General Impression", opts: opts("عادي|Common,مبتكر|Creative,مريب|Fishy,قاسٍ|Cruel,مرعب|Horrible,غامض|Suspenseful") },
  { id: "S16", ar: "ما كان يجري", en: "In Progress", opts: opts("ترفيه|Entertainment,استرخاء|Relaxation,تجمّع|Assembly,تجارة|Trading,زيارة|Visit,وجبة|Meal") },
];

/* ───────────── أدوات ───────────── */
const shuffle = (a) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};
const clean = (s) => String(s || "").replace(/\s+/g, " ").trim().slice(0, 20);
const clamp = (n, a, b) => Math.max(a, Math.min(b, Math.round(Number(n) || 0)));
const ROUNDS = ["r1", "r2", "r3"];

const rooms = new Map(); // code -> room
const socks = new Map(); // socket.id -> { code, pid }
let eventSeq = 0;

function newCode() {
  let c;
  do c = String(1000 + Math.floor(Math.random() * 9000));
  while (rooms.has(c));
  return c;
}

function makeRoom() {
  const code = newCode();
  const room = {
    code,
    hostId: null,
    players: [],
    opts: { accomplice: false, witness: false, fsId: null },
    phase: "lobby",
    solution: null,
    board: null,
    log: [],
    winner: null,
    event: null,
    witnessPair: [],
    timer: { total: 180, endsAt: null, remaining: 180 },
    touched: Date.now(),
  };
  rooms.set(code, room);
  return room;
}

const addLog = (room, t) => {
  room.log.push(t);
  if (room.log.length > 80) room.log.shift();
};
const finish = (room, side, reason) => {
  room.winner = { side, reason };
  room.phase = "end";
  room.timer.endsAt = null;
  addLog(room, side === "murderer" ? "فاز القاتل" : "فاز المحققون");
};

/* ما يراه كل لاعب: المعلومات العامة + أسراره هو فقط */
function view(room, pid) {
  const me = room.players.find((p) => p.id === pid);
  const mur = room.players.find((p) => p.role === "murderer");
  const acc = room.players.find((p) => p.role === "accomplice");
  const ended = room.phase === "end";
  const caught = room.phase === "witness";

  const my = { role: me ? me.role : null };
  if (me && room.phase !== "lobby") {
    if (me.role === "accomplice") my.murderer = mur && mur.name;
    if (me.role === "witness") my.pair = room.witnessPair;
    if (me.role === "murderer") my.solution = room.solution;
    if (me.role === "forensic") {
      my.solution = room.solution;
      my.murderer = mur && mur.name;
    }
  }

  const b = room.board;
  return {
    code: room.code,
    me: pid,
    hostId: room.hostId,
    phase: room.phase,
    opts: room.opts,
    serverNow: Date.now(),
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      connected: p.connected,
      badge: p.badge,
      ready: p.ready,
      means: p.means,
      evidence: p.evidence,
      role:
        p.id === pid || ended || p.role === "forensic" || (caught && (p.role === "murderer" || p.role === "accomplice"))
          ? p.role
          : null,
    })),
    board: b && { cause: b.cause, locTile: b.locTile, loc: b.loc, scenes: b.scenes, replaced: b.replaced, poolLeft: b.pool.length },
    timer: room.timer,
    log: room.log,
    winner: room.winner,
    event: room.event,
    my,
    solutionSet: !!room.solution,
    solution: ended ? room.solution : null,
    witnessCandidates:
      caught && me && (me.role === "murderer" || me.role === "accomplice")
        ? room.players.filter((p) => !["forensic", "murderer", "accomplice"].includes(p.role)).map((p) => ({ id: p.id, name: p.name }))
        : null,
    caught: caught ? { murderer: mur && mur.name, accomplice: acc ? acc.name : null } : null,
  };
}

function broadcast(room) {
  room.touched = Date.now();
  for (const p of room.players) if (p.socketId) io.to(p.socketId).emit("state", view(room, p.id));
}

function resetToLobby(room) {
  room.phase = "lobby";
  room.solution = null;
  room.board = null;
  room.winner = null;
  room.event = null;
  room.witnessPair = [];
  room.timer.endsAt = null;
  room.timer.remaining = room.timer.total;
  for (const p of room.players) Object.assign(p, { role: null, means: [], evidence: [], badge: false, ready: false });
}

function startGame(room) {
  const n = room.players.length;
  if (n < 4 || n > 12) return { error: "عدد اللاعبين يجب أن يكون بين 4 و12" };
  const o = room.opts;
  const useAcc = o.accomplice && n >= 6;
  const useWit = o.witness && n >= 6;

  const fs = room.players.find((p) => p.id === o.fsId) || room.players[Math.floor(Math.random() * n)];
  const others = room.players.filter((p) => p !== fs);
  const roles = ["murderer"];
  if (useAcc) roles.push("accomplice");
  if (useWit) roles.push("witness");
  while (roles.length < others.length) roles.push("investigator");
  const r = shuffle(roles);
  const m = shuffle(MEANS);
  const e = shuffle(EVIDENCE);

  Object.assign(fs, { role: "forensic", means: [], evidence: [], badge: false, ready: false });
  others.forEach((p, k) =>
    Object.assign(p, { role: r[k], means: m.slice(k * 4, k * 4 + 4), evidence: e.slice(k * 4, k * 4 + 4), badge: true, ready: false })
  );

  const sc = shuffle(SCENES);
  room.board = {
    cause: null,
    locTile: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
    loc: null,
    scenes: sc.slice(0, 4).map((t) => ({ tile: t, mark: null })),
    pool: sc.slice(4),
    replaced: { r2: false, r3: false },
  };
  const mur = room.players.find((p) => p.role === "murderer");
  const acc = room.players.find((p) => p.role === "accomplice");
  room.witnessPair = shuffle([mur.name, acc && acc.name].filter(Boolean));
  room.solution = null;
  room.log = [];
  room.winner = null;
  room.event = null;
  room.timer = { total: room.timer.total, endsAt: null, remaining: room.timer.total };
  room.phase = "night";
  addLog(room, `بدأت اللعبة. فني مسرح الجريمة: ${fs.name}`);
  return {};
}

function beginRound1(room) {
  room.phase = "r1";
  addLog(room, "بدأت الجولة الأولى");
}

/* ───────────── الاتصالات ───────────── */
io.on("connection", (socket) => {
  const handle = (ev, fn) =>
    socket.on(ev, (data, cb) => {
      cb = typeof cb === "function" ? cb : () => {};
      try {
        const r = fn(data && typeof data === "object" ? data : {}) || {};
        cb(r.error ? r : { ok: true, ...r });
      } catch (err) {
        console.error(ev, err);
        cb({ error: "حدث خطأ غير متوقع" });
      }
    });

  const ctx = () => {
    const s = socks.get(socket.id);
    if (!s) return {};
    const room = rooms.get(s.code);
    const me = room && room.players.find((p) => p.id === s.pid);
    return room && me ? { room, me } : {};
  };
  const NO_ROOM = { error: "لست داخل غرفة" };
  const isHost = (room, me) => room.hostId === me.id;

  function detach() {
    const s = socks.get(socket.id);
    if (!s) return;
    socks.delete(socket.id);
    const room = rooms.get(s.code);
    const p = room && room.players.find((x) => x.id === s.pid);
    if (p && p.socketId === socket.id) {
      p.socketId = null;
      p.connected = false;
      broadcast(room);
    }
  }

  function attach(room, name, pid) {
    if (!pid || typeof pid !== "string") return { error: "معرّف غير صالح" };
    let p = room.players.find((x) => x.id === pid);
    if (!p) {
      if (room.phase !== "lobby") return { error: "اللعبة بدأت بالفعل في هذه الغرفة" };
      if (room.players.length >= 12) return { error: "الغرفة ممتلئة (12 لاعبًا)" };
      if (!name) return { error: "اكتب اسمك أولًا" };
      let finalName = name;
      let k = 2;
      while (room.players.some((x) => x.name === finalName)) finalName = `${name} ${k++}`;
      p = { id: pid, name: finalName, socketId: null, connected: false, role: null, means: [], evidence: [], badge: false, ready: false };
      room.players.push(p);
    }
    const cur = socks.get(socket.id);
    if (cur && (cur.code !== room.code || cur.pid !== pid)) detach();
    if (p.socketId && p.socketId !== socket.id) {
      const old = io.sockets.sockets.get(p.socketId);
      socks.delete(p.socketId);
      if (old) old.emit("replaced");
    }
    p.socketId = socket.id;
    p.connected = true;
    socks.set(socket.id, { code: room.code, pid });
    if (!room.hostId || !room.players.some((x) => x.id === room.hostId)) room.hostId = pid;
    broadcast(room);
    return { code: room.code };
  }

  handle("create", ({ name, playerId }) => {
    name = clean(name);
    if (!name) return { error: "اكتب اسمك أولًا" };
    return attach(makeRoom(), name, playerId);
  });

  handle("join", ({ code, name, playerId }) => {
    const room = rooms.get(String(code || "").trim());
    if (!room) return { error: "الغرفة غير موجودة. تأكد من الرمز" };
    return attach(room, clean(name), playerId);
  });

  handle("leave", () => {
    const { room, me } = ctx();
    if (!room) return {};
    socks.delete(socket.id);
    if (room.phase === "lobby") {
      room.players = room.players.filter((p) => p !== me);
      if (room.hostId === me.id) room.hostId = (room.players.find((p) => p.connected) || room.players[0] || {}).id || null;
      if (!room.players.length) rooms.delete(room.code);
    } else {
      me.socketId = null;
      me.connected = false;
    }
    if (rooms.has(room.code)) broadcast(room);
    return {};
  });

  handle("setOpts", ({ accomplice, witness, fsId }) => {
    const { room, me } = ctx();
    if (!room) return NO_ROOM;
    if (!isHost(room, me)) return { error: "الإعدادات للمضيف فقط" };
    if (room.phase !== "lobby") return { error: "لا يمكن تغيير الإعدادات أثناء اللعب" };
    room.opts = {
      accomplice: !!accomplice,
      witness: !!witness,
      fsId: room.players.some((p) => p.id === fsId) ? fsId : null,
    };
    broadcast(room);
    return {};
  });

  handle("kick", ({ pid }) => {
    const { room, me } = ctx();
    if (!room) return NO_ROOM;
    if (!isHost(room, me) || room.phase !== "lobby" || pid === me.id) return { error: "غير مسموح" };
    const p = room.players.find((x) => x.id === pid);
    if (!p) return {};
    if (p.socketId) {
      io.to(p.socketId).emit("kicked");
      socks.delete(p.socketId);
    }
    room.players = room.players.filter((x) => x !== p);
    if (room.opts.fsId === pid) room.opts.fsId = null;
    broadcast(room);
    return {};
  });

  handle("start", () => {
    const { room, me } = ctx();
    if (!room) return NO_ROOM;
    if (!isHost(room, me)) return { error: "المضيف فقط يبدأ اللعبة" };
    if (room.phase !== "lobby" && room.phase !== "end") return { error: "اللعبة جارية" };
    const r = startGame(room);
    if (r.error) return r;
    broadcast(room);
    return {};
  });

  handle("pickSolution", ({ meansId, evidenceId }) => {
    const { room, me } = ctx();
    if (!room) return NO_ROOM;
    if (room.phase !== "night" || me.role !== "murderer") return { error: "غير مسموح" };
    const means = me.means.find((c) => c.id === meansId);
    const evidence = me.evidence.find((c) => c.id === evidenceId);
    if (!means || !evidence) return { error: "اختر أداة ودليلًا من بطاقاتك" };
    room.solution = { means, evidence };
    broadcast(room);
    return {};
  });

  handle("ready", () => {
    const { room, me } = ctx();
    if (!room) return NO_ROOM;
    if (room.phase !== "night") return {};
    if (me.role === "murderer" && !room.solution) return { error: "اختر الأداة والدليل أولًا" };
    me.ready = true;
    if (room.solution && room.players.every((p) => p.ready)) beginRound1(room);
    broadcast(room);
    return {};
  });

  handle("forceStart", () => {
    const { room, me } = ctx();
    if (!room) return NO_ROOM;
    if (!isHost(room, me) || room.phase !== "night") return { error: "غير مسموح" };
    if (!room.solution) return { error: "القاتل لم يختر بعد" };
    beginRound1(room);
    broadcast(room);
    return {};
  });

  handle("mark", ({ tile, value }) => {
    const { room, me } = ctx();
    if (!room) return NO_ROOM;
    if (me.role !== "forensic" || !ROUNDS.includes(room.phase)) return { error: "فني مسرح الجريمة فقط يضع العلامات" };
    const v = value === null || value === undefined ? null : clamp(value, 0, 5);
    const b = room.board;
    if (tile === "cause") b.cause = v;
    else if (tile === "loc") b.loc = v;
    else if (Number.isInteger(tile) && b.scenes[tile]) b.scenes[tile].mark = v;
    else return { error: "بطاقة غير صالحة" };
    broadcast(room);
    return {};
  });

  handle("replace", ({ index }) => {
    const { room, me } = ctx();
    if (!room) return NO_ROOM;
    const b = room.board;
    if (me.role !== "forensic" || !(room.phase === "r2" || room.phase === "r3")) return { error: "الاستبدال في الجولة 2 و3 فقط" };
    if (b.replaced[room.phase]) return { error: "استبدلت بطاقة في هذه الجولة" };
    if (!b.scenes[index] || !b.pool.length) return { error: "لا يمكن الاستبدال" };
    const old = b.scenes[index].tile;
    const nt = b.pool.shift();
    b.scenes[index] = { tile: nt, mark: null };
    b.replaced[room.phase] = true;
    addLog(room, `الفني استبدل «${old.ar}» بـ«${nt.ar}»`);
    broadcast(room);
    return {};
  });

  handle("advance", () => {
    const { room, me } = ctx();
    if (!room) return NO_ROOM;
    if (me.role !== "forensic" && !isHost(room, me)) return { error: "الفني أو المضيف فقط" };
    if (room.phase === "r1") room.phase = "r2";
    else if (room.phase === "r2") room.phase = "r3";
    else if (room.phase === "r3") finish(room, "murderer", "انتهت الجولات الثلاث دون اتهام صحيح.");
    else return {};
    if (room.phase === "r2" || room.phase === "r3") addLog(room, `بدأت ${room.phase === "r2" ? "الجولة الثانية" : "الجولة الثالثة"}`);
    room.timer.endsAt = null;
    room.timer.remaining = room.timer.total;
    broadcast(room);
    return {};
  });

  handle("timer", ({ action, seconds, delta }) => {
    const { room, me } = ctx();
    if (!room) return NO_ROOM;
    if (me.role !== "forensic" && !isHost(room, me)) return { error: "التحكم بالمؤقت للفني أو المضيف" };
    const t = room.timer;
    const now = Date.now();
    const rem = () => (t.endsAt ? Math.max(0, Math.ceil((t.endsAt - now) / 1000)) : t.remaining);
    if (action === "set") {
      t.total = clamp(seconds, 15, 1200);
      t.endsAt = null;
      t.remaining = t.total;
    } else if (action === "adjust") {
      t.total = clamp(t.total + (Number(delta) || 0), 15, 1200);
      if (!t.endsAt) t.remaining = t.total;
    } else if (action === "start") {
      let r = rem();
      if (r <= 0) r = t.total;
      t.remaining = r;
      t.endsAt = now + r * 1000;
    } else if (action === "pause") {
      t.remaining = rem();
      t.endsAt = null;
    } else if (action === "reset") {
      t.endsAt = null;
      t.remaining = t.total;
    }
    broadcast(room);
    return {};
  });

  handle("accuse", ({ targetId, meansId, evidenceId }) => {
    const { room, me } = ctx();
    if (!room) return NO_ROOM;
    if (!ROUNDS.includes(room.phase)) return { error: "لا يمكن الاتهام الآن" };
    if (me.role === "forensic") return { error: "فني مسرح الجريمة لا يتّهم" };
    if (!me.badge) return { error: "استخدمت شارة الاتهام" };
    const t = room.players.find((p) => p.id === targetId);
    if (!t || t.role === "forensic" || t.id === me.id) return { error: "اختر مشتبهًا صالحًا" };
    const mc = t.means.find((c) => c.id === meansId);
    const ec = t.evidence.find((c) => c.id === evidenceId);
    if (!mc || !ec) return { error: "اختر أداة ودليلًا" };

    const correct = t.role === "murderer" && room.solution.means.id === mc.id && room.solution.evidence.id === ec.id;
    const text = `${me.name} اتّهم ${t.name} بـ«${mc.ar}» و«${ec.ar}»`;
    addLog(room, `${text}: ${correct ? "صحيح" : "خطأ"}`);
    room.event = { id: ++eventSeq, kind: "accuse", text, ok: correct };

    if (correct) {
      const reason = `${me.name} كشف القاتل ${t.name} بالأداة والدليل الصحيحين.`;
      if (room.players.some((p) => p.role === "witness")) {
        room.winner = { side: "investigators", reason };
        room.phase = "witness";
        room.timer.endsAt = null;
      } else finish(room, "investigators", reason);
    } else {
      me.badge = false;
      const left = room.players.filter((p) => (p.role === "investigator" || p.role === "witness") && p.badge).length;
      if (left === 0) finish(room, "murderer", "استنفد المحققون كل شارات الاتهام دون كشف الحل.");
    }
    broadcast(room);
    return { correct };
  });

  handle("witnessGuess", ({ targetId }) => {
    const { room, me } = ctx();
    if (!room) return NO_ROOM;
    if (room.phase !== "witness" || !(me.role === "murderer" || me.role === "accomplice")) return { error: "غير مسموح" };
    const t = room.players.find((p) => p.id === targetId);
    if (!t || ["forensic", "murderer", "accomplice"].includes(t.role)) return { error: "اختيار غير صالح" };
    addLog(room, `${me.name} خمّن أن الشاهد هو ${t.name}`);
    if (t.role === "witness") {
      finish(room, "murderer", `كُشف القاتل، لكنه عرف أن ${t.name} هو الشاهد فانقلبت النتيجة.`);
    } else {
      const w = room.players.find((p) => p.role === "witness");
      finish(room, "investigators", `${room.winner.reason} وفشل القاتل في معرفة الشاهد (${w.name}).`);
    }
    broadcast(room);
    return {};
  });

  handle("newGame", () => {
    const { room, me } = ctx();
    if (!room) return NO_ROOM;
    if (!isHost(room, me)) return { error: "المضيف فقط" };
    resetToLobby(room);
    broadcast(room);
    return {};
  });

  socket.on("disconnect", () => {
    const s = socks.get(socket.id);
    socks.delete(socket.id);
    if (!s) return;
    const room = rooms.get(s.code);
    if (!room) return;
    const p = room.players.find((x) => x.id === s.pid);
    if (!p || p.socketId !== socket.id) return;
    p.socketId = null;
    p.connected = false;
    broadcast(room);
    // إذا خرج المضيف ولم يرجع خلال 30 ثانية، تنتقل الاستضافة لأول لاعب متصل
    if (room.hostId === p.id) {
      setTimeout(() => {
        if (!p.connected && room.hostId === p.id) {
          const n = room.players.find((x) => x.connected);
          if (n) {
            room.hostId = n.id;
            broadcast(room);
          }
        }
      }, 30000);
    }
  });
});

// تنظيف الغرف المهجورة كل 10 دقائق
setInterval(() => {
  const cutoff = Date.now() - 6 * 60 * 60 * 1000;
  for (const [code, room] of rooms)
    if (room.touched < cutoff && !room.players.some((p) => p.connected)) rooms.delete(code);
}, 10 * 60 * 1000).unref();

const PORT = process.env.PORT || 3000;
if (require.main === module) server.listen(PORT, () => console.log(`Deception server on :${PORT}`));

module.exports = { server, io, rooms };
