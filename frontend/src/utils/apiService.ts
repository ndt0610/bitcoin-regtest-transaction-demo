export const API_BASE_URL = 'http://127.0.0.1:8000';

export async function checkBackendConnection(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}

export async function apiGetStatus() {
  const res = await fetch(`${API_BASE_URL}/api/regtest/status`);
  if (!res.ok) throw new Error('Không thể kết nối RPC Regtest');
  return res.json();
}

export async function apiInitializeMiner(bootstrap = false) {
  const res = await fetch(`${API_BASE_URL}/api/regtest/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bootstrap })
  });
  if (!res.ok) throw new Error('Lỗi khởi tạo ví thợ đào');
  return res.json();
}

export async function apiMineBlocks(blocks: number) {
  const res = await fetch(`${API_BASE_URL}/api/regtest/mine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks })
  });
  if (!res.ok) throw new Error('Lỗi khai thác khối');
  return res.json();
}

export async function apiGenerateWallet(network = 'regtest') {
  const res = await fetch(`${API_BASE_URL}/api/wallet/generate?network=${network}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Lỗi sinh ví mới');
  return res.json();
}

export async function apiFaucet(addresses: Record<string, string>, amountsSat: Record<string, number>, mineBlock = true) {
  const res = await fetch(`${API_BASE_URL}/api/regtest/faucet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ addresses, amountsSat, mineBlock })
  });
  if (!res.ok) throw new Error('Lỗi cấp coin faucet');
  return res.json();
}

export async function apiFetchUtxos(addresses: Record<string, string>) {
  const res = await fetch(`${API_BASE_URL}/api/regtest/utxos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ addresses })
  });
  if (!res.ok) throw new Error('Lỗi truy vấn UTXO');
  return res.json();
}

export async function apiSelectCoins(addresses: Record<string, string>, recipient: string, amountSat: number, feeRateSatVb: number) {
  const res = await fetch(`${API_BASE_URL}/api/transaction/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ addresses, recipient, amountSat, feeRateSatVb })
  });
  if (!res.ok) throw new Error('Lỗi thuật toán chọn UTXO');
  return res.json();
}

export async function apiCreateAndSign(privateKey: string, recipient: string, amountSat: number, feeRateSatVb: number) {
  const res = await fetch(`${API_BASE_URL}/api/transaction/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ privateKey, recipient, amountSat, feeRateSatVb })
  });
  if (!res.ok) throw new Error('Lỗi tạo và ký giao dịch');
  return res.json();
}

export async function apiBroadcast(rawTransaction: string, expectedTxid: string) {
  const res = await fetch(`${API_BASE_URL}/api/transaction/broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawTransaction, expectedTxid })
  });
  if (!res.ok) throw new Error('Lỗi phát sóng giao dịch');
  return res.json();
}

export async function apiGetTxStatus(txid: string) {
  const res = await fetch(`${API_BASE_URL}/api/transaction/${txid}/status`);
  if (!res.ok) throw new Error('Lỗi tra cứu trạng thái giao dịch');
  return res.json();
}
