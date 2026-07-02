import React, { Suspense } from "react";

const originalModules = import.meta.glob("../claude-artifact-original.jsx");
const loadOriginalApp = originalModules["../claude-artifact-original.jsx"];
const originalSourceModules = import.meta.glob("../claude-artifact-original.jsx", {
  query: "?raw",
  import: "default"
});
const loadOriginalSource = originalSourceModules["../claude-artifact-original.jsx"];

function findBalancedObjectEnd(source, startIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let i = startIndex; i < source.length; i += 1) {
    const ch = source[i];

    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
    } else if (ch === "{") {
      depth += 1;
    } else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
  }

  return -1;
}

function extractSeedData(source) {
  if (!source) return null;

  const marker = "const SEED_DATA";
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) return null;

  const jsonStart = source.indexOf("{", markerIndex);
  if (jsonStart < 0) return null;

  const jsonEnd = findBalancedObjectEnd(source, jsonStart);
  if (jsonEnd < 0) return null;

  return JSON.parse(source.slice(jsonStart, jsonEnd));
}

const OriginalApp = loadOriginalApp
  ? React.lazy(async () => {
      const [mod, source] = await Promise.all([
        loadOriginalApp(),
        loadOriginalSource ? loadOriginalSource() : Promise.resolve(null)
      ]);
      const seedData = extractSeedData(source);
      if (seedData && window.__prepareDashboardSeed) {
        await window.__prepareDashboardSeed(seedData);
      }
      return { default: mod.default };
    })
  : null;

function MissingOriginalApp() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "system-ui, sans-serif", background: "#EEF1EC", color: "#1C1F1B" }}>
      <div style={{ maxWidth: 560, padding: 24, border: "1px solid #DEE3DA", borderRadius: 12, background: "#fff" }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 20 }}>元アプリファイルが見つかりません</h1>
        <p style={{ margin: 0, lineHeight: 1.7, color: "#5B6058" }}>
          ルート直下に claude-artifact-original.jsx を置くと、4H fitness マーケティング分析ダッシュボードが読み込まれます。
        </p>
      </div>
    </div>
  );
}

function LoadingOriginalApp() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "system-ui, sans-serif", background: "#EEF1EC", color: "#5B6058" }}>
      4H fitness マーケティング分析ダッシュボードを読み込み中...
    </div>
  );
}

export default function App() {
  if (!OriginalApp) return <MissingOriginalApp />;

  return (
    <Suspense fallback={<LoadingOriginalApp />}>
      <OriginalApp />
    </Suspense>
  );
}
