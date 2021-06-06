const Wabt = require('wabt');

async function main() {
  const wabt = await Wabt();

  const module = wabt.parseWat(
    'async-adder.wat',
    `(module
        (import "async" "promises" (memory 1))
        (import "async" "closeLoop" (func $closeLoop))
        (import "external" "getX" (func $getX (result u32)))
        (import "external" "getY" (func $getY (result u32)))
        (func (export "sum1") (local $xPromise u32) (local $xValue i32) (local $yPromise u32) (local $yValue i32)
          call $getX
          local.set $xPromise
          call $closeLoop
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
