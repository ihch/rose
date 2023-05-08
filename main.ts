import { HttpMethod } from "https://deno.land/std@0.186.0/http/method.ts";
import { Handler, serveListener } from "https://deno.land/std@0.186.0/http/mod.ts";
import Logger from "https://deno.land/x/logger@v1.1.0/logger.ts";

class AppServer {
    private listener: Deno.Listener;
    private logger: Logger;
    private routeTree: Node<Handler>;

    constructor() {
        this.listener = Deno.listen({ port: 8080 });
        this.logger = new Logger();
        this.routeTree = new Node<Handler>();
    }

    async start() {
        this.logger.info(`Listening on localhost:8080`);
        
        await serveListener(this.listener, (req, connInfo) => {
            const url = new URL(req.url);
            const path = url.pathname;
            const params = url.searchParams;

            this.logger.info("Request received", req.method, path, params.toString());
            
            const handler = this.routeTree.find(path + '/' + req.method)
            if (!handler) {
                this.logger.error('No handler found.', req.method, path);
                return new Response('404 Not found.', { status: 404 });
            }
            
            try {
                return handler(req, connInfo);
            }
             catch (e) {
                this.logger.error(e);
                return new Response('500 Internal server error.', { status: 500 });
            }
        })
    }
    
    add(path: string, method: HttpMethod, handler: Handler) {
        this.routeTree.insert(path + '/' + method, handler);
    }
    
    get(path: string, handler: Handler) {
        this.add(path, "GET", handler);
    }
}

interface Node<T> {
    value: T | null;
    children: { [key: string]: Node<T> };
}

class Node<T> implements Node<T> {
    constructor() {
        this.value = null;
        this.children = {};
    }
    
    insert(path: string, value: T) {
        const pathArray = splitPath(path);
        
        // deno-lint-ignore no-this-alias
        let currentNode: Node<T> = this;

        for (const pathPart of pathArray) {
            if (!currentNode.children[pathPart]) {
                currentNode.children[pathPart] = new Node<T>();
            }
            currentNode = currentNode.children[pathPart];
        }
        
        currentNode.value = value;
    }
    
    find(path: string): T | null {
        const pathArray = splitPath(path);
        
        // deno-lint-ignore no-this-alias
        let currentNode: Node<T> = this;

        for (const pathPart of pathArray) {
            if (!currentNode.children[pathPart]) {
                currentNode.children[pathPart] = new Node<T>();
            }
            currentNode = currentNode.children[pathPart];
        }
        
        return currentNode.value;
    }
}

const splitPath = (path: string): string[] => {
    const pathArray = path.split('/');
    return pathArray;
}

const app = new AppServer();

app.get('/', () => new Response('Hello World', { status: 200 }));
app.get('/ping', () => new Response('pong', { status: 200 }));
app.get('/echo', (req) => {
    const params = new URL(req.url).searchParams;
    return new Response(params.get('say') ?? 'hello', { status: 200 });
});

await app.start();