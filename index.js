const Wabt = require('wabt');

async function main() {
  const wabt = await Wabt();

  const module = wabt.parseWat(
    'async-adder.wat',
    `(module
        (import "global" "memory" (memory 1))
        (import "global" "table" (table 2 funcref))
        ;;(elem (i32.const 0) $sumClosure1 $sumClosure2)
        (import "closure" "createContext" (func $createContext (param $tableIndex i32) (param $scopeOffset i32) (result i32)))
        (import "closure" "deleteContext" (func $deleteContext (param $contextPointer i32)))
        (import "promise" "then" (func $then (param $promisePointer i32) (param $contextPointer i32) (result i32)))
        (import "promise" "resolve" (func $resolve (param $resultPointer i32) (result i32)))
        (import "external" "getX" (func $getX (result i32)))
        (import "external" "getY" (func $getY (result i32)))
        (func $malloc (param $bytes i32) (result i32) (local $result i32);; bump allocator
          i32.const 0
          i32.load
          local.set $result
          i32.const 0
          local.get $result
          local.get $bytes
          i32.add
          i32.store
          local.get $result
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

  const {
    instance: {
      exports: { count }
    }
  } = await WebAssembly.instantiate(module.toBinary({}).buffer, {
    global: {
      memory: new WebAssembly.Memory({
        initial: 1
      }),
      table: new WebAssembly.Table({
        initial: 2,
        element: 'anyfunc'
      })
    },
    closure: {
      createContext() {},
      deleteContext() {}
    },
    promise: {
      then() {},
      resolve() {}
    },
    external: {
      getX() {},
      getY() {}
    }
  });
  // console.log(count());
}
main();
