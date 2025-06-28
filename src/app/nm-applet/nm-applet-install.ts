import { installSystemPackage } from "../../utils/install.utils";

// Configuration des dépendances
export function getConfig() {
  return {
    name: "Nm Applet",
    dependencies: [], // nm-applet n'a pas de dépendances particulières
  };
}

export default async function installNmApplet() {
  await installSystemPackage({
    name: "NetworkManager Applet",
    packageManager: "pacman",
    packageName: "network-manager-applet",
    successMessage: "NetworkManager Applet installed successfully 📶🔧",
  });
}
