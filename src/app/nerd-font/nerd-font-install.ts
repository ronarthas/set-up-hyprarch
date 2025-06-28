import { installPackage } from "../../utils/install.utils";

// Configuration des dépendances
export function getConfig() {
  return {
    name: "Nerd Fonts",
    dependencies: [], // Pas de dépendances
  };
}

export default async function installNerdFonts() {
  await installPackage({
    name: "Nerd Fonts",
    checkCommand: "fc-list | grep -i nerd", // Vérifier si des Nerd Fonts sont installées
    installCommand:
      "sudo pacman -S --noconfirm ttf-nerd-fonts-symbols ttf-nerd-fonts-symbols-mono && paru -S --noconfirm ttf-jetbrains-mono-nerd ttf-firacode-nerd ttf-hack-nerd",
    successMessage: "Nerd Fonts installed successfully 🔤✨📝",
  });
}
