import { MongoMemoryServer } from "mongodb-memory-server-core";

const mongo = await MongoMemoryServer.create({
  binary: { version: "8.2.6" },
  instance: { ip: "127.0.0.1", port: 27028, dbName: "bookmarks_demo" },
});
console.log("Temporary local MongoDB; all data is lost when this process stops.");
console.log(`MONGODB_URI=${mongo.getUri("bookmarks_demo")}`);
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
