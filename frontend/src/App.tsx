import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StepId,
  StepStatus,
  ThemeMode,
  ViewMode,
  RegtestStatus,
  WalletData,
  FaucetItem,
  UTXO,
  CoinSelection,
  SignedTransactionData,
  ConfirmationData
} from './types';
import {
  STEPS_METADATA,
  INITIAL_REGTEST_STATUS,
  INITIAL_DEMO_WALLET,
  INITIAL_FAUCET_ITEMS,
  INITIAL_UTXOS,
  INITIAL_SELECTION,
  INITIAL_SIGNED_TX,
  INITIAL_CONFIRMATION
} from './data/mockData';
import { Header } from './components/Header';
import { StepperNav } from './components/StepperNav';
import { StickySummaryHUD } from './components/StickySummaryHUD';
import { FloatingNavDock } from './components/FloatingNavDock';
import { EvaluationModal } from './components/EvaluationModal';
import { ExpertReportModal } from './components/ExpertReportModal';
import { PipelineOverview } from './components/PipelineOverview';
import { Step1Status } from './components/StepPanels/Step1Status';
import { Step2Miner } from './components/StepPanels/Step2Miner';
import { Step3Wallet } from './components/StepPanels/Step3Wallet';
import { Step4Faucet } from './components/StepPanels/Step4Faucet';
import { Step5Utxos } from './components/StepPanels/Step5Utxos';
import { Step6Select } from './components/StepPanels/Step6Select';
import { Step7Sign } from './components/StepPanels/Step7Sign';
import { Step8Broadcast } from './components/StepPanels/Step8Broadcast';
import { Step9Confirmation } from './components/StepPanels/Step9Confirmation';
import { generateRandomHex } from './utils/helpers';
import { checkBackendConnection, apiGetStatus } from './utils/apiService';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('bitcoin_demo_theme') as ThemeMode;
    return saved || 'dark';
  });

  // Navigation & View state
  const [currentStep, setCurrentStep] = useState<StepId>(1);
  const [viewMode, setViewMode] = useState<ViewMode>('stepper');
  const [isEvaluationOpen, setIsEvaluationOpen] = useState(false);
  const [isExpertReportOpen, setIsExpertReportOpen] = useState(false);
  const [isAutoRunning, setIsAutoRunning] = useState(false);

  // Connection state
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isSandboxMode, setIsSandboxMode] = useState(true);

  // Step completion statuses
  const [stepStatuses, setStepStatuses] = useState<Record<StepId, StepStatus>>({
    1: 'completed',
    2: 'completed',
    3: 'completed',
    4: 'completed',
    5: 'completed',
    6: 'completed',
    7: 'completed',
    8: 'completed',
    9: 'completed'
  });

  // Business Data states
  const [status, setStatus] = useState<RegtestStatus>(INITIAL_REGTEST_STATUS);
  const [wallet, setWallet] = useState<WalletData>(INITIAL_DEMO_WALLET);
  const [faucetItems, setFaucetItems] = useState<FaucetItem[]>(INITIAL_FAUCET_ITEMS);
  const [utxos, setUtxos] = useState<UTXO[]>(INITIAL_UTXOS);
  const [selection, setSelection] = useState<CoinSelection>(INITIAL_SELECTION);
  const [signedTx, setSignedTx] = useState<SignedTransactionData>(INITIAL_SIGNED_TX);
  const [isBroadcasted, setIsBroadcasted] = useState(true);
  const [confirmation, setConfirmation] = useState<ConfirmationData>(INITIAL_CONFIRMATION);

  // Sync refs to prevent stale closure reads during auto-runs or rapid step switches
  const statusRef = useRef(status);
  statusRef.current = status;
  const walletRef = useRef(wallet);
  walletRef.current = wallet;
  const faucetItemsRef = useRef(faucetItems);
  faucetItemsRef.current = faucetItems;
  const utxosRef = useRef(utxos);
  utxosRef.current = utxos;
  const selectionRef = useRef(selection);
  selectionRef.current = selection;
  const signedTxRef = useRef(signedTx);
  signedTxRef.current = signedTx;
  const confirmationRef = useRef(confirmation);
  confirmationRef.current = confirmation;

  // Handle Theme switching & html class
  useEffect(() => {
    localStorage.setItem('bitcoin_demo_theme', theme);
    const root = document.documentElement;

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  // Check background backend connectivity
  useEffect(() => {
    let mounted = true;
    checkBackendConnection().then((connected) => {
      if (mounted) {
        setIsBackendConnected(connected);
        if (connected) {
          apiGetStatus().then((s) => {
            if (s && mounted) {
              setStatus((prev) => ({
                ...prev,
                blocks: s.blocks ?? prev.blocks,
                headers: s.headers ?? prev.headers,
                minerBalanceSat: s.balanceSat ?? prev.minerBalanceSat
              }));
            }
          }).catch(() => {});
        }
      }
    });
    return () => { mounted = false; };
  }, []);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when user is focusing on an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentStep((prev) => (prev < 9 ? ((prev + 1) as StepId) : prev));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as StepId) : prev));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Navigation handlers
  const handlePrev = useCallback(() => {
    setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as StepId) : prev));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentStep((prev) => (prev < 9 ? ((prev + 1) as StepId) : prev));
  }, []);

  // Step 1 handler: Refresh RPC status
  const handleRefreshStatus = async () => {
    await new Promise((r) => setTimeout(r, 600));
    setStatus((prev) => ({
      ...prev,
      blocks: prev.blocks,
      headers: prev.headers,
      verificationprogress: 1.0,
      rpcConnected: true
    }));
    setStepStatuses((prev) => ({ ...prev, 1: 'completed' }));
  };

  // Step 2 handler: Mine blocks / Bootstrap
  const handleMineBlocks = async (blocks: number) => {
    await new Promise((r) => setTimeout(r, 600));
    setStatus((prev) => ({
      ...prev,
      blocks: prev.blocks + blocks,
      headers: prev.headers + blocks,
      minerBalanceSat: prev.minerBalanceSat + blocks * 5_000_000_000
    }));
    setStepStatuses((prev) => ({ ...prev, 2: 'completed' }));
  };

  const handleBootstrap = async () => {
    await new Promise((r) => setTimeout(r, 800));
    setStatus((prev) => ({
      ...prev,
      blocks: 101,
      headers: 101,
      minerBalanceSat: 5_000_000_000
    }));
    setStepStatuses((prev) => ({ ...prev, 2: 'completed' }));
  };

  // Step 3 handler: Generate new wallet
  const handleGenerateWallet = async () => {
    await new Promise((r) => setTimeout(r, 600));
    const randomHexKey = generateRandomHex(64);
    const randomPubHex = '02' + generateRandomHex(64);
    const newP2pkh = 'm' + generateRandomHex(33);
    const newP2sh = '2' + generateRandomHex(33);
    const newP2wpkh = 'bcrt1q' + generateRandomHex(38);
    const newP2tr = 'bcrt1p' + generateRandomHex(58);

    setWallet({
      network: 'regtest',
      privateKey: randomHexKey,
      publicKey: randomPubHex,
      addresses: {
        p2pkh: newP2pkh,
        p2shP2wpkh: newP2sh,
        p2wpkh: newP2wpkh,
        p2tr: newP2tr
      }
    });

    // Update faucet items with new addresses
    setFaucetItems([
      {
        addressType: 'p2pkh',
        label: 'Legacy (P2PKH)',
        address: newP2pkh,
        amountSat: 40_000,
        txid: generateRandomHex(64),
        confirmations: 0
      },
      {
        addressType: 'p2shP2wpkh',
        label: 'Nested SegWit (P2SH-P2WPKH)',
        address: newP2sh,
        amountSat: 40_000,
        txid: generateRandomHex(64),
        confirmations: 0
      },
      {
        addressType: 'p2wpkh',
        label: 'Native SegWit (P2WPKH)',
        address: newP2wpkh,
        amountSat: 40_000,
        txid: generateRandomHex(64),
        confirmations: 0
      }
    ]);

    setStepStatuses((prev) => ({ ...prev, 3: 'completed' }));
  };

  // Step 4 handler: Trigger faucet
  const handleTriggerFaucet = async (mineBlock: boolean, amountPerAddr?: number) => {
    await new Promise((r) => setTimeout(r, 700));
    const currentItems = faucetItemsRef.current;
    const finalAmountSat = amountPerAddr && amountPerAddr > 0 ? amountPerAddr : 40_000;
    const totalSent = finalAmountSat * currentItems.length;

    const updated = currentItems.map((item) => ({
      ...item,
      amountSat: finalAmountSat,
      txid: generateRandomHex(64),
      confirmations: mineBlock ? 1 : 0
    }));
    faucetItemsRef.current = updated;
    setFaucetItems(updated);

    setStatus((prev) => {
      const next = {
        ...prev,
        blocks: mineBlock ? prev.blocks + 1 : prev.blocks,
        headers: mineBlock ? prev.headers + 1 : prev.headers,
        minerBalanceSat: Math.max(0, prev.minerBalanceSat - totalSent)
      };
      statusRef.current = next;
      return next;
    });

    // Refresh UTXOs
    const newUtxos: UTXO[] = updated.map((item) => ({
      id: `${item.txid}:0`,
      txid: item.txid,
      vout: 0,
      scriptPubKey:
        item.addressType === 'p2pkh'
          ? '76a914' + generateRandomHex(40) + '88ac'
          : item.addressType === 'p2shP2wpkh'
          ? 'a914' + generateRandomHex(40) + '87'
          : '0014' + generateRandomHex(40),
      address: item.address,
      addressType: item.addressType,
      valueSat: item.amountSat,
      confirmations: mineBlock ? 1 : 0
    }));
    utxosRef.current = newUtxos;
    setUtxos(newUtxos);
    setStepStatuses((prev) => ({ ...prev, 4: 'completed' }));
  };

  // Step 5 handler: Rescan UTXOs
  const handleRescanUtxos = async () => {
    await new Promise((r) => setTimeout(r, 600));
    setStepStatuses((prev) => ({ ...prev, 5: 'completed' }));
  };

  // Step 6 handler: Coin Selection
  const handleRunSelection = async (
    amountSat: number,
    feeRateSatVb: number,
    recipient: string,
    customUtxos?: UTXO[]
  ) => {
    await new Promise((r) => setTimeout(r, 400));
    const activeUtxos = utxosRef.current.filter((u) => !u.isSpent);
    const chosenUtxos = customUtxos && customUtxos.length > 0 ? customUtxos : activeUtxos;

    const totalInput = chosenUtxos.reduce((s, u) => s + u.valueSat, 0);

    // Dynamic vSize based on script types
    let inputVSize = 0;
    chosenUtxos.forEach((u) => {
      if (u.addressType === 'p2pkh') inputVSize += 148;
      else if (u.addressType === 'p2shP2wpkh') inputVSize += 91;
      else inputVSize += 68;
    });
    const overhead = 10 + 34 + 31;
    const estimatedVSize = Math.max(140, inputVSize + overhead);
    const estimatedFee = estimatedVSize * feeRateSatVb;
    const change = totalInput - amountSat - estimatedFee;

    const newSelection: CoinSelection = {
      targetAmountSat: amountSat,
      feeRateSatVb,
      estimatedFeeSat: estimatedFee,
      estimatedVSize,
      totalInputSat: totalInput,
      changeSat: change,
      selectedInputCount: chosenUtxos.length,
      selectedUtxos: chosenUtxos
    };
    selectionRef.current = newSelection;
    setSelection(newSelection);
    setStepStatuses((prev) => ({ ...prev, 6: 'completed' }));
  };

  // Step 7 handler: Sign Transaction
  const handleSignTransaction = async () => {
    const curSelection = selectionRef.current;
    const curWallet = walletRef.current;
    const curStatus = statusRef.current;

    // Strict consensus balance check: value in must cover value out + fee
    if (curSelection.totalInputSat < curSelection.targetAmountSat + curSelection.estimatedFeeSat || curSelection.changeSat < 0) {
      return;
    }
    await new Promise((r) => setTimeout(r, 700));
    const newTxid = generateRandomHex(64);
    const newWtxid = generateRandomHex(64);

    const dynamicSignatures = curSelection.selectedUtxos.map((utxo, idx) => {
      const sighash = generateRandomHex(64);
      const signature =
        '30440220' + generateRandomHex(64) + '0220' + generateRandomHex(62) + '01';
      const pubkeyHex = curWallet.publicKey;

      if (utxo.addressType === 'p2pkh') {
        return {
          inputIndex: idx,
          addressType: 'p2pkh' as const,
          sighash,
          signature,
          scriptSig: `48${signature}21${pubkeyHex}`,
          witness: []
        };
      } else if (utxo.addressType === 'p2shP2wpkh') {
        const redeemScript = '0014' + generateRandomHex(40);
        return {
          inputIndex: idx,
          addressType: 'p2shP2wpkh' as const,
          sighash,
          signature,
          scriptSig: `16${redeemScript}`,
          witness: [signature, pubkeyHex],
          redeemScript
        };
      } else {
        return {
          inputIndex: idx,
          addressType: 'p2wpkh' as const,
          sighash,
          signature,
          scriptSig: '',
          witness: [signature, pubkeyHex]
        };
      }
    });

    const dynamicOutputs = [
      {
        address: curStatus.minerAddress,
        valueSat: curSelection.targetAmountSat,
        type: 'recipient' as const
      },
      ...(curSelection.changeSat > 0
        ? [
            {
              address: curWallet.addresses.p2wpkh,
              valueSat: curSelection.changeSat,
              type: 'change' as const
            }
          ]
        : [])
    ];

    const vSize = curSelection.estimatedVSize || 250;
    const rawBytes = Math.round(vSize * 1.38);

    const newSignedTx: SignedTransactionData = {
      txid: newTxid,
      wtxid: newWtxid,
      rawTransaction:
        '020000000001' +
        (dynamicSignatures.length < 16 ? '0' : '') +
        dynamicSignatures.length.toString(16) +
        generateRandomHex(80) +
        (dynamicOutputs.length < 16 ? '0' : '') +
        dynamicOutputs.length.toString(16) +
        generateRandomHex(90) +
        '00000000',
      totalInputSat: curSelection.totalInputSat,
      totalOutputSat: curSelection.targetAmountSat + Math.max(0, curSelection.changeSat),
      feeSat: curSelection.estimatedFeeSat,
      changeSat: curSelection.changeSat,
      vSize,
      rawBytes,
      signatures: dynamicSignatures,
      outputs: dynamicOutputs,
      preflight: {
        decoded: {
          version: 2,
          locktime: 0,
          vinCount: dynamicSignatures.length,
          voutCount: dynamicOutputs.length,
          size: rawBytes,
          vsize: vSize,
          weight: vSize * 4
        },
        allowed: true
      }
    };
    signedTxRef.current = newSignedTx;
    setSignedTx(newSignedTx);
    setIsBroadcasted(false);
    setStepStatuses((prev) => ({ ...prev, 7: 'completed' }));
  };

  // Step 8 handler: Broadcast
  const handleBroadcast = async () => {
    const curSelection = selectionRef.current;
    const curSignedTx = signedTxRef.current;
    // Strict consensus balance check: reject invalid transactions from mempool
    if (curSelection.totalInputSat < curSelection.targetAmountSat + curSelection.estimatedFeeSat || curSelection.changeSat < 0) {
      return;
    }
    await new Promise((r) => setTimeout(r, 600));
    setIsBroadcasted(true);
    const newConf = {
      ...confirmationRef.current,
      txid: curSignedTx.txid,
      confirmations: 0
    };
    confirmationRef.current = newConf;
    setConfirmation(newConf);
    setStepStatuses((prev) => ({ ...prev, 8: 'completed' }));
  };

  // Step 9 handler: Mine Confirm Block
  const handleMineConfirmBlock = async () => {
    await new Promise((r) => setTimeout(r, 800));
    const curStatus = statusRef.current;
    const curSignedTx = signedTxRef.current;
    const curSelection = selectionRef.current;
    const curUtxos = utxosRef.current;
    const curWallet = walletRef.current;

    const newHeight = curStatus.blocks + 1;
    const newHash = generateRandomHex(64);

    const nextStatus = {
      ...curStatus,
      blocks: newHeight,
      headers: newHeight
    };
    statusRef.current = nextStatus;
    setStatus(nextStatus);

    // Mark used UTXOs as spent
    const spentIds = curSelection.selectedUtxos.map((u) => u.id);
    const updatedUtxos = curUtxos.map((u) => {
      if (spentIds.includes(u.id)) {
        return { ...u, isSpent: true };
      }
      return u;
    });

    // Add new change UTXO if changeSat > 0
    const changeUtxo: UTXO = {
      id: `${curSignedTx.txid}:1`,
      txid: curSignedTx.txid,
      vout: 1,
      scriptPubKey: '0014' + generateRandomHex(40),
      address: curWallet.addresses.p2wpkh,
      addressType: 'p2wpkh',
      valueSat: curSignedTx.changeSat,
      confirmations: 1
    };

    const finalUtxos = curSignedTx.changeSat > 0 ? [...updatedUtxos, changeUtxo] : updatedUtxos;
    utxosRef.current = finalUtxos;
    setUtxos(finalUtxos);

    const newConf: ConfirmationData = {
      txid: curSignedTx.txid,
      blockHeight: newHeight,
      blockHash: newHash,
      confirmations: 1,
      timestamp: new Date().toLocaleTimeString(),
      spentUtxoIds: spentIds,
      changeUtxo: curSignedTx.changeSat > 0 ? changeUtxo : undefined
    };
    confirmationRef.current = newConf;
    setConfirmation(newConf);

    setStepStatuses((prev) => ({ ...prev, 9: 'completed' }));
  };

  // Reset entire demo
  const handleResetDemo = () => {
    setStatus(INITIAL_REGTEST_STATUS);
    statusRef.current = INITIAL_REGTEST_STATUS;
    setWallet(INITIAL_DEMO_WALLET);
    walletRef.current = INITIAL_DEMO_WALLET;
    setFaucetItems(INITIAL_FAUCET_ITEMS);
    faucetItemsRef.current = INITIAL_FAUCET_ITEMS;
    setUtxos(INITIAL_UTXOS);
    utxosRef.current = INITIAL_UTXOS;
    setSelection(INITIAL_SELECTION);
    selectionRef.current = INITIAL_SELECTION;
    setSignedTx(INITIAL_SIGNED_TX);
    signedTxRef.current = INITIAL_SIGNED_TX;
    setConfirmation(INITIAL_CONFIRMATION);
    confirmationRef.current = INITIAL_CONFIRMATION;
    setIsBroadcasted(true);
    setCurrentStep(1);
    setStepStatuses({
      1: 'completed',
      2: 'completed',
      3: 'completed',
      4: 'completed',
      5: 'completed',
      6: 'completed',
      7: 'completed',
      8: 'completed',
      9: 'completed'
    });
  };

  // Auto-run 9 steps demo
  const handleAutoRun = async () => {
    if (isAutoRunning) return;
    setIsAutoRunning(true);
    setViewMode('stepper');

    for (let step = 1; step <= 9; step++) {
      setCurrentStep(step as StepId);
      if (step === 1) await handleRefreshStatus();
      else if (step === 2) await handleBootstrap();
      else if (step === 3) await handleGenerateWallet();
      else if (step === 4) await handleTriggerFaucet(true);
      else if (step === 5) await handleRescanUtxos();
      else if (step === 6) {
        // Dynamically choose a mathematically valid target amount based on active UTXOs
        const activeUtxos = utxosRef.current.filter((u) => !u.isSpent);
        const availableSat = activeUtxos.reduce((s, u) => s + u.valueSat, 0);
        if (availableSat <= 0) {
          setIsAutoRunning(false);
          break;
        }
        const feeEst = 760;
        const safeTargetSat =
          availableSat >= 100_000 + feeEst
            ? 100_000
            : Math.max(1_000, Math.floor((availableSat - feeEst) * 0.7));
        await handleRunSelection(safeTargetSat, 2, statusRef.current.minerAddress, activeUtxos);
      }
      else if (step === 7) {
        if (
          selectionRef.current.totalInputSat <
            selectionRef.current.targetAmountSat + selectionRef.current.estimatedFeeSat ||
          selectionRef.current.changeSat < 0
        ) {
          setIsAutoRunning(false);
          break;
        }
        await handleSignTransaction();
      }
      else if (step === 8) {
        if (selectionRef.current.changeSat < 0) {
          setIsAutoRunning(false);
          break;
        }
        await handleBroadcast();
      }
      else if (step === 9) {
        await handleMineConfirmBlock();
      }
      await new Promise((r) => setTimeout(r, 600));
    }

    setIsAutoRunning(false);
  };

  // Next step meta title for dock
  const nextMeta = STEPS_METADATA.find((s) => s.id === currentStep + 1);

  return (
    <div className={`min-h-screen flex flex-col bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200 ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Top Header */}
      <Header
        theme={theme}
        onThemeChange={setTheme}
        isBackendConnected={isBackendConnected}
        isSandboxMode={isSandboxMode}
        onToggleSandbox={setIsSandboxMode}
        onOpenEvaluation={() => setIsEvaluationOpen(true)}
        onOpenExpertReport={() => setIsExpertReportOpen(true)}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        currentStep={currentStep}
        totalSteps={9}
      />

      {/* Stepper Navigation */}
      <StepperNav
        steps={STEPS_METADATA}
        currentStep={currentStep}
        stepStatuses={stepStatuses}
        onSelectStep={(id) => {
          setCurrentStep(id);
          setViewMode('stepper');
        }}
      />

      {/* Sticky Mini-HUD */}
      <StickySummaryHUD
        status={status}
        utxos={utxos}
        currentTxid={signedTx.txid}
        txConfirmed={confirmation.confirmations >= 1}
        onJumpToStep={(id) => {
          setCurrentStep(id);
          setViewMode('stepper');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
        {viewMode === 'pipeline' ? (
          <PipelineOverview
            currentStep={currentStep}
            stepStatuses={stepStatuses}
            onSelectStep={(id) => setCurrentStep(id)}
            onSwitchToStepper={() => setViewMode('stepper')}
          />
        ) : (
          <div>
            {currentStep === 1 && (
              <Step1Status
                status={status}
                onRefresh={handleRefreshStatus}
                onNext={handleNext}
              />
            )}
            {currentStep === 2 && (
              <Step2Miner
                status={status}
                onMineBlocks={handleMineBlocks}
                onBootstrap={handleBootstrap}
                onNext={handleNext}
              />
            )}
            {currentStep === 3 && (
              <Step3Wallet
                wallet={wallet}
                onGenerateNewWallet={handleGenerateWallet}
                onNext={handleNext}
              />
            )}
            {currentStep === 4 && (
              <Step4Faucet
                status={status}
                wallet={wallet}
                faucetItems={faucetItems}
                onTriggerFaucet={handleTriggerFaucet}
                onMineConfirm={() => handleMineBlocks(1)}
                onNext={handleNext}
              />
            )}
            {currentStep === 5 && (
              <Step5Utxos
                utxos={utxos}
                onRescan={handleRescanUtxos}
                onNext={handleNext}
              />
            )}
            {currentStep === 6 && (
              <Step6Select
                wallet={wallet}
                utxos={utxos}
                selection={selection}
                minerRecipientAddress={status.minerAddress}
                onRunSelection={handleRunSelection}
                onNext={handleNext}
              />
            )}
            {currentStep === 7 && (
              <Step7Sign
                wallet={wallet}
                signedTx={signedTx}
                selection={selection}
                onSignTransaction={handleSignTransaction}
                onNext={handleNext}
              />
            )}
            {currentStep === 8 && (
              <Step8Broadcast
                signedTx={signedTx}
                isBroadcasted={isBroadcasted}
                onBroadcast={handleBroadcast}
                onNext={handleNext}
              />
            )}
            {currentStep === 9 && (
              <Step9Confirmation
                signedTx={signedTx}
                confirmation={confirmation}
                utxos={utxos}
                onMineConfirmBlock={handleMineConfirmBlock}
                onResetDemo={handleResetDemo}
                onViewPipeline={() => setViewMode('pipeline')}
              />
            )}
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation Dock */}
      <FloatingNavDock
        currentStep={currentStep}
        totalSteps={9}
        onPrev={handlePrev}
        onNext={handleNext}
        onAutoRun={handleAutoRun}
        isAutoRunning={isAutoRunning}
        onReset={handleResetDemo}
        nextStepTitle={nextMeta?.shortTitle}
      />

      {/* In-depth Evaluation Modal */}
      <EvaluationModal
        isOpen={isEvaluationOpen}
        onClose={() => setIsEvaluationOpen(false)}
      />

      {/* In-depth Expert Markdown Report Modal */}
      <ExpertReportModal
        isOpen={isExpertReportOpen}
        onClose={() => setIsExpertReportOpen(false)}
      />
    </div>
  );
}
