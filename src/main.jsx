import React from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import App from "./App.jsx";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function assertMarketingKey(key) {
  if (typeof key !== "string" || !key.startsWith("mktg:")) {
    throw new Error(`Marketing dashboard storage can only access mktg: keys: ${key}`);
  }
}

if (!window.storage) {
  window.storage = {
    async get(key) {
      assertMarketingKey(key);
      const { data, error } = await supabase
        .from("kv_store")
        .select("value")
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return { key, value: data.value };
    },
    async set(key, value) {
      assertMarketingKey(key);
      const { error } = await supabase
        .from("kv_store")
        .upsert({ key, value }, { onConflict: "key" });
      if (error) throw error;
      return { key, value };
    },
    async delete(key) {
      assertMarketingKey(key);
      const { error } = await supabase.from("kv_store").delete().eq("key", key);
      if (error) throw error;
      return { key };
    },
  };
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
