// Source - https://stackoverflow.com/a/64383997
// Posted by adlopez15
// Retrieved 2026-03-06, License - CC BY-SA 4.0

import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename) as string
export default __dirname
