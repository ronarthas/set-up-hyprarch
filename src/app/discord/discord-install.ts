import { installSystemPackage } from "../../utils/install.utils";

export default async function installDiscord() {
  await installSystemPackage({
    name: "Discord",
    packageName: "discord",
    packageManager: "pacman", // Essaie pacman d'abord
    successMessage: "Discord installed successfully 💬🎮",
  });
}
