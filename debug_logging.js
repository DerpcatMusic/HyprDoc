// Debug logging to identify the infinite creation source
console.log("=== INFINITE DOCUMENT CREATION DEBUG ===");

let saveCount = 0;
let updateCount = 0;
let hashCount = 0;

export const debugLogging = {
  logSave: (docId, source = "unknown") => {
    saveCount++;
    console.log(`🔄 SAVE #${saveCount} from ${source}:`, {
      docId: docId?.substring(0, 8),
      timestamp: new Date().toISOString(),
      stack: new Error().stack.split("\n").slice(1, 4).join("\n"),
    });
  },

  logUpdate: (blockId, source = "unknown") => {
    updateCount++;
    console.log(`📝 UPDATE #${updateCount} from ${source}:`, {
      blockId: blockId?.substring(0, 8),
      timestamp: new Date().toISOString(),
      stack: new Error().stack.split("\n").slice(1, 3).join("\n"),
    });
  },

  logHash: (docId, source = "unknown") => {
    hashCount++;
    console.log(`🔐 HASH #${hashCount} from ${source}:`, {
      docId: docId?.substring(0, 8),
      timestamp: new Date().toISOString(),
    });
  },

  reset: () => {
    saveCount = 0;
    updateCount = 0;
    hashCount = 0;
    console.log("🔄 Debug counters reset");
  },
};
