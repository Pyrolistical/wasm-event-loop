import Wabt from 'wabt';

const wabt = await Wabt();

const module = wabt.parseWat('word-counter.wat', `
  (module
    (export "count" (func (result i32)
      i32.const 69
    ))
  )
`);

console.log(module.toText())