/** @param {NS} ns **/
export async function main(ns) {
    const supportingScripts = ['wormy/advanced/scripts/hack.js', 'wormy/advanced/scripts/grow.js',
        'wormy/advanced/scripts/weaken.js', 'wormy/advanced/jackx.js'];

    // Outermost loop to keep the script running indefinitely
    while (true) {
        // create a queue, and add the initially scanned servers from 'home'
        let serversToProcess = ns.scan('home');

        while (serversToProcess.length > 0) {
            let currentServer = serversToProcess.shift();
            if (currentServer !== 'home') {
                await processServer(ns, currentServer, supportingScripts);
                ns.print(`WARN: Scanning for new servers from ${currentServer}`);
                let foundServers = ns.scan(currentServer);
                for (let server of foundServers) {
                    if (!serversToProcess.includes(server)) {
                        serversToProcess.push(server);
                    }
                }
                await ns.sleep(100);
            }
        }

        // Sleep before starting another round of scanning and processing
        ns.tprint(`INFO: Completed a round of server processing. Starting again in 1 second.`);
        await ns.sleep(1000);
    }
}

async function processServer(ns, server, supportingScripts) {
    let portsRequired = ns.getServerNumPortsRequired(server);
    let portsOpened = 0;
    if (ns.hasRootAccess(server)) {
        // ns.tprint(`Already have root access on ${server}`);
        return;
    }
    if (ns.fileExists('BruteSSH.exe', 'home')) {
        ns.brutessh(server);
        portsOpened++;
    }
    if (ns.fileExists('FTPCrack.exe', 'home')) {
        ns.ftpcrack(server);
        portsOpened++;
    }
    if (ns.fileExists('relaySMTP.exe', 'home')) {
        ns.relaysmtp(server);
        portsOpened++;
    }
    if (ns.fileExists('HTTPWorm.exe', 'home')) {
        ns.httpworm(server);
        portsOpened++;
    }
    if (ns.fileExists('SQLInject.exe', 'home')) {
        ns.sqlinject(server);
        portsOpened++;
    }

    if (portsRequired <= portsOpened) {
        ns.nuke(server);
        for (let script of supportingScripts) {
            ns.scp(script, server);
            ns.print(`Copied ${script} to ${server}`);
            await ns.sleep(500);
        }
        ns.tprint(`SUCCESS: Root Access gained on ${server}`);
    }
    await ns.sleep(1500);
}