import * as p from "@clack/prompts";
import color from "picocolors";
import { generateOptionsFromFolders } from "./utils/files.utils";
import { enableSudoCache } from "./utils/install.utils";
import { join } from "node:path";

async function main() {
  //console.clear();
  const app = await generateOptionsFromFolders(
    join(import.meta.dir, "../src/app"),
  );

  await Bun.sleep(1000);
  p.intro(`${color.bgCyan(color.black(" Setup Arch Package "))}`);

  const project = await p.group({
    tools: () =>
      p.multiselect({
        message: "Select app to install",
        options: app,
      }),
    install: () =>
      p.confirm({
        message: "Install all Package?",
        initialValue: false,
      }),
  });

  if (project.install && project.tools && project.tools.length > 0) {
    // Demander le mot de passe sudo une seule fois au début
    try {
      await enableSudoCache();
    } catch (error) {
      p.log.error("Sudo access required for installations");
      return;
    }

    const s = p.spinner();
    s.start("Starting installations...");

    try {
      await executeInstallations(project.tools as string[]);
      s.stop("All installations completed! ✅");
    } catch (error) {
      s.stop("Installation failed ❌");
      p.log.error(`Installation error: ${error}`);
    }
  } else if (!project.install) {
    p.log.info("Installation cancelled");
  } else {
    p.log.warning("No tools selected");
  }
}

/**
 * Exécute les installations sélectionnées
 * @param selectedTools - Liste des fichiers d'installation sélectionnés
 */
async function executeInstallations(selectedTools: string[]): Promise<void> {
  for (const toolFile of selectedTools) {
    try {
      const toolName = getToolName(toolFile);
      const installPath = getInstallPath(toolFile);

      p.log.info(`📦 Installing ${toolName}...`);

      // Import dynamique du module
      const installModule = await import(installPath);

      // Exécuter la fonction d'installation (export default)
      if (
        installModule.default &&
        typeof installModule.default === "function"
      ) {
        await installModule.default();
        p.log.success(`✅ ${toolName} installation completed`);
      } else {
        throw new Error(`No default export function found in ${toolFile}`);
      }
    } catch (error) {
      const toolName = getToolName(toolFile);
      p.log.error(`❌ Failed to install ${toolName}: ${error}`);

      // Demander si on continue avec les autres installations
      const shouldContinue = await p.confirm({
        message: `Continue with remaining installations?`,
        initialValue: true,
      });

      if (!shouldContinue) {
        throw new Error("Installation process cancelled by user");
      }
    }
  }
}

/**
 * Convertit le nom du fichier en chemin d'installation complet
 * @param toolFile - Nom du fichier (ex: "bun-install.ts")
 * @returns Chemin absolu vers le fichier d'installation
 */
function getInstallPath(toolFile: string): string {
  // Enlever le "-install.ts" pour obtenir le nom du dossier
  const folderName = toolFile.replace("-install.ts", "");
  // Construire le chemin complet
  return join(import.meta.dir, "../src/app", folderName, toolFile);
}

/**
 * Extrait le nom de l'outil depuis le nom du fichier pour l'affichage
 * @param toolFile - Nom du fichier (ex: "bun-install.ts")
 * @returns Nom de l'outil formaté (ex: "Bun")
 */
function getToolName(toolFile: string): string {
  return toolFile
    .replace("-install.ts", "")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

main().catch(console.error);
