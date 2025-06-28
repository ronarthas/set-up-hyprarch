import { installSystemPackage } from "../../utils/install.utils";

// Configuration des dépendances
export function getConfig() {
  return {
    name: "PyCharm",
    dependencies: ["python"], // PyCharm dépend de Python
  };
}

export default async function installPyCharm() {
  await installSystemPackage({
    name: "PyCharm",
    packageManager: "paru",
    packageName: "pycharm-community-edition",
    successMessage: "PyCharm Community installed successfully 🐍💻",
  });
}
