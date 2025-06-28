import { installPackage } from "../../utils/install.utils";

// Configuration des dépendances
export function getConfig() {
  return {
    name: "Ansible",
    dependencies: ["pipx"], // Ansible dépend de pipx (qui dépend de Python)
  };
}

export default async function installAnsible() {
  await installPackage({
    name: "Ansible",
    checkCommand: "ansible --version",
    installCommand: "pipx install --include-deps ansible",
    successMessage: "Ansible installed successfully 🤖⚡",
  });
}
