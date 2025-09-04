import fs from "fs-extra";

async function copyTemplates() {
  try {
    await fs.copy("src/app/templates", "dist/app/templates");
    console.log("Templates copied successfully!");
  } catch (err) {
    console.error("Error copying templates:", err);
  }
}

copyTemplates();
