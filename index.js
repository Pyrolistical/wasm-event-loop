const Wabt = require('wabt');

async function main() {
  const wabt = await Wabt();

  const module = wabt.parseWat(
    'async-adder.wat',
    `(module
        (import "global" "memory" (memory 1))
        (import "global" "table" (table 2))
        (elem (i32.const 0) $sumClosure1 $sumClosure2)
        (import "closure" "createContext" (func $createContext (param $tableIndex u32) (param $scopeOffset u32) (param $scopeLength u32) (result u32))
        (import "closure" "deleteContext" (func $deleteContext (param $contextPointer u32))
        (import "promise" "then" (func $then (param $promisePointer u32) (param $tableIndex u32) (param $contextPointer u32))
        (import "external" "getX" (func $getX (result u32)))
        (import "external" "getY" (func $getY (result u32)))
        (func $malloc (param $bytes u32) (result u32) (local $result u32);; bump allocator
          u32.load 0
          local.tee $result
          local.get $bytes
          u32.add
          u32.store 0
          local.get $result
        )
        (func (export "sum") (local $xPromisePointer u32) (result u32)
          call $getX
          local.set $xPromisePointer
          u32.const 
          call $then $xPromisePointer
          i32.add
        )
        (func (export "sum") (result i32) (local $xPromise u32) (local $xValue i32) (local $yPromise u32) (local $yValue i32)
          call $getX
          local.set $xPromise
          call $closeLoop
          i32.add
        )
      )
    `
  );

  console.log(module.toText({}));

  const {
    instance: {
      exports: { count }
    }
  } = await WebAssembly.instantiate(module.toBinary({}).buffer);
  console.log(count());
}
main();
