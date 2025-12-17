
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Search, Book, GraduationCap, Loader2, Volume2, ArrowRight, Lightbulb, ChevronRight, Menu, X, Zap, Table, ArrowLeft, Database, SearchIcon } from 'lucide-react';

// --- API Configuration ---
const MODEL_NAME = 'gemini-2.5-flash';
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// --- Types ---

interface WordForm {
  label: string;
  value: string;
}

interface VerbConjugation {
  tense: string; // Präsens, Präteritum, etc.
  ich: string;
  du: string;
  er_sie_es: string;
  wir: string;
  ihr: string;
  sie_Sie: string;
}

interface DictionaryEntry {
  word: string;
  pronunciation: string;
  partOfSpeech: string; // Noun, Verb, Adjective, Adverb, Pronoun, Question Word
  gender?: string; // m, f, n
  meanings: string[];
  level: string; // A1 - C2
  forms: WordForm[]; // Basic forms (Plural, etc.)
  mnemonic: string;
  examples: Array<{ de: string; cn: string }>;
  // New: Pre-loaded full conjugation data for verbs
  conjugations?: VerbConjugation[]; 
}

interface WikiTopic {
  id: string;
  title: string;
  description: string;
  content: string;
}

// --- Static Data (Expanded) ---

const STATIC_DB: DictionaryEntry[] = [
  // --- VERBS ---
  {
    word: "sein",
    pronunciation: "zaɪn",
    partOfSpeech: "Verb",
    meanings: ["是", "存在", "位于"],
    level: "A1",
    forms: [{ label: "Perfekt", value: "ist gewesen" }, { label: "Präteritum", value: "war" }],
    mnemonic: "Sein (是) 是最基础的存在。",
    examples: [{ de: "Ich bin müde.", cn: "我累了。" }, { de: "Er ist Lehrer.", cn: "他是老师。" }],
    conjugations: [
      { tense: "Präsens (现在时)", ich: "bin", du: "bist", er_sie_es: "ist", wir: "sind", ihr: "seid", sie_Sie: "sind" },
      { tense: "Präteritum (过去时)", ich: "war", du: "warst", er_sie_es: "war", wir: "waren", ihr: "wart", sie_Sie: "waren" },
    ]
  },
  {
    word: "haben",
    pronunciation: "ˈhaːbən",
    partOfSpeech: "Verb",
    meanings: ["有", "持有", "拥有"],
    level: "A1",
    forms: [{ label: "Perfekt", value: "hat gehabt" }, { label: "Präteritum", value: "hatte" }],
    mnemonic: "Haben 就像 'Hand' (手)，手里拿着就是拥有。",
    examples: [{ de: "Ich habe Hunger.", cn: "我饿了(我有饥饿感)。" }, { de: "Hast du Zeit?", cn: "你有时间吗？" }],
    conjugations: [
      { tense: "Präsens (现在时)", ich: "habe", du: "hast", er_sie_es: "hat", wir: "haben", ihr: "habt", sie_Sie: "haben" },
      { tense: "Präteritum (过去时)", ich: "hatte", du: "hattest", er_sie_es: "hatte", wir: "hatten", ihr: "hattet", sie_Sie: "hatten" },
    ]
  },
  {
    word: "wissen",
    pronunciation: "ˈvɪsn̩",
    partOfSpeech: "Verb",
    meanings: ["知道", "晓得"],
    level: "A1",
    forms: [{ label: "Perfekt", value: "hat gewusst" }, { label: "Präteritum", value: "wusste" }],
    mnemonic: "Wissen (Wit/Wise) - 有智慧的人就知道。注意变位是'Ich weiß'。",
    examples: [{ de: "Ich weiß es nicht.", cn: "我不知道。" }, { de: "Weißt du, wo er ist?", cn: "你知道他在哪吗？" }],
    conjugations: [
      { tense: "Präsens (现在时)", ich: "weiß", du: "weißt", er_sie_es: "weiß", wir: "wissen", ihr: "wisst", sie_Sie: "wissen" },
      { tense: "Präteritum (过去时)", ich: "wusste", du: "wusstest", er_sie_es: "wusste", wir: "wussten", ihr: "wusstet", sie_Sie: "wussten" },
    ]
  },
  {
    word: "gehen",
    pronunciation: "ˈɡeːən",
    partOfSpeech: "Verb",
    meanings: ["走", "去", "步行"],
    level: "A1",
    forms: [{ label: "Perfekt", value: "ist gegangen" }, { label: "Präteritum", value: "ging" }],
    mnemonic: "Gehen (Go) - 两人一起走。",
    examples: [{ de: "Wir gehen nach Hause.", cn: "我们回家。" }, { de: "Wie geht es dir?", cn: "你好吗(它走得如何)？" }],
    conjugations: [
      { tense: "Präsens (现在时)", ich: "gehe", du: "gehst", er_sie_es: "geht", wir: "gehen", ihr: "geht", sie_Sie: "gehen" },
      { tense: "Präteritum (过去时)", ich: "ging", du: "gingst", er_sie_es: "ging", wir: "gingen", ihr: "gingt", sie_Sie: "gingen" },
    ]
  },
  {
    word: "machen",
    pronunciation: "ˈmaxn",
    partOfSpeech: "Verb",
    meanings: ["做", "从事", "制作"],
    level: "A1",
    forms: [{ label: "Perfekt", value: "hat gemacht" }, { label: "Präteritum", value: "machte" }],
    mnemonic: "Machen (Make) - 妈妈在做饭。",
    examples: [{ de: "Was machst du?", cn: "你在做什么？" }, { de: "Das macht nichts.", cn: "没关系(这不做任何事)。" }],
    conjugations: [
      { tense: "Präsens (现在时)", ich: "mache", du: "machst", er_sie_es: "macht", wir: "machen", ihr: "macht", sie_Sie: "machen" },
      { tense: "Präteritum (过去时)", ich: "machte", du: "machtest", er_sie_es: "machte", wir: "machten", ihr: "machtet", sie_Sie: "machten" },
    ]
  },
  {
    word: "lernen",
    pronunciation: "ˈlɛʁnən",
    partOfSpeech: "Verb",
    meanings: ["学习", "学"],
    level: "A1",
    forms: [{ label: "Perfekt", value: "hat gelernt" }, { label: "Präteritum", value: "lernte" }],
    mnemonic: "Lernen (Learn) - 发音很像。",
    examples: [{ de: "Ich lerne Deutsch.", cn: "我在学德语。" }, { de: "Wir müssen für die Prüfung lernen.", cn: "我们要为考试复习。" }],
    conjugations: [
      { tense: "Präsens (现在时)", ich: "lerne", du: "lernst", er_sie_es: "lernt", wir: "lernen", ihr: "lernt", sie_Sie: "lernen" },
      { tense: "Präteritum (过去时)", ich: "lernte", du: "lerntest", er_sie_es: "lernte", wir: "lernten", ihr: "lerntet", sie_Sie: "lernten" },
    ]
  },
  {
    word: "kommen",
    pronunciation: "ˈkɔmən",
    partOfSpeech: "Verb",
    meanings: ["来", "来到"],
    level: "A1",
    forms: [{ label: "Perfekt", value: "ist gekommen" }, { label: "Präteritum", value: "kam" }],
    mnemonic: "Kommen (Come) - 几乎一样的发音。",
    examples: [{ de: "Woher kommst du?", cn: "你从哪里来？" }, { de: "Der Bus kommt gleich.", cn: "公车马上来。" }],
    conjugations: [
      { tense: "Präsens (现在时)", ich: "komme", du: "kommst", er_sie_es: "kommt", wir: "kommen", ihr: "kommt", sie_Sie: "kommen" },
      { tense: "Präteritum (过去时)", ich: "kam", du: "kamst", er_sie_es: "kam", wir: "kamen", ihr: "kamt", sie_Sie: "kamen" },
    ]
  },
  {
    word: "sehen",
    pronunciation: "ˈzeːən",
    partOfSpeech: "Verb",
    meanings: ["看", "看见"],
    level: "A1",
    forms: [{ label: "Perfekt", value: "hat gesehen" }, { label: "Präteritum", value: "sah" }],
    mnemonic: "Sehen (See) - 用眼睛(See)看。",
    examples: [{ de: "Ich sehe dich.", cn: "我看见你了。" }, { de: "Sieht er fern?", cn: "他在看电视吗？" }],
    conjugations: [
      { tense: "Präsens (现在时)", ich: "sehe", du: "siehst", er_sie_es: "sieht", wir: "sehen", ihr: "seht", sie_Sie: "sehen" },
      { tense: "Präteritum (过去时)", ich: "sah", du: "sahst", er_sie_es: "sah", wir: "sahen", ihr: "saht", sie_Sie: "sahen" },
    ]
  },
  {
    word: "essen",
    pronunciation: "ˈɛsn̩",
    partOfSpeech: "Verb",
    meanings: ["吃"],
    level: "A1",
    forms: [{ label: "Perfekt", value: "hat gegessen" }, { label: "Präteritum", value: "aß" }],
    mnemonic: "Essen (Eat) - 'e'开头的都是吃。",
    examples: [{ de: "Was isst du gern?", cn: "你喜欢吃什么？" }, { de: "Wir essen Pizza.", cn: "我们吃披萨。" }],
    conjugations: [
      { tense: "Präsens (现在时)", ich: "esse", du: "isst", er_sie_es: "isst", wir: "essen", ihr: "esst", sie_Sie: "essen" },
      { tense: "Präteritum (过去时)", ich: "aß", du: "aßest", er_sie_es: "aß", wir: "aßen", ihr: "aßt", sie_Sie: "aßen" },
    ]
  },
  {
    word: "trinken",
    pronunciation: "ˈtʁɪŋkn̩",
    partOfSpeech: "Verb",
    meanings: ["喝", "饮"],
    level: "A1",
    forms: [{ label: "Perfekt", value: "hat getrunken" }, { label: "Präteritum", value: "trank" }],
    mnemonic: "Trinken (Drink) - 德语T对应英语D。",
    examples: [{ de: "Ich trinke Wasser.", cn: "我喝水。" }, { de: "Möchtest du etwas trinken?", cn: "你想喝点什么吗？" }],
    conjugations: [
      { tense: "Präsens (现在时)", ich: "trinke", du: "trinkst", er_sie_es: "trinkt", wir: "trinken", ihr: "trinkt", sie_Sie: "trinken" },
      { tense: "Präteritum (过去时)", ich: "trank", du: "trankst", er_sie_es: "trank", wir: "tranken", ihr: "trankt", sie_Sie: "tranken" },
    ]
  },
  {
    word: "schlafen",
    pronunciation: "ˈʃlaːfn̩",
    partOfSpeech: "Verb",
    meanings: ["睡觉"],
    level: "A1",
    forms: [{ label: "Perfekt", value: "hat geschlafen" }, { label: "Präteritum", value: "schlief" }],
    mnemonic: "Schlafen (Sleep) - 嘘(Sch)一声去睡觉。",
    examples: [{ de: "Ich schlafe gut.", cn: "我睡得很好。" }, { de: "Das Kind schläft.", cn: "孩子在睡觉。" }],
    conjugations: [
      { tense: "Präsens (现在时)", ich: "schlafe", du: "schläfst", er_sie_es: "schläft", wir: "schlafen", ihr: "schlaft", sie_Sie: "schlafen" },
      { tense: "Präteritum (过去时)", ich: "schlief", du: "schliefst", er_sie_es: "schlief", wir: "schliefen", ihr: "schlieft", sie_Sie: "schliefen" },
    ]
  },
  {
    word: "nehmen",
    pronunciation: "ˈneːmən",
    partOfSpeech: "Verb",
    meanings: ["拿", "取", "乘坐"],
    level: "A1",
    forms: [{ label: "Perfekt", value: "hat genommen" }, { label: "Präteritum", value: "nahm" }],
    mnemonic: "Nehmen - 哪怕(Na)也要拿走。",
    examples: [{ de: "Ich nehme den Bus.", cn: "我坐公交车。" }, { de: "Nimmst du das?", cn: "你要这个吗？" }],
    conjugations: [
      { tense: "Präsens (现在时)", ich: "nehme", du: "nimmst", er_sie_es: "nimmt", wir: "nehmen", ihr: "nehmt", sie_Sie: "nehmen" },
      { tense: "Präteritum (过去时)", ich: "nahm", du: "nahmst", er_sie_es: "nahm", wir: "nahmen", ihr: "nahmt", sie_Sie: "nahmen" },
    ]
  },
  // --- NOUNS ---
  {
    word: "Haus",
    gender: "n",
    pronunciation: "haʊ̯s",
    partOfSpeech: "Noun",
    meanings: ["房子", "家"],
    level: "A1",
    forms: [{ label: "Plural", value: "die Häuser" }, { label: "Genitiv", value: "des Hauses" }],
    mnemonic: "Das Haus (House) - 发音几乎一样。",
    examples: [{ de: "Das Haus ist groß.", cn: "这房子很大。" }, { de: "Ich bin zu Hause.", cn: "我在家。" }]
  },
  {
    word: "Zeit",
    gender: "f",
    pronunciation: "t͡saɪ̯t",
    partOfSpeech: "Noun",
    meanings: ["时间", "时期"],
    level: "A1",
    forms: [{ label: "Plural", value: "die Zeiten" }],
    mnemonic: "Die Zeit (Time) - 菜(Zeit)要在时间内做好。",
    examples: [{ de: "Ich habe keine Zeit.", cn: "我没时间。" }, { de: "Es ist Zeit zu gehen.", cn: "是时候走了。" }]
  },
  {
    word: "Mensch",
    gender: "m",
    pronunciation: "mɛnʃ",
    partOfSpeech: "Noun",
    meanings: ["人", "人类"],
    level: "A1",
    forms: [{ label: "Plural", value: "die Menschen" }, { label: "N-Declension", value: "den Menschen" }],
    mnemonic: "Der Mensch (Man) - 男人是 Mensch。",
    examples: [{ de: "Jeder Mensch ist gleich.", cn: "每个人都是平等的。" }]
  },
  {
    word: "Jahr",
    gender: "n",
    pronunciation: "jaːɐ̯",
    partOfSpeech: "Noun",
    meanings: ["年", "岁"],
    level: "A1",
    forms: [{ label: "Plural", value: "die Jahre" }],
    mnemonic: "Das Jahr (Year) - 音似。",
    examples: [{ de: "Ein Jahr hat 12 Monate.", cn: "一年有12个月。" }, { de: "Ich bin 20 Jahre alt.", cn: "我20岁。" }]
  },
  {
    word: "Tag",
    gender: "m",
    pronunciation: "taːk",
    partOfSpeech: "Noun",
    meanings: ["天", "日子", "白天"],
    level: "A1",
    forms: [{ label: "Plural", value: "die Tage" }],
    mnemonic: "Der Tag (Day) - T对应D，Tag就是Day。",
    examples: [{ de: "Guten Tag!", cn: "你好(美好的一天)！" }, { de: "Jeden Tag.", cn: "每天。" }]
  },
  {
    word: "Frau",
    gender: "f",
    pronunciation: "fʁaʊ̯",
    partOfSpeech: "Noun",
    meanings: ["女士", "妻子", "女人"],
    level: "A1",
    forms: [{ label: "Plural", value: "die Frauen" }],
    mnemonic: "Die Frau (Frau) - 德语里对女士的称呼。",
    examples: [{ de: "Das ist meine Frau.", cn: "这是我的妻子。" }, { de: "Guten Tag, Frau Müller.", cn: "你好，穆勒女士。" }]
  },
  {
    word: "Mann",
    gender: "m",
    pronunciation: "man",
    partOfSpeech: "Noun",
    meanings: ["男人", "丈夫"],
    level: "A1",
    forms: [{ label: "Plural", value: "die Männer" }],
    mnemonic: "Der Mann (Man) - 写法发音都像。",
    examples: [{ de: "Ein Mann steht dort.", cn: "一个男人站在那里。" }]
  },
  {
    word: "Kind",
    gender: "n",
    pronunciation: "kɪnt",
    partOfSpeech: "Noun",
    meanings: ["孩子", "儿童"],
    level: "A1",
    forms: [{ label: "Plural", value: "die Kinder" }],
    mnemonic: "Das Kind (Kin) - 亲戚(Kin)里的孩子。",
    examples: [{ de: "Ich habe zwei Kinder.", cn: "我有两个孩子。" }]
  },
  {
    word: "Geld",
    gender: "n",
    pronunciation: "ɡɛlt",
    partOfSpeech: "Noun",
    meanings: ["钱", "货币"],
    level: "A1",
    forms: [{ label: "No Plural", value: "-" }],
    mnemonic: "Das Geld (Gold) - 钱以前就是金子(Gold)。",
    examples: [{ de: "Ich habe kein Geld.", cn: "我没有钱。" }, { de: "Zeit ist Geld.", cn: "时间就是金钱。" }]
  },
  {
    word: "Welt",
    gender: "f",
    pronunciation: "vɛlt",
    partOfSpeech: "Noun",
    meanings: ["世界"],
    level: "A1",
    forms: [{ label: "Plural", value: "die Welten" }],
    mnemonic: "Die Welt (World) - 围(W)绕地球一圈就是世界。",
    examples: [{ de: "Die Welt ist klein.", cn: "世界很小。" }]
  },
  {
    word: "Hand",
    gender: "f",
    pronunciation: "hant",
    partOfSpeech: "Noun",
    meanings: ["手"],
    level: "A1",
    forms: [{ label: "Plural", value: "die Hände" }],
    mnemonic: "Die Hand (Hand) - 完全一样。",
    examples: [{ de: "Gib mir deine Hand.", cn: "把你的手给我。" }]
  },
  // --- ADJECTIVES ---
  {
    word: "gut",
    pronunciation: "ɡuːt",
    partOfSpeech: "Adjective",
    meanings: ["好的", "优秀的"],
    level: "A1",
    forms: [{ label: "Komparativ", value: "besser" }, { label: "Superlativ", value: "am besten" }],
    mnemonic: "Gut (Good) - 只要把 o 换成 u。",
    examples: [{ de: "Guten Morgen!", cn: "早上好！" }, { de: "Das schmeckt gut.", cn: "这很好吃。" }]
  },
   {
    word: "schön",
    pronunciation: "ʃøːn",
    partOfSpeech: "Adjective",
    meanings: ["美丽的", "美好的"],
    level: "A1",
    forms: [{ label: "Komparativ", value: "schöner" }, { label: "Superlativ", value: "am schönsten" }],
    mnemonic: "Schön (Shine) - 美丽的东西会闪耀。",
    examples: [{ de: "Das Wetter ist schön.", cn: "天气很好。" }, { de: "Schönen Tag noch!", cn: "祝你一天愉快！" }]
  },
  {
    word: "groß",
    pronunciation: "ɡʁoːs",
    partOfSpeech: "Adjective",
    meanings: ["大的", "高的"],
    level: "A1",
    forms: [{ label: "Komparativ", value: "größer" }, { label: "Superlativ", value: "am größten" }],
    mnemonic: "Groß (Gross) - 总量(Gross)很大。",
    examples: [{ de: "Berlin ist eine große Stadt.", cn: "柏林是个大城市。" }, { de: "Er ist sehr groß.", cn: "他很高。" }]
  },
  {
    word: "klein",
    pronunciation: "klaɪ̯n",
    partOfSpeech: "Adjective",
    meanings: ["小的", "矮的"],
    level: "A1",
    forms: [{ label: "Komparativ", value: "kleiner" }, { label: "Superlativ", value: "am kleinsten" }],
    mnemonic: "Klein - 可怜(Klein)的小东西。",
    examples: [{ de: "Das Haus ist klein.", cn: "这房子很小。" }]
  },
  {
    word: "alt",
    pronunciation: "alt",
    partOfSpeech: "Adjective",
    meanings: ["老的", "旧的"],
    level: "A1",
    forms: [{ label: "Komparativ", value: "älter" }, { label: "Superlativ", value: "am ältesten" }],
    mnemonic: "Alt (Old) - 奥(A)特曼是老的。",
    examples: [{ de: "Wie alt bist du?", cn: "你多大了？" }, { de: "Das Auto ist alt.", cn: "这辆车旧了。" }]
  },
  {
    word: "neu",
    pronunciation: "nɔɪ̯",
    partOfSpeech: "Adjective",
    meanings: ["新的"],
    level: "A1",
    forms: [{ label: "Komparativ", value: "neuer" }, { label: "Superlativ", value: "am neusten" }],
    mnemonic: "Neu (New) - 发音近似。",
    examples: [{ de: "Ich habe ein neues Handy.", cn: "我有个新手机。" }]
  },
  // --- FUNCTION WORDS / OTHERS ---
  {
    word: "aber",
    pronunciation: "ˈaːbɐ",
    partOfSpeech: "Conjunction",
    meanings: ["但是", "可是"],
    level: "A1",
    forms: [],
    mnemonic: "Aber - 啊不(Aber)，但是不行。",
    examples: [{ de: "Ich bin müde, aber glücklich.", cn: "我很累，但是很开心。" }]
  },
  {
    word: "und",
    pronunciation: "ʊnt",
    partOfSpeech: "Conjunction",
    meanings: ["和", "与"],
    level: "A1",
    forms: [],
    mnemonic: "Und (And) - 元音变了而已。",
    examples: [{ de: "Du und ich.", cn: "你和我。" }]
  },
  {
    word: "oder",
    pronunciation: "ˈoːdɐ",
    partOfSpeech: "Conjunction",
    meanings: ["或者"],
    level: "A1",
    forms: [],
    mnemonic: "Oder (Order) - 点餐(Order)时选这个或者那个。",
    examples: [{ de: "Kaffee oder Tee?", cn: "咖啡还是茶？" }]
  },
  {
    word: "nicht",
    pronunciation: "nɪçt",
    partOfSpeech: "Adverb",
    meanings: ["不", "没有"],
    level: "A1",
    forms: [],
    mnemonic: "Nicht (Night) - 晚上(Night)看不见(不)。",
    examples: [{ de: "Das ist nicht gut.", cn: "这不好。" }]
  },
  {
    word: "mit",
    pronunciation: "mɪt",
    partOfSpeech: "Preposition",
    meanings: ["和...一起", "用"],
    level: "A1",
    forms: [{ label: "Case", value: "Dativ (Always)" }],
    mnemonic: "Mit (Meet) - 见面(Meet)就要在一起(With)。",
    examples: [{ de: "Ich fahre mit dem Bus.", cn: "我坐(用)公交车去。" }, { de: "Komm mit!", cn: "一起来！" }]
  },
  // --- QUESTION WORDS (Existing) ---
  {
    word: "was",
    pronunciation: "vas",
    partOfSpeech: "Question Word",
    meanings: ["什么"],
    level: "A1",
    forms: [],
    mnemonic: "Was (What) - 发音类似。",
    examples: [{ de: "Was ist das?", cn: "这是什么？" }, { de: "Was machst du?", cn: "你在做什么？" }]
  },
  {
    word: "wer",
    pronunciation: "veːɐ̯",
    partOfSpeech: "Question Word",
    meanings: ["谁"],
    level: "A1",
    forms: [{label: "Akkusativ", value: "wen"}, {label: "Dativ", value: "wem"}],
    mnemonic: "Wer (Who) - 注意 Wer 是'谁', Wo 是'哪里', 容易混淆。",
    examples: [{ de: "Wer bist du?", cn: "你是谁？" }, { de: "Wer kommt heute?", cn: "今天谁来？" }]
  },
  {
    word: "wo",
    pronunciation: "voː",
    partOfSpeech: "Question Word",
    meanings: ["哪里", "在何处"],
    level: "A1",
    forms: [{label: "From where", value: "woher"}, {label: "To where", value: "wohin"}],
    mnemonic: "Wo - 蜗(Wo)牛在哪里爬。",
    examples: [{ de: "Wo wohnst du?", cn: "你住在哪里？" }, { de: "Wo ist der Bahnhof?", cn: "火车站都在哪？" }]
  },
  {
    word: "wie",
    pronunciation: "viː",
    partOfSpeech: "Question Word",
    meanings: ["如何", "怎样"],
    level: "A1",
    forms: [{label: "How much", value: "wie viel"}],
    mnemonic: "Wie (How) - 我们(We)如何去做。",
    examples: [{ de: "Wie heißt du?", cn: "你叫什么名字(你如何称呼)？" }, { de: "Wie geht es dir?", cn: "你好吗？" }]
  },
  {
    word: "wann",
    pronunciation: "van",
    partOfSpeech: "Question Word",
    meanings: ["什么时候", "何时"],
    level: "A1",
    forms: [],
    mnemonic: "Wann (When) - 几乎一样的发音。",
    examples: [{ de: "Wann beginnt der Kurs?", cn: "课程什么时候开始？" }]
  },
  // --- PRONOUNS (Existing) ---
  {
    word: "ich",
    pronunciation: "ɪç",
    partOfSpeech: "Pronoun",
    meanings: ["我"],
    level: "A1",
    forms: [{label: "Akkusativ", value: "mich"}, {label: "Dativ", value: "mir"}],
    mnemonic: "Ich - 只有我(i)自己。",
    examples: [{ de: "Ich heiße Anna.", cn: "我叫安娜。" }]
  },
  {
    word: "du",
    pronunciation: "duː",
    partOfSpeech: "Pronoun",
    meanings: ["你 (非正式)"],
    level: "A1",
    forms: [{label: "Akkusativ", value: "dich"}, {label: "Dativ", value: "dir"}],
    mnemonic: "Du (Dude) - 你这家伙。",
    examples: [{ de: "Kommst du mit?", cn: "你一起来吗？" }]
  },
  {
    word: "Sie",
    pronunciation: "ziː",
    partOfSpeech: "Pronoun",
    meanings: ["您 (正式)"],
    level: "A1",
    forms: [{label: "Akkusativ", value: "Sie"}, {label: "Dativ", value: "Ihnen"}],
    mnemonic: "大写的 Sie 是尊敬的您。",
    examples: [{ de: "Können Sie mir helfen?", cn: "您能帮我吗？" }]
  },
  // --- ADVERBS (Existing) ---
  {
    word: "heute",
    pronunciation: "ˈhɔɪ̯tə",
    partOfSpeech: "Adverb",
    meanings: ["今天"],
    level: "A1",
    forms: [],
    mnemonic: "Heute (Hoy) - 吼(Heu)一声今天开始。",
    examples: [{ de: "Heute ist Montag.", cn: "今天是周一。" }]
  },
  {
    word: "hier",
    pronunciation: "hiːɐ̯",
    partOfSpeech: "Adverb",
    meanings: ["这里"],
    level: "A1",
    forms: [],
    mnemonic: "Hier (Here) - 发音一样。",
    examples: [{ de: "Ich bin hier.", cn: "我在这里。" }]
  }
];

// --- Schemas for Structured Output (Fallback) ---

const dictionarySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    word: { type: Type.STRING, description: "The German word (Lemma)" },
    pronunciation: { type: Type.STRING, description: "IPA pronunciation" },
    partOfSpeech: { type: Type.STRING, description: "Noun, Verb, Adjective, Adverb, Pronoun" },
    gender: { type: Type.STRING, description: "m, f, n (for nouns), or null" },
    meanings: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Chinese definitions" },
    level: { type: Type.STRING, description: "CEFR Level" },
    forms: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING },
          value: { type: Type.STRING }
        }
      }
    },
    mnemonic: { type: Type.STRING, description: "Memory aid in Chinese" },
    examples: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          de: { type: Type.STRING },
          cn: { type: Type.STRING }
        }
      }
    }
  },
  required: ["word", "meanings", "level", "forms", "mnemonic", "examples"]
};

// --- Encyclopedia Content ---
const TOPICS: Record<string, WikiTopic[]> = {
  "基础 (Basics)": [
    { 
      id: 'pronunciation', 
      title: '发音规则 (Aussprache)', 
      description: '元音、变音与特殊辅音', 
      content: `## 德语发音基础
德语的发音非常有规律，掌握规则后即可朗读任何单词。

### 1. 变音 (Umlaute)
* **Ä ä**: 类似英语 "bed" 中的 e，嘴巴张开。
* **Ö ö**: 发音时嘴唇撮圆，发 "o" 的音，舌头位置像发 "e"。
* **Ü ü**: 类似中文拼音的 "ü" (雨)。

### 2. 复合元音 (Diphthongs)
* **ei / ai**: 发音像英语的 "eye" (爱)。例如: *Eis, Mai*.
* **ie**: 发长音 "i:" (伊)。例如: *Liebe*.
* **eu / äu**: 发音像 "oy" (欧伊)。例如: *Euro, Häuser*.
* **au**: 发音像 "ow" (奥)。例如: *Haus*.

### 3. 特殊辅音
* **ch**: 
  * 在 a, o, u, au 之后: 发喉音 (像吐痰前的声音)，如 *Buch*.
  * 在 e, i, ä, ö, ü, ei, eu 之后: 发轻音 (像猫哈气)，如 *ich*.
* **sch**: 类似中文 "施"，嘴唇要撅起。如 *Schule*.
* **st / sp** (词首): 发 "sht" 和 "shp" 的音。如 *Stadt, Sport*.
* **r**: 小舌音，如果发不出，可以用轻微的喉部摩擦音代替。

### Pro Tip
**重音规则**: 德语单词的重音通常在第一个音节 (如 *Vater*)，但带有非重读前缀 (be-, ge-, er-, ver-, zer-, ent-, emp-, miss-) 的词，重音在第二个音节。`
    },
    { 
      id: 'alphabet', 
      title: '字母表 (Alphabet)', 
      description: '字母与特殊字符 ß', 
      content: `## 德语字母表
德语使用26个拉丁字母，外加4个特殊字符。

### 特殊字符
* **Ä ä** (A-Umlaut)
* **Ö ö** (O-Umlaut)
* **Ü ü** (U-Umlaut)
* **ß** (Eszett): 只在小写中使用，发音等同于双 "s"。
  * *注意*: 在瑞士德语中不使用 ß，全部写为 ss。

### 字母歌 (发音)
A (ah), B (beh), C (tseh), D (deh), E (eh), F (eff), G (geh), H (ha), I (ih), J (yot), K (kah), L (ell), M (emm), N (enn), O (oh), P (peh), Q (koo), R (err), S (ess), T (teh), U (uh), V (fow), W (veh), X (ix), Y (ypsilon), Z (tsett).

### Pro Tip
字母 **V** 在德语词中通常发 "f" 的音 (如 *Vater*, *Vogel*)，但在外来词中发 "v" (如 *Vase*). 字母 **W** 永远发 "v" (咬唇音)，如 *Wasser*.`
    },
  ],
  "名词 (Nouns)": [
    { 
      id: 'articles', 
      title: '冠词 (Artikel)', 
      description: 'Der, Die, Das 性别定冠词', 
      content: `## 德语的性 (Genus)
德语名词分为三种性，这是初学者最大的难点。

### 定冠词
* **Der** (阳性 - Maskulin): 男性人物, 季节, 月份, 星期, 多数以 -er, -en, -ling, -ismus 结尾的词。
* **Die** (阴性 - Feminin): 女性人物, 多数花草树木, 以及以 **-e**, -ung, -heit, -keit, -schaft, -tät, -ion 结尾的词。
* **Das** (中性 - Neutrum): 金属, 颜色, 幼小生物, 以及以 -chen, -lein, -um, -ment 结尾的词。

### 不定冠词 (Ein/Eine)
| 性别 | 定冠词 | 不定冠词 |
| :--- | :--- | :--- |
| 阳性 | der | ein |
| 阴性 | die | eine |
| 中性 | das | ein |

### Pro Tip
**-chen** 结尾的词永远是中性！
* Die Frau (女人) -> **Das** Mädchen (女孩/小姑娘)
* Der Hund (狗) -> **Das** Hündchen (小狗)`
    },
    { 
      id: 'cases', 
      title: '格 (Kasus)', 
      description: 'N, A, D, G 四格变位', 
      content: `## 德语的四个格
格决定了名词在句子中的功能。

### 1. Nominativ (第一格 - 主格)
* 作主语 (Subject)。
* 动词 sein, werden, bleiben 后的表语。
* 例: *Der Mann* ist hier.

### 2. Akkusativ (第四格 - 宾格)
* 作直接宾语 (Direct Object)。
* 多数动词的宾语 (haben, essen, trinken...)。
* 特定介词后 (für, ohne, um, durch, gegen)。
* 变化: 只有 **Der** 变成 **Den**，其他不变。

### 3. Dativ (第三格 - 与格)
* 作间接宾语 (Indirect Object, 也就是"给"的对象)。
* 特定动词 (helfen, danken, gefallen...)。
* 特定介词后 (aus, bei, mit, nach, seit, von, zu)。
* 变化: Der/Das -> **Dem**, Die -> **Der**, 复数 Die -> **Den (+n)**.

### 4. Genitiv (第二格 - 所有格)
* 表示所属关系 ("...的")。
* 变化: Der/Das -> **Des (+s)**, Die -> **Der**.

### 变格总结表 (定冠词)
| 格 | Mas (阳) | Fem (阴) | Neu (中) | Pl (复) |
| :--- | :--- | :--- | :--- | :--- |
| **N** | der | die | das | die |
| **A** | **den** | die | das | die |
| **D** | **dem** | **der** | **dem** | **den +n** |
| **G** | **des +s** | **der** | **des +s** | **der** |`
    },
    { 
      id: 'plural', 
      title: '复数 (Plural)', 
      description: '名词复数的构成规则', 
      content: `## 复数构成规则
德语复数不像英语只加 's' 那么简单，有五种主要形式。

1. **-e**: 多数阳性名词和中性名词。
   * der Tag -> die Tage, das Jahr -> die Jahre.
   * 常伴随变音: der Stuhl -> die Stühle.
2. **-(e)n**: 多数阴性名词。
   * die Frau -> die Frauen, die Tür -> die Türen.
3. **-er**: 许多中性名词 (通常加变音)。
   * das Kind -> die Kinder, das Haus -> die Häuser.
4. **-s**: 外来词。
   * das Auto -> die Autos, das Handy -> die Handys.
5. **不变化**: 以 -er, -el, -en 结尾的阳性/中性名词。
   * der Lehrer -> die Lehrer, der Apfel -> die Äpfel (仅变音).

### Pro Tip
记忆诀窍: 以 **-e** 结尾的阴性名词，复数几乎总是加 **-n** (die Lampe -> die Lampen).`
    }
  ],
  "动词 (Verbs)": [
    { 
      id: 'present', 
      title: '现在时 (Präsens)', 
      description: '动词变位规则', 
      content: `## 动词现在时变位
规则动词词干 + 词尾。以 *lernen* (学习) 为例:

| 人称 | 词尾 | 变位 |
| :--- | :--- | :--- |
| ich (我) | -e | lern**e** |
| du (你) | -st | lern**st** |
| er/sie/es (他/她/它) | -t | lern**t** |
| wir (我们) | -en | lern**en** |
| ihr (你们) | -t | lern**t** |
| sie/Sie (他们/您) | -en | lern**en** |

### 常见不规则变化 (换音)
在 **du** 和 **er/sie/es** 形式中，元音常发生变化:
* **e -> i/ie**: 
  * geben: du gibst, er gibt
  * sehen: du siehst, er sieht
* **a -> ä**:
  * fahren: du fährst, er fährt
  * schlafen: du schläfst, er schläft`
    },
    { 
      id: 'past_perfect', 
      title: '过去 vs 完成 (Präteritum vs Perfekt)', 
      description: '两种过去时态的区别', 
      content: `## 两种过去时态

### 1. 完成时 (Das Perfekt)
* **构成**: haben/sein + Partizip II (过去分词).
* **用法**: 口语对话中最常用。
* **Haben vs Sein**:
  * **Sein**: 移动 (gehen, fahren) 或 状态改变 (aufwachen, sterben)。
  * **Haben**: 其他所有动词 (essen, schlafen, arbeiten)。
* *例子*: Ich **habe** gegessen. (我吃过了) / Ich **bin** gegangen. (我走了)

### 2. 过去时 (Das Präteritum)
* **用法**: 书面语、报纸、小说，以及常用动词 (sein, haben, 情态动词) 的口语。
* *例子*: Ich **war** müde. (sein) / Ich **hatte** keine Zeit. (haben)

### Pro Tip
口语中尽量使用完成时，除非是说 "我是/我有/我能..." (Ich war/hatte/konnte)，这几个词用过去时更自然。`
    },
    { 
      id: 'modal', 
      title: '情态动词 (Modalverben)', 
      description: 'Müssen, können, dürfen...', 
      content: `## 德语六大情态动词
情态动词通常和另一个动词的原形连用，原形动词放在句末。

1. **können** (能, 会): 能力或可能性。
   * *Ich kann Deutsch sprechen.*
2. **müssen** (必须): 强制或必要性。
   * *Wir müssen lernen.*
3. **dürfen** (允许): 许可。
   * *Darf ich hier rauchen?*
4. **wollen** (想要): 强烈的意愿。
   * *Ich will nach Berlin fahren.*
5. **sollen** (应该): 义务或建议 (通常来自他人)。
   * *Der Arzt sagt, ich soll schlafen.*
6. **mögen** (喜欢) / **möchten** (想要 - 委婉):
   * *Ich mag Pizza.* / *Ich möchte einen Kaffee.*

### 变位注意
情态动词在 **ich** 和 **er/sie/es** 的变位是一样的，且没有词尾！
* ich kann, er kann (不是 kannt!)
* ich muss, er muss`
    }
  ],
  "句法 (Syntax)": [
    { 
      id: 'word_order', 
      title: '词序 (Wortstellung)', 
      description: '动词第二位原则', 
      content: `## 德语词序黄金法则

### 1. 主句: 动词永远在第二位 (Verb Position 2)
无论句首是什么，变位动词必须是句子的第二个成分。
* **Ich** *kaufe* heute Brot. (主语在首)
* **Heute** *kaufe* ich Brot. (时间在首 -> 主语后置)
* **Brot** *kaufe* ich heute. (强调宾语 -> 主语后置)

### 2. 动词框结构 (Satzklammer)
如果有一个助动词或情态动词，第二个动词(原形或分词)放在**句末**。
* Ich **muss** heute Deutsch **lernen**.
* Ich **habe** gestern einen Apfel **gegessen**.

### 3. TeKaMoLo (状语排序)
如果一个句子里有多个状语，通常顺序是:
* **Te**mporal (时间)
* **Ka**usal (原因)
* **Mo**dal (方式)
* **Lo**kal (地点)
* *例子*: Ich fahre **heute** (Te) **wegen des Wetters** (Ka) **mit dem Bus** (Mo) **nach Hause** (Lo).`
    },
    { 
      id: 'connectors', 
      title: '连词 (Konjunktionen)', 
      description: 'ADUSO 与 尾语序', 
      content: `## 连接句子的两种方式

### 1. 正语序连词 (位置 0)
这些连词不占位，后面紧跟主语+动词。记忆口诀: **ADUSO**.
* **A**ber (但是)
* **D**enn (因为)
* **U**nd (和)
* **S**ondern (而是)
* **O**der (或者)
* *例子*: Ich bin müde, **aber** ich *lerne* weiter.

### 2. 尾语序连词 (Nebensatz)
这些连词引导从句，动词必须踢到**句末**。
* **weil** (因为)
* **dass** (...这一点/that)
* **wenn** (如果/当...时)
* **ob** (是否)
* **obwohl** (尽管)
* *例子*: Ich lerne Deutsch, **weil** ich es *liebe*. (不是 weil ich liebe es!)

### Pro Tip
**Deshalb** (因此) 属于副词连接词，它占第一位，所以动词紧跟在它后面。
* Ich bin krank, **deshalb** *bleibe* ich zu Hause.`
    }
  ],
  "疑问词 (Question Words)": [
    {
      id: 'w-questions',
      title: 'W-Fragen (W-问题)',
      description: 'Wer, Was, Wo, Wie, Wann, Warum...',
      content: `## 德语中的 W-Fragen
德语的疑问词几乎都以 "W" 开头，所以称为 W-Fragen。在这些疑问句中，**动词必须放在第二位**。

### 常用疑问词一览
* **Wer**: 谁 (针对人)
  * *Wer ist das?* (这是谁？)
  * **变格**: Wer (N) -> Wen (A) -> Wem (D) -> Wessen (G)
* **Was**: 什么 (针对物)
  * *Was machst du?* (你在做什么？)
* **Wo**: 哪里 (位置 - 静止)
  * *Wo wohnst du?* (你住在哪里？)
* **Wohin**: 去哪里 (方向 - 移动)
  * *Wohin gehst du?* (你去哪儿？)
* **Woher**: 从哪里来 (来源)
  * *Woher kommst du?* (你从哪来？)
* **Wann**: 什么时候 (时间)
  * *Wann beginnt der Film?* (电影何时开始？)
* **Wie**: 怎样/如何 (方式)
  * *Wie heißt du?* (你叫什么？字面:你如何被称呼)
  * **组合用法**: 
    * *Wie viel* (多少 - 不可数)
    * *Wie viele* (多少 - 可数)
    * *Wie lange* (多久)
    * *Wie oft* (多常)
* **Warum**: 为什么 (原因)
  * *Warum lernst du Deutsch?* (你为什么学德语？)
* **Welcher/Welche/Welches**: 哪一个 (定语疑问词，需要变格)
  * *Welches Auto gefällt dir?* (你喜欢哪辆车？)

### Pro Tip
区分 **Wo**, **Wohin**, **Woher**:
* **Wo** 是"点" (在...里).
* **Wohin** 是"线" (向...去).
* **Woher** 是"线" (从...来).`
    }
  ]
};

// --- Components ---

// --- Verb Conjugation View Component ---

const ConjugationView = ({ entry, onBack }: { entry: DictionaryEntry; onBack: () => void }) => {
  return (
    <div className="animate-fade-in space-y-6">
      <button onClick={onBack} className="flex items-center text-gray-500 hover:text-black transition-colors font-medium">
        <ArrowLeft className="w-5 h-5 mr-1" />
        Back to "{entry.word}"
      </button>

      <div className="glass-card p-8 rounded-2xl">
         <div className="flex items-baseline justify-between mb-8 border-b border-gray-100 pb-4">
            <div>
               <h2 className="text-3xl font-bold text-black mb-1">动词变位表</h2>
               <p className="text-gray-500 text-lg">Konjugation: <span className="font-bold text-black italic">{entry.word}</span></p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
               <Table className="w-6 h-6" />
            </div>
         </div>

         {!entry.conjugations ? (
           <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
             No pre-loaded conjugation data available for this word.
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {entry.conjugations.map((table, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                   <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="font-bold text-gray-800">{table.tense}</h3>
                   </div>
                   <table className="w-full text-sm">
                      <tbody className="divide-y divide-gray-100">
                         <tr className="table-row-hover"><td className="px-4 py-2 text-gray-400 w-1/3">ich</td><td className="px-4 py-2 font-medium text-gray-900">{table.ich}</td></tr>
                         <tr className="table-row-hover"><td className="px-4 py-2 text-gray-400">du</td><td className="px-4 py-2 font-medium text-gray-900">{table.du}</td></tr>
                         <tr className="table-row-hover"><td className="px-4 py-2 text-gray-400">er/sie/es</td><td className="px-4 py-2 font-medium text-gray-900">{table.er_sie_es}</td></tr>
                         <tr className="table-row-hover"><td className="px-4 py-2 text-gray-400">wir</td><td className="px-4 py-2 font-medium text-gray-900">{table.wir}</td></tr>
                         <tr className="table-row-hover"><td className="px-4 py-2 text-gray-400">ihr</td><td className="px-4 py-2 font-medium text-gray-900">{table.ihr}</td></tr>
                         <tr className="table-row-hover"><td className="px-4 py-2 text-gray-400">sie/Sie</td><td className="px-4 py-2 font-medium text-gray-900">{table.sie_Sie}</td></tr>
                      </tbody>
                   </table>
                </div>
              ))}
           </div>
         )}
      </div>
    </div>
  );
};


// --- Dictionary View ---

const DictionaryView = () => {
  const [query, setQuery] = useState('');
  const [data, setData] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'search' | 'conjugation'>('search');
  const [source, setSource] = useState<'static' | 'ai'>('static');
  
  // New State for Autocomplete
  const [suggestions, setSuggestions] = useState<DictionaryEntry[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Handle outside click to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter suggestions when query changes
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    const normalizedQuery = query.toLowerCase().trim();
    
    // Simple fuzzy match: starts with or includes in German, or includes in Chinese meaning
    const matches = STATIC_DB.filter(entry => {
       const deMatch = entry.word.toLowerCase().includes(normalizedQuery);
       const cnMatch = entry.meanings.some(m => m.includes(normalizedQuery));
       return deMatch || cnMatch;
    }).slice(0, 5); // Limit to top 5 results to keep UI clean

    setSuggestions(matches);
  }, [query]);

  const selectSuggestion = (entry: DictionaryEntry) => {
    setQuery(entry.word);
    setData(entry);
    setSource('static');
    setSuggestions([]);
    setShowSuggestions(false);
    setError('');
    setViewMode('search');
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setShowSuggestions(false);
    setLoading(true);
    setError('');
    setData(null);
    setViewMode('search');

    // 1. Try Static Search (Instant)
    const normalizedQuery = query.toLowerCase().trim();
    const staticResult = STATIC_DB.find(
      entry => 
        entry.word.toLowerCase() === normalizedQuery || 
        entry.meanings.some(m => m.includes(normalizedQuery))
    );

    if (staticResult) {
      setData(staticResult);
      setSource('static');
      setLoading(false);
      return;
    }

    // 2. Fallback to AI if not found in static DB
    setSource('ai');
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Generate a dictionary entry for the German word related to search term: "${query}". 
        If the user searches in Chinese, translate to the most common German word first.
        If the user searches a conjugated form, find the lemma (base form).
        
        Ensure "mnemonic" is a clever, helpful memory aid in Chinese, focusing on gender or meaning.
        Ensure "forms" contains the most critical grammatical changes (e.g., plural for nouns, major tenses for verbs).
        Ensure "conjugations" is populated if it is a verb (Präsens, Präteritum).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: dictionarySchema,
          temperature: 0.3,
        }
      });

      const jsonText = response.text || "{}";
      const result = JSON.parse(jsonText);
      setData(result);
    } catch (err) {
      console.error(err);
      setError('Entschuldigung. Es gab ein Problem beim Laden der Daten.');
    } finally {
      setLoading(false);
    }
  };

  if (viewMode === 'conjugation' && data) {
    return <ConjugationView entry={data} onBack={() => setViewMode('search')} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="relative" ref={searchContainerRef}>
        <form onSubmit={handleSearch} className="relative group z-20">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search German or Chinese (e.g., haben, 学习)..."
            className={`w-full h-14 pl-12 pr-4 bg-white border-2 border-transparent group-hover:border-gray-200 focus:border-black shadow-sm text-lg outline-none transition-all placeholder:text-gray-400 ${
              suggestions.length > 0 && showSuggestions ? 'rounded-t-2xl rounded-b-none border-b-0' : 'rounded-2xl'
            }`}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <button 
            type="submit"
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-gray-800 transition-colors"
          >
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Suchen'}
          </button>
        </form>

        {/* Autocomplete Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-14 left-0 w-full bg-white border-2 border-t-0 border-gray-100 rounded-b-2xl shadow-xl z-30 overflow-hidden">
             {suggestions.map((s, idx) => (
                <button 
                  key={idx}
                  onClick={() => selectSuggestion(s)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-0 transition-colors"
                >
                   <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{s.word}</span>
                      <span className="text-sm text-gray-400">/ {s.meanings[0]} /</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{s.partOfSpeech}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                   </div>
                </button>
             ))}
          </div>
        )}

        <div className="mt-2 text-xs text-gray-400 text-center flex items-center justify-center gap-1">
           {source === 'static' && data ? (
              <span className="flex items-center text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><Database className="w-3 h-3 mr-1"/> Instant Local Result</span>
           ) : (
              <span className="flex items-center"><Zap className="w-3 h-3 fill-current mr-1" /> Powered by Gemini 2.5</span>
           )}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 animate-pulse">
          <div className="w-16 h-1 bg-gradient-to-r from-black via-red-600 to-yellow-500 rounded-full mb-4 opacity-50"></div>
          <p>Analyzing Grammar...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center border border-red-100">
          {error}
        </div>
      )}

      {!loading && !data && !error && (
        <div className="text-center py-20 opacity-40">
           <Book className="w-16 h-16 mx-auto mb-4 text-gray-300" />
           <p className="text-lg">Geben Sie ein Wort ein</p>
           <p className="text-sm mt-2">Try "wo", "heute", "ich", "lernen"</p>
        </div>
      )}

      {data && (
        <div className="animate-fade-in space-y-6">
          {/* Header Card */}
          <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
            {/* German Flag Accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-black via-red-600 to-yellow-400"></div>
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <h1 className="text-4xl font-bold tracking-tight text-black">
                    {data.gender === 'm' && <span className="text-blue-600 font-light mr-1">der</span>}
                    {data.gender === 'f' && <span className="text-red-500 font-light mr-1">die</span>}
                    {data.gender === 'n' && <span className="text-green-600 font-light mr-1">das</span>}
                    {data.word}
                  </h1>
                  <span className="text-gray-400 font-mono text-sm">/{data.pronunciation}/</span>
                </div>
                <div className="flex gap-2 mt-3 items-center">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider rounded-md">{data.partOfSpeech}</span>
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold uppercase tracking-wider rounded-md">{data.level}</span>
                  {data.partOfSpeech.toLowerCase().includes('verb') && (
                     <button 
                       onClick={() => setViewMode('conjugation')}
                       className="ml-2 flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                     >
                       <Table className="w-3 h-3" />
                       变位 (Conjugation)
                       <ArrowRight className="w-3 h-3 ml-1" />
                     </button>
                  )}
                </div>
              </div>
              <button className="p-2 rounded-full hover:bg-gray-50 text-gray-400 hover:text-black transition-colors">
                <Volume2 className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-1 mb-6">
              {data.meanings.map((m, i) => (
                <p key={i} className="text-xl text-gray-800 font-medium leading-relaxed">{m}</p>
              ))}
            </div>

            {/* Grammar Table */}
            {data.forms && data.forms.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Grammatik</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-4">
                  {data.forms.map((form, idx) => (
                    <div key={idx} className="flex flex-col">
                      <span className="text-xs text-gray-500 mb-0.5">{form.label}</span>
                      <span className="font-medium text-gray-900">{form.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mnemonic Card */}
          <div className="glass-card p-5 rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-100">
             <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-400/20 text-yellow-700 rounded-lg shrink-0">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-yellow-800 uppercase tracking-wide mb-1">助记 (Memory Aid)</h3>
                  <p className="text-gray-800 italic">{data.mnemonic}</p>
                </div>
             </div>
          </div>

          {/* Examples */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Beispiele</h3>
            <div className="space-y-4">
              {data.examples.map((ex, i) => (
                <div key={i} className="group">
                  <p className="text-lg text-gray-900 mb-1">{ex.de}</p>
                  <p className="text-gray-500 group-hover:text-gray-700 transition-colors">{ex.cn}</p>
                  {i < data.examples.length - 1 && <div className="h-px bg-gray-100 mt-4" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Encyclopedia View (Restored) ---

const EncyclopediaView = () => {
  const [selectedTopic, setSelectedTopic] = useState<WikiTopic | null>(null);

  if (selectedTopic) {
    return (
      <div className="animate-fade-in space-y-6">
        <button 
          onClick={() => setSelectedTopic(null)} 
          className="flex items-center text-gray-500 hover:text-black transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Zurück zur Übersicht
        </button>

        <div className="glass-card p-8 rounded-2xl">
          <div className="mb-6 border-b border-gray-100 pb-4">
            <h2 className="text-3xl font-bold text-black mb-2">{selectedTopic.title}</h2>
            <p className="text-gray-500">{selectedTopic.description}</p>
          </div>
          <div className="prose prose-lg max-w-none text-gray-800 whitespace-pre-line">
             {selectedTopic.content.split('\n').map((line, i) => {
               if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-6 mb-3 text-black">{line.replace('## ', '')}</h2>;
               if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mt-4 mb-2 text-gray-900">{line.replace('### ', '')}</h3>;
               if (line.startsWith('* ')) {
                  const content = line.replace('* ', '');
                  const parts = content.split('**');
                  return (
                    <li key={i} className="ml-4 list-disc marker:text-gray-400 pl-1 mb-1">
                      {parts.map((part, idx) => idx % 2 === 1 ? <strong key={idx} className="font-bold text-gray-900">{part}</strong> : part)}
                    </li>
                  );
               }
               const parts = line.split('**');
               return (
                 <p key={i} className="mb-2 leading-relaxed">
                   {parts.map((part, idx) => idx % 2 === 1 ? <strong key={idx} className="font-bold text-gray-900">{part}</strong> : part)}
                 </p>
               );
             })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center py-8">
        <GraduationCap className="w-12 h-12 mx-auto mb-4 text-black" />
        <h2 className="text-2xl font-bold text-gray-900">Grammatik Enzyklopädie</h2>
        <p className="text-gray-500 mt-2">Wichtige Themen im Überblick</p>
      </div>

      {Object.entries(TOPICS).map(([category, topics]) => (
        <div key={category} className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-1">{category}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setSelectedTopic(topic)}
                className="glass-card p-5 rounded-xl text-left hover:border-black/20 hover:shadow-md transition-all group"
              >
                <h4 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                  {topic.title}
                </h4>
                <p className="text-sm text-gray-500 line-clamp-2">{topic.description}</p>
                <div className="mt-3 flex items-center text-xs font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Lesen <ChevronRight className="w-3 h-3 ml-1" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// --- App Component (Restored) ---

const App = () => {
  const [activeTab, setActiveTab] = useState<'dictionary' | 'encyclopedia'>('dictionary');
  
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-yellow-200">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span className="w-8 h-8 bg-black text-white flex items-center justify-center rounded-lg">D</span>
            <span>Deutsches Wörterbuch</span>
          </div>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-full">
            <button
              onClick={() => setActiveTab('dictionary')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeTab === 'dictionary' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              查词
            </button>
            <button
              onClick={() => setActiveTab('encyclopedia')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeTab === 'encyclopedia' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              百科
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {activeTab === 'dictionary' ? <DictionaryView /> : <EncyclopediaView />}
      </main>

      {/* Global Styles for clean scrollbars and utilities */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .glass-card { background: white; border: 1px solid #e5e7eb; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .table-row-hover:hover { background-color: #f9fafb; }
      `}</style>
    </div>
  );
};

// --- Entry Point (Restored) ---
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
