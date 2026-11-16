export type StepId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type StepStatus = 'pending' | 'in_progress' | 'completed';

export type AddressType = 'p2pkh' | 'p2shP2wpkh' | 'p2wpkh' | 'p2tr';

export interface WalletAddresses {
  p2pkh: string;
  p2shP2wpkh: string;
  p2wpkh: string;
  p2tr: string;
}

export interface WalletData {
  privateKey: string;
  publicKey: string;
  addresses: WalletAddresses;
  network: string;
}

export interface RegtestStatus {
  chain: string;
  blocks: number;
  headers: number;
  verificationprogress: number;
  minerBalanceSat: number;
  minerAddress: string;
  rpcConnected: boolean;
  rpcUrl: string;
  nodeVersion: string;
}

export interface FaucetItem {
  addressType: AddressType;
  label: string;
  address: string;
  amountSat: number;
  txid: string;
  confirmations: number;
}

export interface UTXO {
  id: string; // `${txid}:${vout}`
  txid: string;
  vout: number;
  scriptPubKey: string;
  address: string;
  addressType: AddressType;
  valueSat: number;
  confirmations: number;
  isSpent?: boolean;
}

export interface CoinSelection {
  targetAmountSat: number;
  feeRateSatVb: number;
  estimatedFeeSat: number;
  estimatedVSize: number;
  totalInputSat: number;
  changeSat: number;
  selectedInputCount: number;
  selectedUtxos: UTXO[];
}

export interface SignatureMetadata {
  inputIndex: number;
  addressType: AddressType;
  sighash: string;
  signature: string;
  scriptSig: string;
  witness: string[];
  redeemScript?: string;
}

export interface SignedTxOutput {
  address: string;
  valueSat: number;
  type: 'recipient' | 'change';
}

export interface SignedTransactionData {
  txid: string;
  wtxid: string;
  rawTransaction: string;
  totalInputSat: number;
  totalOutputSat: number;
  feeSat: number;
  changeSat: number;
  vSize: number;
  rawBytes: number;
  signatures: SignatureMetadata[];
  outputs: SignedTxOutput[];
  preflight: {
    decoded: {
      version: number;
      locktime: number;
      vinCount: number;
      voutCount: number;
      size: number;
      vsize: number;
      weight: number;
    };
    allowed: boolean;
    rejectReason?: string;
  };
}

export interface ConfirmationData {
  txid: string;
  blockHeight: number;
  blockHash: string;
  confirmations: number;
  timestamp: string;
  changeUtxo?: UTXO;
  spentUtxoIds: string[];
}

export interface StepMeta {
  id: StepId;
  phaseId: number;
  phaseTitle: string;
  title: string;
  shortTitle: string;
  description: string;
  tag: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';
export type ViewMode = 'stepper' | 'pipeline';
