import { installSystemPackage } from "../../utils/install.utils";

export default async function installZenBrowser() {
  await installSystemPackage({
    name: "Zen Browser",
    packageName: "zen-browser-bin",
    packageManager: "paru",
    successMessage: "Zen Browser installed successfully 🧘✨🌐",
  });
}
