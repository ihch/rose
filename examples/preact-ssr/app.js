import { h, render } from 'https://esm.sh/preact';
import { useState } from 'https://esm.sh/preact/hooks';
import renderToString from 'https://esm.sh/v119/preact-render-to-string@6.0.3/src/index.js';

const Button = () => {
    const [value, setValue] = useState(0);
    return h('button', { onClick: () => setValue(value + 1) }, `Increment ${value}`);
}

export const Component = () => {
    return h(
        'div',
        null,
        [
            'Hello World',
            h(Button, null),
        ]
    );
};

export const renderSsrApp = () => {
    return renderToString(Component());
}

export const renderApp = (parent) => {
    return render(Component(), parent);
}
