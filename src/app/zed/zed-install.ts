import { installSystemPackage } from "../../utils/install.utils";

export default async function installZed() {
  await installSystemPackage({
    name: "Zed",
    packageName: "zed",
    packageManager: "pacman",
    successMessage: "Zed editor installed successfully 📝✨",
  });
}
