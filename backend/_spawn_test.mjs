import { spawn } from "node:child_process";

const PY = "C:\\Users\\AKSHAAY KG\\AppData\\Local\\Programs\\Python\\Python311\\python.exe";
const SCRIPT = process.argv[2];
const cwd = process.argv[3] || process.cwd();
console.log(`Spawning: ${PY} -u ${SCRIPT}`);
console.log(`cwd: ${cwd}`);

const proc = spawn(PY, ["-u", SCRIPT], {
  cwd,
  env: { ...process.env, PYTHONUNBUFFERED: "1" },
});

let count = 0;
proc.stdout.on("data", (d) => {
  for (const line of d.toString().split(/\r?\n/)) {
    if (line.trim()) {
      count++;
      console.log(`[OUT ${String(count).padStart(3)}] ${line}`);
    }
  }
});
proc.stderr.on("data", (d) => process.stderr.write("[ERR] " + d.toString()));
proc.on("close", (code) => console.log(`exited ${code}`));

setTimeout(() => {
  console.log("=== 25s elapsed; killing ===");
  proc.kill("SIGTERM");
}, 25000);
