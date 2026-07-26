import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function filePath(name: string): string {
  ensureDir();
  return path.join(DATA_DIR, `${name}.json`);
}

export function readData<T>(name: string, fallback: T): T {
  try {
    const raw = fs.readFileSync(filePath(name), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeData<T>(name: string, data: T): void {
  ensureDir();
  fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2), "utf-8");
}
