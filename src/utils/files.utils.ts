import { readdir, stat } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import color from "picocolors"; // Importer picocolors

interface Option {
  value: string;
  label: string;
  hint?: string;
}

export async function generateOptionsFromFolders(
  path: string,
): Promise<Option[]> {
  try {
    const resolvedPath = resolve(path);
    const entries = await readdir(resolvedPath);
    const options: Option[] = [];

    for (const entry of entries) {
      const entryPath = join(resolvedPath, entry);
      const entryStat = await stat(entryPath);

      if (entryStat.isDirectory()) {
        const option: Option = {
          value: `${entry}-install.ts`,
          label: formatLabel(entry),
        };

        // Vérifier s'il y a un fichier hint.txt dans le dossier
        const hintPath = join(entryPath, "hint.txt");
        try {
          const hintFile = Bun.file(hintPath);
          if (await hintFile.exists()) {
            const hintText = await hintFile.text();
            if (hintText.trim()) {
              // 🎨 Colorer le hint en gris/cyan/vert selon tes préférences
              option.hint = color.gray(hintText.trim()); // Gris discret
              // option.hint = color.cyan(hintText.trim());      // Cyan moderne
              // option.hint = color.green(hintText.trim());     // Vert
              // option.hint = color.dim(hintText.trim());       // Atténué
            }
          }
        } catch {
          // Si erreur lors de la lecture du hint, on ignore silencieusement
        }

        options.push(option);
      }
    }

    return options;
  } catch (error) {
    throw new Error(
      `Erreur lors de la lecture du répertoire ${resolvedPath}: ${error}`,
    );
  }
}

function formatLabel(folderName: string): string {
  return folderName
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
