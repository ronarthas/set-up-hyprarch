import { installSystemPackage } from "../../utils/install.utils";

export default async function installPostman() {
  await installSystemPackage({
    name: "Postman",
    packageName: "postman-bin",
    packageManager: "paru",
    successMessage: "Postman installed successfully 📮🚀",
  });
}
