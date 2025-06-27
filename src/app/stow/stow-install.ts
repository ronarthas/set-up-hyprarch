import { installSystemPackage } from "../../utils/install.utils";

export default async function installStow() {
  await installSystemPackage({
    name: "Stow",
    packageManager: "pacman",
    packageName: "stow",
    successMessage: "Stow succesfully installed 👌🏼",
  });
}
