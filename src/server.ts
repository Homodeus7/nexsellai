import { env } from "./config/env.js";
import app from "./app.js";

if (process.env.VERCEL !== "1") {
  app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
  });
}

export default app;
