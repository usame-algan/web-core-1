import React, { ReactElement, useState } from 'react'
import { Link } from '@mui/material'
import { generateDataRowValue, TxDataRow } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import { isMultisigExecutionDetails } from '@/utils/transaction-guards'
import { Operation, TransactionDetails } from '@gnosis.pm/safe-react-gateway-sdk'
import { dateString } from '@/utils/formatters'
import css from './styles.module.css'

interface Props {
  txDetails: TransactionDetails
  defaultExpanded?: boolean
}

const Summary = ({ txDetails, defaultExpanded = false }: Props): ReactElement => {
  const [expanded, setExpanded] = useState<boolean>(defaultExpanded)

  const toggleExpanded = () => {
    setExpanded((val) => !val)
  }

  const { txHash, detailedExecutionInfo, executedAt, txData } = txDetails

  let submittedAt, confirmations, safeTxHash, baseGas, gasPrice, gasToken, refundReceiver, safeTxGas
  if (isMultisigExecutionDetails(detailedExecutionInfo)) {
    ;({ submittedAt, confirmations, safeTxHash, baseGas, gasPrice, gasToken, safeTxGas } = detailedExecutionInfo)
    refundReceiver = detailedExecutionInfo.refundReceiver?.value
  }

  return (
    <>
      <TxDataRow title="Transaction hash:">{generateDataRowValue(txHash, 'hash', true)}</TxDataRow>
      <TxDataRow title="safeTxHash:">{generateDataRowValue(safeTxHash, 'hash')}</TxDataRow>
      <TxDataRow title="Created:">{submittedAt ? dateString(submittedAt) : null}</TxDataRow>
      {executedAt && <TxDataRow title="Executed:">{dateString(executedAt)}</TxDataRow>}

      {/* Advanced TxData */}
      {txData && (
        <>
          {!defaultExpanded && (
            <Link className={css.buttonExpand} onClick={toggleExpanded} component="button" variant="body1">
              Advanced details
            </Link>
          )}

          <div className={`${css.collapsibleSection}${expanded ? 'Expanded' : ''}`}>
            <TxDataRow title="Operation:">
              {`${txData.operation} (${Operation[txData.operation].toLowerCase()})`}
            </TxDataRow>
            <TxDataRow title="safeTxGas:">{safeTxGas}</TxDataRow>
            <TxDataRow title="baseGas:">{baseGas}</TxDataRow>
            <TxDataRow title="gasPrice:">{gasPrice}</TxDataRow>
            <TxDataRow title="gasToken:">{generateDataRowValue(gasToken, 'hash', true)}</TxDataRow>
            <TxDataRow title="refundReceiver:">{generateDataRowValue(refundReceiver, 'hash', true)}</TxDataRow>
            {confirmations?.map(({ signature }, index) => (
              <TxDataRow title={`Signature ${index + 1}:`} key={`signature-${index}:`}>
                {generateDataRowValue(signature, 'rawData')}
              </TxDataRow>
            ))}
            <TxDataRow title="Raw data:">{generateDataRowValue(txData.hexData, 'rawData')}</TxDataRow>
          </div>
        </>
      )}
    </>
  )
}

export default Summary
