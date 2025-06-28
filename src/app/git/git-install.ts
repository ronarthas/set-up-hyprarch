import { installSystemPackage } from "../../utils/install.utils";

export default async function installGit() {
  await installSystemPackage({
    name: "Git",
    packageName: "git",
    packageManager: "pacman",
    successMessage: "Git installed successfully 🔗📝",
  });
}
