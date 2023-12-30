/** @param {NS} ns **/
export async function main(ns) {
    const homeServer = 'home';
    const ramBuffer = 0.50; // Reserve 0.50GB of RAM
    const supportingScripts = ['wormy/advanced/scripts/hack.js', 'wormy/advanced/scripts/grow.js', 'wormy/advanced/scripts/weaken.js'];

    let targetServer = ns.args[0];
    if (!targetServer) {
        ns.tprint('ERROR: No target server provided');
        return;
    }

    ns.tprint(`SUCCESS: Starting advanced attack script on target server: ${targetServer}`);

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const rootServers = getRootServers(ns);
        rootServers.push('home');
        await ns.sleep(50);
        for (let source of rootServers) {
            // Try nuking the targetServer to gain root access
            let availableRam = ns.getServerMaxRam(source) - ns.getServerUsedRam(source) - ramBuffer;
            // Initialize scriptRam with some arbitrary large value.
            let scriptRam = 2;
            while (availableRam >= scriptRam) {
                await ns.sleep(50);
                let action;
                const currentSecurity = ns.getServerSecurityLevel(targetServer);
                const currentMoney = ns.getServerMoneyAvailable(targetServer);
                const maxMoney = ns.getServerMaxMoney(targetServer);
                const securityThreshold = ns.getServerMinSecurityLevel(targetServer) + 10;
                const moneyThreshold = 0.75;
                ns.print('<<<<<<<<<<<<<<<<<<<<<<<<   ~~   >>>>>>>>>>>>>>>>>>>>>>>>')
                ns.print(`INFO: ${targetServer} Current Security: `, currentSecurity)
                ns.print(`INFO: ${targetServer} Security Threshold: `, securityThreshold)
                ns.print(`INFO: ${targetServer} Max Money: `, maxMoney)
                ns.print(`INFO: ${targetServer} Current Money: `, currentMoney)
                ns.print('<<<<<<<<<<<<<<<<<<<<<<<<   ~~   >>>>>>>>>>>>>>>>>>>>>>>>')

                if (currentSecurity > securityThreshold) {
                    action = 'weaken';
                } else if (currentMoney < maxMoney * moneyThreshold) {
                    action = 'grow';
                } else {
                    action = 'hack';
                }

                const pid = ns.exec(`wormy/advanced/scripts/${action}.js`, source, 1, targetServer);
                if (pid === 0) {
                    ns.print(`ERROR: Unable to start script ${action}.js on server ${source}`);
                    continue;
                } else {
                    availableRam -= scriptRam;
                    ns.print(`SUCCESS: Deploying ${action}.js`)
                }

                // Manage the supporting scripts
                for (let script of supportingScripts) {
                    let supportingScriptRam = ns.getScriptRam(script, homeServer);
                    if (availableRam >= supportingScriptRam) {
                        ns.scp(script, source);
                        availableRam -= supportingScriptRam;
                    }
                    await ns.sleep(50);
                }
            }
            await ns.sleep(50)
        }
    }
}

// Function checks for all servers that you have root access to
function getRootServers(ns, startServer = 'home') {
    let visitedServers = [];
    let serversToVisit = [startServer];

    while (serversToVisit.length > 0) {
        let currentServer = serversToVisit.pop();

        if (!visitedServers.includes(currentServer)) {
            visitedServers.push(currentServer);

            let connectedServers = ns.scan(currentServer);
            for (let server of connectedServers) {
                if (ns.hasRootAccess(server)) {
                    serversToVisit.push(server);
                }
            }
        }
    }

    return visitedServers;
}