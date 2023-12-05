/** @param {NS} ns **/
export async function main(ns) {
    const ServerName = ns.args[0];
    const maxServers = ns.getPurchasedServerLimit();
    let purchasedServers = ns.getPurchasedServers();
    let serversToPurchase = maxServers - purchasedServers.length;

    if (serversToPurchase <= 0) {
        ns.tprint("You already own the maximum number of servers.");
        return;
    }
    //
    const ramOptions = [8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];
    let affordableRamOption = ramOptions[0];

    for (let i = ramOptions.length - 1; i >= 0; i--) {
        const ramCost = ns.getPurchasedServerCost(ramOptions[i]);
        if (ns.getServerMoneyAvailable('home') >= ramCost) {
            affordableRamOption = ramOptions[i];
            break;
        }
    }

    while (serversToPurchase > 0 && ns.getServerMoneyAvailable('home') >= ns.getPurchasedServerCost(affordableRamOption)) {
        const newServer = ns.purchaseServer(`${ServerName}-${purchasedServers.length}`, affordableRamOption);
        if (newServer) {
            purchasedServers.push(newServer);
            serversToPurchase--;
            ns.tprint(`Purchased new server: ${newServer} with ${affordableRamOption}GB RAM`);
            await copyFilesToServer(ns, newServer); // Copy files to the new server
        } else {
            ns.tprint("Failed to purchase a new server. Insufficient funds or at server limit.");
            break;
        }
    }
}

async function copyFilesToServer(ns, targetServer) {
    if (!ns.hasRootAccess(targetServer)) {
        ns.tprint(`Error: You do not have root access to ${targetServer}.`);
        return;
    }

    const files = ns.ls('home').filter(file => file.endsWith('.js') || file.endsWith('.txt') || file.endsWith('.lit'));
    for (const file of files) {
        await ns.scp(file, 'home', targetServer);
    }

    ns.tprint(`Supported files copied to ${targetServer}.`);
}