/** @param {NS} ns **/
export async function main(ns) {
    const homeServer = 'home';
    const ramBuffer = 0.50; // Reserve 0.50GB of RAM
    const mainScript = 'wormy/advanced/jackx.js';
    const supportingScripts = ['wormy/advanced/scripts/hack.js', 'wormy/advanced/scripts/grow.js', 'wormy/advanced/scripts/weaken.js'];

    // Pass the target server from the arguments
    let targetServer = ns.args[0];
    if (!targetServer) {
        ns.tprint('No target server provided');
        return;
    }

    ns.tprint(`Starting advanced attack script on target server: ${targetServer}`);

    const rootServers = getRootServers(ns);

    // Try nuking the targetServer to gain root access
    tryNuke(ns, targetServer);

    // eslint-disable-next-line no-constant-condition
    while (true) {
        await ns.sleep(1000);
        for (let source of rootServers) {
            await ns.sleep(5000);
            let action;
            const currentSecurity = ns.getServerSecurityLevel(targetServer);
            const currentMoney = ns.getServerMoneyAvailable(targetServer);
            const maxMoney = ns.getServerMaxMoney(targetServer);
            const securityThreshold = ns.getServerMinSecurityLevel(targetServer) + 10;
            const moneyThreshold = 0.90;

            if (currentSecurity > securityThreshold) {
                action = 'weaken';
            } else if (currentMoney < maxMoney * moneyThreshold) {
                action = 'grow';
            } else {
                action = 'hack';
            }
            const scriptRam = ns.getScriptRam(`wormy/advanced/scripts/${action}.js`, homeServer);
            if (scriptRam <= 0) {
                ns.tprint(`Error: Script RAM usage is zero or invalid for ${action}.js on home server ${homeServer}`);
                return;
            }
            let availableRam = ns.getServerMaxRam(source) - ns.getServerUsedRam(source) - ramBuffer;
            while (availableRam >= scriptRam) {
                // Copy action script
                ns.scp(`wormy/advanced/scripts/${action}.js`, source);
                const pid = ns.exec(`wormy/advanced/scripts/${action}.js`, source, 1, targetServer);
                if (pid === 0) {
                    break;
                } else {
                    availableRam -= scriptRam;
                }
                // Copy mainScript and supporting scripts
                const mainScriptRam = ns.getScriptRam(mainScript, homeServer);
                if (availableRam >= mainScriptRam) {
                    ns.scp(mainScript, source);
                    ns.exec(mainScript, source, mainScriptRam, targetServer);
                    availableRam -= mainScriptRam;
                }
                for (let script of supportingScripts) {
                    let supportingScriptRam = ns.getScriptRam(script, homeServer);
                    if (availableRam >= supportingScriptRam) {
                        ns.scp(script, source);
                        availableRam -= supportingScriptRam;
                    }
                    await ns.sleep(100);
                }
            }
        }
    }
}

// Function checks for all servers that you have root access to
function getRootServers(ns) {
    let servers = ns.scan('home');
    let rootServers = [];

    for (let server of servers) {
        if (ns.hasRootAccess(server)) {
            rootServers.push(server);
        }
    }

    return rootServers;
}

function tryNuke(ns, server) {
    if (ns.fileExists('BruteSSH.exe', 'home')) ns.brutessh(server);
    if (ns.fileExists('FTPCrack.exe', 'home')) ns.ftpcrack(server);
    if (ns.fileExists('relaySMTP.exe', 'home')) ns.relaysmtp(server);
    if (ns.fileExists('HTTPWorm.exe', 'home')) ns.httpworm(server);
    if (ns.fileExists('SQLInject.exe', 'home')) ns.sqlinject(server);

    if (ns.getServerNumPortsRequired(server) <= 5) {
        ns.nuke(server);
    }
}