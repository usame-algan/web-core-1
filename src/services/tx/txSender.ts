import {
  getTransactionDetails,
  Operation,
  postSafeGasEstimation,
  SafeTransactionEstimation,
  TransactionDetails,
} from '@gnosis.pm/safe-react-gateway-sdk'
import {
  MetaTransactionData,
  SafeTransaction,
  SafeTransactionDataPartial,
  TransactionOptions,
  TransactionResult,
} from '@gnosis.pm/safe-core-sdk-types'
import extractTxInfo from '@/services/tx/extractTxInfo'
import proposeTx from './proposeTransaction'
import { txDispatch, TxEvent } from './txEvents'
import { getSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { didRevert } from '@/utils/ethers-utils'
import Safe, { RemoveOwnerTxParams } from '@gnosis.pm/safe-core-sdk'
import { AddOwnerTxParams, SwapOwnerTxParams } from '@gnosis.pm/safe-core-sdk/dist/src/Safe'
import { Multi_send_call_only } from '@/types/contracts/Multi_send_call_only'
import { Web3Provider } from '@ethersproject/providers'
import { ContractTransaction } from 'ethers'
import { getSafeTxs } from '@/utils/transactions'

const getAndValidateSafeSDK = (): Safe => {
  const safeSDK = getSafeSDK()
  if (!safeSDK) {
    throw new Error('Safe SDK not initialized')
  }
  return safeSDK
}

const estimateSafeTxGas = async (
  chainId: string,
  safeAddress: string,
  txParams: MetaTransactionData,
): Promise<SafeTransactionEstimation> => {
  return postSafeGasEstimation(chainId, safeAddress, {
    to: txParams.to,
    value: txParams.value,
    data: txParams.data,
    operation: (txParams.operation as unknown as Operation) || Operation.CALL,
  })
}

/**
 * Create a transaction from raw params
 */
export const createTx = async (txParams: SafeTransactionDataPartial, nonce?: number): Promise<SafeTransaction> => {
  const safeSDK = getAndValidateSafeSDK()

  // Set the recommended nonce and safeTxGas if not provided
  if (nonce === undefined) {
    const chainId = await safeSDK.getChainId()
    const estimation = await estimateSafeTxGas(String(chainId), safeSDK.getAddress(), txParams)
    txParams = { ...txParams, nonce: estimation.recommendedNonce, safeTxGas: Number(estimation.safeTxGas) }
  } else {
    txParams = { ...txParams, nonce }
  }

  return safeSDK.createTransaction(txParams)
}

/**
 * Create a multiSend transaction from an array of MetaTransactionData and options
 *
 * If only one tx is passed it will be created without multiSend.
 */
export const createMultiSendTx = async (txParams: MetaTransactionData[]): Promise<SafeTransaction> => {
  return withRecommendedNonce((safeSDK) => safeSDK.createTransaction(txParams))
}

const withRecommendedNonce = async (
  createFn: (safeSDK: Safe) => Promise<SafeTransaction>,
): Promise<SafeTransaction> => {
  const safeSDK = getAndValidateSafeSDK()
  const tx = await createFn(safeSDK)
  return createTx(tx.data)
}

export const createRemoveOwnerTx = async (txParams: RemoveOwnerTxParams): Promise<SafeTransaction> => {
  return withRecommendedNonce((safeSDK) => safeSDK.getRemoveOwnerTx(txParams))
}

export const createAddOwnerTx = async (txParams: AddOwnerTxParams): Promise<SafeTransaction> => {
  return withRecommendedNonce((safeSDK) => safeSDK.getAddOwnerTx(txParams))
}

export const createSwapOwnerTx = async (txParams: SwapOwnerTxParams): Promise<SafeTransaction> => {
  return withRecommendedNonce((safeSDK) => safeSDK.getSwapOwnerTx(txParams))
}

export const createUpdateThresholdTx = async (threshold: number): Promise<SafeTransaction> => {
  return withRecommendedNonce((safeSDK) => safeSDK.getChangeThresholdTx(threshold))
}

/**
 * Create a rejection tx
 */
export const createRejectTx = async (nonce: number): Promise<SafeTransaction> => {
  const safeSDK = getAndValidateSafeSDK()
  return safeSDK.createRejectionTransaction(nonce)
}

/**
 * Prepare a SafeTransaction from Client Gateway / Tx Queue
 */
export const createExistingTx = async (
  chainId: string,
  safeAddress: string,
  txId: string,
  txDetails?: TransactionDetails,
): Promise<SafeTransaction> => {
  // Get the tx details from the backend if not provided
  txDetails = txDetails || (await getTransactionDetails(chainId, txId))

  // Convert them to the Core SDK tx params
  const { txParams, signatures } = extractTxInfo(txDetails, safeAddress)

  // Create a tx and add pre-approved signatures
  const safeTx = await createTx(txParams, txParams.nonce)
  Object.entries(signatures).forEach(([signer, data]) => {
    safeTx.addSignature({ signer, data, staticPart: () => data, dynamicPart: () => '' })
  })

  return safeTx
}

/**
 * Propose a transaction
 * If txId is passed, it's an existing tx being signed
 */
export const dispatchTxProposal = async (
  chainId: string,
  safeAddress: string,
  sender: string,
  safeTx: SafeTransaction,
  txId?: string,
): Promise<TransactionDetails> => {
  const safeSDK = getAndValidateSafeSDK()
  const safeTxHash = await safeSDK.getTransactionHash(safeTx)

  let proposedTx: TransactionDetails | undefined
  try {
    proposedTx = await proposeTx(chainId, safeAddress, sender, safeTx, safeTxHash)
  } catch (error) {
    if (txId) {
      txDispatch(TxEvent.SIGNATURE_PROPOSE_FAILED, { txId, tx: safeTx, error: error as Error })
    } else {
      txDispatch(TxEvent.PROPOSE_FAILED, { tx: safeTx, error: error as Error })
    }
    throw error
  }

  txDispatch(txId ? TxEvent.SIGNATURE_PROPOSED : TxEvent.PROPOSED, { txId: proposedTx.txId, tx: safeTx })

  return proposedTx
}

/**
 * Sign a transaction
 */
export const dispatchTxSigning = async (
  safeTx: SafeTransaction,
  isHardwareWallet: boolean,
  txId?: string,
): Promise<SafeTransaction> => {
  const sdk = getAndValidateSafeSDK()
  const signingMethod = isHardwareWallet ? 'eth_sign' : 'eth_signTypedData'

  let signedTx: SafeTransaction | undefined
  try {
    signedTx = await sdk.signTransaction(safeTx, signingMethod)
  } catch (error) {
    txDispatch(TxEvent.SIGN_FAILED, { txId, tx: safeTx, error: error as Error })
    throw error
  }

  txDispatch(TxEvent.SIGNED, { txId, tx: signedTx })

  return signedTx
}

/**
 * Execute a transaction
 */
export const dispatchTxExecution = async (
  txId: string,
  safeTx: SafeTransaction,
  txOptions?: TransactionOptions,
): Promise<string> => {
  const sdk = getAndValidateSafeSDK()

  txDispatch(TxEvent.EXECUTING, { txId, tx: safeTx })

  // Execute the tx
  let result: TransactionResult | undefined
  try {
    result = await sdk.executeTransaction(safeTx, txOptions)
  } catch (error) {
    txDispatch(TxEvent.FAILED, { txId, tx: safeTx, error: error as Error })
    throw error
  }

  txDispatch(TxEvent.MINING, { txId, txHash: result.hash, tx: safeTx })

  // Asynchronously watch the tx to be mined
  result.transactionResponse
    ?.wait()
    .then((receipt) => {
      if (didRevert(receipt)) {
        txDispatch(TxEvent.REVERTED, { txId, receipt, tx: safeTx, error: new Error('Transaction reverted by EVM') })
      } else {
        txDispatch(TxEvent.MINED, { txId, tx: safeTx, receipt })
      }
    })
    .catch((error) => {
      txDispatch(TxEvent.FAILED, { txId, tx: safeTx, error: error as Error })
    })

  return result.hash
}

export const dispatchBatchExecution = async (
  txs: TransactionDetails[],
  multiSendContract: Multi_send_call_only,
  multiSendTxData: string,
  provider: Web3Provider,
  chainId: string,
  safeAddress: string,
) => {
  const safeTxs = await getSafeTxs(txs, chainId, safeAddress)

  txs.forEach((tx, idx) => {
    txDispatch(TxEvent.EXECUTING, { txId: tx.txId, tx: safeTxs[idx], batchId: multiSendTxData })
  })

  let result: ContractTransaction | undefined
  try {
    result = await multiSendContract.connect(provider.getSigner()).multiSend(multiSendTxData)
  } catch (err) {
    txs.forEach((tx, idx) => {
      txDispatch(TxEvent.FAILED, { txId: tx.txId, tx: safeTxs[idx], error: err as Error, batchId: multiSendTxData })
    })
    throw err
  }

  txs.forEach((tx, idx) => {
    txDispatch(TxEvent.MINING, { txId: tx.txId, txHash: result!.hash, tx: safeTxs[idx], batchId: multiSendTxData })
  })

  result
    .wait()
    .then((receipt) => {
      if (didRevert(receipt)) {
        txs.forEach((tx, idx) => {
          txDispatch(TxEvent.REVERTED, {
            txId: tx.txId,
            receipt,
            tx: safeTxs[idx],
            error: new Error('Transaction reverted by EVM'),
            batchId: multiSendTxData,
          })
        })
      } else {
        txs.forEach((tx, idx) => {
          txDispatch(TxEvent.MINED, {
            txId: tx.txId,
            tx: safeTxs[idx],
            receipt,
            batchId: multiSendTxData,
          })
        })
      }
    })
    .catch((err) => {
      txs.forEach((tx, idx) => {
        txDispatch(TxEvent.FAILED, {
          txId: tx.txId,
          tx: safeTxs[idx],
          error: err as Error,
          batchId: multiSendTxData,
        })
      })
    })

  return result.hash
}
