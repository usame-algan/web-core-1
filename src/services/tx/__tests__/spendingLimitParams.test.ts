import { NewSpendingLimitData } from '@/components/settings/SpendingLimits/NewSpendingLimit'
import { ZERO_ADDRESS } from '@gnosis.pm/safe-core-sdk/dist/src/utils/constants'
import * as safeCoreSDK from '@/hooks/coreSDK/safeCoreSDK'
import * as spendingLimit from '@/services/contracts/spendingLimitContracts'
import * as txSender from '@/services/tx/txSender'
import * as spendingLimitParams from '@/services/tx/spendingLimitParams'
import Safe from '@gnosis.pm/safe-core-sdk'
import { SpendingLimitState } from '@/store/spendingLimitsSlice'
import { createNewSpendingLimitTx } from '@/components/settings/SpendingLimits/NewSpendingLimit/steps/ReviewSpendingLimit'

const mockData: NewSpendingLimitData = {
  beneficiary: ZERO_ADDRESS,
  tokenAddress: ZERO_ADDRESS,
  amount: '1',
  resetTime: '0',
}

describe('createNewSpendingLimitTx', () => {
  let mockGetEnableModuleTx: any
  let mockSDK: Safe

  beforeEach(() => {
    jest.resetAllMocks()

    mockGetEnableModuleTx = jest.fn(() => ({
      data: {
        data: '0x',
        to: '0x',
      },
    }))

    mockSDK = {
      isModuleEnabled: jest.fn(() => false),
      getEnableModuleTx: mockGetEnableModuleTx,
      createTransaction: jest.fn(() => 'asd'),
    } as unknown as Safe

    jest.spyOn(txSender, 'createMultiSendTx').mockImplementation(jest.fn())
    jest.spyOn(safeCoreSDK, 'getSafeSDK').mockReturnValue(mockSDK)
    jest.spyOn(spendingLimit, 'getSpendingLimitModuleAddress').mockReturnValue(ZERO_ADDRESS)
  })

  it('returns undefined if there is no sdk instance', async () => {
    jest.spyOn(safeCoreSDK, 'getSafeSDK').mockReturnValue(undefined)
    const result = await createNewSpendingLimitTx(mockData, [], '4', 18)

    expect(result).toBeUndefined()
  })

  it('returns undefined if there is no contract address', async () => {
    jest.spyOn(safeCoreSDK, 'getSafeSDK').mockReturnValue(mockSDK)
    jest.spyOn(spendingLimit, 'getSpendingLimitModuleAddress').mockReturnValue(undefined)
    const result = await createNewSpendingLimitTx(mockData, [], '4', 18)

    expect(result).toBeUndefined()
  })

  it('creates a tx to enable the spending limit module if its not registered yet', async () => {
    await createNewSpendingLimitTx(mockData, [], '4', 18)

    expect(mockGetEnableModuleTx).toHaveBeenCalledTimes(1)
  })

  it('creates a tx to add a delegate if beneficiary is not a delegate yet', async () => {
    const spy = jest.spyOn(spendingLimitParams, 'createAddDelegateTx')
    await createNewSpendingLimitTx(mockData, [], '4', 18)

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('does not create a tx to add a delegate if beneficiary is already a delegate', async () => {
    const mockSpendingLimits: SpendingLimitState[] = [
      {
        beneficiary: ZERO_ADDRESS,
        token: '0x10',
        amount: '1',
        resetTimeMin: '0',
        lastResetMin: '0',
        nonce: '0',
        spent: '1',
      },
    ]

    const spy = jest.spyOn(spendingLimitParams, 'createAddDelegateTx')
    await createNewSpendingLimitTx(mockData, mockSpendingLimits, '4', 18)

    expect(spy).not.toHaveBeenCalled()
  })

  it('creates a tx to reset an existing allowance if some of the allowance was already spent', async () => {
    const existingSpendingLimitMock = {
      beneficiary: ZERO_ADDRESS,
      token: '0x10',
      amount: '1',
      resetTimeMin: '0',
      lastResetMin: '0',
      nonce: '0',
      spent: '1',
    }

    const spy = jest.spyOn(spendingLimitParams, 'createResetAllowanceTx')
    await createNewSpendingLimitTx(mockData, [], '4', 18, existingSpendingLimitMock)

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('does not create a tx to reset an existing allowance if none was spent', async () => {
    const existingSpendingLimitMock = {
      beneficiary: ZERO_ADDRESS,
      token: '0x10',
      amount: '1',
      resetTimeMin: '0',
      lastResetMin: '0',
      nonce: '0',
      spent: '0',
    }

    const spy = jest.spyOn(spendingLimitParams, 'createResetAllowanceTx')
    await createNewSpendingLimitTx(mockData, [], '4', 18, existingSpendingLimitMock)

    expect(spy).not.toHaveBeenCalled()
  })

  it('creates a tx to set the allowance', async () => {
    const spy = jest.spyOn(spendingLimitParams, 'createSetAllowanceTx')
    await createNewSpendingLimitTx(mockData, [], '4', 18)

    expect(spy).toHaveBeenCalled()
  })
  it('encodes all txs as a single multiSend tx', async () => {
    const spy = jest.spyOn(txSender, 'createMultiSendTx')
    await createNewSpendingLimitTx(mockData, [], '4', 18)

    expect(spy).toHaveBeenCalled()
  })
})
