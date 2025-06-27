import { installSystemPackage } from "../../utils/install.utils";

export default async function installGhostty() {
  await installSystemPackage({
    name: "Ghostty",
    packageName: "ghostty",
    packageManager: "pacman",
    successMessage: "Ghostty terminal installed successfully 👻💻",
  });
}
