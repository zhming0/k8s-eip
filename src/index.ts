import { start } from "./core"

const INTERVAL_MSECS = 5 * 60 * 1000

async function sleep (ms: number): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

async function loop () {
  while (true) {
    await start()
    console.log('Start sleeping...')
    await sleep(INTERVAL_MSECS)
  }
}


loop().catch(e => {
  console.error(e)
  process.exit(-1)
})
