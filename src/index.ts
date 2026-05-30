#!/usr/bin/env node

import path from "node:path";
import { program } from "commander";
import fs from "fs/promises";
import sharp from "sharp";

const currentDir = process.cwd();

type CliOptions = {
  filename: string;
  sizes: number[];
};

program
  .name("Image resizer")
  .description("Resizes one image into multiple different sizes")
  .version("0.0.1");

const parseSizes = (value: string, previous: number[]) => {
  const size = Number.parseInt(value, 10);
  if (Number.isNaN(size)) {
    throw new Error(`Invalid size: ${value}`);
  }
  previous.push(size);
  return previous;
};

program
  .command("resize")
  .description("Resize an image")
  .argument("<output-name>", "The output name")

  .requiredOption(
    "-s, --sizes <numbers...>",
    "List of sizes, eg --sizes 320 640 800",
    parseSizes,
    [] as number[],
  )
  .requiredOption("-f, --filename <filename>", "Input filename")

  .action(async (outfile: string, opts: CliOptions) => {
    const fullPath = path.join(currentDir, opts.filename);
    const instance = sharp(fullPath);

    await Promise.all(
      opts.sizes.map(async (size) => {
        const { data, info } = await instance
          .clone()
          .resize(size)
          .png()
          .toBuffer({ resolveWithObject: true });

        const { width, height, format } = info;

        const outName = `${outfile}_${width}x${height}.${format}`;
        await fs.writeFile(outName, data);
        return outName;
      }),
    ).catch((err) => console.error("Error", err));
  });

program.parse(process.argv);
