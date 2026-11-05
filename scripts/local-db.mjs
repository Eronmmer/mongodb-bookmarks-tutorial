import { MongoMemoryServer } from "mongodb-memory-server-core";

let mongo;
try {
  mongo = await MongoMemoryServer.create({
    binary: { version: "9.0.4" },
    // Keep the manual local-development URI stable. Never silently start elsewhere.
    instance: { ip: "127.0.0.1", port: 27028, portGeneration: false, dbName: "bookmark_app" },
  });
} catch {
  console.error("Could not start local MongoDB on 127.0.0.1:27028. Check that the port is free and the MongoDB binary can be downloaded.");
  process.exit(1);
}
console.log("Temporary local MongoDB; all data is lost when this process stops.");
console.log(`MONGODB_URI=${mongo.getUri("bookmark_app")}`);
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await mongo.stop();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
await new Promise(() => {});
