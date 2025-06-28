import { installSystemPackage } from "../../utils/install.utils";

// Configuration des dépendances
export function getConfig() {
  return {
    name: "Stow",
    dependencies: ["git"], // Stow dépend de Git
  };
}

export default async function installStow() {
  await installSystemPackage({
    name: "Stow",
    packageManager: "pacman",
    packageName: "stow",
    successMessage: "Stow successfully installed 📦🔗",
  });
}
