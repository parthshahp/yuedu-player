import cedict from 'cc-cedict'

// cc-cedict is already module-level cached by Node's require cache,
// but this explicit singleton makes the import boundary clear and
// prevents accidental client-side imports.
export function getDict() {
  return cedict
}
