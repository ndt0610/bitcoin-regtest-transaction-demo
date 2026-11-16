import { StepMeta, RegtestStatus, WalletData, FaucetItem, UTXO, CoinSelection, SignedTransactionData, ConfirmationData } from '../types';

export const STEPS_METADATA: StepMeta[] = [
  {
    id: 1,
    phaseId: 1,
    phaseTitle: 'Khởi Tạo Môi Trường',
    title: 'Bước 1: Trạng Thái Mạng Bitcoin Core Regtest',
    shortTitle: '1. Mạng & RPC',
    description: 'Kiểm tra kết nối JSON-RPC cục bộ tới Bitcoin Core chạy chuỗi Regtest độc lập.',
    tag: 'RPC 18443'
  },
  {
    id: 2,
    phaseId: 1,
    phaseTitle: 'Khởi Tạo Môi Trường',
    title: 'Bước 2: Khởi Tạo Ví Thợ Đào & Khai Thác 101 Khối',
    shortTitle: '2. Ví Thợ Đào',
    description: 'Nạp ví demo_miner và đào 101 khối để coinbase transactions vượt qua quy tắc trưởng thành (Coinbase Maturity 100 blocks).',
    tag: 'Coinbase Maturity'
  },
  {
    id: 3,
    phaseId: 1,
    phaseTitle: 'Khởi Tạo Môi Trường',
    title: 'Bước 3: Tạo Ví Demo Mới & Dẫn Xuất 3 Chuẩn Địa Chỉ',
    shortTitle: '3. Tạo Ví Demo',
    description: 'Tạo khóa riêng tư secp256k1 mới và suy ra 3 định dạng địa chỉ: Legacy (P2PKH), Nested SegWit (P2SH-P2WPKH), Native SegWit (P2WPKH).',
    tag: 'ECDSA secp256k1'
  },
  {
    id: 4,
    phaseId: 2,
    phaseTitle: 'Quản Lý Quỹ & UTXO',
    title: 'Bước 4: Cấp Coin Faucet Cho Tất Cả Địa Chỉ Ví',
    shortTitle: '4. Faucet Nạp Quỹ',
    description: 'Dùng ví thợ đào chuyển satoshi thật đến từng địa chỉ ví demo và tạo các giao dịch cấp coin vào mempool.',
    tag: 'sendtoaddress'
  },
  {
    id: 5,
    phaseId: 2,
    phaseTitle: 'Quản Lý Quỹ & UTXO',
    title: 'Bước 5: Quét & Lấy Danh Sách UTXO Khả Dụng',
    shortTitle: '5. Quét UTXO',
    description: 'Thực thi lệnh scantxoutset hoặc listunspent trên Bitcoin Core để truy xuất tập hợp UTXO chưa chi tiêu.',
    tag: 'scantxoutset'
  },
  {
    id: 6,
    phaseId: 3,
    phaseTitle: 'Xây Dựng & Ký Giao Dịch',
    title: 'Bước 6: Thuật Toán Lựa Chọn UTXO & Ước Tính Phí',
    shortTitle: '6. Chọn UTXO',
    description: 'Lựa chọn số lượng UTXO tối thiểu đủ cho số tiền gửi + phí giao dịch (sat/vB) và tính toán vSize, tiền thừa (change).',
    tag: 'Coin Selection'
  },
  {
    id: 7,
    phaseId: 3,
    phaseTitle: 'Xây Dựng & Ký Giao Dịch',
    title: 'Bước 7: Ký Độc Lập Từng Input Theo Chuẩn Script',
    shortTitle: '7. Ký Giao Dịch',
    description: 'Tạo chữ ký SIGHASH_ALL cho từng input (scriptSig cho P2PKH, witness stack cho P2WPKH, redeemScript cho P2SH-P2WPKH).',
    tag: 'SIGHASH_ALL'
  },
  {
    id: 8,
    phaseId: 4,
    phaseTitle: 'Xác Thực & Khai Thác',
    title: 'Bước 8: Kiểm Tra Preflight & Phát Sóng Giao Dịch',
    shortTitle: '8. Phát Sóng TX',
    description: 'Giải mã bằng decoderawtransaction, kiểm tra testmempoolaccept = ALLOWED, sau đó phát vào Mempool bằng sendrawtransaction.',
    tag: 'testmempoolaccept'
  },
  {
    id: 9,
    phaseId: 4,
    phaseTitle: 'Xác Thực & Khai Thác',
    title: 'Bước 9: Khai Thác Khối Xác Nhận & Quét Lại Số Dư',
    shortTitle: '9. Đào Khối Xác Nhận',
    description: 'Đào 1 block mới để đóng gói giao dịch, xác minh số xác nhận >= 1, xác thực UTXO cũ đã chi tiêu và UTXO tiền thừa mới xuất hiện.',
    tag: 'generatetoaddress'
  }
];

export const INITIAL_REGTEST_STATUS: RegtestStatus = {
  chain: 'regtest',
  blocks: 119,
  headers: 119,
  verificationprogress: 1.0,
  minerBalanceSat: 5_000_000_000, // 50 BTC
  minerAddress: 'bcrt1q8v67484p9l5cvy4h4q047248e58a7kwh8jcv82',
  rpcConnected: true,
  rpcUrl: 'http://127.0.0.1:18443',
  nodeVersion: 'Bitcoin Core v31.1.0'
};

export const INITIAL_DEMO_WALLET: WalletData = {
  network: 'regtest',
  privateKey: 'e4d8a1c97f48523091e92d77054fba36e1c2d9f4857216a0483b9c1d84f7a205',
  publicKey: '028b12f6a913459c046e7f12a39bb8dc89b1406e1215b3c58f00041285093e96ad',
  addresses: {
    p2pkh: 'mt1euQPp4PuaRTVrWSzQjioeL2SsNJra9v',
    p2shP2wpkh: '2N8iACxDvTtx4cuzc34xbQ9RsqZMDg16JFi',
    p2wpkh: 'bcrt1q3y8suvrt4t0de89auqmd5r3x2t0t22q4dpnj7c',
    p2tr: 'bcrt1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9h5d4eqg5r67w'
  }
};

export const INITIAL_FAUCET_ITEMS: FaucetItem[] = [
  {
    addressType: 'p2pkh',
    label: 'Legacy (P2PKH)',
    address: 'mt1euQPp4PuaRTVrWSzQjioeL2SsNJra9v',
    amountSat: 40_000,
    txid: 'a80b4afa058cd4864cbc3823bc8cecb12ef084fbfab592ad6a24944dd8721240',
    confirmations: 1
  },
  {
    addressType: 'p2shP2wpkh',
    label: 'Nested SegWit (P2SH-P2WPKH)',
    address: '2N8iACxDvTtx4cuzc34xbQ9RsqZMDg16JFi',
    amountSat: 40_000,
    txid: '2ae1f165f3db75e73279c20d4a18528066b6711f0d6ce59b5a3f8f566b018713',
    confirmations: 1
  },
  {
    addressType: 'p2wpkh',
    label: 'Native SegWit (P2WPKH)',
    address: 'bcrt1q3y8suvrt4t0de89auqmd5r3x2t0t22q4dpnj7c',
    amountSat: 40_000,
    txid: '3f799e54723efbd15f4a67ddfa6c10e97f6168779971dae5eaa652e0321961db',
    confirmations: 1
  }
];

export const INITIAL_UTXOS: UTXO[] = [
  {
    id: '2ae1f165f3db75e73279c20d4a18528066b6711f0d6ce59b5a3f8f566b018713:0',
    txid: '2ae1f165f3db75e73279c20d4a18528066b6711f0d6ce59b5a3f8f566b018713',
    vout: 0,
    scriptPubKey: 'a914a4cf79848524a87383a129d2983d95101a0521ad87',
    address: '2N8iACxDvTtx4cuzc34xbQ9RsqZMDg16JFi',
    addressType: 'p2shP2wpkh',
    valueSat: 40_000,
    confirmations: 1
  },
  {
    id: '3f799e54723efbd15f4a67ddfa6c10e97f6168779971dae5eaa652e0321961db:0',
    txid: '3f799e54723efbd15f4a67ddfa6c10e97f6168779971dae5eaa652e0321961db',
    vout: 0,
    scriptPubKey: '001479848524a87383a129d2983d95101a0521ad8784',
    address: 'bcrt1q3y8suvrt4t0de89auqmd5r3x2t0t22q4dpnj7c',
    addressType: 'p2wpkh',
    valueSat: 40_000,
    confirmations: 1
  },
  {
    id: 'a80b4afa058cd4864cbc3823bc8cecb12ef084fbfab592ad6a24944dd8721240:0',
    txid: 'a80b4afa058cd4864cbc3823bc8cecb12ef084fbfab592ad6a24944dd8721240',
    vout: 0,
    scriptPubKey: '76a9148479848524a87383a129d2983d95101a0521ad8788ac',
    address: 'mt1euQPp4PuaRTVrWSzQjioeL2SsNJra9v',
    addressType: 'p2pkh',
    valueSat: 40_000,
    confirmations: 1
  }
];

export const INITIAL_SELECTION: CoinSelection = {
  targetAmountSat: 100_000,
  feeRateSatVb: 2,
  estimatedFeeSat: 764,
  estimatedVSize: 382,
  totalInputSat: 120_000,
  changeSat: 19_236,
  selectedInputCount: 3,
  selectedUtxos: INITIAL_UTXOS
};

export const INITIAL_SIGNED_TX: SignedTransactionData = {
  txid: 'ee6741cabfda2bb92c2c94a74c8eb972bc6645eac41d623b697d80724ea4e2cd',
  wtxid: 'e41acf1e9ee7bdfcee734ec275154ed657091ab1314e6935aafaeb67c1b9164a',
  rawTransaction: '020000000001031387016b568f3f5a9be56c0d1f71b6668052184a0d207932e775dbf365f1e12a000000001716001479848524a87383a129d2983d95101a0521ad8784feffffffdb611932e052a6eaae5e71997768617fe9106cfa7dfa67a6d1fbeff3549e793f0000000000feffffff401272d84d94246aad92b5fabf8408ef12cb8ebc2338cb4c86d48c05fa4a0ba8000000006a473044022067f938d29b1f0923e1b74a...01',
  totalInputSat: 120_000,
  totalOutputSat: 119_236,
  feeSat: 764,
  changeSat: 19_236,
  vSize: 380,
  rawBytes: 544,
  outputs: [
    {
      address: 'bcrt1q8v67484p9l5cvy4h4q047248e58a7kwh8jcv82',
      valueSat: 100_000,
      type: 'recipient'
    },
    {
      address: 'bcrt1q3y8suvrt4t0de89auqmd5r3x2t0t22q4dpnj7c',
      valueSat: 19_236,
      type: 'change'
    }
  ],
  signatures: [
    {
      inputIndex: 0,
      addressType: 'p2shP2wpkh',
      sighash: '78294a8f9c1b3e4d5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f',
      signature: '304402205c6a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a02201a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b01',
      scriptSig: '16001479848524a87383a129d2983d95101a0521ad8784',
      witness: [
        '304402205c6a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a02201a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b01',
        '028b12f6a913459c046e7f12a39bb8dc89b1406e1215b3c58f00041285093e96ad'
      ],
      redeemScript: '001479848524a87383a129d2983d95101a0521ad8784'
    },
    {
      inputIndex: 1,
      addressType: 'p2wpkh',
      sighash: '89104a8f9c1b3e4d5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f',
      signature: '30450221008d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d02202b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c01',
      scriptSig: '',
      witness: [
        '30450221008d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d02202b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c01',
        '028b12f6a913459c046e7f12a39bb8dc89b1406e1215b3c58f00041285093e96ad'
      ]
    },
    {
      inputIndex: 2,
      addressType: 'p2pkh',
      sighash: '90124a8f9c1b3e4d5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f',
      signature: '3044022067f938d29b1f0923e1b74a98402a4b3c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a02203c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d01',
      scriptSig: '473044022067f938d29b1f0923e1b74a...21028b12f6a913459c046e7f12a39bb8dc89b1406e1215b3c58f00041285093e96ad',
      witness: []
    }
  ],
  preflight: {
    decoded: {
      version: 2,
      locktime: 0,
      vinCount: 3,
      voutCount: 2,
      size: 544,
      vsize: 380,
      weight: 1520
    },
    allowed: true
  }
};

export const INITIAL_CONFIRMATION: ConfirmationData = {
  txid: 'ee6741cabfda2bb92c2c94a74c8eb972bc6645eac41d623b697d80724ea4e2cd',
  blockHeight: 121,
  blockHash: '51e67f662a417b4876ad26114ab39e6cc08e6aabd6f5ae22da63da0652491ef1',
  confirmations: 1,
  timestamp: new Date().toLocaleTimeString(),
  spentUtxoIds: [
    '2ae1f165f3db75e73279c20d4a18528066b6711f0d6ce59b5a3f8f566b018713:0',
    '3f799e54723efbd15f4a67ddfa6c10e97f6168779971dae5eaa652e0321961db:0',
    'a80b4afa058cd4864cbc3823bc8cecb12ef084fbfab592ad6a24944dd8721240:0'
  ],
  changeUtxo: {
    id: 'ee6741cabfda2bb92c2c94a74c8eb972bc6645eac41d623b697d80724ea4e2cd:1',
    txid: 'ee6741cabfda2bb92c2c94a74c8eb972bc6645eac41d623b697d80724ea4e2cd',
    vout: 1,
    scriptPubKey: '001479848524a87383a129d2983d95101a0521ad8784',
    address: 'bcrt1q3y8suvrt4t0de89auqmd5r3x2t0t22q4dpnj7c',
    addressType: 'p2wpkh',
    valueSat: 19_236,
    confirmations: 1
  }
};
