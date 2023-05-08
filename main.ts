import { serveListener } from "https://deno.land/std@0.186.0/http/mod.ts";
import Logger from "https://deno.land/x/logger/logger.ts";

class AppServer {
    listener: Deno.Listener;
    logger: Logger;

    constructor() {
        this.listener = Deno.listen({ port: 8080 });
        this.logger = new Logger();
    }

    async start() {
        console.log(`Listening on localhost:8080`);
        
        await serveListener(this.listener, (req) => {
            this.logger.info("Request received", req.url);
            return new Response('Hello World', { status: 200 });
        })
    }
}

const app = new AppServer();

await app.start();