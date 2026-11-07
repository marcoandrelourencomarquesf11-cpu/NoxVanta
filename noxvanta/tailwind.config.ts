import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { colors: { nx: { red: "#e53945", ink: "#090a0d", panel: "#111318" } } } },
  plugins: []
};
export default config;
