import { installAdvancedPackage } from "../../utils/postInstall.utils";
import { $ } from "bun";
import { log } from "@clack/prompts";

// Configuration des dépendances
export function getConfig() {
  return {
    name: "Docker",
    dependencies: ["git"],
  };
}

export default async function installDocker() {
  // Vérification personnalisée pour Docker
  try {
    await $`docker --version`.quiet();
    log.success("Docker is already installed ✅");
    return;
  } catch {
    // Pas installé, on continue
  }

  await installAdvancedPackage({
    name: "Docker",
    packageManager: "pacman",
    packageName: "docker",
    successMessage: "Docker installed successfully 🐳",

    // 🚀 Post-installation hooks
    postInstallHooks: [
      {
        name: "enable-docker-service",
        description: "Enabling Docker service",
        commands: [
          "sudo systemctl enable docker",
          "sudo systemctl start docker",
        ],
        critical: true, // Si ça échoue, tout s'arrête
      },
      {
        name: "add-user-to-group",
        description: "Adding user to docker group",
        commands: ["sudo usermod -aG docker $USER"],
        critical: false, // Si ça échoue, on continue
      },
    ],

    // 🔄 Commandes de rollback
    rollbackCommands: [
      "sudo systemctl stop docker",
      "sudo systemctl disable docker",
      "sudo pacman -R --noconfirm docker",
      "sudo gpasswd -d $USER docker",
    ],
  });

  log.info("💡 Please restart your session to use Docker without sudo");
}
