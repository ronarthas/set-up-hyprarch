// Fonction utilitaire pour la manipulation de fichier / dossier
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

interface Option {
  value: string;
  label: string;
  hint?: string;
}

/**
 * Génère un tableau d'options à partir des dossiers d'un chemin donné
 * @param path - Le chemin du répertoire à analyser
 * @returns Un tableau d'objets Option
 */
export async function generateOptionsFromFolders(
  path: string,
): Promise<Option[]> {
  try {
    const entries = await readdir(path);
    const options: Option[] = [];

    for (const entry of entries) {
      const entryPath = join(path, entry);
      const entryStat = await stat(entryPath);

      // Vérifier si c'est un dossier
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
              option.hint = hintText.trim();
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
      `Erreur lors de la lecture du répertoire ${path}: ${error}`,
    );
  }
}

/**
 * Formate le nom du dossier en label avec première lettre majuscule
 * et remplace les tirets par des espaces
 * @param folderName - Le nom du dossier
 * @returns Le label formaté
 */
function formatLabel(folderName: string): string {
  return folderName
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// Exemple d'utilisation
/*
const options = await generateOptionsFromFolders('./templates');
console.log(options);
*/
