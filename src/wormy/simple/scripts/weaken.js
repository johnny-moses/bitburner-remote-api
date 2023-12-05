// Made to be deployed by jack.js to a target server

/** @param {NS} ns **/
export async function main(ns) {
    const target = ns.args[0];
    const threads = ns.args[1] || 1;

    if (!target) {
        ns.tprint("Error: No target specified for weaken.");
        return;
    }

    await ns.weaken(target, {threads: threads});

}
