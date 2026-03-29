import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const templatesDir = path.join(process.cwd(), "src/data/templates");
  const files = fs.readdirSync(templatesDir).filter((f) => f.endsWith(".json"));
  const templates = files.map((f) => {
    const raw = fs.readFileSync(path.join(templatesDir, f), "utf-8");
    return JSON.parse(raw);
  });
  return NextResponse.json(templates);
}
