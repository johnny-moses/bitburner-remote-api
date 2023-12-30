/** @param {NS} ns **/
export async function main(ns) {
    const wormx = 'wormy/advanced/wormx.js'
    const d_jack = 'wormy/advanced/deploy-jack.js'

    ns.exec(wormx, 'home', 1)
    ns.tprint('AUTOX STARTED')
    await ns.sleep(1000)
    ns.exec(d_jack, 'home', 1)
}