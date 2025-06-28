import { installAdvancedPackage } from "../../utils/postInstall.utils";

// Configuration des dépendances
export function getConfig() {
  return {
    name: "Pipx",
    dependencies: ["python"], // pipx dépend de Python
  };
}

export default async function installPipx() {
  await installAdvancedPackage({
    name: "Pipx",
    packageManager: "pacman",
    packageName: "python-pipx",
    successMessage: "Pipx installed successfully 📦🐍",

    // 🚀 Post-installation hooks
    postInstallHooks: [
      {
        name: "configure-pipx-path",
        description: "Configuring pipx PATH globally",
        commands: ["sudo pipx ensurepath --global"],
        critical: false, // Si ça échoue, on continue
      },
    ],

    // 🔄 Commandes de rollback
    rollbackCommands: ["sudo pacman -R --noconfirm python-pipx"],
  });
}
