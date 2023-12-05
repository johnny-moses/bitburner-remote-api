/** @param {NS} ns **/
export async function main(ns) {
    var refreshInterval = 10; // Refresh interval in seconds
    const topServers = getTopServers(ns, 5);
    ns.print("Top servers: " + JSON.stringify(topServers)); // Debugging line to check the server names

    if (topServers.length === 0) {
        ns.toast("No top servers found", "error");
        return;
    }

    topServers.forEach(server => {
        ns.exec('ispy.js', 'home', 1, server);
        ns.print(`Launched monitoring on ${server}`);
    });

    while (true) {
        ns.clearLog()
        ns.print("===== Monitoring Top Servers =====");
        for (const server of topServers) {

            // Fetch and display server stats
            const moneyAvailable = ns.getServerMoneyAvailable(server);
            const maxMoney = ns.getServerMaxMoney(server);
            const securityLevel = ns.getServerSecurityLevel(server);
            const minSecurityLevel = ns.getServerMinSecurityLevel(server);
            const hackingLevel = ns.getServerRequiredHackingLevel(server);
            const growthRate = ns.getServerGrowth(server);

            ns.print(`Money Available: $${ns.nFormat(moneyAvailable, '0.000a')}`);
            ns.print(`Maximum Money: $${ns.nFormat(maxMoney, '0.000a')}`);
            ns.print(`Current Security Level: ${securityLevel.toFixed(2)}`);
            ns.print(`Minimum Security Level: ${minSecurityLevel.toFixed(2)}`);
            ns.print(`Required Hacking Level: ${hackingLevel}`);
            ns.print(`Server Growth Rate: ${growthRate}`);
        }
        // Countdown loop for refresh interval
        for (let i = refreshInterval; i > 0; i--) {
            ns.print(`Refreshing all servers in ${i} seconds...`);
            await ns.sleep(1000); // Wait for 1 second
        }
    }
}


function getAllServers(ns, server = 'home', seenServers = new Set()) {
    if (seenServers.has(server)) return [];
    seenServers.add(server);

    const connectedServers = ns.scan(server);
    let servers = [server];

    for (const connectedServer of connectedServers) {
        servers = servers.concat(getAllServers(ns, connectedServer, seenServers));
    }

    return servers;
}

function getTopServers(ns, number) {
    let allServers = getAllServers(ns);
    let hackableServers = allServers.filter(server =>
        ns.hasRootAccess(server) &&
        ns.getServerMaxMoney(server) > 0 &&
        ns.getServerRequiredHackingLevel(server) <= ns.getHackingLevel()
    );

    hackableServers.sort((a, b) => ns.getServerMaxMoney(b) - ns.getServerMaxMoney(a));
    return hackableServers.slice(0, number);
}
