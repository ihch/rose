import { HttpMethod } from "https://deno.land/std@0.186.0/http/method.ts";
import { Handler, serveListener } from "https://deno.land/std@0.186.0/http/mod.ts";
import Logger from "https://deno.land/x/logger@v1.1.0/logger.ts";

class AppServer {
    listener: Deno.Listener;
    logger: Logger;
    routes: {
        path: string;
        method: HttpMethod;
        handler: Handler;
    }[];

    constructor() {
        this.listener = Deno.listen({ port: 8080 });
        this.logger = new Logger();
        this.routes = [];
    }

    async start() {
        console.log(`Listening on localhost:8080`);
        
        await serveListener(this.listener, (req, connInfo) => {
            const path = new URL(req.url).pathname;

            this.logger.info("Request received", req.method, path);
            
            const route = this.routes.find(route => route.path === path && route.method === req.method);
            
            try {
                return route?.handler(req, connInfo) ?? new Response('404 Not found.', { status: 404 });
            } catch (e) {
                this.logger.error(e);
                return new Response('500 Internal server error.', { status: 500 });
            }
        })
    }
    
    add(path: string, method: HttpMethod, handler: Handler) {
        this.routes.push({ path, method, handler });
    }
    
    get(path: string, handler: Handler) {
        this.add(path, "GET", handler);
    }
}

const app = new AppServer();

app.get('/', () => new Response('Hello World', { status: 200 }));
app.get('/ping', () => new Response('pong', { status: 200 }));

await app.start();