import { Rose } from './lib/index.ts';

const app = new Rose();

app.get('/', () => new Response('Hello World', { status: 200 }));

app.get('/ping', () => new Response('pong', { status: 200 }));

app.get('/echo', (req) => {
    const params = new URL(req.url).searchParams;
    return new Response(params.get('say') ?? 'hello', { status: 200 });
});

app.get('/mynameis/:name', (req) => {
    const routeParams = req.routeParams ?? {};
    return new Response(routeParams.name ?? 'hello', { status: 200 });
});

app.get('/mynameis/:name/homete', (req) => {
    const routeParams = req.routeParams ?? {};
    return new Response(routeParams.name + ' is great.' ?? 'hello', {
        status: 200,
    });
});

app.get('/mynameis/:name/homete/:word', (req) => {
    const routeParams = req.routeParams ?? {};
    return new Response(
        routeParams.name + ' is ' + routeParams.word + '.' ?? 'hello',
        { status: 200 },
    );
});

app.get('/:word', (req) => {
    const routeParams = req.routeParams ?? {};
    return new Response(routeParams.word ?? 'hello', { status: 200 });
});

await app.start();
