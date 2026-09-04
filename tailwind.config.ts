import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        surfaceAlt: "var(--surface-alt)",
        ink: "var(--ink)",
        inkMuted: "var(--ink-muted)",
        line: "var(--line)",
        brand: "var(--brand)",
        brandStrong: "var(--brand-strong)",
        brandSoft: "var(--brand-soft)",
        ok: "var(--ok)",
        warn: "var(--warn)",
        danger: "var(--danger)",
        // 기존 코드 호환
        background: "var(--bg)",
        foreground: "var(--ink)",
      },
      borderRadius: {
        card: "16px",
        btn: "12px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(36,31,27,.06), 0 8px 24px rgba(36,31,27,.05)",
      },
      maxWidth: {
        container: "1180px",
      },
    },
  },
  plugins: [],
};
export default config;
