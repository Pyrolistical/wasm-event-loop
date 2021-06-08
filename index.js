const Wabt = require('wabt');

async function main() {
  const wabt = await Wabt();

  const module = wabt.parseWat(
    'async-adder.wat',
    `(module
        (import "global" "memory" (memory 1))
        (import "global" "malloc" (func $malloc (param $bytes i32) (result i32)))
        (import "global" "table" (table 2 funcref))
        ;;(elem (i32.const 0) $sumClosure1 $sumClosure2)
        (import "promise" "then" (func $then (param $promisePointer i32) (param $contextPointer i32) (result i32)))
        (import "promise" "resolve" (func $resolve (param $resultPointer i32) (result i32)))
        (import "external" "getX" (func $getX (result i32)))
        (import "external" "getY" (func $getY (result i32)))
        
        (func $createContext (param $tableIndex i32) (param $scopePointer i32) (result i32)) (local $pointer i32)
          i32.const 8
          call $malloc
          local.tee $pointer
          local.get $tableIndex
          i32.store
          local.get $pointer
          i32.const 4
          i32.add
          local.get $scopePointer
          i32.store
          local.get $pointer
        )
        (func $deleteContext (param $contextPointer i32))
          nop
        )

        (func (export "sum") (result i32) (local $xPromisePointer i32) (local $closurePointer i32)
          call $getX
          local.set $xPromisePointer
          i32.const 0
          i32.const 0
          call $createContext
          local.set $closurePointer
          local.get $xPromisePointer
          local.get $closurePointer
          call $then
        )
        (func $sumClosure1 (param $thisClosurePointer i32) (param $xValue i32) (result i32) (local $xPointer i32) (local $yPromisePointer i32) (local $closurePointer i32)
          local.get $thisClosurePointer
          call $deleteContext
          call $getY
          local.set $yPromisePointer
          i32.const 1
          i32.const 4
          call $malloc
          local.tee $xPointer
          call $createContext
          local.set $closurePointer
          local.get $xPointer
          local.get $xValue
          i32.store
          local.get $yPromisePointer
          local.get $closurePointer
          call $then
        )
        (func $sumClosure2 (param $thisClosurePointer i32) (param $yValue i32) (result i32) (local $xValue i32) (local $result i32) (local $resultPointer i32)
          local.get $thisClosurePointer
          i32.const 4
          i32.add
          i32.const 0
          i32.add
          i32.load
          local.set $xValue
          local.get $thisClosurePointer
          call $deleteContext
          local.get $xValue
          local.get $yValue
          i32.add
          local.set $result
          i32.const 4
          call $malloc
          local.tee $resultPointer
          local.get $result
          i32.store
          local.get $resultPointer
          call $resolve
        )
      )
    `
  );

  console.log(module.toText({}));

  const memory = new WebAssembly.Memory({
    initial: 1
  });
  const i32Memory = new Int32Array(memory.buffer);
  const i8Memory = new Int8Array(memory.buffer);
  i32Memory[0] = 4;
  function malloc (bytes) {
    // bump allocator
    const next = i32Memory[0];
    i32Memory[0] = next + Math.ceil(bytes);
    return next;
  }
  const PROMISE_ENUM = {
    PENDING: 0,
    RESOLVED: 1,
    FAILED: 2
  }
  function createPromise(bytes) {
    const promisePointer = malloc(1 + bytes);
    i8Memory[promisePointer] = PROMISE_ENUM.PENDING;
    return promisePointer;
  }
  function resolvePromise(promisePointer, value) {
    i8Memory.set(value, promisePointer + 1);
    i8Memory[promisePointer] = PROMISE_ENUM.RESOLVED;
    for (const {type, pointer} of promiseChains[promisePointer] || []) {
      switch (type) {
        case 'closure': {
          const nextPromisePointer = table.get(i32Memory[closurePointer])(pointer, promisePointer + 1);
          const boundPromise = bindClosurePromise[pointer];
          if (boundPromise) {
            promiseChains[boundPromise] = promiseChains[boundPromise] || [];
            promiseChains[boundPromise].push({
              type: 'promise',
              pointer: nextPromisePointer
            });
          }
        }
        case 'promise': {
          resolvePromise(pointer, value);
        }
    }
  }
  const promiseChains = {};
  const bindClosurePromise = {};

  const table = new WebAssembly.Table({
    initial: 2,
    element: 'anyfunc'
  });

  const {
    instance: {
      exports
    }
  } = await WebAssembly.instantiate(module.toBinary({}).buffer, {
    global: {
      memory,
      malloc,
      table
    },
    promise: {
      then(parentPromisePointer, closurePointer) {
        promiseChains[parentPromisePointer] = promiseChains[parentPromisePointer] || [];
        promiseChains[parentPromisePointer].push({
          type: 'closure',
          pointer
        });
        ..this is wrong...createPromise need to be the same size as promise in closurePointer...?
        const promisePointer = createPromise(0);
        bindClosurePromise[closurePointer] = promisePointer;
        return promisePointer;
      },
      resolve() {}
    },
    external: {
      getX() {
        const promisePointer = createPromise(4);
        getX().then((x) => {
          const value = new ArrayBuffer(4);
          const view = new Int32Array(value);
          view[0] = x;
          resolvePromise(promisePointer, value)
        })
        return promisePointer;
      },
      getY() {
        return wasmPromise.resolve(69);
      }
    }
  });

  async function getX() {
    return Promise.resolve(42);
  }

  async function getY() {
    return new Promise((resolve) => setTimeout(() => resolve(69), 100));
  }

  async function sum() {
    const promise = exports.sum();
  }

  console.log(await sum())
}
main();
