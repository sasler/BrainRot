import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

function readGameSource(...segments: string[]) {
  return fs.readFileSync(path.join(process.cwd(), ...segments), "utf8");
}

type PuzzleEntry = {
  puzzle: string;
  solution: string;
};

function parsePuzzleBank(source: string) {
  const entries: PuzzleEntry[] = [];
  const matcher = /puzzle:\s*"([0-9.]+)"[\s\S]*?solution:\s*"([0-9]+)"/g;
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(source))) {
    entries.push({
      puzzle: match[1],
      solution: match[2],
    });
  }

  return entries;
}

function isValidSolvedCell(grid: number[], row: number, col: number) {
  const value = grid[row * 9 + col];

  for (let index = 0; index < 9; index += 1) {
    if (index !== col && grid[row * 9 + index] === value) {
      return false;
    }
    if (index !== row && grid[index * 9 + col] === value) {
      return false;
    }
  }

  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r += 1) {
    for (let c = boxCol; c < boxCol + 3; c += 1) {
      if ((r !== row || c !== col) && grid[r * 9 + c] === value) {
        return false;
      }
    }
  }

  return true;
}

test.describe("Sudoku regression guards", () => {
  test("GPT Sudoku does not reject correct digits just because candidates are poisoned", () => {
    const source = readGameSource("public", "games", "sudoku", "gpt-5-4", "index.html");

    expect(source).toContain("const conflictWarning = !candidates.includes(value) && state.assists.showConflicts;");
    expect(source).toContain("if (value !== correctValue) {");
    expect(source).not.toContain(
      "if (value !== correctValue || (!candidates.includes(value) && state.assists.showConflicts)) {",
    );
    expect(source).toContain("Digit ${value} is correct here. Another bad entry is still poisoning this lane");
  });

  test("GPT Sudoku puzzle bank only ships solvable boards with matching solutions", () => {
    const source = readGameSource("public", "games", "sudoku", "gpt-5-4", "index.html");
    const entries = parsePuzzleBank(source);

    expect(entries).toHaveLength(12);

    entries.forEach((entry, entryIndex) => {
      expect(entry.puzzle, `puzzle ${entryIndex} length`).toHaveLength(81);
      expect(entry.solution, `solution ${entryIndex} length`).toHaveLength(81);

      const solved = entry.solution.split("").map(Number);

      for (let cellIndex = 0; cellIndex < 81; cellIndex += 1) {
        const puzzleValue = entry.puzzle[cellIndex];
        const solutionValue = entry.solution[cellIndex];

        if (puzzleValue !== "." && puzzleValue !== "0") {
          expect(
            solutionValue,
            `puzzle ${entryIndex} given mismatch at row ${Math.floor(cellIndex / 9) + 1} col ${(cellIndex % 9) + 1}`,
          ).toBe(puzzleValue);
        }

        expect(
          isValidSolvedCell(solved, Math.floor(cellIndex / 9), cellIndex % 9),
          `puzzle ${entryIndex} invalid solution at row ${Math.floor(cellIndex / 9) + 1} col ${(cellIndex % 9) + 1}`,
        ).toBe(true);
      }
    });
  });

  test("Sonnet Sudoku numpad maps digits 1-9 without an off-by-one shift", () => {
    const source = readGameSource("public", "games", "sudoku", "sonnet-4-6", "index.html");

    expect(source).toMatch(/if\(col>=0&&col<=8\)return col\+1;\s*\/\/ digits 1-9/);
    expect(source).toMatch(/if\(col===9\)return 0;\s*\/\/ erase/);
    expect(source).not.toContain("if(col>=0&&col<=8)return col;");
  });
});
