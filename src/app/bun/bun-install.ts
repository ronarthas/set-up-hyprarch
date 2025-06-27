import { installPackage, commandExists } from "../../utils/install.utils";

export default async function installBun() {
  await installPackage({
    name: "Bun",
    checkCommand: "bun --version",
    installCommand: "curl -fsSL https://bun.sh/install | bash",
    successMessage: "Bun installed successfully 👌🏼",
    skipMessage: "Bun is already installed ✅",
  });
}
