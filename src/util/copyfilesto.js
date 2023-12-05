/** @param {NS} ns **/
export async function main(ns) {
    const targetServer = ns.args[0];
    if (!targetServer) {
        ns.tprint("Error: No target server specified. Usage: run copyToServer.js [targetServer]");
        return;
    }

    if (!ns.hasRootAccess(targetServer)) {
        ns.tprint(`Error: You do not have root access to ${targetServer}.`);
        return;
    }

    const files = ns.ls('home').filter(file => file.endsWith('.js') || file.endsWith('.txt') || file.endsWith('.lit'));
    for (const file of files) {
        await ns.scp(file, targetServer);
    }

    ns.tprint(`Supported files copied to ${targetServer}.`);
}
