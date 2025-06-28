import { installPackage } from "../../utils/install.utils";

// Configuration des dépendances
export function getConfig() {
  return {
    name: "Hyprpanel",
    dependencies: [], // Toutes les dépendances sont installées en une fois
  };
}

export default async function installHyprpanel() {
  await installPackage({
    name: "Hyprpanel",
    checkCommand: "which ags", // Vérifier si aylurs-gtk-shell est installé
    installCommand:
      "paru -S --noconfirm aylurs-gtk-shell-git wireplumber libgtop bluez bluez-utils btop networkmanager dart-sass wl-clipboard brightnessctl swww python upower pacman-contrib power-profiles-daemon gvfs gtksourceview3 libsoup3 grimblast-git wf-recorder-git hyprpicker matugen-bin python-gpustat hyprsunset-git ags-hyprpanel-git",
    successMessage:
      "Hyprpanel and all dependencies installed successfully 🎛️✨🚀",
  });
}
