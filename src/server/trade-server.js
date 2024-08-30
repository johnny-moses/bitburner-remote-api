/** @param {NS} ns **/
export async function main(ns) {
    const serverRam = 8;
    const serverName = 'trader';
    const serverCost = ns.getPurchasedServerCost(serverRam);

    // Check if the player has enough money
    if (ns.getServerMoneyAvailable('home') < serverCost) {
        ns.tprint(`Not enough money to purchase ${serverRam} server`);
        return;
    }

    // Purchase the server
    ns.purchaseServer(serverName, serverRam);

    // Scripts to be copied
    const scriptFiles = ['server/trade.js', 'server/helper.js'];

    // Copy all scripts to the new server
    for (let i = 0; i < scriptFiles.length; i++) {
        // Only copy the script file if it exists on the home server
        if (ns.fileExists(scriptFiles[i], 'home')) {
            ns.scp(scriptFiles[i], serverName, 'home');1
        }
    }

    // Execute one of the scripts if it exists on the server
    if (scriptFiles.length > 0 && ns.fileExists(scriptFiles[0], serverName)) {
        if(!ns.isRunning(scriptFiles[0], serverName)) {
            ns.exec('server/trade.js', serverName, 1);
        }
    } else {
        ns.tprint('No script files available on the server to run');
    }
}