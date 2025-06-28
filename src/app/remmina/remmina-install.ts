import { installSystemPackage } from "../../utils/install.utils";

// Configuration des dépendances
export function getConfig() {
  return {
    name: "Remmina",
    dependencies: [], // Remmina n'a pas de dépendances particulières
  };
}

export default async function installRemmina() {
  await installSystemPackage({
    name: "Remmina",
    packageManager: "pacman",
    packageName: "remmina",
    successMessage: "Remmina installed successfully 🖥️🔗",
  });
}
