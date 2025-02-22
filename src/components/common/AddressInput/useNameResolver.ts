import { useMemo } from 'react'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import useAsync from '@/hooks/useAsync'
import { isDomain, resolveName } from '@/services/domains'
import useDebounce from '@/hooks/useDebounce'

const useNameResolver = (value?: string): { address: string | undefined; resolving: boolean } => {
  const ethersProvider = useWeb3ReadOnly()
  const debouncedValue = useDebounce((value || '').trim(), 200)

  // Fetch an ENS resolution for the current address
  const [ens, , isResolving] = useAsync<{ name: string; address: string } | undefined>(() => {
    if (!ethersProvider || !debouncedValue || !isDomain(debouncedValue)) return

    return resolveName(ethersProvider, debouncedValue).then((address) =>
      address ? { name: debouncedValue, address } : undefined,
    )
  }, [debouncedValue, ethersProvider])

  const resolving = isResolving && !!ethersProvider && !!debouncedValue
  const address = ens && ens.name === value ? ens.address : undefined

  return useMemo(
    () => ({
      resolving,
      address,
    }),
    [resolving, address],
  )
}

export default useNameResolver
