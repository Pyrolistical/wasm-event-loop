# wasm-event-loop

[Edit on StackBlitz ⚡️](https://stackblitz.com/edit/wasm-event-loop)

This is a demo of event loop inside WebAssembly. The sample implements an async word counter, given an URL count the words in body.

Pseudo-code of async word count in WebAssembly
```js
async function countWordsInBody(url) {
  const body = await httpGet(url);

  let words = 0;
  let currentlyWord = false;
  if (!isWhitespace(body.charCodeAt(0))) {
    words = 1;
    currentlyWord = true;
  }

  for (let i = 0; i < body.length; i++) {
    if (isWhitespace(body.charCodeAt(i))) {
      if (currentlyWord) {
        // word ended
        currentlyWord = false;
      } else {
        // consecutive whitespace, keep going
      }
    } else {
      if (currentlyWord) {
        // consecutive chars in a word, keep going
      } else {
        // start of new word
        words += 1;
        currentlyWord = true;
      }
    }
  }
  
  return words;
}

function isWhitespace(charCode) {
  switch (charCode) {
    case 9: // \t
    case 10: // \n
    case 12: // \f
    case 13: // \r
    case 32: // space
      return true;
    default:
      return false;
  }
}
```