import { Rose } from './lib/index.ts';

const app = new Rose();

app.get('/', () => new Response('Hello World', { status: 200 }));

app.get('/ping', () => new Response('pong', { status: 200 }));

app.get('/echo', (req) => {
    const params = new URL(req.url).searchParams;
    return new Response(params.get('say') ?? 'hello', { status: 200 });
});

await app.start();
