/**
 * Vérifie si sudo est disponible sans mot de passe
 */ import { $, spawn } from "bun";
import { log } from "@clack/prompts";
import * as p from "@clack/prompts";

// Variable globale pour gérer le cache sudo
let sudoCacheActive = false;

export interface InstallConfig {
  name: string;
  checkCommand: string;
  installCommand: string;
  dependencies?: string[]; // Ajout des dépendances
  successMessage?: string;
  skipMessage?: string;
}

export interface PackageManagerConfig {
  name: string;
  packageName: string;
  packageManager: "pacman" | "paru" | "apt" | "yum" | "dnf";
  dependencies?: string[]; // Ajout des dépendances
  additionalFlags?: string[];
  successMessage?: string;
}

/**
 * Active le cache sudo en demandant le mot de passe via @clack/prompts
 */
export async function enableSudoCache(): Promise<void> {
  if (sudoCacheActive) return;

  try {
    // Vérifier d'abord si sudo est déjà disponible
    try {
      await $`sudo -n true`.quiet();
      sudoCacheActive = true;
      log.success("Sudo déjà disponible ✅");
      return;
    } catch {
      // Sudo pas disponible, on demande le mot de passe
    }

    log.info("🔐 Authentification sudo requise");

    const password = await p.password({
      message: "Entrez votre mot de passe sudo:",
      mask: "•",
    });

    if (p.isCancel(password)) {
      throw new Error("Authentification annulée");
    }

    // Tester le mot de passe avec sudo
    try {
      await $`echo "${password}" | sudo -S -v`;
      sudoCacheActive = true;
      log.success("✅ Cache sudo activé avec succès !");

      // Renouvelle le cache toutes les 4 minutes
      const interval = setInterval(async () => {
        try {
          await $`sudo -n true`.quiet();
        } catch {
          clearInterval(interval);
          sudoCacheActive = false;
        }
      }, 240000);
    } catch (error) {
      log.error("❌ Mot de passe sudo incorrect");
      throw new Error("Authentification sudo échouée");
    }
  } catch (error) {
    log.error("❌ Impossible d'activer le cache sudo");
    throw error;
  }
}

/**
 * Exécute une commande de façon interactive avec spawn
 */
async function runInteractiveCommand(command: string): Promise<void> {
  const parts = command.split(" ");
  const cmd = parts[0];
  const args = parts.slice(1);

  const proc = spawn({
    cmd: [cmd, ...args],
    stdin: "inherit", // Permet l'interaction
    stdout: "inherit", // Affichage temps réel
    stderr: "inherit", // Erreurs temps réel
  });

  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    throw new Error(`Command failed with exit code ${exitCode}`);
  }
}
export async function isSudoAvailable(): Promise<boolean> {
  try {
    await $`sudo -n true`.quiet();
    return true;
  } catch {
    return false;
  }
}

/**
 * Vérifie si une commande existe
 */
export async function commandExists(command: string): Promise<boolean> {
  try {
    await $`which ${command}`.quiet();
    return true;
  } catch {
    return false;
  }
}

/**
 * Vérifie si un package est installé via un gestionnaire de paquets
 */
export async function isPackageInstalled(
  packageManager: string,
  packageName: string,
): Promise<boolean> {
  try {
    switch (packageManager) {
      case "pacman":
      case "paru":
        await $`pacman -Q ${packageName}`.quiet();
        return true;
      case "apt":
        await $`dpkg -l ${packageName}`.quiet();
        return true;
      case "yum":
      case "dnf":
        await $`${packageManager} list installed ${packageName}`.quiet();
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Résout l'ordre d'installation selon les dépendances (tri topologique)
 */
export function resolveDependencyOrder(
  packages: Array<{ name: string; dependencies?: string[] }>,
): string[] {
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const result: string[] = [];

  // Créer un map pour un accès rapide
  const packageMap = new Map(
    packages.map((pkg) => [pkg.name.toLowerCase(), pkg]),
  );

  function visit(packageName: string): void {
    const normalizedName = packageName.toLowerCase();

    if (visiting.has(normalizedName)) {
      throw new Error(`Circular dependency detected involving: ${packageName}`);
    }

    if (visited.has(normalizedName)) {
      return;
    }

    visiting.add(normalizedName);

    const pkg = packageMap.get(normalizedName);
    if (pkg && pkg.dependencies) {
      for (const dep of pkg.dependencies) {
        visit(dep);
      }
    }

    visiting.delete(normalizedName);
    visited.add(normalizedName);
    result.push(packageName);
  }

  // Visiter tous les packages
  for (const pkg of packages) {
    visit(pkg.name);
  }

  return result;
}

/**
 * Fonction générique d'installation idempotente
 */
export async function installPackage(config: InstallConfig): Promise<void> {
  const { name, checkCommand, installCommand, successMessage, skipMessage } =
    config;

  try {
    log.info(`Checking ${name}...`);

    // Vérifier si déjà installé
    try {
      await $`${checkCommand.split(" ")}`.quiet();
      log.success(skipMessage || `${name} is already installed ✅`);
      return;
    } catch {
      // Pas installé, on continue
    }

    // Activer le cache sudo si la commande nécessite sudo
    if (installCommand.includes("sudo") && !sudoCacheActive) {
      await enableSudoCache();
    }

    log.info(`Installing ${name}...`);

    // Exécuter la commande de façon interactive
    await runInteractiveCommand(installCommand);

    log.success(successMessage || `${name} installed successfully 👌🏼`);
  } catch (err) {
    log.error(`Failed to install ${name}:`);
    if (err instanceof $.ShellError) {
      if (err.stdout) log.error(`stdout: ${err.stdout.toString()}`);
      if (err.stderr) log.error(`stderr: ${err.stderr.toString()}`);
      log.error(`exit code: ${err.exitCode}`);
    }
    throw err;
  }
}

/**
 * Installation via gestionnaire de paquets système
 */
export async function installSystemPackage(
  config: PackageManagerConfig,
): Promise<void> {
  const {
    name,
    packageName,
    packageManager,
    additionalFlags = [],
    successMessage,
  } = config;

  try {
    log.info(`Checking ${name}...`);

    if (await isPackageInstalled(packageManager, packageName)) {
      log.success(`${name} is already installed ✅`);
      return;
    }

    // Activer le cache sudo si nécessaire
    const installCmd = getInstallCommand(
      packageManager,
      packageName,
      additionalFlags,
    );
    if (installCmd.includes("sudo") && !sudoCacheActive) {
      await enableSudoCache();
    }

    log.info(`Installing ${name} via ${packageManager}...`);

    // Exécuter avec support d'interaction
    await runInteractiveCommand(installCmd);

    log.success(successMessage || `${name} installed successfully 👌🏼`);
  } catch (err) {
    log.error(`Failed to install ${name}:`);
    if (err instanceof $.ShellError) {
      if (err.stdout) log.error(`stdout: ${err.stdout.toString()}`);
      if (err.stderr) log.error(`stderr: ${err.stderr.toString()}`);
    }
    throw err;
  }
}

/**
 * Génère la commande d'installation selon le gestionnaire de paquets
 */
function getInstallCommand(
  packageManager: string,
  packageName: string,
  additionalFlags: string[],
): string {
  const flags = additionalFlags.join(" ");

  switch (packageManager) {
    case "pacman":
      return `sudo pacman -S --noconfirm ${flags} ${packageName}`;
    case "paru":
      return `paru -S --noconfirm ${flags} ${packageName}`;
    case "apt":
      return `sudo apt install -y ${flags} ${packageName}`;
    case "yum":
      return `sudo yum install -y ${flags} ${packageName}`;
    case "dnf":
      return `sudo dnf install -y ${flags} ${packageName}`;
    default:
      throw new Error(`Unsupported package manager: ${packageManager}`);
  }
}
