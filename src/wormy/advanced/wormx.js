/** @param {NS} ns **/
export async function main(ns) {
    const supportingScripts = ['wormy/advanced/scripts/hack.js', 'wormy/advanced/scripts/grow.js',
        'wormy/advanced/scripts/weaken.js', 'wormy/advanced/jackx.js'];

    while (true) {
        let servers = ns.scan();
        for (let i = 0; i < servers.length; i++) {
            let portsRequired = ns.getServerNumPortsRequired(servers[i])
            let portsOpened = 0;
            if (ns.hasRootAccess(servers[i])) {
                continue;
            }
            if (ns.fileExists('BruteSSH.exe', 'home')) {
                ns.brutessh(servers[i]);
                portsOpened++;
            }
            if (ns.fileExists('FTPCrack.exe', 'home')) {
                ns.ftpcrack(servers[i]);
                portsOpened++;
            }
            if (ns.fileExists('relaySMTP.exe', 'home')) {
                ns.relaysmtp(servers[i]);
                portsOpened++;
            }
            if (ns.fileExists('HTTPWorm.exe', 'home')) {
                ns.httpworm(servers[i]);
                portsOpened++;
            }
            if (ns.fileExists('SQLInject.exe', 'home')) {
                ns.sqlinject(servers[i]);
                portsOpened++;
            }

            if (portsRequired <= portsOpened) {
                ns.nuke(servers[i]);
                for (let script of supportingScripts) {
                    ns.scp(script, servers[i])
                    ns.tprint(`Copied ${script} to ${servers[i]}`, 'pink')
                    await ns.sleep(20)
                }
                ns.tprint(`SUCCESS: Root Access gained on ${servers[i]}`)
            }
        }
        await ns.sleep(500)
    }
}