import { Rose } from '../../lib/index.ts';
import { renderSsrApp } from "./app.js";

const app = new Rose();

app.get('/', () => {
    console.log(renderSsrApp());
    const html = `
    <html>
        <head>
            <title>Hello World</title>
        </head>
        <body>
            <div id="app">
                ${renderSsrApp()}
            </div>
            
            <script src="/client.js" type="module"></script>
        </body>
    </html>
    `;
    return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
    });
});

app.get('/client.js', async () => {
    let file;

    try {
        file = await Deno.open('./client.js');
    } catch (_) {
        return new Response('404 Not found.', { status: 404 });
    }
    return new Response(file.readable, { status: 200, headers: { 'Content-Type': 'text/javascript' }})
})

app.get('/app.js', async () => {
    let file;

    try {
        file = await Deno.open('./app.js');
    } catch (_) {
        return new Response('404 Not found.', { status: 404 });
    }
    return new Response(file.readable, { status: 200, headers: { 'Content-Type': 'text/javascript' }})
})

await app.start();