import { $ } from "bun";
import { log } from "@clack/prompts";
import { join } from "node:path";
import {
  installSystemPackage,
  type PackageManagerConfig,
} from "./install.utils";

// Types pour les fonctionnalités avancées
export interface PostInstallHook {
  name: string;
  commands: string[];
  description?: string;
  critical?: boolean; // Si true, l'échec arrête tout
}

export interface AdvancedInstallConfig extends PackageManagerConfig {
  postInstallHooks?: PostInstallHook[];
  rollbackCommands?: string[]; // Commandes pour désinstaller
}

// Historique des installations pour rollback
const installHistory: Array<{
  package: string;
  timestamp: string;
  rollbackCommands: string[];
}> = [];

// Logs persistants
const logFilePath = join(import.meta.dir, "../../logs/install.log");

/**
 * Sauvegarde un log dans le fichier
 */
async function saveLog(
  level: string,
  message: string,
  packageName?: string,
): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${level.toUpperCase()} ${packageName ? `[${packageName}]` : ""}: ${message}\n`;

    // Créer le dossier logs s'il n'existe pas
    await $`mkdir -p ${join(import.meta.dir, "../../logs")}`.quiet();

    // Ajouter au fichier de log
    await Bun.write(logFilePath, logEntry, { createPath: true });
  } catch (error) {
    // Si on ne peut pas logger, on continue silencieusement
  }
}

/**
 * Installation avancée avec post-hooks, logs et rollback
 */
export async function installAdvancedPackage(
  config: AdvancedInstallConfig,
): Promise<void> {
  const { name, postInstallHooks = [], rollbackCommands = [] } = config;

  try {
    await saveLog("info", `Starting installation of ${name}`, name);
    log.info(`📦 Starting advanced installation of ${name}...`);

    // 1. Installation du package principal
    await installSystemPackage(config);
    await saveLog("success", `Package ${name} installed successfully`, name);

    // 2. Exécuter les post-install hooks
    if (postInstallHooks.length > 0) {
      await executePostInstallHooks(name, postInstallHooks);
    }

    // 3. Sauvegarder dans l'historique pour rollback
    if (rollbackCommands.length > 0) {
      installHistory.push({
        package: name,
        timestamp: new Date().toISOString(),
        rollbackCommands,
      });
      await saveLog("info", `Rollback commands saved for ${name}`, name);
    }

    log.success(`✅ ${name} installation completed with all hooks!`);
    await saveLog(
      "success",
      `Complete installation finished for ${name}`,
      name,
    );
  } catch (error) {
    await saveLog("error", `Installation failed: ${error}`, name);
    log.error(`❌ Installation of ${name} failed: ${error}`);

    // Proposer le rollback si des commandes sont disponibles
    if (rollbackCommands.length > 0) {
      await proposeRollback(name, rollbackCommands);
    }

    throw error;
  }
}

/**
 * Exécute les hooks de post-installation
 */
async function executePostInstallHooks(
  packageName: string,
  hooks: PostInstallHook[],
): Promise<void> {
  log.info(`🔧 Executing ${hooks.length} post-installation hook(s)...`);

  for (const hook of hooks) {
    try {
      await saveLog("info", `Executing hook: ${hook.name}`, packageName);
      log.info(`⚙️ ${hook.description || hook.name}...`);

      for (const command of hook.commands) {
        await $`${command.split(" ")}`;
        await saveLog("info", `Hook command executed: ${command}`, packageName);
      }

      log.success(`✅ Hook "${hook.name}" completed`);
      await saveLog("success", `Hook completed: ${hook.name}`, packageName);
    } catch (error) {
      await saveLog(
        "error",
        `Hook failed: ${hook.name} - ${error}`,
        packageName,
      );

      if (hook.critical) {
        log.error(`❌ Critical hook "${hook.name}" failed!`);
        throw new Error(`Critical post-install hook failed: ${hook.name}`);
      } else {
        log.warning(
          `⚠️ Non-critical hook "${hook.name}" failed, continuing...`,
        );
      }
    }
  }
}

/**
 * Propose un rollback en cas d'échec
 */
async function proposeRollback(
  packageName: string,
  rollbackCommands: string[],
): Promise<void> {
  const shouldRollback = await import("@clack/prompts").then((p) =>
    p.confirm({
      message: `Installation of ${packageName} failed. Attempt rollback?`,
      initialValue: true,
    }),
  );

  if (shouldRollback) {
    await executeRollback(packageName, rollbackCommands);
  }
}

/**
 * Exécute un rollback
 */
export async function executeRollback(
  packageName: string,
  rollbackCommands: string[],
): Promise<void> {
  try {
    log.info(`🔄 Rolling back ${packageName}...`);
    await saveLog("info", `Starting rollback for ${packageName}`, packageName);

    for (const command of rollbackCommands) {
      try {
        await $`${command.split(" ")}`;
        await saveLog(
          "info",
          `Rollback command executed: ${command}`,
          packageName,
        );
      } catch (error) {
        log.warning(`⚠️ Rollback command failed: ${command}`);
        await saveLog(
          "warning",
          `Rollback command failed: ${command}`,
          packageName,
        );
      }
    }

    log.success(`✅ Rollback of ${packageName} completed`);
    await saveLog(
      "success",
      `Rollback completed for ${packageName}`,
      packageName,
    );
  } catch (error) {
    log.error(`❌ Rollback failed: ${error}`);
    await saveLog("error", `Rollback failed: ${error}`, packageName);
  }
}

/**
 * Affiche l'historique des installations
 */
export function getInstallHistory(): typeof installHistory {
  return [...installHistory];
}

/**
 * Rollback d'une installation précédente
 */
export async function rollbackPreviousInstall(
  packageName: string,
): Promise<void> {
  const historyEntry = installHistory.find(
    (entry) => entry.package === packageName,
  );

  if (!historyEntry) {
    log.error(`❌ No rollback information found for ${packageName}`);
    return;
  }

  await executeRollback(packageName, historyEntry.rollbackCommands);

  // Supprimer de l'historique après rollback
  const index = installHistory.findIndex(
    (entry) => entry.package === packageName,
  );
  if (index > -1) {
    installHistory.splice(index, 1);
  }
}

/**
 * Lit les logs d'installation
 */
export async function readInstallLogs(): Promise<string> {
  try {
    const file = Bun.file(logFilePath);
    if (await file.exists()) {
      return await file.text();
    }
    return "No logs found";
  } catch (error) {
    return `Error reading logs: ${error}`;
  }
}
