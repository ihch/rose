const splitPath = (path: string): string[] => {
    const pathArray = path.split('/');
    return pathArray;
};

const isPathParameterKeyword = (keyword: string) => {
    // ':' で始まる文字列をパスパラメーターとして扱う
    return keyword.startsWith(':');
};

const parsePathParameterKey = (keyword: string) => {
    return keyword.substring(1);
};

type Pattern = {
    type: 'path' | 'regexp';
    keyword: string;
    path: string;
};

interface Node<T> {
    insert(path: string, value: T): void;
    find(
        path: string,
    ): { handler: T | null; params: { [key: string]: string } } | null;
}

export class RadixTree<T> implements Node<T> {
    #value: T | null;
    #children: { [key: string]: RadixTree<T> };
    #patterns: Pattern[];

    constructor() {
        this.#value = null;
        this.#children = {};
        this.#patterns = [];
    }

    insert(path: string, value: T) {
        const pathArray = splitPath(path);

        // deno-lint-ignore no-this-alias
        let currentNode: RadixTree<T> = this;

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
                currentNode.#children[pathPart] = new RadixTree<T>();
            }
            currentNode = currentNode.#children[pathPart];
        }

        currentNode.#value = value;
    }

    find(
        path: string,
    ): { handler: T | null; params: { [key: string]: string } } | null {
        const pathArray = splitPath(path);

        // deno-lint-ignore no-this-alias
        let currentNode: RadixTree<T> = this;
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
