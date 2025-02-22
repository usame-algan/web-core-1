import { HexEncodedData } from '@/components/transactions/HexEncodedData'
import { MethodDetails } from '@/components/transactions/TxDetails/TxData/DecodedData/MethodDetails'
import MultisendTxsDecoded from '@/components/transactions/TxDetails/TxData/DecodedData/Multisend/MultisendTxsDecoded'
import { useCurrentChain } from '@/hooks/useChains'
import { toWei } from '@/utils/formatters'
import { TransactionData } from '@gnosis.pm/safe-react-gateway-sdk'
import { ReactElement } from 'react'

type MultisendProps = {
  txData?: TransactionData
}

export const Multisend = ({ txData }: MultisendProps): ReactElement | null => {
  const chain = useCurrentChain()

  if (!txData) return null

  // ? when can a multiSend call take no parameters?
  if (!txData.dataDecoded?.parameters) {
    if (txData.hexData) {
      return <HexEncodedData title="Data (hex encoded)" hexData={txData.hexData} />
    }
    return null
  }

  // multiSend method receives one parameter `transactions`
  return (
    <>
      {txData.dataDecoded?.parameters[0].valueDecoded?.map(({ dataDecoded, data, value, to, operation }, index) => {
        const actionTitle = `Action ${index + 1}`
        const method = dataDecoded?.method || ''
        const { decimals, symbol } = chain!.nativeCurrency
        const amount = value ? toWei(value, decimals) : 0

        let details
        if (dataDecoded) {
          details = <MethodDetails data={dataDecoded} />
        } else if (data) {
          // If data is not decoded in the backend response
          details = <HexEncodedData title="Data (hex encoded)" hexData={data} />
        }

        const addressInfo = txData.addressInfoIndex?.[to]
        const name = addressInfo?.name
        const avatarUrl = addressInfo?.logoUri

        const title = `Interact with${Number(amount) !== 0 ? ` (and send ${amount} ${symbol} to)` : ''}:`
        return (
          <MultisendTxsDecoded
            key={`${data ?? to}-${index}`}
            actionTitle={actionTitle}
            method={method}
            txDetails={{ title, address: to, dataDecoded, name, avatarUrl, operation }}
          >
            {details}
          </MultisendTxsDecoded>
        )
      })}
    </>
  )
}

export default Multisend
