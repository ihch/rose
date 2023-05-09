import { HttpMethod } from "https://deno.land/std@0.186.0/http/method.ts";
import { serveListener } from "https://deno.land/std@0.186.0/http/mod.ts";
import { ConnInfo } from "https://deno.land/std@0.186.0/http/server.ts";
import Logger from "https://deno.land/x/logger@v1.1.0/logger.ts";

type AppRequest = Request & { routeParams?: { [key: string]: string } };
type AppHandler = (req: AppRequest, connInfo: ConnInfo) => Response | Promise<Response>;

export class AppServer {
    #listener: Deno.Listener;
    #logger: Logger;
    #routeTree: Node<AppHandler>;

    constructor() {
        this.#listener = Deno.listen({ port: 8080 });
        this.#logger = new Logger();
        this.#routeTree = new Node<AppHandler>();
    }

    async start() {
        this.#logger.info(`Listening on localhost:8080`);
        
        await serveListener(this.#listener, (req, connInfo) => {
            const url = new URL(req.url);
            const path = url.pathname;
            const searchParams = url.searchParams;

            this.#logger.info("Request received", req.method, path, searchParams.toString());
            
            const node = this.#routeTree.find(path + '/' + req.method)

            if (!node || !node.handler) {
                this.#logger.error('No handler found.', req.method, path);
                return new Response('404 Not found.', { status: 404 });
            }
            
            const { handler, params: routeParams } = node;
            
            try {
                return handler(Object.assign(req, { routeParams }), connInfo);
            }
             catch (e) {
                this.#logger.error(e);
                return new Response('500 Internal server error.', { status: 500 });
            }
        })
    }
    
    add(path: string, method: HttpMethod, handler: AppHandler) {
        this.#routeTree.insert(path + '/' + method, handler);
    }
    
    get(path: string, handler: AppHandler) {
        this.add(path, "GET", handler);
    }
}

const isPathParameterKeyword = (keyword: string) => {
    // ':' で始まる文字列をパスパラメーターとして扱う
    return keyword.startsWith(':');
}

const parsePathParameterKey = (keyword: string) => {
    return keyword.substring(1);
}

interface Node<T> {
    insert(path: string, value: T): void;
    find(path: string): { handler: T | null, params: { [key: string]: string } } | null;
}

type Pattern = {
    type: 'path' | 'regexp';
    keyword: string;
    path: string;
}

class Node<T> implements Node<T> {
    #value: T | null;
    #children: { [key: string]: Node<T> };
    #patterns: Pattern[];

    constructor() {
        this.#value = null;
        this.#children = {};
        this.#patterns = [];
    }
    
    insert(path: string, value: T) {
        const pathArray = splitPath(path);
        
        // deno-lint-ignore no-this-alias
        let currentNode: Node<T> = this;

        for (const pathPart of pathArray) {
            if (isPathParameterKeyword(pathPart)) {
                const keyword = parsePathParameterKey(pathPart);
                const pattern: Pattern = {
                    type: 'path',
                    keyword,
                    path: pathPart,
                };
                currentNode.#patterns.push(pattern);
            }

            if (!currentNode.#children[pathPart]) {
                currentNode.#children[pathPart] = new Node<T>();
            }
            currentNode = currentNode.#children[pathPart];
        }
        
        currentNode.#value = value;
    }
    
    find(path: string): { handler: T | null, params: { [key: string]: string } } | null {
        const pathArray = splitPath(path);
        
        // deno-lint-ignore no-this-alias
        let currentNode: Node<T> = this;
        const params: { [key: string]: string } = {};

        for (const pathPart of pathArray) {
            if (currentNode.#children[pathPart]) {
                currentNode = currentNode.#children[pathPart];
                continue;
            }

            for (const pattern of currentNode.#patterns) {
                /*
                TODO: 複数のパスパラメーターパターンがある場合の処理
                今はパターンの一つ目を返す実装になっている. 

                例
                    同じ階層で別のパスパラメーターが存在するみたいなの
                    app.get('/:username', (req) => { res.send('OK') });
                    app.get('/:photos/:id, (req) => { res.send('OK') });
                */
                if (pattern.type === 'path') {
                    currentNode = currentNode.#children[pattern.path];
                    params[pattern.keyword] = pathPart;
                    break;
                }
            }
        }
        
        return { 
            handler: currentNode.#value,
            params,
        };
    }
}

const splitPath = (path: string): string[] => {
    const pathArray = path.split('/');
    return pathArray;
}
