/* eslint-disable no-console */
import mongoose from "mongoose";
import app from "./app";
import config from "./app/config";
import authUtils from "./app/utils/auth.utils";

async function main() {
  try {
    await mongoose.connect(config.database_url as string);
    await authUtils.adminSeed();
    app.listen(config.port, () => {
      console.log(`server running ⚡⚡⚡ on port => ${config.port}`);
    });
  } catch (error) {
    console.log(error);
  }
}

main();
