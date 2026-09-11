import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { uploadObject } from "../lib/r2-client";
import { insertPhoto } from "../lib/db";
import { getStorageFolder } from "../lib/storage";

const THUMBNAIL_MAX_DIMENSION = 400;
const MEDIUM_MAX_DIMENSION = 1600;
const ORIGINAL_MAX_DIMENSION = 2500;

const THUMBNAIL_QUALITY = 70;
const MEDIUM_QUALITY = 85;
const ORIGINAL_QUALITY = 90;

const VALID_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

interface UploadResult {
  fileName: string;
  status: "uploaded" | "skipped" | "failed";
  reason?: string;
}

async function resizeToBuffer(
  inputBuffer: Buffer,
  maxDimension: number,
  quality: number
): Promise<Buffer> {
  return sharp(inputBuffer)
    .rotate() 
    .resize({
      width: maxDimension,
      height: maxDimension,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality })
    .toBuffer();
}

async function processOneFile(
  filePath: string,
  fileName: string,
  friendName: string
): Promise<UploadResult> {
  const ext = path.extname(fileName).toLowerCase();

  if (!VALID_EXTENSIONS.has(ext)) {
    return { fileName, status: "skipped", reason: "not a recognized image type" };
  }

  const inputBuffer = await fs.readFile(filePath);

  const safeName = fileName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.\-]/g, "");

  const nameWithoutExt = safeName.slice(0, safeName.length - ext.length);
  const storagePath = `${friendName}/${nameWithoutExt}.jpg`;

  const thumbnailBuf = await resizeToBuffer(inputBuffer, THUMBNAIL_MAX_DIMENSION, THUMBNAIL_QUALITY);
  const mediumBuf = await resizeToBuffer(inputBuffer, MEDIUM_MAX_DIMENSION, MEDIUM_QUALITY);
  const originalBuf = await resizeToBuffer(inputBuffer, ORIGINAL_MAX_DIMENSION, ORIGINAL_QUALITY);

  await Promise.all([
    uploadObject(`${getStorageFolder("thumbnail")}/${storagePath}`, thumbnailBuf, "image/jpeg"),
    uploadObject(`${getStorageFolder("medium")}/${storagePath}`, mediumBuf, "image/jpeg"),
    uploadObject(`${getStorageFolder("original")}/${storagePath}`, originalBuf, "image/jpeg"),
  ]);

  try {
    await insertPhoto({ friendName, path: storagePath });
  } catch (err) {
    return {
      fileName,
      status: "skipped",
      reason: "already exists in database (re-uploaded files, skipped duplicate row)",
    };
  }

  return { fileName, status: "uploaded" };
}

async function main() {
  const folderArg = process.argv[2];
  if (!folderArg) {
    console.error("Usage: npm run upload <folder-path>");
    console.error("Example: npm run upload ./photos/Rahul");
    process.exit(1);
  }

  const folderPath = path.resolve(folderArg);
  const friendName = path
    .basename(folderPath)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");

  if (!friendName) {
    console.error(`Couldn't derive a friend name from folder "${folderPath}".`);
    process.exit(1);
  }

  let entries: string[];
  try {
    entries = await fs.readdir(folderPath);
  } catch {
    console.error(`Couldn't read folder: ${folderPath}`);
    process.exit(1);
  }

  console.log(`Uploading for "${friendName}" — ${entries.length} item(s) found in folder.\n`);

  const BATCH_SIZE = 3;

  const fileNames: string[] = [];
  for (const fileName of entries) {
    const filePath = path.join(folderPath, fileName);
    const stat = await fs.stat(filePath);
    if (stat.isFile()) fileNames.push(fileName);
  }

  const results: UploadResult[] = [];

  for (let i = 0; i < fileNames.length; i += BATCH_SIZE) {
    const batch = fileNames.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map(async (fileName) => {
        const filePath = path.join(folderPath, fileName);
        try {
          const result = await processOneFile(filePath, fileName, friendName);
          const icon = result.status === "uploaded" ? "✓" : result.status === "skipped" ? "–" : "✗";
          console.log(`${icon} ${fileName}${result.reason ? ` (${result.reason})` : ""}`);
          return result;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.log(`✗ ${fileName} (failed: ${message})`);
          return { fileName, status: "failed" as const, reason: message };
        }
      })
    );

    results.push(...batchResults);
  }

  const uploaded = results.filter((r) => r.status === "uploaded").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const failed = results.filter((r) => r.status === "failed").length;

  console.log(`\nDone. ${uploaded} uploaded, ${skipped} skipped, ${failed} failed.`);

  if (failed > 0) {
    process.exitCode = 1; 
  }
}

main();