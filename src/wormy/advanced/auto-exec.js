/** @param {NS} ns **/
export async function main(ns) {
    const wormx = 'wormy/advanced/wormx.js';
    const d_jack = 'wormy/advanced/deploy-jack.js';
    const trade = '../trade/trade.js';

    ns.exec(wormx, 'home', 1);
    ns.tprint('AUTOX STARTED');
    await ns.sleep(100)
    // ns.exec(trade, 'home', 1);
    // await ns.sleep(100);
    ns.exec(d_jack, 'home', 1);

}