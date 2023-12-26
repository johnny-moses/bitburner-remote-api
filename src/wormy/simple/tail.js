/** @param {NS} ns **/

export async function main(ns) {
    const targetServer = ns.args[0]

    while(true) {
        let serverStatus = {
            securityLevel: ns.getServerSecurityLevel(targetServer),
            availableMoney: ns.getServerMoneyAvailable(targetServer),
            totalMoney: ns.getServerMaxMoney(targetServer),
            numPortsRequired: ns.getServerNumPortsRequired(targetServer),
            ramUsage: ns.getServerUsedRam(targetServer),
            hasRootAccess: ns.hasRootAccess(targetServer)
        };

        ns.tprint(serverStatus);
        await ns.sleep(10000); // sleep for 10 seconds before checking again
    }
}