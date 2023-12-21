// Description: Attack deployment manager. This script will automatically launch grow/weaken/hack scripts as needed.
// Uses grow.js, weaken.js, and hack.js to attack a target server.
// Usage: run jack.js [target]

/** @param {NS} ns **/
export async function main(ns) {
    const target = ns.args[0];
    const hostServer = ns.getHostname();
    const securityThreshold = ns.getServerMinSecurityLevel(target) + 10; // Security buffer
    const moneyThreshold = 0.90; // 75% of max money
    const ramBuffer = 2.5; // Reserve 2.5GB of RAM

    if (!target) {
        ns.tprint("Error: No target specified. Exiting.");
        return;
    }

    ns.tprint(`Starting advanced attack script on target: ${target} from server: ${hostServer}`);

    // eslint-disable-next-line no-constant-condition
    while (true) {
        try {
            const currentSecurity = ns.getServerSecurityLevel(target);
            const currentMoney = ns.getServerMoneyAvailable(target);
            const maxMoney = ns.getServerMaxMoney(target);

            let action;
            if (currentSecurity > securityThreshold) {
                action = 'weaken';
            } else if (currentMoney < maxMoney * moneyThreshold) {
                action = 'grow';
            } else {
                action = 'hack';
            }

            const scriptRam = ns.getScriptRam(`wormy/simple/scripts/${action}.js`, hostServer);
            if (scriptRam <= 0) {
                ns.tprint(`Error: Script RAM usage is zero or invalid for ${action}.js on server ${hostServer}`);
                return;
            }

            let availableRam = ns.getServerMaxRam(hostServer) - ns.getServerUsedRam(hostServer) - ramBuffer;
            while (availableRam >= scriptRam) {
                const pid = ns.exec(`wormy/simple/scripts/${action}.js`, hostServer, 1, target);
                if (pid === 0) {
                    // ns.tprint(`Failed to start ${action}.js on target: ${target} from server ${hostServer}.`);
                    break; // Break the loop if unable to start a new process
                } else {
                    // ns.tprint(`Launched ${action}.js on target: ${target} from server ${hostServer}. PID: ${pid}`);
                    availableRam -= scriptRam;
                }
                await ns.sleep(100); // Short sleep to prevent script from hogging CPU
            }

            // ns.tprint(`Not enough RAM on server ${hostServer} to perform ${action} on target: ${target}. Waiting to retry...`);
            await ns.sleep(5000);
        } catch (e) {
            ns.tprint(`An error occurred on server ${hostServer}: ${e}`);
            await ns.sleep(1000);
        }
    }
}
