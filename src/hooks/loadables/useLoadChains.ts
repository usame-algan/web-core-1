import { useEffect } from 'react'
import { getChainsConfig, type ChainInfo } from '@gnosis.pm/safe-react-gateway-sdk'
import useAsync, { type AsyncResult } from '../useAsync'
import { logError, Errors } from '@/services/exceptions'

const getConfigs = async (): Promise<ChainInfo[]> => {
  const data = await getChainsConfig()
  return data.results || []
}

export const useLoadChains = (): AsyncResult<ChainInfo[]> => {
  const [data, error, loading] = useAsync<ChainInfo[]>(getConfigs, [])

  // Log errors
  useEffect(() => {
    if (error) {
      logError(Errors._904, error.message)
    }
  }, [error])

  return [data, error, loading]
}

export default useLoadChains
