# wasm-event-loop

[Edit on StackBlitz ⚡️](https://stackblitz.com/edit/wasm-event-loop)

This is a demo of event loop inside WebAssembly. The sample implements an async function that sums values from two async other async functions.

Pseudo-code of async sum in WebAssembly
```js
import {getX, getY} from './external.js';

export async function sum(): i32 {
  const xValue = await getX();
  const yValue = await getY();
  return xValue + yValue;
}
```

...as promises
```js
import {getX, getY} from './external.js';

export function sum(): Promise<i32> {
  return getX()
    .then((xValue) => {
      return getY()
        .then((yValue) => {
          return xValue + yValue;
        });
    });
}
```

...which is then broken down along the promise closures
```js
import {createScope, setScopeValue, getScopeValue, deleteScope} from './closure.js';
import {then} from './async.js';
import {getX, getY} from './external.js';

export function sum(): u16 { // u16 is pointer to promise
  const xPromise = getX();
  const sumClosure1ScopePointer = createScope();
  return then(xPromise, sumClosure1, sumClosure1ScopePointer);
}

export function sumClosure1(sumClosure1ScopePointer: u16, xValue: i32): u16 {
  deleteScope(sumClosure1ScopePointer);
  const yPromise = getY();
  const sumClosure2ScopePointer = createScope();
  setScopeValue(sumClosure2ScopePointer, 'xValue', 'i32', xValue);
  return then(yPromise, sumClosure2, sumClosure2ScopePointer);
}

export function sumClosure2(sumClosure2ScopePointer: u16, yValue: i32): i32 {
  const xValue = getScopeValue(sumClosure2ScopePointer, 'xValue');
  deleteScope(sumClosure2ScopePointer);
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