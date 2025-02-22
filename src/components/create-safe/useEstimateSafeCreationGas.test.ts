import { renderHook } from '@/tests/test-utils'
import { useEstimateSafeCreationGas } from '@/components/create-safe/useEstimateSafeCreationGas'
import { EMPTY_DATA, ZERO_ADDRESS } from '@gnosis.pm/safe-core-sdk/dist/src/utils/constants'
import { type ConnectedWallet } from '@/hooks/wallets/useOnboard'
import * as chainIdModule from '@/hooks/useChainId'
import * as store from '@/store'
import * as safeContracts from '@/services/contracts/safeContracts'
import * as sender from './sender'
import * as wallet from '@/hooks/wallets/useWallet'
import * as web3 from '@/hooks/wallets/web3'
import { waitFor } from '@testing-library/react'
import { type EIP1193Provider } from '@web3-onboard/core'
import { JsonRpcProvider } from '@ethersproject/providers'
import { BigNumber } from 'ethers'
import { Proxy_factory } from '@/types/contracts/Proxy_factory'

const mockProps = {
  owners: [],
  threshold: 1,
  saltNonce: 1,
}

describe('useEstimateSafeCreationGas', () => {
  beforeEach(() => {
    jest.resetAllMocks()

    jest.spyOn(store, 'useAppSelector').mockReturnValue({})
    jest.spyOn(chainIdModule, 'useChainId').mockReturnValue('4')
    jest
      .spyOn(safeContracts, 'getProxyFactoryContractInstance')
      .mockReturnValue({ address: ZERO_ADDRESS } as unknown as Proxy_factory)
    jest.spyOn(sender, 'getSafeCreationTx').mockReturnValue(EMPTY_DATA)
    jest.spyOn(wallet, 'default').mockReturnValue({} as ConnectedWallet)
  })

  it('should return no gasLimit by default', () => {
    const { result } = renderHook(() => useEstimateSafeCreationGas(mockProps))
    expect(result.current.gasLimit).toBeUndefined()
    expect(result.current.gasLimitLoading).toBe(false)
  })

  it('should estimate gas', async () => {
    const mockProvider = new JsonRpcProvider()
    mockProvider.estimateGas = jest.fn(() => {
      return Promise.resolve(BigNumber.from('123'))
    })
    jest.spyOn(web3, 'useWeb3ReadOnly').mockReturnValue(mockProvider)
    jest.spyOn(sender, 'getSafeCreationTx').mockReturnValue(EMPTY_DATA)
    jest.spyOn(wallet, 'default').mockReturnValue({
      label: 'MetaMask',
      chainId: '4',
      address: ZERO_ADDRESS,
      provider: null as unknown as EIP1193Provider,
    })

    const { result } = renderHook(() => useEstimateSafeCreationGas(mockProps))

    await waitFor(() => {
      expect(result.current.gasLimit).toStrictEqual(BigNumber.from('123'))
      expect(result.current.gasLimitLoading).toBe(false)
    })
  })

  it('should not estimate gas if there is no wallet connected', async () => {
    jest.spyOn(wallet, 'default').mockReturnValue(null)
    const { result } = renderHook(() => useEstimateSafeCreationGas(mockProps))

    await waitFor(() => {
      expect(result.current.gasLimit).toBeUndefined()
      expect(result.current.gasLimitLoading).toBe(false)
    })
  })

  it('should not estimate gas if there is no encoded data', async () => {
    jest.spyOn(sender, 'getSafeCreationTx').mockReturnValue(undefined)
    const { result } = renderHook(() => useEstimateSafeCreationGas(mockProps))

    await waitFor(() => {
      expect(result.current.gasLimit).toBeUndefined()
      expect(result.current.gasLimitLoading).toBe(false)
    })
  })

  it('should not estimate gas if there is no provider', async () => {
    jest.spyOn(web3, 'useWeb3ReadOnly').mockReturnValue(undefined)
    const { result } = renderHook(() => useEstimateSafeCreationGas(mockProps))

    await waitFor(() => {
      expect(result.current.gasLimit).toBeUndefined()
      expect(result.current.gasLimitLoading).toBe(false)
    })
  })
})
