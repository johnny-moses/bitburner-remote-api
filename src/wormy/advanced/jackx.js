/** @param {NS} ns **/
export async function main(ns) {
    const homeServer = 'home';
    const ramBuffer = 2.5; // Reserve 2.5GB of RAM

    // fill up the list of eligible servers initially
    let servers = scanAllServers(ns);
    let eligibleServersList = eligibleServers(ns, servers).slice(0, 3); // Top 3 servers

    ns.tprint(`Starting advanced attack script from home server: ${homeServer}`);

    // eslint-disable-next-line no-constant-condition
    while (true) {
        await ns.sleep(1000); // Prevents the game from freezing
        for (let i = 0; i < eligibleServersList.length; i++) {
            const target = eligibleServersList[i].name;
            const securityThreshold = ns.getServerMinSecurityLevel(target) + 10; // Security buffer
            const moneyThreshold = 0.90; // 90% of max money

            try {
                const currentSecurity = ns.getServerSecurityLevel(target);
                const currentMoney = ns.getServerMoneyAvailable(target);
                const maxMoney = ns.getServerMaxMoney(target);

                let action;
                if (currentSecurity > securityThreshold) {
                    action = 'weaken';
                } else if (currentMoney < maxMoney * moneyThreshold) {
                    action = 'grow';
                } else {
                    action = 'hack';
                }

                const scriptRam = ns.getScriptRam(`wormy/simple/scripts/${action}.js`, homeServer);
                if (scriptRam <= 0) {
                    ns.tprint(`Error: Script RAM usage is zero or invalid for ${action}.js on home server ${homeServer}`);
                    return;
                }

                let availableRam = ns.getServerMaxRam(homeServer) - ns.getServerUsedRam(homeServer) - ramBuffer;
                while (availableRam >= scriptRam) {
                    ns.scp(`wormy/simple/scripts/${action}.js`, homeServer, target); // Copies the script to the target server
                    const pid = ns.exec(`wormy/simple/scripts/${action}.js`, target, 1, target);
                    if (pid === 0) {
                        break;
                    } else {
                        availableRam -= scriptRam;
                    }
                    await ns.sleep(100);
                }
                await ns.sleep(5000);
            } catch (e) {
                ns.tprint(`An error occurred on home server ${homeServer}: ${e}`);
                await ns.sleep(1000);
            }
        }
        // refresh the list after operating on each server in the list
        servers = scanAllServers(ns);
        eligibleServersList = eligibleServers(ns, servers).slice(0, 3);
    }
}

function scanAllServers(ns) {
    let servers = ['home']; // Start with 'home'
    for (let i = 0; i < servers.length; ++i) {
        let newServers = ns.scan(servers[i]);
        for (let j = 0; j < newServers.length; ++j) {
            if (!servers.includes(newServers[j])) {
                servers.push(newServers[j]);
            }
        }
    }
    return servers;
}

// Function to check which servers are hackable
function eligibleServers(ns, servers) {
    let hackableServers = [];
    for (let i = 0; i < servers.length; ++i) {
        let server = servers[i];
        if (server.includes('home')) continue;
        if (ns.hasRootAccess(server) && ns.getServerRequiredHackingLevel(server) <= ns.getHackingLevel()) {
            hackableServers.push({
                name: server,
                money: ns.getServerMoneyAvailable(server),
            });
        }
    }

    hackableServers.sort((a, b) => b.money - a.money); // Sort in descending order of money
    return hackableServers;
}