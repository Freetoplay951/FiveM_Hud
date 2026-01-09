import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import vitePluginBundleObfuscator from "vite-plugin-bundle-obfuscator";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    base: "./",
    server: {
        host: "::",
        port: 8080,
    },
    plugins: [
        react(),
        vitePluginBundleObfuscator({
            enable: true,
            autoExcludeNodeModules: true,
            threadPool: true,
            options: {
                compact: true, // komprimiert Code
                controlFlowFlattening: false, // nicht aktivieren, kann JS-FiveM brechen
                deadCodeInjection: false, // deaktiviert
                disableConsoleOutput: true, // console.log unterdrücken
                identifierNamesGenerator: "hexadecimal", // Variablen schwerer lesbar
                renameGlobals: true, // globale Variablen umbenennen
                selfDefending: true, // leicht schwerer zu debuggen
                simplify: true, // Code simplifizieren
                stringArray: true, // Strings verschleiern
                stringArrayEncoding: ["base64"], // Strings verschlüsseln
                stringArrayIndexShift: true,
                stringArrayRotate: true,
                stringArrayShuffle: true,
                stringArrayWrappersCount: 1,
                stringArrayThreshold: 0.8, // nicht 100%, sonst zu riskant
                unicodeEscapeSequence: true,
            },
        }),
        mode === "development" && componentTagger(),
    ].filter(Boolean),
    build: {
        sourcemap: false,
        minify: "terser",
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
}));
