# rose

Under development.

HTTP server built in Deno language.

## API

A basic response can be returned, but no path parameters are available at this time.

```typescript
app.get('/', () => new Response('Hello World', { status: 200 }));
app.get('/ping', () => new Response('pong', { status: 200 }));
app.get('/echo', (req) => {
    const params = new URL(req.url).searchParams;
    return new Response(params.get('say') ?? 'hello', { status: 200 });
});
```
