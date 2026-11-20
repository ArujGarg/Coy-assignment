import { createApp } from "./app";
import { getDb } from "./db";

const port = Number(process.env.PORT ?? 4000);
const db = await getDb(); // connects, and seeds on first run
createApp(db).listen(port, () => console.log(`API listening on http://localhost:${port}`));
