const Wabt = require('wabt');

async function main() {
  const wabt = await Wabt();

  const module = wabt.parseWat(
    'word-counter.wat',
    `
    (module
      (func (export "count") (result i32)
        i32.const 69
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
