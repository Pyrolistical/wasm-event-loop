# wasm-event-loop

[Edit on StackBlitz ⚡️](https://stackblitz.com/edit/wasm-event-loop)

This is a demo of event loop inside WebAssembly. The sample implements an async function that sums values from two async other async functions.

Pseudo-code of async sum in WebAssembly
```js
import {getX, getY} from './external.js';

export async function sum(): i32 {
  const xValue: i32 = await getX();
  const yValue: i32 = await getY();
  return xValue + yValue;
}
```

...as promises
```js
import {getX, getY} from './external.js';

export function sum(): Promise<i32> {
  return getX()
    .then((const xValue: i32) => {
      return getY()
        .then((const yValue: i32) => {
          return xValue + yValue;
        });
    });
}
```

...closures converted to functions
```js
import {createContext, deleteContext} from './closure.js';
import {then} from './async.js';
import {getX, getY} from './external.js';

export function sum(): u16 { // u16 is pointer to promise
  const xPromise = getX();
  const sumClosure1ContextPointer = createContext(sumClosure1);
  return then(xPromise, sumClosure1ContextPointer);
}

export function sumClosure1(sumClosure1ContextPointer: u16, xValue: i32): u16 {
  deleteContext(sumClosure1ContextPointer);
  const yPromise = getY();
  const sumClosure2ContextPointer = createContext(sumClosure2, {
    xValue
  });
  return then(yPromise, sumClosure2ContextPointer);
}

export function sumClosure2(sumClosure2ContextPointer: u16, yValue: i32): i32 {
  const {xValue} = sumClosure2ContextPointer.scope;
  deleteContext(sumClosure2ContextPointer);
  return xValue + yValue;
}
```

On the JavaScript side
```js
const memory = new WebAssembly.Memory();
const managedMemory = ManagedMemory(memory);
const {instance: {exports: sum, sumClosure1, sumClosure2} = WebAssembly.instanitate(module, {
  async: {
    promises: managedMemory.
  },
  external: {
    getX() {
      return wasmPromise.resolve(42);
    },
    getY() {
      return wasmPromise.resolve(69);
    }
  }
});

```