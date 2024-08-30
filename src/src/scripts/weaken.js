// Made to be deployed by src/wormy/advanced/jackx.js to a target server

/** @param {NS} ns **/
export async function main(ns) {
    const target = ns.args[0];
    const threads = ns.args[1] || 1;

    if (!target) {
        ns.tprint("ERROR: No target specified for weaken.");
        return;
    }

    await ns.weaken(target, {threads: threads});

}
