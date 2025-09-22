/**
 * extracts the toolName and toolArgs from a strin.
 * @param {string} toolcalls - The string to parse.
 * @returns {Object} An object containing the toolName and toolArgs.
 */
function extractToolCalls(toolcalls) {
    const results = [];
    console.log("typeof", typeof toolcalls)
    console.log("toolcalls.toolname", toolcalls.toolName)
    const parts = toolcalls.split('[TOOL_CALLS]');
    for (const part of parts) {
        if (!part.trim()) continue;
        const firstBrace = part.indexOf('{');
        if (firstBrace === -1) continue;
        const toolName = part.slice(0, firstBrace).trim();
        // Trouver la fin du JSON avec comptage d'accolades
        let braceCount = 0;
        let end = firstBrace;
        for (; end < part.length; end++) {
            if (part[end] === '{') braceCount++;
            if (part[end] === '}') braceCount--;
            if (braceCount === 0) break;
        }
        const jsonString = part.slice(firstBrace, end + 1);
        let toolArgs = null;
        try {
            toolArgs = JSON.parse(jsonString);
        } catch (e) {
            // Gérer l'erreur de parsing si besoin
            continue;
        }
        results.push({ toolName, toolArgs });
    }
    return results;
}
export default extractToolCalls;