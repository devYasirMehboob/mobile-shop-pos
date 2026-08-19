// IndexedDB offline utility decommissioned
export async function getCachedProducts() { return []; }
export async function deductCachedStock() { return true; }
export async function saveOfflineSale() { return true; }
export function generateOfflineSaleId() { return "OFF_" + Date.now(); }
export async function getOfflineSales() { return []; }
export async function updateOfflineSaleStatus() { return true; }
export async function getPendingOfflineSalesCount() { return 0; }
export async function cacheProducts() { return true; }
export async function getDeviceConfig() { return null; }
export async function saveDeviceConfig() { return true; }
export function generateSalt() { return ""; }
export function hashPin() { return ""; }
