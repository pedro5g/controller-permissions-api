import { env } from "@/env";
import { app } from "./app";

app.listen({ port: env.PORT }).then(() => {
  console.log(`Server is running at PORT ${env.PORT} 🔥`);
  console.log(`Api docs http://localhost:${env.PORT}/docs`);
});
