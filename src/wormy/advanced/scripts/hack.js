// Made to be deployed by jack.js to a target server

/** @param {NS} ns **/
export async function main(ns) {
    const target = ns.args[0];
    const threads = ns.args[1] || 1;

    if (!target) {
        ns.tprint("ERROR: No target specified for hack.");
        return;
    }

    await ns.hack(target, {threads: threads});

}
