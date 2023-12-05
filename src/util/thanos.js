/** @param {NS} ns **/
export async function main(ns) {
    const files = ns.ls('home'); // Get the list of all files on 'home' server

    for (const file of files) {
        ns.rm(file, 'home'); // Remove each file
        ns.tprint(`Deleted file: ${file}`);
    }
}
