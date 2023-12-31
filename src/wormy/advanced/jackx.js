/** @param {NS} ns **/
export async function main(ns) {
    const homeServer = 'home';
    const ramBuffer = 512; // Reserve 512GB of RAM
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
        rootServers.unshift(homeServer) // Move homeServer to the beginning of the array for prioritized processing
        await ns.sleep(100);

        for (let source of rootServers) {
            let availableRam = ns.getServerMaxRam(source) - ns.getServerUsedRam(source);

            if (availableRam <= 0 && source === homeServer) {
                ns.print(`INFO: Not enough RAM available on ${source}. Skipping for now.`);
                continue;
            }

            // Initialize scriptRam with some arbitrary large value.
            let scriptRam = 1.75;
            while (availableRam - scriptRam >= ramBuffer) { // Just checking if we have enough RAM to run the script.
                await ns.sleep(100);

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

                // Before exec check for sufficient RAM
                scriptRam = ns.getScriptRam(`wormy/advanced/scripts/${action}.js`, source);

                if (availableRam - scriptRam < 0 && source === homeServer) {
                    ns.print(`ERROR: Unable to start script ${action}.js on home server due to low RAM`);
                    break;
                }

                const pid = ns.exec(`wormy/advanced/scripts/${action}.js`, source, 1, targetServer);
                if (pid === 0) {
                    ns.print(`ERROR: Unable to start script ${action}.js on server ${source}`);
                    continue;
                } else {
                    availableRam -= (scriptRam + ramBuffer);
                    ns.print(`SUCCESS: Deploying ${action}.js`)
                }

                // Manage the supporting scripts
                for (let script of supportingScripts) {
                    let supportingScriptRam = ns.getScriptRam(script, homeServer);
                    if (availableRam - supportingScriptRam < ramBuffer) {
                        continue;
                    } else {
                        availableRam -= supportingScriptRam;
                        ns.scp(script, source);
                    }
                    await ns.sleep(50);
                }
            }
            await ns.sleep(100)
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