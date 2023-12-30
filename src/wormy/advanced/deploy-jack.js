/** @param {NS} ns **/
export async function main(ns) {
    const scriptToRun = 'wormy/advanced/jackx.js';
    while (true) {
        let servers = ns.scan();
        for (let i = 0; i < servers.length; i++) {
            if (ns.getServerRequiredHackingLevel(servers[i]) <= ns.getHackingLevel() && ns.hasRootAccess(servers[i])) {
                ns.exec(scriptToRun, 'home', 1, servers[i])
                ns.tprint(`SUCCESS: Deployed JACKX on ${servers[i]}`)
                await ns.sleep(50)
            }
        }
        return;
    }
}