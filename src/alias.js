/** @param {NS} ns **/
export async function main(ns) {
    const aliases = [
        { alias: "n", command: "run NUKE.exe" },
        { alias: "home", command: "home; cd src" },
        { alias: "sa1", command: "scan-analyze 3" },
        { alias: "sa2", command: "scan-analyze 5" },
        { alias: "sa3", command: "scan-analyze 10" },
        { alias: "brutessh", command: "home; connect darkweb; buy -l; buy brutessh.exe; home" },
        { alias: "ftpcrack", command: "home; connect darkweb; buy -l; buy ftpcrack.exe; home" },
        { alias: "relaysmtp", command: "home; connect darkweb; buy -l; buy relaysmtp.exe; home" },
        { alias: "httpworm", command: "home; connect darkweb; buy -l; buy httpworm.exe; home" },
        { alias: "sqlinject", command: "home; connect darkweb; buy -l; buy sqlinject.exe; home" },

    ];

    let aliasCommands = aliases.map(({ alias, command }) => `alias ${alias}="${command}"`).join("; ");
    ns.tprint("SUCCESS: Copy and paste the following command into your terminal:");
    ns.tprint(aliasCommands);
}
