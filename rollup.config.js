import resolve from "@rollup/plugin-node-resolve"
import copy from "rollup-plugin-copy"
import typescript from "@rollup/plugin-typescript"
import terser from "@rollup/plugin-terser"
import commonjs from "@rollup/plugin-commonjs"

export default {
   input: "src/main.ts",
   watch: {
      include: ["src/**"],
   },
   output: {
      file: "dist/Rplace_Brush/rplaceBrush.js",
      format: "esm",
   },
   plugins: [
      resolve(),
      typescript(),
      commonjs(),
      terser(),
      copy({
         targets: [
            { src: "src/manifest.json", dest: "dist/Rplace_Brush" },
            { src: "src/rule.json", dest: "dist/Rplace_Brush" },
            { src: "src/icons/icon_128.png", dest: "dist/Rplace_Brush/icons" },
         ],
         copyOnce: false,
      }),
   ],
}
