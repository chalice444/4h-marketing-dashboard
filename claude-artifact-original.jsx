import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell, LabelList,
} from "recharts";
import {
  Upload, Map as MapIcon, Users, BarChart3, ChevronLeft, ChevronRight, X, Check,
  AlertTriangle, Info, Download, Building2, Target, RefreshCw, Loader2,
  MapPin, Zap, Heart, TrendingUp, Menu,
} from "lucide-react";
import Papa from "papaparse";

// ============================================================
// 定数・店舗情報
// ============================================================
const STORES = {
  梅ヶ丘: { lat: 35.655641, lng: 139.651382, color: "#6B4A7A", light: "#F1ECF2",
    address: "世田谷区梅丘1丁目43−37", postal: "〒154-0022" },
  狛江: { lat: 35.630806, lng: 139.575562, color: "#2E6B7A", light: "#E8F2F3",
    address: "狛江市元和泉1丁目11−20", postal: "〒201-0013" },
};
const STORE_KEYS = Object.keys(STORES);

// 主要市区町村の重心座標（東京南西部・神奈川北部）
const MUNI_COORDS = {
  // 世田谷区・狛江市は町名レベル
  "梅丘": [35.6472, 139.6401], "宮坂": [35.6432, 139.6355],
  "経堂": [35.6482, 139.6267], "豪徳寺": [35.6498, 139.6318],
  "赤堤": [35.6522, 139.6356], "松原": [35.6527, 139.6410],
  "羽根木": [35.6516, 139.6428], "代田": [35.6522, 139.6446],
  "代沢": [35.6551, 139.6500], "太子堂": [35.6594, 139.6528],
  "三宿": [35.6561, 139.6571], "池尻": [35.6557, 139.6628],
  "三軒茶屋": [35.6432, 139.6690], "若林": [35.6467, 139.6570],
  "世田谷": [35.6406, 139.6538], "桜": [35.6386, 139.6599],
  "上町": [35.6358, 139.6540], "弦巻": [35.6409, 139.6436],
  "桜丘": [35.6408, 139.6370], "粕谷": [35.6357, 139.6181],
  "船橋": [35.6339, 139.6264], "千歳台": [35.6359, 139.5944],
  "砧": [35.6293, 139.5993], "大蔵": [35.6244, 139.5939],
  "瀬田": [35.6222, 139.6001], "岡本": [35.6293, 139.5822],
  "喜多見": [35.6360, 139.5720], "成城": [35.6445, 139.5956],
  "祖師谷": [35.6451, 139.5872], "上祖師谷": [35.6390, 139.5779],
  "廻沢": [35.6396, 139.5837], "給田": [35.6414, 139.5987],
  "用賀": [35.6385, 139.6302], "深沢": [35.6286, 139.6374],
  "等々力": [35.6186, 139.6496], "玉川": [35.6136, 139.6397],
  "野毛": [35.6149, 139.6450], "中町": [35.6460, 139.6458],
  "北烏山": [35.6576, 139.5780], "南烏山": [35.6545, 139.5832],
  "奥沢": [35.6228, 139.6840], "自由が丘": [35.6079, 139.6675],
  "尾山台": [35.6151, 139.6578], "玉堤": [35.6188, 139.6524],
  // 狛江市 — 町名レベル
  "元和泉": [35.6297, 139.5838], "和泉本町": [35.6386, 139.5789],
  "駒井町": [35.6342, 139.5798], "猪方": [35.6247, 139.5789],
  "岩戸北": [35.6368, 139.5848], "岩戸南": [35.6315, 139.5858],
  "東和泉": [35.6264, 139.5758], "西和泉": [35.6460, 139.5754],
  "西野川": [35.6298, 139.5709], "東野川": [35.6317, 139.5747],
  "中和泉": [35.6418, 139.5832], "小足立": [35.6255, 139.5862],
  // 他市区町村 フォールバック
  "世田谷区": [35.6465, 139.6537],
  "狛江市": [35.6358, 139.5778],
  "調布市": [35.6513, 139.5446],
  "三鷹市": [35.6836, 139.5603],
  "武蔵野市": [35.7177, 139.5661],
  "小金井市": [35.6996, 139.5027],
  "府中市": [35.6681, 139.4779],
  "稲城市": [35.6376, 139.5055],
  "多摩市": [35.6368, 139.4461],
  "川崎市多摩区": [35.6198, 139.5764],
  "川崎市高津区": [35.6003, 139.6195],
  "川崎市中原区": [35.5773, 139.6531],
  "川崎市宮前区": [35.5694, 139.5718],
  "川崎市川崎区": [35.5308, 139.7023],
  "横浜市港北区": [35.5436, 139.6239],
  "横浜市青葉区": [35.5588, 139.5374],
  "目黒区": [35.6424, 139.6991],
  "渋谷区": [35.6641, 139.7034],
  "品川区": [35.6091, 139.7300],
  "大田区": [35.5616, 139.7163],
  "杉並区": [35.6994, 139.6364],
  "中野区": [35.7073, 139.6637],
  "港区": [35.6581, 139.7514],
  "新宿区": [35.6938, 139.7036],
  "町田市": [35.5452, 139.4388],
  "相模原市": [35.5667, 139.3736],
  "川崎市": [35.5308, 139.7023],
  "横浜市": [35.4437, 139.6380],
};

const CHOME_COORDS = {
  // 世田谷区・梅ヶ丘商圏の町丁目代表点
  "経堂1丁目": [35.6480, 139.6352],
  "経堂2丁目": [35.6514, 139.6317],
  "経堂3丁目": [35.6509, 139.6255],
  "経堂4丁目": [35.6474, 139.6222],
  "経堂5丁目": [35.6450, 139.6292],
  "宮坂1丁目": [35.6450, 139.6390],
  "宮坂2丁目": [35.6481, 139.6370],
  "宮坂3丁目": [35.6511, 139.6334],
  "豪徳寺1丁目": [35.6510, 139.6450],
  "豪徳寺2丁目": [35.6484, 139.6432],
  "赤堤1丁目": [35.6537, 139.6391],
  "赤堤2丁目": [35.6552, 139.6440],
  "赤堤3丁目": [35.6573, 139.6378],
  "赤堤4丁目": [35.6602, 139.6332],
  "赤堤5丁目": [35.6640, 139.6302],
  "桜1丁目": [35.6403, 139.6468],
  "桜2丁目": [35.6388, 139.6422],
  "桜3丁目": [35.6368, 139.6388],
  "桜丘1丁目": [35.6421, 139.6366],
  "桜丘2丁目": [35.6400, 139.6324],
  "桜丘3丁目": [35.6364, 139.6325],
  "桜丘4丁目": [35.6330, 139.6308],
  "桜丘5丁目": [35.6385, 139.6262],
  "船橋1丁目": [35.6492, 139.6230],
  "船橋2丁目": [35.6519, 139.6168],
  "船橋3丁目": [35.6462, 139.6165],
  "船橋4丁目": [35.6415, 139.6170],
  "船橋5丁目": [35.6462, 139.6225],
  // 狛江商圏の町丁目代表点
  "岩戸北1丁目": [35.6389, 139.5827],
  "岩戸北2丁目": [35.6373, 139.5868],
  "岩戸北3丁目": [35.6354, 139.5870],
  "岩戸北4丁目": [35.6336, 139.5872],
  "岩戸南1丁目": [35.6322, 139.5840],
  "岩戸南2丁目": [35.6299, 139.5845],
  "岩戸南3丁目": [35.6281, 139.5864],
  "岩戸南4丁目": [35.6257, 139.5865],
  "東和泉1丁目": [35.6302, 139.5771],
  "東和泉2丁目": [35.6274, 139.5780],
  "東和泉3丁目": [35.6250, 139.5754],
  "東和泉4丁目": [35.6231, 139.5727],
  "元和泉1丁目": [35.6305, 139.5789],
  "元和泉2丁目": [35.6325, 139.5818],
  "元和泉3丁目": [35.6277, 139.5836],
  "中和泉1丁目": [35.6372, 139.5775],
  "中和泉2丁目": [35.6399, 139.5787],
  "中和泉3丁目": [35.6418, 139.5807],
  "中和泉4丁目": [35.6428, 139.5843],
  "中和泉5丁目": [35.6444, 139.5888],
  "西和泉1丁目": [35.6454, 139.5768],
  "西和泉2丁目": [35.6467, 139.5737],
};

const MANUAL_GEO_CORRECTIONS = {};

const GEO_COORDS = { ...MUNI_COORDS, ...CHOME_COORDS };

const DIST_BANDS = [
  { label: "〜1km",  max: 1 },
  { label: "〜2km",  max: 2 },
  { label: "〜3km",  max: 3 },
  { label: "〜4km",  max: 4 },
  { label: "5km超", max: Infinity },
];
const BAND_COLORS = [
  { fill:"#C0392B", stroke:"#922B21", fillOpacity:0.16 },
  { fill:"#D68910", stroke:"#B7770D", fillOpacity:0.13 },
  { fill:"#1E8449", stroke:"#196F3D", fillOpacity:0.10 },
  { fill:"#2E86C1", stroke:"#1A5276", fillOpacity:0.07 },
];

const AGE_GROUPS = ["10代以下", "20代", "30代", "40代", "50代", "60代以上"];
const CHART_COLORS = ["#6B4A7A", "#2E6B7A", "#C97B3D", "#3A8C5C", "#B03A52", "#5E5E8A", "#7A6B3A"];
const PIE_COLORS_GENDER = ["#2E6B7A", "#C97B3D"];

// ============================================================
// ユーティリティ
// ============================================================
function haversine([lat1, lng1], [lat2, lng2]) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseFlexDate(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  const m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  return null;
}

function getAgeGroup(age) {
  if (!age || isNaN(age)) return "不明";
  if (age < 20) return "10代以下";
  if (age < 30) return "20代";
  if (age < 40) return "30代";
  if (age < 50) return "40代";
  if (age < 60) return "50代";
  return "60代以上";
}

function getDistBand(distKm) {
  if (distKm == null) return "不明";
  for (const b of DIST_BANDS) if (distKm <= b.max) return b.label;
  return "5km超";
}

function normalizeAddressText(...parts) {
  return parts
    .filter(Boolean)
    .join("")
    .normalize("NFKC")
    .replace(/[‐‑‒–—―ーｰ－]/g, "-")
    .replace(/[ 　\t\r\n]/g, "")
    .replace(/(\d+)丁目/g, "$1丁目")
    .replace(/(\d+)-/g, "$1丁目")
    .trim();
}

function normalizeGeoKey(key) {
  return normalizeAddressText(key);
}

function extractTown(address2) {
  if (!address2) return "";
  const s = normalizeAddressText(address2);
  const chome = s.match(/^(.+?\d+丁目)/);
  if (chome) return chome[1];
  const town = s.match(/^([^0-9\-番号]+?)(?:\d+丁目|\d+|番|号|-|$)/);
  return town ? town[1].trim() : "";
}

function findLongestGeoKey(addressText, table) {
  const normalizedAddress = normalizeAddressText(addressText);
  return Object.keys(table)
    .map(k => ({ raw: k, normalized: normalizeGeoKey(k) }))
    .filter(k => normalizedAddress.includes(k.normalized))
    .sort((a, b) => b.normalized.length - a.normalized.length)[0]?.raw || "";
}

function resolveMemberGeo(row) {
  const postal = row["郵便番号"] || "";
  const prefecture = row["都道府県"] || "";
  const address1 = (row["住所1"] || "").trim();
  const address2 = (row["住所2"] || "").trim();
  const geoAddressText = normalizeAddressText(prefecture, address1, address2);

  const manualKey = findLongestGeoKey(geoAddressText, MANUAL_GEO_CORRECTIONS);
  if (manualKey) {
    return {
      municipality: manualKey,
      coords: MANUAL_GEO_CORRECTIONS[manualKey],
      geoSource: "manual_correction",
      geoKey: manualKey,
      geoAddressText,
      geoConfidence: "high",
      geoNote: "手動補正",
    };
  }

  const chomeKey = findLongestGeoKey(geoAddressText, CHOME_COORDS);
  if (chomeKey) {
    return {
      municipality: chomeKey,
      coords: CHOME_COORDS[chomeKey],
      geoSource: "town_chome_match",
      geoKey: chomeKey,
      geoAddressText,
      geoConfidence: "high",
      geoNote: "町丁目一致",
    };
  }

  const townFromAddress2 = extractTown(address2);
  if (townFromAddress2 && MUNI_COORDS[townFromAddress2]) {
    return {
      municipality: townFromAddress2,
      coords: MUNI_COORDS[townFromAddress2],
      geoSource: "town_match",
      geoKey: townFromAddress2,
      geoAddressText,
      geoConfidence: "medium",
      geoNote: "住所2の町名代表点",
    };
  }

  const townKey = findLongestGeoKey(geoAddressText, MUNI_COORDS);
  if (townKey) {
    return {
      municipality: townKey,
      coords: MUNI_COORDS[townKey],
      geoSource: "town_match",
      geoKey: townKey,
      geoAddressText,
      geoConfidence: "medium",
      geoNote: "住所全文の町名代表点",
    };
  }

  const address1Key = findLongestGeoKey(address1, MUNI_COORDS);
  if (address1Key) {
    return {
      municipality: address1Key,
      coords: MUNI_COORDS[address1Key],
      geoSource: "address1_match",
      geoKey: address1Key,
      geoAddressText,
      geoConfidence: "low",
      geoNote: "住所1フォールバック",
    };
  }

  return {
    municipality: address1 || "不明",
    coords: null,
    geoSource: "fallback",
    geoKey: "",
    geoAddressText,
    geoConfidence: "low",
    geoNote: postal ? "座標テーブル未一致（郵便番号は保存のみ）" : "座標テーブル未一致",
  };
}

function normalizeMuni(address1, address2, row = {}) {
  return resolveMemberGeo({ ...row, "住所1": address1, "住所2": address2 }).municipality;
}

function isValidCoord(lat, lng) {
  return Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
}

function getMemberMapGeo(member) {
  const hasSavedCoord = isValidCoord(member.lat, member.lng);
  const resolved = resolveMemberGeo({
    "郵便番号": member.postal || "",
    "都道府県": member.prefecture || "",
    "住所1": member.address1 || "",
    "住所2": member.address2 || "",
  });
  const hasNewGeo = Boolean(member.geoKey || member.geoSource || member.geoConfidence);
  const useSavedCoord = hasSavedCoord && hasNewGeo;
  const fallbackCoord = resolved.coords || (hasSavedCoord ? [Number(member.lat), Number(member.lng)] : null);
  const coords = useSavedCoord ? [Number(member.lat), Number(member.lng)] : fallbackCoord;
  const key = member.geoKey || resolved.geoKey || member.municipality || "fallback";

  return {
    key,
    name: key || member.municipality || "不明",
    lat: coords?.[0] ?? null,
    lng: coords?.[1] ?? null,
    geoSource: member.geoSource || resolved.geoSource || "legacy",
    geoConfidence: member.geoConfidence || resolved.geoConfidence || (hasSavedCoord ? "medium" : "low"),
    geoAddressText: member.geoAddressText || resolved.geoAddressText || normalizeAddressText(member.prefecture, member.address1, member.address2),
    geoNote: member.geoNote || (hasNewGeo ? "" : `表示時に再判定: ${resolved.geoNote}`),
    municipality: member.municipality || resolved.municipality || "不明",
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeStore(raw) {
  const s = raw || "";
  if (s.includes("梅ヶ丘")) return "梅ヶ丘";
  if (s.includes("狛江")) return "狛江";
  return "";
}

function getOrFieldValue(row, patterns) {
  for (const p of patterns) {
    const k = Object.keys(row).find(k2 => k2.includes(p));
    if (k && row[k]?.trim()) return row[k].trim();
  }
  return "";
}

function getMultiFieldValues(row, prefix) {
  return Object.keys(row)
    .filter(k => k.includes(prefix) && row[k]?.trim())
    .map(k => {
      const parts = k.split("_");
      return parts[parts.length - 1];
    })
    .filter(v => v && v !== prefix);
}

const pct = (n, d) => d ? `${(n / d * 100).toFixed(1)}%` : "—";
const num = (n) => n == null ? "—" : Math.round(n).toLocaleString("ja-JP");

// ============================================================
// CSV パーサー
// ============================================================
function parseML009Row(row) {
  const address1 = (row["住所1"] || "").trim();
  const address2 = (row["住所2"] || "").trim();
  const geo = resolveMemberGeo(row);
  const municipality = geo.municipality;
  const coords = geo.coords;
  const store = normalizeStore(row["メンバー所属店舗名"] || row["所属店舗名"] || "");
  const gender = row["性別"] === "男性" ? "男性" : row["性別"] === "女性" ? "女性" : "不明";
  const age = parseInt(row["年齢"]) || null;
  const distUme = coords ? haversine(coords, [STORES.梅ヶ丘.lat, STORES.梅ヶ丘.lng]) : null;
  const distKom = coords ? haversine(coords, [STORES.狛江.lat, STORES.狛江.lng]) : null;
  const planEnd = parseFlexDate(row["プラン契約適用終了日"] || "");
  return {
    id: String(row["メンバーID"] || "").trim().replace(/[　\s]/g, ""),
    name: row["氏名"] || "",
    gender, age, ageGroup: getAgeGroup(age),
    postal: row["郵便番号"] || "",
    prefecture: row["都道府県"] || "",
    address1, address2,
    joinDate: parseFlexDate(row["入会日時"] || ""),
    store, planName: row["契約プラン名"] || "",
    planStartDate: parseFlexDate(row["プラン契約適用開始日"] || ""),
    planEndDate: planEnd,
    isActive: !planEnd,
    municipality,
    lat: coords?.[0] ?? null, lng: coords?.[1] ?? null,
    geoSource: geo.geoSource,
    geoKey: geo.geoKey,
    geoAddressText: geo.geoAddressText,
    geoConfidence: geo.geoConfidence,
    geoNote: geo.geoNote,
    distUme, distKom,
    distBandUme: getDistBand(distUme), distBandKom: getDistBand(distKom),
  };
}

function parseQuestionnaireRow(row, store) {
  const genderCode = row["メンバー_性別"];
  const gender = genderCode === "1" ? "男性" : genderCode === "2" ? "女性" : "不明";
  return {
    memberId: String(row["メンバー_ID"] || "").trim(),
    store, gender,
    age: parseInt(row["メンバー_年齢"]) || null,
    ageGroup: getAgeGroup(parseInt(row["メンバー_年齢"])),
    postal: row["メンバー_郵便番号"] || "",
    occupation: getOrFieldValue(row, ["ご職業", "職業"]),
    whenKnew: getOrFieldValue(row, ["いつですか", "いつ知"]),
    howKnew: getOrFieldValue(row, ["どこで知りましたか", "どこで知った"]),
    lineKnowledge: getOrFieldValue(row, ["公式LINE", "LINE"]),
    gymExperience: getOrFieldValue(row, ["フィットネスクラブ", "ジムに入会"]),
    joinReasons: getMultiFieldValues(row, "入会を決めた理由"),
    infoSources: getMultiFieldValues(row, "どこで入手しましたか"),
    registeredAt: row["登録日時"] || "",
  };
}

function detectQuestionnaireStore(rows, filename) {
  if (filename && filename.includes("梅")) return "梅ヶ丘";
  if (filename && filename.includes("狛")) return "狛江";
  const storeCodes = rows.map(r => {
    const sc = Object.keys(r).find(k => k.includes("店舗コード"));
    return sc ? r[sc] : "";
  }).filter(Boolean);
  if (storeCodes.some(v => v.includes("S0001") || v.includes("梅"))) return "梅ヶ丘";
  if (storeCodes.some(v => v.includes("S0002") || v.includes("狛"))) return "狛江";
  const names = rows.map(r => r["名称"] || "");
  if (names.some(n => n.includes("梅"))) return "梅ヶ丘";
  if (names.some(n => n.includes("狛"))) return "狛江";
  return "不明";
}

function parseCsv(text) {
  const clean = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const res = Papa.parse(clean, { header: true, skipEmptyLines: true });
  return { rows: res.data, fields: res.meta.fields || [] };
}

// ============================================================
// ストレージ層
// ============================================================
const SK = {
  members: "mktg:members",
  questUme: "mktg:quest_ume",
  questKom: "mktg:quest_kom",
  meta: "mktg:meta",
};

function withTimeout(p, ms) {
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error("timeout")), ms);
    p.then(v => { clearTimeout(t); res(v); }, e => { clearTimeout(t); rej(e); });
  });
}
async function sGet(key) {
  try { const r = await withTimeout(window.storage.get(key, true), 8000); return r ? JSON.parse(r.value) : null; }
  catch { return null; }
}
async function sSet(key, value) {
  try { await withTimeout(window.storage.set(key, JSON.stringify(value), true), 8000); return true; }
  catch { return false; }
}
async function loadAll() {
  const [members, questUme, questKom, meta] = await Promise.all([
    sGet(SK.members), sGet(SK.questUme), sGet(SK.questKom), sGet(SK.meta),
  ]);
  return { members: members || [], questUme: questUme || [], questKom: questKom || [], meta };
}

// ============================================================
// グローバルCSS
// ============================================================
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;600;700&display=swap');

.m4h-root {
  --ink: #1A1F1E;
  --ink-soft: #4B5654;
  --ink-faint: #8A9490;
  --bg: #EDF1EE;
  --surface: #FFFFFF;
  --surface-soft: #F4F6F4;
  --border: #DEE4DF;
  --border-soft: #EAEEEA;
  --plum: #6B4A7A;
  --plum-soft: #F1ECF2;
  --teal: #2E6B7A;
  --teal-soft: #E8F2F3;
  --go: #2F6F4E;
  --go-soft: #E4F1EA;
  --amber: #B9791F;
  --amber-soft: #FBF0DE;
  --red: #B03A2A;
  --red-soft: #F8E8E5;
  --shadow-sm: 0 1px 3px rgba(26,31,30,0.07);
  --shadow-md: 0 4px 14px rgba(26,31,30,0.09);
  --radius: 14px;
  --radius-sm: 8px;
  --font-d: 'Space Grotesk', 'Noto Sans JP', sans-serif;
  --font-b: 'Noto Sans JP', sans-serif;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-b);
  min-height: 100%;
}
.m4h-root * { box-sizing: border-box; }
.m4h-root .num { font-family: var(--font-d); font-variant-numeric: tabular-nums; }
.m4h-card { background: var(--surface); border: 1px solid var(--border-soft); border-radius: var(--radius); box-shadow: var(--shadow-sm); }
.m4h-btn { display:inline-flex; align-items:center; gap:6px; border-radius:var(--radius-sm); font-weight:600; font-size:13px; border:1px solid transparent; cursor:pointer; font-family:inherit; white-space:nowrap; transition:background .12s; }
.m4h-btn-primary { background:var(--ink); color:white; }
.m4h-btn-primary:hover { background:#2A3330; }
.m4h-btn-outline { background:var(--surface); color:var(--ink); border-color:var(--border); }
.m4h-btn-outline:hover { background:var(--surface-soft); }
.m4h-btn-ghost { background:transparent; color:var(--ink-soft); }
.m4h-btn-ghost:hover { background:var(--surface-soft); }
.m4h-btn:disabled { opacity:.45; cursor:not-allowed; }
.m4h-fade { animation:m4hFade .3s ease both; }
@keyframes m4hFade { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }
.m4h-nav a,.m4h-nav button { display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:var(--radius-sm);color:var(--ink-soft);font-size:13px;font-weight:600;background:none;border:none;cursor:pointer;font-family:inherit;width:100%;transition:background .12s,color .12s; }
.m4h-nav a:hover,.m4h-nav button:hover { background:var(--surface-soft);color:var(--ink); }
.m4h-nav .active { background:var(--ink)!important;color:white!important; }
.m4h-pill { padding:5px 13px;border-radius:999px;font-size:12.5px;font-weight:700;border:1px solid var(--border);background:var(--surface);color:var(--ink-soft);cursor:pointer;transition:all .12s;font-family:inherit; }
.m4h-pill.on { background:var(--ink);color:white;border-color:var(--ink); }
input.m4h-in,select.m4h-in { border:1px solid var(--border);border-radius:var(--radius-sm);padding:7px 10px;font-size:13px;background:var(--surface);color:var(--ink);font-family:inherit;width:100%; }
input.m4h-in:focus,select.m4h-in:focus { outline:2px solid var(--teal);outline-offset:1px;border-color:var(--teal); }
.m4h-table { width:max-content;min-width:100%;border-collapse:separate;border-spacing:0;font-size:13px; }
.m4h-table th { text-align:right;font-weight:700;color:var(--ink-soft);font-size:11px;padding:8px 12px;border-bottom:1px solid var(--border);white-space:nowrap;background:var(--surface-soft); }
.m4h-table th:first-child,.m4h-table td:first-child { text-align:left; }
.m4h-table td { text-align:right;padding:7px 12px;border-bottom:1px solid var(--border-soft);white-space:nowrap; }
.m4h-table tr:hover td { background:var(--surface-soft); }
.m4h-scroll { overflow:auto; }
.m4h-scroll::-webkit-scrollbar { height:5px;width:5px; }
.m4h-scroll::-webkit-scrollbar-thumb { background:var(--border);border-radius:4px; }

#leaflet-map { width:100%;height:420px;border-radius:var(--radius);overflow:hidden;z-index:0; }
.m4h-store-legend { display:flex;gap:16px;flex-wrap:wrap;font-size:12px; }
.m4h-store-legend span { display:flex;align-items:center;gap:6px;font-weight:600; }

.m4h-stat-row { display:flex;gap:12px;flex-wrap:wrap; }
.m4h-stat { flex:1;min-width:120px;padding:14px 16px;background:var(--surface);border:1px solid var(--border-soft);border-radius:var(--radius);box-shadow:var(--shadow-sm); }
.m4h-stat-label { font-size:11px;font-weight:700;color:var(--ink-faint);margin-bottom:4px; }
.m4h-stat-val { font-family:var(--font-d);font-size:26px;font-weight:700;line-height:1; }
.m4h-stat-sub { font-size:11px;color:var(--ink-faint);margin-top:3px; }

@media(max-width:860px){
  .m4h-sidebar { display:none!important; }
  .m4h-bottom-nav { display:flex!important; }
  .m4h-main { padding-bottom:72px!important; }
}
.m4h-bottom-nav { display:none;position:fixed;bottom:0;left:0;right:0;background:var(--surface);border-top:1px solid var(--border);z-index:80;padding:6px 0 calc(6px + env(safe-area-inset-bottom)); }
.m4h-bottom-nav-inner { display:flex;justify-content:space-around; }
.m4h-bottom-nav button { display:flex;flex-direction:column;align-items:center;gap:2px;color:var(--ink-faint);font-size:9.5px;font-weight:700;background:none;border:none;cursor:pointer;font-family:inherit;padding:4px 8px;flex:1; }
.m4h-bottom-nav button.active { color:var(--ink); }
`;

// ============================================================
// 小コンポーネント
// ============================================================
function Pill({ active, onClick, children }) {
  return <button className={`m4h-pill ${active ? "on" : ""}`} onClick={onClick}>{children}</button>;
}
function SectionHead({ eyebrow, title, action }) {
  return (
    <div style={{ display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10 }}>
      <div>
        {eyebrow && <div style={{ fontSize:11,fontWeight:700,color:"var(--ink-faint)",letterSpacing:".05em",marginBottom:2 }}>{eyebrow}</div>}
        <h2 style={{ fontFamily:"var(--font-d)",fontSize:20,fontWeight:700,margin:0 }}>{title}</h2>
      </div>
      {action}
    </div>
  );
}
function Empty({ icon: Icon = Info, title, sub }) {
  return (
    <div style={{ textAlign:"center",padding:"44px 16px",color:"var(--ink-faint)" }}>
      <Icon size={26} style={{ marginBottom:10,opacity:.55 }} />
      <div style={{ fontWeight:700,color:"var(--ink-soft)",fontSize:14 }}>{title}</div>
      {sub && <div style={{ fontSize:12.5,marginTop:4,maxWidth:340,marginInline:"auto",lineHeight:1.5 }}>{sub}</div>}
    </div>
  );
}
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{ position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",zIndex:200 }} className="m4h-fade">
      <div className="m4h-card" style={{ padding:"10px 18px",display:"flex",alignItems:"center",gap:8,boxShadow:"var(--shadow-md)",
        background:toast.err ? "var(--red-soft)" : "var(--ink)",color:toast.err ? "var(--red)" : "white",border:"none" }}>
        {toast.err ? <AlertTriangle size={15}/> : <Check size={15}/>}
        <span style={{ fontSize:13,fontWeight:600 }}>{toast.msg}</span>
      </div>
    </div>
  );
}
function StoreTag({ store }) {
  const s = STORES[store];
  if (!s) return null;
  return <span className="num" style={{ fontSize:11,fontWeight:700,background:s.light,color:s.color,borderRadius:99,padding:"2px 9px" }}>{store}</span>;
}

// ============================================================
// 地図（Leaflet）
// ============================================================
function MapView({ members }) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const layersRef = useRef([]);
  const [loading, setLoading] = useState(true);
  const [filterStore, setFilterStore] = useState("");
  const [showLowGeoOnly, setShowLowGeoOnly] = useState(true);

  const filtered = useMemo(() => {
    let m = members.filter(r => {
      const geo = getMemberMapGeo(r);
      return isValidCoord(geo.lat, geo.lng);
    });
    if (filterStore) m = m.filter(r => r.store === filterStore);
    return m;
  }, [members, filterStore]);

  // geoKey を優先し、表示座標は会員ごとの lat/lng を平均して集計
  const muniClusters = useMemo(() => {
    const map = new Map();
    for (const m of filtered) {
      const geo = getMemberMapGeo(m);
      if (!isValidCoord(geo.lat, geo.lng)) continue;
      const k = geo.key || "fallback";
      if (!map.has(k)) {
        map.set(k, {
          key: k,
          name: geo.name,
          lat: Number(geo.lat),
          lng: Number(geo.lng),
          latSum: 0,
          lngSum: 0,
          count: 0,
          stores: {},
          geoSources: {},
          municipalities: {},
          lowCount: 0,
        });
      }
      const c = map.get(k);
      c.latSum += Number(geo.lat);
      c.lngSum += Number(geo.lng);
      c.count++;
      c.stores[m.store] = (c.stores[m.store] || 0) + 1;
      c.geoSources[geo.geoSource] = (c.geoSources[geo.geoSource] || 0) + 1;
      c.municipalities[geo.municipality] = (c.municipalities[geo.municipality] || 0) + 1;
      if (geo.geoConfidence === "low") c.lowCount++;
      c.lat = c.latSum / c.count;
      c.lng = c.lngSum / c.count;
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [filtered]);

  const initMap = useCallback(() => {
    if (!mapRef.current || leafletMapRef.current || !window.L) return;
    const L = window.L;
    const map = L.map(mapRef.current).setView([35.638, 139.610], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
      maxZoom: 18,
    }).addTo(map);
    leafletMapRef.current = map;
    setLoading(false);
  }, []);

  useEffect(() => {
    if (window.L) { initMap(); return; }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    script.onload = initMap;
    script.onerror = () => setLoading(false);
    document.head.appendChild(script);
    return () => {
      if (leafletMapRef.current) { leafletMapRef.current.remove(); leafletMapRef.current = null; }
    };
  }, []);

  useEffect(() => {
    const L = window.L;
    const map = leafletMapRef.current;
    if (!L || !map) return;
    layersRef.current.forEach(l => map.removeLayer(l));
    layersRef.current = [];

    const bandRadii = [4000, 3000, 2000, 1000];
    for (const storeKey of STORE_KEYS) {
      const s = STORES[storeKey];
      bandRadii.forEach((r, i) => {
        const bi = bandRadii.length - 1 - i;
        const bc = BAND_COLORS[bi];
        const c = L.circle([s.lat, s.lng], { radius: r, color: bc.stroke, fillColor: bc.fill, weight: 1.5, fillOpacity: bc.fillOpacity, dashArray: bi < 2 ? null : "6 4", interactive: false }).addTo(map);
        layersRef.current.push(c);
      });
      const outerRing = L.circle([s.lat, s.lng], { radius: 5000, color: "#95A5A6", fillColor: "transparent", weight: 1, fillOpacity: 0, dashArray: "8 6", interactive: false }).addTo(map);
      layersRef.current.push(outerRing);
      // 赤ピンマーカー（文字なし・クリックで住所ポップアップ）
      const pinIcon = L.divIcon({
        html: `<div style="position:relative;width:24px;height:36px">
          <svg viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg" style="width:24px;height:36px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4))">
            <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="#E53935"/>
            <circle cx="12" cy="12" r="5" fill="white"/>
          </svg>
        </div>`,
        className: "", iconSize: [24, 36], iconAnchor: [12, 36], popupAnchor: [0, -38],
      });
      const m = L.marker([s.lat, s.lng], { icon: pinIcon, zIndexOffset: 2000 })
        .bindPopup(`<b>${storeKey}店</b><br>${s.postal}<br>${s.address}`, { maxWidth: 220 })
        .addTo(map);
      layersRef.current.push(m);
    }

    // 会員分布バブル
    for (const cl of muniClusters) {
      const r = Math.max(6, Math.min(30, 5 + cl.count * 0.5));
      const storeKey = Object.keys(cl.stores).sort((a, b) => cl.stores[b] - cl.stores[a])[0];
      const color = storeKey && STORES[storeKey] ? STORES[storeKey].color : "#666";
      const sourceText = Object.entries(cl.geoSources)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `${escapeHtml(k)}: ${v}人`)
        .join("<br>");
      const municipalityText = Object.entries(cl.municipalities)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([k, v]) => `${escapeHtml(k)}: ${v}人`)
        .join("<br>");
      const popupHtml = `
        <b>${escapeHtml(cl.name)}</b><br>
        会員数: ${cl.count}人<br>
        geoKey: ${escapeHtml(cl.key)}<br>
        low confidence: ${cl.lowCount}人
        <hr style="border:none;border-top:1px solid #ddd;margin:6px 0">
        <b>geoSource</b><br>${sourceText || "—"}
        <hr style="border:none;border-top:1px solid #ddd;margin:6px 0">
        <b>municipality</b><br>${municipalityText || "—"}
      `;
      const circle = L.circleMarker([cl.lat, cl.lng], {
        radius: r, color: "white", fillColor: color, weight: 1.5, fillOpacity: 0.75,
      }).bindPopup(popupHtml, { maxWidth: 280 }).addTo(map);
      layersRef.current.push(circle);
    }
  }, [muniClusters]);

  const totalWithCoords = members.filter(m => {
    const geo = getMemberMapGeo(m);
    return isValidCoord(geo.lat, geo.lng);
  }).length;
  const coverage = members.length ? Math.round(totalWithCoords / members.length * 100) : 0;
  const geoDiagnostics = useMemo(() => {
    const rows = members.map(m => {
      const geo = getMemberMapGeo(m);
      return {
        id: m.id,
        name: m.name,
        address1: m.address1,
        address2: m.address2,
        lat: geo.lat,
        lng: geo.lng,
        municipality: geo.municipality,
        geoAddressText: geo.geoAddressText,
        geoKey: geo.key || "",
        geoSource: geo.geoSource || "legacy",
        geoConfidence: geo.geoConfidence,
        geoNote: geo.geoNote,
      };
    });
    return rows
      .filter(r => !showLowGeoOnly || r.geoConfidence === "low" || r.geoSource === "fallback" || r.geoSource === "address1_match")
      .slice(0, 80);
  }, [members, showLowGeoOnly]);
  const lowGeoCount = members.filter(m => {
    const geo = getMemberMapGeo(m);
    return geo.geoConfidence === "low" || geo.geoSource === "fallback" || geo.geoSource === "address1_match";
  }).length;

  return (
    <div className="m4h-fade" style={{ display:"flex",flexDirection:"column",gap:16 }}>
      <SectionHead eyebrow="商圏マップ" title="会員分布" action={
        <div style={{ display:"flex",gap:6 }}>
          <Pill active={filterStore===""} onClick={() => setFilterStore("")}>全店</Pill>
          {STORE_KEYS.map(k => <Pill key={k} active={filterStore===k} onClick={() => setFilterStore(k)}>{k}</Pill>)}
        </div>
      } />
      <div className="m4h-card" style={{ padding:18 }}>
        {loading && (
          <div style={{ display:"flex",alignItems:"center",gap:8,color:"var(--ink-faint)",fontSize:13,padding:"16px 0" }}>
            <Loader2 size={16} style={{ animation:"spin 1s linear infinite" }} />
            <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
            地図を読み込み中…
          </div>
        )}
        <div id="leaflet-map" ref={mapRef} />
        <div style={{ marginTop:12,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8 }}>
          <div style={{ display:"flex",gap:14,flexWrap:"wrap",fontSize:12,alignItems:"center",marginBottom:6 }}>
            <span style={{ fontWeight:700,color:"var(--ink-soft)" }}>距離帯</span>
            {BAND_COLORS.map((bc,i) => <span key={i} style={{ display:"flex",alignItems:"center",gap:4 }}><span style={{ width:12,height:12,borderRadius:3,background:bc.fill,border:"2px solid "+bc.stroke,display:"inline-block" }}/>{DIST_BANDS[i].label}</span>)}
            <span style={{ display:"flex",alignItems:"center",gap:4 }}><span style={{ width:12,height:12,borderRadius:3,border:"2px dashed #95A5A6",display:"inline-block" }}/>5km圏</span>
          </div>
          <div style={{ display:"flex",gap:14,flexWrap:"wrap",fontSize:12,alignItems:"center" }}>
            <span style={{ fontWeight:700,color:"var(--ink-soft)" }}>店舗</span>
            {STORE_KEYS.map(k => (
              <span key={k} style={{ display:"flex",alignItems:"center",gap:5 }}>
                <svg viewBox="0 0 24 36" style={{ width:12,height:18,flexShrink:0 }}><path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="#E53935"/><circle cx="12" cy="12" r="5" fill="white"/></svg>
                {k}店
                <span style={{ color:"var(--ink-faint)",fontSize:10 }}>（{STORES[k].address}）</span>
              </span>
            ))}
            <span style={{ display:"flex",alignItems:"center",gap:4 }}>
              <span style={{ width:12,height:12,borderRadius:99,background:"#6B4A7A",opacity:.55,display:"inline-block" }}/>
              バブル＝入会エリア（クリックで件数詳細）
            </span>
          </div>
          <div style={{ fontSize:11,color:"var(--ink-faint)" }}>地図表示 {totalWithCoords}/{members.length}人（{coverage}%）</div>
        </div>
      </div>
      <div className="m4h-card" style={{ padding:18 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:10 }}>
          <div>
            <div style={{ fontWeight:800,fontSize:14 }}>座標診断</div>
            <div style={{ fontSize:11.5,color:"var(--ink-faint)",marginTop:3 }}>
              会員CSV取込時に、住所全文からどのキーで代表座標を決めたかを確認できます。
            </div>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
            <span style={{ fontSize:11.5,color:"var(--ink-faint)" }}>低信頼度 {lowGeoCount}件</span>
            <Pill active={showLowGeoOnly} onClick={() => setShowLowGeoOnly(true)}>低信頼度のみ</Pill>
            <Pill active={!showLowGeoOnly} onClick={() => setShowLowGeoOnly(false)}>全件</Pill>
          </div>
        </div>
        <div className="m4h-scroll" style={{ maxHeight:260,border:"1px solid var(--border-soft)",borderRadius:8 }}>
          <table className="m4h-table">
            <thead>
              <tr>
                <th>会員</th><th>住所1</th><th>住所2</th><th>lat</th><th>lng</th><th>municipality</th><th>geoKey</th><th>geoSource</th><th>信頼度</th><th>判定住所</th>
              </tr>
            </thead>
            <tbody>
              {geoDiagnostics.length ? geoDiagnostics.map(r => (
                <tr key={`${r.id}-${r.geoKey}-${r.geoSource}`}>
                  <td style={{ textAlign:"left" }}>{r.name || r.id || "—"}</td>
                  <td style={{ textAlign:"left" }}>{r.address1 || "—"}</td>
                  <td style={{ textAlign:"left" }}>{r.address2 || "—"}</td>
                  <td>{isValidCoord(r.lat, r.lng) ? Number(r.lat).toFixed(5) : "—"}</td>
                  <td>{isValidCoord(r.lat, r.lng) ? Number(r.lng).toFixed(5) : "—"}</td>
                  <td style={{ textAlign:"left" }}>{r.municipality || "—"}</td>
                  <td style={{ textAlign:"left",fontWeight:700 }}>{r.geoKey || "—"}</td>
                  <td>{r.geoSource}</td>
                  <td>
                    <span style={{
                      fontWeight:800,
                      color: r.geoConfidence === "high" ? "var(--go)" : r.geoConfidence === "medium" ? "var(--amber)" : "var(--bad)",
                    }}>{r.geoConfidence}</span>
                  </td>
                  <td style={{ textAlign:"left",maxWidth:260,whiteSpace:"normal" }}>{r.geoAddressText || "—"}</td>
                </tr>
              )) : (
                <tr><td colSpan={10} style={{ color:"var(--ink-faint)",padding:18 }}>表示対象の診断データはありません</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize:11,color:"var(--ink-faint)",marginTop:8,lineHeight:1.6 }}>
          high は町丁目一致、medium は町名代表点、low は住所1フォールバックまたは未一致です。既存取込済みデータは、会員CSVを再取込すると新しい診断情報と座標で更新されます。
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 商圏サマリー
// ============================================================
function AreaSummary({ members }) {
  const [filterStore, setFilterStore] = useState("");

  const filtered = useMemo(() => filterStore ? members.filter(m => m.store === filterStore) : members, [members, filterStore]);
  const withDist = useMemo(() => {
    const key = filterStore ? (filterStore === "梅ヶ丘" ? "distBandUme" : "distBandKom") : null;
    return filtered.map(m => ({ ...m, effectiveBand: key ? m[key] : null }));
  }, [filtered, filterStore]);

  const bandData = useMemo(() => {
    if (!filterStore) return [];
    const key = filterStore === "梅ヶ丘" ? "distBandUme" : "distBandKom";
    const counts = {};
    for (const b of DIST_BANDS) counts[b.label] = 0;
    counts["不明"] = 0;
    for (const m of filtered) counts[m[key] || "不明"] = (counts[m[key] || "不明"] || 0) + 1;
    return [...DIST_BANDS.map(b => ({ name: b.label, 会員数: counts[b.label] || 0 })), { name: "不明", 会員数: counts["不明"] || 0 }].filter(r => r.会員数 > 0);
  }, [filtered, filterStore]);

  const muniRank = useMemo(() => {
    const counts = {};
    for (const m of filtered) {
      const k = m.municipality || "不明";
      counts[k] = (counts[k] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([name, count]) => ({ name, count }));
  }, [filtered]);

  const totals = useMemo(() => {
    const n = filtered.length;
    const setagaya = filtered.filter(m => m.address1?.includes("世田谷")).length;
    const komae = filtered.filter(m => m.address1?.includes("狛江")).length;
    return { n, setagaya, komae };
  }, [filtered]);

  return (
    <div className="m4h-fade" style={{ display:"flex",flexDirection:"column",gap:16 }}>
      <SectionHead eyebrow="商圏サマリー" title="エリア別会員数" action={
        <div style={{ display:"flex",gap:6 }}>
          <Pill active={filterStore===""} onClick={() => setFilterStore("")}>全店</Pill>
          {STORE_KEYS.map(k => <Pill key={k} active={filterStore===k} onClick={() => setFilterStore(k)}>{k}</Pill>)}
        </div>
      } />

      <div className="m4h-stat-row">
        <div className="m4h-stat"><div className="m4h-stat-label">対象会員数</div><div className="m4h-stat-val num">{num(totals.n)}</div><div className="m4h-stat-sub">人</div></div>
        <div className="m4h-stat"><div className="m4h-stat-label">世田谷区</div><div className="m4h-stat-val num">{num(totals.setagaya)}</div><div className="m4h-stat-sub">{pct(totals.setagaya, totals.n)}</div></div>
        <div className="m4h-stat"><div className="m4h-stat-label">狛江市</div><div className="m4h-stat-val num">{num(totals.komae)}</div><div className="m4h-stat-sub">{pct(totals.komae, totals.n)}</div></div>
      </div>

      {filterStore && bandData.length > 0 && (
        <div className="m4h-card" style={{ padding:18 }}>
          <div style={{ fontWeight:700,fontSize:13,marginBottom:12 }}>{filterStore}店からの距離帯別会員数</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bandData} margin={{ left:0,right:10 }}>
              <CartesianGrid strokeDasharray="3 5" stroke="#DEE4DF" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize:12,fill:"var(--ink-soft)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11,fill:"var(--ink-faint)" }} axisLine={false} tickLine={false} width={36} />
              <Tooltip contentStyle={{ fontSize:12,borderRadius:8,border:"1px solid var(--border)" }} />
              <Bar dataKey="会員数" fill={STORES[filterStore].color} radius={[5,5,0,0]} maxBarSize={56} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="m4h-card" style={{ padding:18 }}>
        <div style={{ fontWeight:700,fontSize:13,marginBottom:12 }}>市区町村別ランキング（上位15）</div>
        <div className="m4h-scroll">
          <table className="m4h-table">
            <thead><tr><th>順位</th><th style={{ textAlign:"left" }}>市区町村</th><th>会員数</th><th>構成比</th></tr></thead>
            <tbody>
              {muniRank.map((r, i) => (
                <tr key={r.name}>
                  <td className="num" style={{ color:"var(--ink-faint)" }}>{i + 1}</td>
                  <td style={{ textAlign:"left",fontWeight:i < 3 ? 700 : undefined }}>{r.name}</td>
                  <td className="num"><b>{num(r.count)}</b></td>
                  <td className="num">{pct(r.count, totals.n)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


// ============================================================
// 期間フィルター（共通）
// ============================================================
function ymd(d) { return d.toISOString().slice(0,10); }
function startOfMonth(y, m) { return new Date(y, m, 1); }
function endOfMonth(y, m) { return new Date(y, m+1, 0, 23, 59, 59); }

function getDateRange(preset, customStart, customEnd) {
  const now = new Date();
  const y = now.getFullYear(), mo = now.getMonth();
  switch(preset) {
    case "current": return {
      start: startOfMonth(y, mo), end: endOfMonth(y, mo),
      cStart: startOfMonth(y, mo-1), cEnd: endOfMonth(y, mo-1),
      label: "当月", cLabel: "前月" };
    case "prev": return {
      start: startOfMonth(y, mo-1), end: endOfMonth(y, mo-1),
      cStart: startOfMonth(y, mo-2), cEnd: endOfMonth(y, mo-2),
      label: "前月", cLabel: "前々月" };
    case "3months": return {
      start: startOfMonth(y, mo-2), end: endOfMonth(y, mo),
      cStart: startOfMonth(y, mo-5), cEnd: endOfMonth(y, mo-3),
      label: "直近3ヶ月", cLabel: "前3ヶ月" };
    case "6months": return {
      start: startOfMonth(y, mo-5), end: endOfMonth(y, mo),
      cStart: startOfMonth(y, mo-11), cEnd: endOfMonth(y, mo-6),
      label: "直近半年", cLabel: "前半年" };
    case "custom": {
      if (!customStart) return null;
      const s = new Date(customStart + "T00:00:00");
      const e = customEnd ? new Date(customEnd + "T23:59:59") : endOfMonth(y, mo);
      const diff = e - s;
      return {
        start: s, end: e,
        cStart: new Date(s - diff - 86400000),
        cEnd: new Date(s.getTime() - 86400000),
        label: `${customStart}〜${customEnd || ymd(new Date())}`, cLabel: "前の同期間" };
    }
    default: return null;
  }
}

function filterQuestByDate(rows, start, end) {
  if (!start && !end) return rows;
  return rows.filter(r => {
    if (!r.registeredAt) return true;
    const d = new Date(r.registeredAt.slice(0,10) + "T00:00:00");
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  });
}

const PERIOD_PRESETS = [
  { key: "all", label: "全期間" },
  { key: "current", label: "当月" },
  { key: "prev", label: "前月" },
  { key: "3months", label: "直近3ヶ月" },
  { key: "6months", label: "直近半年" },
  { key: "custom", label: "期間指定" },
];

function PeriodBar({ period, setPeriod, customStart, setCustomStart, customEnd, setCustomEnd }) {
  const range = period !== "all" ? getDateRange(period, customStart, customEnd) : null;
  return (
    <div className="m4h-card" style={{ padding:"12px 16px", display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
      <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
        {PERIOD_PRESETS.map(p => (
          <Pill key={p.key} active={period===p.key} onClick={() => setPeriod(p.key)}>{p.label}</Pill>
        ))}
      </div>
      {period === "custom" && (
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          <input type="date" className="m4h-in" style={{ width:140 }} value={customStart} onChange={e => setCustomStart(e.target.value)} />
          <span style={{ color:"var(--ink-faint)", fontSize:13 }}>〜</span>
          <input type="date" className="m4h-in" style={{ width:140 }} value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
        </div>
      )}
      {range && (
        <div style={{ fontSize:11.5, color:"var(--ink-faint)", marginLeft:"auto", display:"flex", gap:12, flexWrap:"wrap" }}>
          <span>📊 <b style={{ color:"var(--ink)" }}>{range.label}</b>（{ymd(range.start)}〜{ymd(range.end)}）</span>
          <span>vs <b>{range.cLabel}</b>（{ymd(range.cStart)}〜{ymd(range.cEnd)}）</span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 集客チャネル分析
// ============================================================
function ChannelView({ questUme, questKom, period, customStart, customEnd }) {
  const [filterStore, setFilterStore] = useState("");
  const allQ = useMemo(() => {
    const u = questUme.map(r => ({ ...r, store: "梅ヶ丘" }));
    const k = questKom.map(r => ({ ...r, store: "狛江" }));
    const all = [...u, ...k];
    return filterStore ? all.filter(r => r.store === filterStore) : all;
  }, [questUme, questKom, filterStore]);

  // 期間フィルター
  const range = period !== "all" ? getDateRange(period, customStart, customEnd) : null;
  const curQ = range ? filterQuestByDate(allQ, range.start, range.end) : allQ;
  const compQ = range ? filterQuestByDate(allQ, range.cStart, range.cEnd) : [];
  const n = curQ.length;
  const hasComp = compQ.length > 0;
  const periodLabel = range ? range.label : "全期間";
  const compLabel = range ? range.cLabel : "";

  if (!allQ.length) return <Empty icon={Upload} title="アンケートデータがありません" sub="データ取込からアンケート回答CSVを取り込んでください" />;

  // どこで知ったか（期間比較）
  const howKnewData = useMemo(() => {
    const buildCounts = (rows) => {
      const c = {};
      for (const q of rows) if (q.howKnew) c[q.howKnew] = (c[q.howKnew]||0)+1;
      return c;
    };
    const cc = buildCounts(curQ);
    const pc = buildCounts(compQ);
    const keys = [...new Set([...Object.keys(cc),...Object.keys(pc)])].sort((a,b)=>(cc[b]||0)-(cc[a]||0)).slice(0,10);
    return keys.map(k => ({
      name: k.length>14?k.slice(0,14)+"…":k,
      _cur: n?Math.round((cc[k]||0)/n*100):0,
      _comp: compQ.length?Math.round((pc[k]||0)/compQ.length*100):0,
    }));
  }, [curQ, compQ, n]);

  // 両店比較 - どこで知ったか
  const howKnewCompare = useMemo(() => {
    const uFiltered = range ? filterQuestByDate(questUme, range.start, range.end) : questUme;
    const kFiltered = range ? filterQuestByDate(questKom, range.start, range.end) : questKom;
    const uCounts = {}; const kCounts = {};
    const nu = uFiltered.length; const nk = kFiltered.length;
    for (const q of uFiltered) { if (q.howKnew) uCounts[q.howKnew] = (uCounts[q.howKnew] || 0) + 1; }
    for (const q of kFiltered) { if (q.howKnew) kCounts[q.howKnew] = (kCounts[q.howKnew] || 0) + 1; }
    const allKeys = [...new Set([...Object.keys(uCounts), ...Object.keys(kCounts)])]
      .sort((a, b) => (uCounts[b] || 0) + (kCounts[b] || 0) - (uCounts[a] || 0) - (kCounts[a] || 0))
      .slice(0, 8);
    return { data: allKeys.map(k => ({
      name: k.length > 14 ? k.slice(0, 14) + "…" : k,
      梅ヶ丘: nu ? Math.round((uCounts[k] || 0) / nu * 100) : 0,
      狛江: nk ? Math.round((kCounts[k] || 0) / nk * 100) : 0,
    })), nu, nk };
  }, [questUme, questKom, range]);

  const filteredUme = range ? filterQuestByDate(questUme, range.start, range.end) : questUme;
  const filteredKom = range ? filterQuestByDate(questKom, range.start, range.end) : questKom;

  // LINE認知
  const lineData = useMemo(() => {
    const counts = {};
    for (const q of curQ) { const v = q.lineKnowledge; if (v) counts[v] = (counts[v] || 0) + 1; }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [curQ]);

  // HPで予約
  const hpPct = useMemo(() => {
    const cnt = curQ.filter(q => q.infoSources?.includes("ホームページ") || q.infoSources?.some(s => s.includes("HP") || s.includes("ホームページ"))).length;
    return n ? Math.round(cnt / n * 100) : 0;
  }, [curQ, n]);

  return (
    <div className="m4h-fade" style={{ display:"flex",flexDirection:"column",gap:16 }}>
      <SectionHead eyebrow="集客チャネル分析" title="どこから来ているか" action={
        <div style={{ display:"flex",gap:6 }}>
          <Pill active={filterStore===""} onClick={() => setFilterStore("")}>両店</Pill>
          {STORE_KEYS.map(k => <Pill key={k} active={filterStore===k} onClick={() => setFilterStore(k)}>{k}</Pill>)}
        </div>
      } />

      <div className="m4h-stat-row">
        <div className="m4h-stat"><div className="m4h-stat-label">回答件数（{periodLabel}）</div><div className="m4h-stat-val num">{n}</div><div className="m4h-stat-sub">件{hasComp ? ` / ${compLabel} ${compQ.length}件` : ""}</div></div>
        <div className="m4h-stat"><div className="m4h-stat-label">HP経由で予約</div><div className="m4h-stat-val num">{hpPct}%</div><div className="m4h-stat-sub">が予約時にHP参照</div></div>
        <div className="m4h-stat"><div className="m4h-stat-label">梅ヶ丘</div><div className="m4h-stat-val num">{filteredUme.length}</div><div className="m4h-stat-sub">件</div></div>
        <div className="m4h-stat"><div className="m4h-stat-label">狛江</div><div className="m4h-stat-val num">{filteredKom.length}</div><div className="m4h-stat-sub">件</div></div>
      </div>

      {!filterStore && (
        <div className="m4h-card" style={{ padding:18 }}>
          <div style={{ fontWeight:700,fontSize:13,marginBottom:4 }}>認知経路の店舗比較（%）</div>
          <div style={{ fontSize:11.5,color:"var(--ink-faint)",marginBottom:14 }}>どこで4H fitnessを知ったか（{periodLabel}）</div>
          <ResponsiveContainer width="100%" height={Math.max(180, howKnewCompare.data.length * 32)}>
            <BarChart data={howKnewCompare.data} layout="vertical" margin={{ left:8,right:24 }}>
              <CartesianGrid strokeDasharray="3 5" stroke="#DEE4DF" horizontal={false} />
              <XAxis type="number" tick={{ fontSize:10,fill:"var(--ink-faint)" }} axisLine={false} tickLine={false} tickFormatter={v => v + "%"} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize:11.5,fill:"var(--ink)" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={v => v + "%"} contentStyle={{ fontSize:12,borderRadius:8 }} />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Bar dataKey="梅ヶ丘" fill={STORES.梅ヶ丘.color} radius={[0,4,4,0]} maxBarSize={14} />
              <Bar dataKey="狛江" fill={STORES.狛江.color} radius={[0,4,4,0]} maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="m4h-card" style={{ padding:18 }}>
        <div style={{ fontWeight:700,fontSize:13,marginBottom:4 }}>認知経路ランキング</div>
        <div style={{ fontSize:11.5,color:"var(--ink-faint)",marginBottom:14 }}>
          {filterStore || "全店"}（n={n}）
        </div>
        <ResponsiveContainer width="100%" height={Math.max(200, howKnewData.length * (hasComp?40:28))}>
          <BarChart data={howKnewData} layout="vertical" margin={{ left:8,right:48 }}>
            <CartesianGrid strokeDasharray="3 5" stroke="#DEE4DF" horizontal={false} />
            <XAxis type="number" tick={{ fontSize:10,fill:"var(--ink-faint)" }} axisLine={false} tickLine={false} tickFormatter={v=>v+"%"} />
            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize:11.5,fill:"var(--ink)" }} axisLine={false} tickLine={false} />
            <Tooltip formatter={v=>v+"%"} contentStyle={{ fontSize:12,borderRadius:8 }} />
            {hasComp && <Legend wrapperStyle={{ fontSize:11 }} />}
            <Bar dataKey="_cur" name={periodLabel} fill="var(--teal)" radius={[0,4,4,0]} maxBarSize={hasComp?13:18} label={{ position:"right", fontSize:10, fill:"var(--ink-faint)", formatter:v=>v+"%" }} />
            {hasComp && <Bar dataKey="_comp" name={compLabel} fill="var(--teal)" fillOpacity={0.3} radius={[0,4,4,0]} maxBarSize={13} />}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {lineData.length > 0 && (
        <div className="m4h-card" style={{ padding:18 }}>
          <div style={{ fontWeight:700,fontSize:13,marginBottom:14 }}>公式LINE認知状況</div>
          <div style={{ display:"flex",gap:12,flexWrap:"wrap",alignItems:"center" }}>
            <PieChart width={160} height={160}>
              <Pie data={lineData} dataKey="value" cx={75} cy={75} innerRadius={48} outerRadius={72} paddingAngle={3} startAngle={90} endAngle={-270}>
                {lineData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
            </PieChart>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {lineData.map((r, i) => (
                <div key={r.name} style={{ display:"flex",alignItems:"center",gap:8,fontSize:13 }}>
                  <span style={{ width:10,height:10,borderRadius:3,background:CHART_COLORS[i%CHART_COLORS.length],flexShrink:0 }} />
                  <span style={{ color:"var(--ink-soft)" }}>{r.name}</span>
                  <span className="num" style={{ fontWeight:700 }}>{pct(r.value, n)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 入会動機分析
// ============================================================
function MotivationView({ questUme, questKom, period, customStart, customEnd }) {
  const [filterStore, setFilterStore] = useState("");
  const [filterAge, setFilterAge] = useState("");

  const allQ = useMemo(() => {
    const u = questUme.map(r => ({ ...r, store: "梅ヶ丘" }));
    const k = questKom.map(r => ({ ...r, store: "狛江" }));
    let rows = [...u, ...k];
    if (filterStore) rows = rows.filter(r => r.store === filterStore);
    if (filterAge) rows = rows.filter(r => r.ageGroup === filterAge);
    return rows;
  }, [questUme, questKom, filterStore, filterAge]);

  // 期間フィルター
  const range = period !== "all" ? getDateRange(period, customStart, customEnd) : null;
  const curQ = range ? filterQuestByDate(allQ, range.start, range.end) : allQ;
  const compQ = range ? filterQuestByDate(allQ, range.cStart, range.cEnd) : [];
  const n = curQ.length;
  const hasComp = compQ.length > 0;
  const periodLabel = range ? range.label : "全期間";
  const compLabel = range ? range.cLabel : "";

  if (!questUme.length && !questKom.length) return <Empty icon={Upload} title="アンケートデータがありません" sub="データ取込からアンケート回答CSVを取り込んでください" />;

  const REASON_LABELS = {
    "自分に合った運動ができそうだったから": "自分に合った運動",
    "短い時間で効率的な運動ができそうだったから": "時短・効率的な運動",
    "運動の効果がわかりそうだったから": "効果が見える",
    "通いやすい場所にあるから": "通いやすい場所",
    "入会金や月会費が手頃だから": "価格が手頃",
    "スタッフの接客が良かったから": "スタッフの接客",
    "施設が清潔だから": "施設が清潔",
    "その他": "その他",
  };

  const reasonData = useMemo(() => {
    const counts = {};
    for (const q of curQ) {
      for (const r of (q.joinReasons || [])) {
        const label = REASON_LABELS[r] || r;
        counts[label] = (counts[label] || 0) + 1;
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count, pct: Math.round(count / n * 100) }));
  }, [curQ, n]);

  const reasonCompare = useMemo(() => {
    const uF = range ? filterQuestByDate(questUme, range.start, range.end) : questUme;
    const kF = range ? filterQuestByDate(questKom, range.start, range.end) : questKom;
    const nu = uF.length; const nk = kF.length;
    const uc = {}; const kc = {};
    for (const q of uF) for (const r of (q.joinReasons || [])) uc[REASON_LABELS[r] || r] = (uc[REASON_LABELS[r] || r] || 0) + 1;
    for (const q of kF) for (const r of (q.joinReasons || [])) kc[REASON_LABELS[r] || r] = (kc[REASON_LABELS[r] || r] || 0) + 1;
    const keys = [...new Set([...Object.keys(uc), ...Object.keys(kc)])]
      .sort((a, b) => (uc[b] || 0) + (kc[b] || 0) - (uc[a] || 0) - (kc[a] || 0));
    return keys.filter(k => k !== "その他").map(k => ({
      name: k, 梅ヶ丘: nu ? Math.round((uc[k] || 0) / nu * 100) : 0, 狛江: nk ? Math.round((kc[k] || 0) / nk * 100) : 0,
    }));
  }, [questUme, questKom, range]);

  const gymExpData = useMemo(() => {
    const exp = curQ.filter(q => q.gymExperience?.includes("はい") || q.gymExperience === "経験あり").length;
    const noExp = n - exp;
    return [{ name: "経験あり", value: exp }, { name: "初めて", value: noExp }];
  }, [curQ, n]);

  return (
    <div className="m4h-fade" style={{ display:"flex",flexDirection:"column",gap:16 }}>
      <SectionHead eyebrow="入会動機分析" title="なぜ入会したか" action={
        <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
          <Pill active={filterStore===""} onClick={() => setFilterStore("")}>両店</Pill>
          {STORE_KEYS.map(k => <Pill key={k} active={filterStore===k} onClick={() => setFilterStore(k)}>{k}</Pill>)}
        </div>
      } />

      <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
        <Pill active={filterAge===""} onClick={() => setFilterAge("")}>全年代</Pill>
        {AGE_GROUPS.map(g => <Pill key={g} active={filterAge===g} onClick={() => setFilterAge(g)}>{g}</Pill>)}
      </div>

      <div className="m4h-card" style={{ padding:18 }}>
        <div style={{ fontWeight:700,fontSize:13,marginBottom:4 }}>入会を決めた理由（複数回答）</div>
        <div style={{ fontSize:11.5,color:"var(--ink-faint)",marginBottom:14 }}>{filterStore || "全店"}{filterAge ? `・${filterAge}` : ""}（n={n}）</div>
        <ResponsiveContainer width="100%" height={Math.max(180, reasonData.length * 32)}>
          <BarChart data={reasonData} layout="vertical" margin={{ left:8,right:56 }}>
            <CartesianGrid strokeDasharray="3 5" stroke="#DEE4DF" horizontal={false} />
            <XAxis type="number" tick={{ fontSize:10,fill:"var(--ink-faint)" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize:11.5,fill:"var(--ink)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize:12,borderRadius:8 }} formatter={(v, n, p) => [`${v}件 (${p.payload.pct}%)`, "件数"]} />
            <Bar dataKey="count" fill="var(--plum)" radius={[0,5,5,0]} maxBarSize={18}
              label={{ position:"right", fontSize:11.5, fill:"var(--ink-soft)", formatter: v => `${n ? Math.round(v / n * 100) : 0}%` }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {!filterStore && (
        <div className="m4h-card" style={{ padding:18 }}>
          <div style={{ fontWeight:700,fontSize:13,marginBottom:4 }}>入会理由の店舗比較（%）</div>
          <div style={{ fontSize:11.5,color:"var(--ink-faint)",marginBottom:14 }}>梅ヶ丘(n={(range ? filterQuestByDate(questUme, range.start, range.end) : questUme).length}) vs 狛江(n={(range ? filterQuestByDate(questKom, range.start, range.end) : questKom).length})</div>
          <ResponsiveContainer width="100%" height={Math.max(180, reasonCompare.length * 32)}>
            <BarChart data={reasonCompare} layout="vertical" margin={{ left:8,right:24 }}>
              <CartesianGrid strokeDasharray="3 5" stroke="#DEE4DF" horizontal={false} />
              <XAxis type="number" tick={{ fontSize:10,fill:"var(--ink-faint)" }} axisLine={false} tickLine={false} tickFormatter={v => v + "%"} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize:11.5,fill:"var(--ink)" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={v => v + "%"} contentStyle={{ fontSize:12,borderRadius:8 }} />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Bar dataKey="梅ヶ丘" fill={STORES.梅ヶ丘.color} radius={[0,4,4,0]} maxBarSize={12} />
              <Bar dataKey="狛江" fill={STORES.狛江.color} radius={[0,4,4,0]} maxBarSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="m4h-card" style={{ padding:18 }}>
        <div style={{ fontWeight:700,fontSize:13,marginBottom:14 }}>ジム経験</div>
        <div style={{ display:"flex",gap:16,flexWrap:"wrap",alignItems:"center" }}>
          <PieChart width={140} height={140}>
            <Pie data={gymExpData} dataKey="value" cx={65} cy={65} innerRadius={40} outerRadius={62} paddingAngle={4} startAngle={90} endAngle={-270}>
              {gymExpData.map((_, i) => <Cell key={i} fill={["var(--teal)","var(--amber)"][i]} />)}
            </Pie>
          </PieChart>
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {gymExpData.map((r, i) => (
              <div key={r.name} style={{ display:"flex",alignItems:"center",gap:8,fontSize:13 }}>
                <span style={{ width:10,height:10,borderRadius:3,background:["var(--teal)","var(--amber)"][i],flexShrink:0 }} />
                <span style={{ color:"var(--ink-soft)" }}>{r.name}</span>
                <span className="num" style={{ fontWeight:700 }}>{pct(r.value, n)}</span>
                <span style={{ color:"var(--ink-faint)",fontSize:12 }}>({r.value}件)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 属性分析
// ============================================================
function AttributeView({ members, questUme, questKom, period, customStart, customEnd }) {
  const [filterStore, setFilterStore] = useState("");
  const [dataSource, setDataSource] = useState("members");

  const range = period !== "all" ? getDateRange(period, customStart, customEnd) : null;

  const rows = useMemo(() => {
    if (dataSource === "quest") {
      const u = questUme.map(r => ({ ...r, store: "梅ヶ丘" }));
      const k = questKom.map(r => ({ ...r, store: "狛江" }));
      let all = filterStore ? [...u, ...k].filter(r => r.store === filterStore) : [...u, ...k];
      // アンケートは registeredAt で期間絞り込み
      if (range) all = filterQuestByDate(all, range.start, range.end);
      return all;
    }
    let base = filterStore ? members.filter(m => m.store === filterStore) : members;
    // 会員データは joinDate で期間絞り込み
    if (range) {
      base = base.filter(m => {
        if (!m.joinDate) return false;
        const d = new Date(m.joinDate + "T00:00:00");
        if (range.start && d < range.start) return false;
        if (range.end && d > range.end) return false;
        return true;
      });
    }
    return base;
  }, [members, questUme, questKom, filterStore, dataSource, range]);

  const n = rows.length;

  const genderData = useMemo(() => {
    const m = rows.filter(r => r.gender === "男性").length;
    const f = rows.filter(r => r.gender === "女性").length;
    const u = n - m - f;
    const arr = [{ name: "女性", value: f }, { name: "男性", value: m }];
    if (u > 0) arr.push({ name: "不明", value: u });
    return arr.filter(r => r.value > 0);
  }, [rows, n]);

  const ageData = useMemo(() => {
    const counts = {};
    for (const g of AGE_GROUPS) counts[g] = 0;
    counts["不明"] = 0;
    for (const r of rows) {
      const g = r.ageGroup || getAgeGroup(r.age);
      counts[g] = (counts[g] || 0) + 1;
    }
    return AGE_GROUPS.filter(g => counts[g] > 0).map(g => ({ name: g, 件数: counts[g] }));
  }, [rows]);

  const occData = useMemo(() => {
    if (dataSource !== "quest") return [];
    const counts = {};
    for (const r of rows) { const v = r.occupation; if (v) counts[v] = (counts[v] || 0) + 1; }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([name, value]) => {
        const pctValue = Math.round(value / n * 100);
        return { name, value, pct: pctValue, pctLabel: `${pctValue}%` };
      });
  }, [rows, n, dataSource]);

  // useMemo呼び出し後に空チェック（フックルール違反を避けるため）
  if (!n) return (
    <div className="m4h-fade" style={{ display:"flex",flexDirection:"column",gap:16 }}>
      <SectionHead eyebrow="属性分析" title="会員の構成" />
      <div style={{ display:"flex",gap:6 }}>
        <Pill active={dataSource==="members"} onClick={() => setDataSource("members")}>会員データ（ML009）</Pill>
        <Pill active={dataSource==="quest"} onClick={() => setDataSource("quest")}>アンケート回答者</Pill>
      </div>
      <Empty icon={Users} title="この期間のデータがありません" sub="期間を変更するか、全期間に戻してください" />
    </div>
  );

  return (
    <div className="m4h-fade" style={{ display:"flex",flexDirection:"column",gap:16 }}>
      <SectionHead eyebrow="属性分析" title="会員の構成" action={
        <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
          <Pill active={filterStore===""} onClick={() => setFilterStore("")}>全店</Pill>
          {STORE_KEYS.map(k => <Pill key={k} active={filterStore===k} onClick={() => setFilterStore(k)}>{k}</Pill>)}
        </div>
      } />

      <div style={{ display:"flex",gap:6 }}>
        <Pill active={dataSource==="members"} onClick={() => setDataSource("members")}>会員データ（ML009）</Pill>
        <Pill active={dataSource==="quest"} onClick={() => setDataSource("quest")}>アンケート回答者</Pill>
      </div>

      <div className="m4h-stat-row">
        <div className="m4h-stat"><div className="m4h-stat-label">対象人数</div><div className="m4h-stat-val num">{num(n)}</div><div className="m4h-stat-sub">人</div></div>
        <div className="m4h-stat">
          <div className="m4h-stat-label">女性比率</div>
          <div className="m4h-stat-val num">{pct(genderData.find(g => g.name==="女性")?.value || 0, n)}</div>
          <div className="m4h-stat-sub">男性 {pct(genderData.find(g => g.name==="男性")?.value || 0, n)}</div>
        </div>
        <div className="m4h-stat">
          <div className="m4h-stat-label">最多年代</div>
          <div className="m4h-stat-val num" style={{ fontSize:20 }}>{[...ageData].sort((a,b)=>b.件数-a.件数)[0]?.name || "—"}</div>
          <div className="m4h-stat-sub">{[...ageData].sort((a,b)=>b.件数-a.件数)[0] ? pct([...ageData].sort((a,b)=>b.件数-a.件数)[0].件数, n) : ""}</div>
        </div>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
        <div className="m4h-card" style={{ padding:18 }}>
          <div style={{ fontWeight:700,fontSize:13,marginBottom:14 }}>性別構成</div>
          <div style={{ display:"flex",alignItems:"center",gap:16 }}>
            <PieChart width={130} height={130}>
              <Pie data={genderData} dataKey="value" cx={60} cy={60} innerRadius={36} outerRadius={58} paddingAngle={4} startAngle={90} endAngle={-270}>
                {genderData.map((_, i) => <Cell key={i} fill={PIE_COLORS_GENDER[i % PIE_COLORS_GENDER.length]} />)}
              </Pie>
            </PieChart>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {genderData.map((r, i) => (
                <div key={r.name} style={{ display:"flex",alignItems:"center",gap:7,fontSize:13 }}>
                  <span style={{ width:9,height:9,borderRadius:3,background:PIE_COLORS_GENDER[i],flexShrink:0 }} />
                  <span style={{ color:"var(--ink-soft)" }}>{r.name}</span>
                  <span className="num" style={{ fontWeight:700 }}>{pct(r.value, n)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="m4h-card" style={{ padding:18 }}>
          <div style={{ fontWeight:700,fontSize:13,marginBottom:14 }}>年齢層</div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={ageData} margin={{ left:-10,right:4 }}>
              <CartesianGrid strokeDasharray="3 5" stroke="#DEE4DF" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize:10,fill:"var(--ink-soft)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:9,fill:"var(--ink-faint)" }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ fontSize:12,borderRadius:8 }} />
              <Bar dataKey="件数" fill="var(--plum)" radius={[4,4,0,0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {dataSource === "quest" && occData.length > 0 && (
        <div className="m4h-card" style={{ padding:18 }}>
          <div style={{ fontWeight:700,fontSize:13,marginBottom:14 }}>職業構成（アンケート回答者）</div>
          <ResponsiveContainer width="100%" height={Math.max(160, occData.length * 30)}>
            <BarChart data={occData} layout="vertical" margin={{ left:8,right:56 }}>
              <CartesianGrid strokeDasharray="3 5" stroke="#DEE4DF" horizontal={false} />
              <XAxis type="number" tick={{ fontSize:10,fill:"var(--ink-faint)" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize:11.5,fill:"var(--ink)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize:12,borderRadius:8 }} formatter={(v, n, p) => [`${v}件 (${p.payload.pct}%)`, "件数"]} />
              <Bar dataKey="value" fill="var(--teal)" radius={[0,5,5,0]} maxBarSize={18}>
                <LabelList dataKey="pctLabel" position="right" fontSize={11} fill="var(--ink-faint)" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ============================================================
// データ取込
// ============================================================
function ImportView({ data, onUpdate, showToast }) {
  const [tab, setTab] = useState("members");
  const [csvText, setCsvText] = useState("");
  const [rawRows, setRawRows] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  const doParse = useCallback((text) => {
    const clean = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const { rows, fields } = parseCsv(clean);
    if (!rows.length) { showToast("データが見つかりません", true); return; }

    if (tab === "members") {
      const isML009 = fields.some(f => f.includes("メンバーID")) && fields.some(f => f.includes("住所1"));
      if (!isML009) { showToast("ML009（メンバー一覧）のCSVではないようです", true); return; }
      const parsed = rows.map(parseML009Row).filter(r => r.id);
      setRawRows(rows); setPreview({ type: "members", count: parsed.length, sample: parsed.slice(0, 3), parsed });
    } else {
      const isQuest = fields.some(f => f.includes("メンバー_ID")) && fields.some(f => f.includes("入会を決めた理由") || f.includes("職業"));
      if (!isQuest) { showToast("アンケート回答CSVではないようです", true); return; }
      const store = detectQuestionnaireStore(rows, "");
      const parsed = rows.map(r => parseQuestionnaireRow(r, store)).filter(r => r.memberId);
      setRawRows(rows); setPreview({ type: "quest", store, count: parsed.length, sample: parsed.slice(0, 3), parsed });
    }
  }, [tab, showToast]);

  const onFile = useCallback((e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => { const text = ev.target.result; setCsvText(text); doParse(text); };
    reader.onerror = () => showToast("ファイル読み込み失敗", true);
    reader.readAsText(f, "UTF-8");
  }, [doParse]);

  const reset = () => { setCsvText(""); setRawRows(null); setPreview(null); if (fileRef.current) fileRef.current.value = ""; };

  const handleImport = async () => {
    if (!preview) return;
    if (preview.type === "members") {
      // 既存をメンバーIDで上書き（フルエクスポート前提）
      const existing = data.members.filter(m => !preview.parsed.find(p => p.id === m.id));
      const merged = [...existing, ...preview.parsed];
      await sSet(SK.members, merged);
      onUpdate({ members: merged });
      showToast(`会員データを更新しました（合計 ${merged.length} 件）`);
    } else {
      const key = preview.store === "梅ヶ丘" ? "questUme" : "questKom";
      const skKey = preview.store === "梅ヶ丘" ? SK.questUme : SK.questKom;
      const existing = data[key].filter(q => !preview.parsed.find(p => p.memberId === q.memberId));
      const merged = [...existing, ...preview.parsed];
      await sSet(skKey, merged);
      onUpdate({ [key]: merged });
      showToast(`${preview.store} アンケートを更新しました（合計 ${merged.length} 件）`);
    }
    reset();
  };

  const tabStyle = (t) => ({ padding:"8px 18px",fontWeight:700,fontSize:13,background:"none",border:"none",borderBottom:`2px solid ${tab===t?"var(--ink)":"transparent"}`,cursor:"pointer",color:tab===t?"var(--ink)":"var(--ink-faint)",fontFamily:"inherit" });

  return (
    <div className="m4h-fade" style={{ display:"flex",flexDirection:"column",gap:16 }}>
      <SectionHead eyebrow="データ取込" title="hacomonoのデータを読み込む" />

      <div style={{ display:"flex",borderBottom:"1px solid var(--border)",marginBottom:4 }}>
        <button style={tabStyle("members")} onClick={() => { setTab("members"); reset(); }}>会員データ（ML009）</button>
        <button style={tabStyle("quest")} onClick={() => { setTab("quest"); reset(); }}>アンケート回答</button>
      </div>

      <div className="m4h-card" style={{ padding:18 }}>
        {tab === "members" ? (
          <>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:4 }}>会員一覧（ML009）を取り込む</div>
            <p style={{ fontSize:12.5,color:"var(--ink-faint)",margin:"2px 0 14px",lineHeight:1.6 }}>
              hacomono「メンバー一覧」からエクスポートしたCSVを選択または貼り付けてください。月1回フルエクスポートして上書き更新することで、商圏マップ・属性分析が最新化されます。郵便番号・住所・性別・年齢・入会日が自動で処理されます。
            </p>
          </>
        ) : (
          <>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:4 }}>入会時アンケート回答を取り込む</div>
            <p style={{ fontSize:12.5,color:"var(--ink-faint)",margin:"2px 0 14px",lineHeight:1.6 }}>
              梅ヶ丘（ENQUETE0006）・狛江（ENQUETE0008）それぞれのアンケート回答CSVを取り込んでください。2店舗分を別々に取り込むことで、認知経路・入会動機の比較分析ができます。
            </p>
          </>
        )}

        <div style={{ display:"flex",gap:10,flexWrap:"wrap",marginBottom:10 }}>
          <button className="m4h-btn m4h-btn-outline" style={{ padding:"8px 14px" }} onClick={() => fileRef.current?.click()}>
            <Upload size={14} /> CSVファイルを選択
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display:"none" }} onChange={onFile} />
          <span style={{ fontSize:12,color:"var(--ink-faint)",alignSelf:"center" }}>または下に貼り付け↓</span>
        </div>
        <textarea className="m4h-in" rows={4} placeholder="CSVの内容をここに貼り付け…"
          style={{ resize:"vertical",fontFamily:"monospace",fontSize:12,marginBottom:8 }}
          value={csvText} onChange={e => setCsvText(e.target.value)} />
        <div style={{ display:"flex",gap:8 }}>
          <button className="m4h-btn m4h-btn-primary" style={{ padding:"8px 16px" }} onClick={() => doParse(csvText)} disabled={!csvText.trim()}>読み込む</button>
          <button className="m4h-btn m4h-btn-outline" style={{ padding:"8px 14px" }} onClick={reset} disabled={!csvText && !rawRows}><X size={13} /> リセット</button>
        </div>

        {preview && (
          <div className="m4h-fade" style={{ marginTop:18,borderTop:"1px solid var(--border-soft)",paddingTop:16 }}>
            <div style={{ display:"flex",gap:16,fontSize:13,marginBottom:12,flexWrap:"wrap",alignItems:"center" }}>
              <span>検出 <b className="num">{preview.count}</b>件</span>
              {preview.store && <StoreTag store={preview.store} />}
              <span style={{ color:"var(--ink-faint)",fontSize:12 }}>
                {preview.type === "members" ? "住所全文から町丁目・町名代表点と距離を自動計算します" : "認知経路・入会動機・属性が集計されます"}
              </span>
            </div>
            <div className="m4h-scroll" style={{ maxHeight:200,border:"1px solid var(--border-soft)",borderRadius:8,marginBottom:12 }}>
              <table className="m4h-table">
                {preview.type === "members" ? (
                  <>
                    <thead><tr><th>メンバーID</th><th>氏名</th><th>店舗</th><th>geoKey</th><th>geoSource</th><th>信頼度</th></tr></thead>
                    <tbody>{preview.sample.map(r => (
                      <tr key={r.id}><td>{r.id}</td><td style={{ textAlign:"left" }}>{r.name}</td><td><StoreTag store={r.store} /></td><td style={{ textAlign:"left",fontWeight:700 }}>{r.geoKey || r.municipality || "—"}</td><td>{r.geoSource}</td><td>{r.geoConfidence}</td></tr>
                    ))}</tbody>
                  </>
                ) : (
                  <>
                    <thead><tr><th>メンバーID</th><th>認知経路</th><th>職業</th><th>年齢</th></tr></thead>
                    <tbody>{preview.sample.map(r => (
                      <tr key={r.memberId}><td>{r.memberId}</td><td style={{ textAlign:"left" }}>{r.howKnew}</td><td style={{ textAlign:"left" }}>{r.occupation}</td><td>{r.age}</td></tr>
                    ))}</tbody>
                  </>
                )}
              </table>
            </div>
            <button className="m4h-btn m4h-btn-primary" style={{ padding:"9px 18px" }} onClick={handleImport}>
              <Check size={15} /> {preview.count}件を取り込む
            </button>
          </div>
        )}
      </div>

      <div className="m4h-card" style={{ padding:16,display:"flex",gap:20,flexWrap:"wrap" }}>
        {[
          { label:"会員データ（ML009）", count: data.members.length, key:"members", onClear: () => { sSet(SK.members, []); onUpdate({ members:[] }); showToast("会員データをクリアしました"); } },
          { label:"梅ヶ丘アンケート", count: data.questUme.length, key:"questUme", onClear: () => { sSet(SK.questUme, []); onUpdate({ questUme:[] }); showToast("クリアしました"); } },
          { label:"狛江アンケート", count: data.questKom.length, key:"questKom", onClear: () => { sSet(SK.questKom, []); onUpdate({ questKom:[] }); showToast("クリアしました"); } },
        ].map(item => (
          <div key={item.key} style={{ minWidth:180 }}>
            <div style={{ fontSize:11.5,color:"var(--ink-faint)",fontWeight:700,marginBottom:4 }}>{item.label}</div>
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              <span className="num" style={{ fontWeight:700,fontSize:18,color: item.count > 0 ? "var(--go)" : "var(--ink-faint)" }}>{item.count}件</span>
              {item.count > 0 && (
                <button className="m4h-btn m4h-btn-ghost" style={{ padding:"3px 8px",fontSize:12 }} onClick={item.onClear}>クリア</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// ルートアプリ
// ============================================================
const NAV = [
  { key:"import", label:"データ取込", icon:Upload },
  { key:"map", label:"商圏マップ", icon:MapIcon },
  { key:"area", label:"商圏サマリー", icon:Target },
  { key:"channel", label:"チャネル分析", icon:Zap },
  { key:"motivation", label:"入会動機", icon:Heart },
  { key:"attr", label:"属性分析", icon:Users },
];

export default function App() {
  const [nav, setNav] = useState("import");
  const [data, setData] = useState({ members:[], questUme:[], questKom:[], meta:null });
  const [syncing, setSyncing] = useState(true);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const [period, setPeriod] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const showToast = useCallback((msg, err=false) => {
    setToast({ msg, err });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    (async () => {
      try { const d = await loadAll(); setData(d); }
      catch {}
      setSyncing(false);
    })();
  }, []);

  const onUpdate = useCallback((partial) => setData(d => ({ ...d, ...partial })), []);

  const hasMembers = data.members.length > 0;
  const hasQuest = data.questUme.length > 0 || data.questKom.length > 0;
  const showPeriodBar = ["channel","motivation","attr","map","area"].includes(nav) && (hasQuest || hasMembers);

  const filteredMembers = useMemo(() => {
    if (!data.members.length) return data.members;
    const range = period !== "all" ? getDateRange(period, customStart, customEnd) : null;
    if (!range) return data.members;
    return data.members.filter(m => {
      if (!m.joinDate) return false;
      const d = new Date(m.joinDate + "T00:00:00");
      return d >= range.start && d <= range.end;
    });
  }, [data.members, period, customStart, customEnd]);

  return (
    <div className="m4h-root" style={{ minHeight:"100vh" }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ display:"flex",minHeight:"100vh" }}>
        <aside className="m4h-sidebar" style={{ width:208,flexShrink:0,borderRight:"1px solid var(--border-soft)",padding:"20px 10px",display:"flex",flexDirection:"column",gap:16,position:"sticky",top:0,height:"100vh" }}>
          <div style={{ padding:"0 8px",display:"flex",alignItems:"center",gap:8 }}>
            <div style={{ width:30,height:30,borderRadius:8,background:"var(--ink)",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-d)",fontWeight:700,fontSize:12 }}>4H</div>
            <div style={{ fontFamily:"var(--font-d)",fontWeight:700,fontSize:13.5,lineHeight:1.2 }}>4H fitness<br /><span style={{ fontWeight:500,fontSize:10.5,color:"var(--ink-faint)" }}>マーケティング分析</span></div>
          </div>
          <nav className="m4h-nav" style={{ display:"flex",flexDirection:"column",gap:2 }}>
            {NAV.map(item => (
              <button key={item.key} className={nav===item.key ? "active" : ""} onClick={() => setNav(item.key)}>
                <item.icon size={15} /> {item.label}
                {item.key==="import" && (data.members.length + data.questUme.length + data.questKom.length === 0) && (
                  <span style={{ marginLeft:"auto",width:8,height:8,borderRadius:99,background:"var(--amber)",flexShrink:0 }} />
                )}
              </button>
            ))}
          </nav>
          <div style={{ marginTop:"auto",padding:"8px",fontSize:10.5,color:"var(--ink-faint)",lineHeight:1.6 }}>
            {syncing ? "同期中…" : `会員 ${data.members.length}件 / アンケート ${data.questUme.length + data.questKom.length}件`}
          </div>
        </aside>

        <main className="m4h-main" style={{ flex:1,minWidth:0,padding:"20px 22px 40px" }}>
          {nav==="import" && <ImportView data={data} onUpdate={onUpdate} showToast={showToast} />}
          {showPeriodBar && <PeriodBar period={period} setPeriod={setPeriod} customStart={customStart} setCustomStart={setCustomStart} customEnd={customEnd} setCustomEnd={setCustomEnd} />}
          {nav==="map" && (!hasMembers ? <Empty icon={MapIcon} title="会員データがありません" sub="まずデータ取込から会員データ（ML009）を取り込んでください" /> : <MapView members={filteredMembers} />)}
          {nav==="area" && (!hasMembers ? <Empty icon={Target} title="会員データがありません" sub="まずデータ取込から会員データ（ML009）を取り込んでください" /> : <AreaSummary members={filteredMembers} />)}
          {nav==="channel" && (!hasQuest ? <Empty icon={Zap} title="アンケートデータがありません" sub="まずデータ取込からアンケート回答CSVを取り込んでください" /> : <ChannelView questUme={data.questUme} questKom={data.questKom} period={period} customStart={customStart} customEnd={customEnd} />)}
          {nav==="motivation" && (!hasQuest ? <Empty icon={Heart} title="アンケートデータがありません" sub="まずデータ取込からアンケート回答CSVを取り込んでください" /> : <MotivationView questUme={data.questUme} questKom={data.questKom} period={period} customStart={customStart} customEnd={customEnd} />)}
          {nav==="attr" && <AttributeView members={data.members} questUme={data.questUme} questKom={data.questKom} period={period} customStart={customStart} customEnd={customEnd} />}
        </main>
      </div>

      <div className="m4h-bottom-nav">
        <div className="m4h-bottom-nav-inner">
          {NAV.map(item => (
            <button key={item.key} className={nav===item.key ? "active" : ""} onClick={() => setNav(item.key)}>
              <item.icon size={18} />{item.label.length > 6 ? item.label.slice(0,6) : item.label}
            </button>
          ))}
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  );
}
