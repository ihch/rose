import { HttpMethod } from 'https://deno.land/std@0.186.0/http/method.ts';
import { serveListener } from 'https://deno.land/std@0.186.0/http/mod.ts';
import { ConnInfo } from 'https://deno.land/std@0.186.0/http/server.ts';
import Logger from 'https://deno.land/x/logger@v1.1.0/logger.ts';
import { RadixTree } from './router.ts';

type AppRequest = Request & { routeParams?: { [key: string]: string } };
type AppHandler = (
    req: AppRequest,
    connInfo: ConnInfo,
) => Response | Promise<Response>;

export class AppServer {
    #listener: Deno.Listener;
    #logger: Logger;
    #routeTree: RadixTree<AppHandler>;

    constructor() {
        this.#listener = Deno.listen({ port: 8080 });
        this.#logger = new Logger();
        this.#routeTree = new RadixTree<AppHandler>();
    }

    async start() {
        this.#logger.info(`Listening on localhost:8080`);

        await serveListener(this.#listener, (req, connInfo) => {
            const url = new URL(req.url);
            const path = url.pathname;
            const searchParams = url.searchParams;

            this.#logger.info(
                'Request received',
                req.method,
                path,
                searchParams.toString(),
            );

            const node = this.#routeTree.find(path + '/' + req.method);

            if (!node || !node.handler) {
                this.#logger.error('No handler found.', req.method, path);
                return new Response('404 Not found.', { status: 404 });
            }

            const { handler, params: routeParams } = node;

            try {
                return handler(Object.assign(req, { routeParams }), connInfo);
            } catch (e) {
                this.#logger.error(e);
                return new Response('500 Internal server error.', {
                    status: 500,
                });
            }
        });
    }

    add(path: string, method: HttpMethod, handler: AppHandler) {
        this.#routeTree.insert(path + '/' + method, handler);
    }

    get(path: string, handler: AppHandler) {
        this.add(path, 'GET', handler);
    }
}
