import { MouseEvent, type ReactElement, useState } from 'react'
import IconButton from '@mui/material/IconButton'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemText from '@mui/material/ListItemText'

import useAddressBook from '@/hooks/useAddressBook'
import EntryDialog from '@/components/address-book/EntryDialog'

// TODO: We should abstract the context menu in order not to import it like this
import css from '@/components/sidebar/SafeListContextMenu/styles.module.css'
import TokenTransferModal from '@/components/tx/modals/TokenTransferModal'
import { Transfer, TransferDirection } from '@gnosis.pm/safe-react-gateway-sdk'
import { ZERO_ADDRESS } from '@gnosis.pm/safe-core-sdk/dist/src/utils/constants'
import { formatEther } from '@ethersproject/units'
import { formatUnits } from 'ethers/lib/utils'
import { isERC20Transfer, isNativeTokenTransfer } from '@/utils/transaction-guards'
import useIsGranted from '@/hooks/useIsGranted'
import { TX_LIST_EVENTS } from '@/services/analytics/events/txList'
import { trackEvent } from '@/services/analytics/analytics'

enum ModalType {
  SEND_AGAIN = 'SEND_AGAIN',
  ADD_TO_AB = 'ADD_TO_AB',
}

const defaultOpen = { [ModalType.SEND_AGAIN]: false, [ModalType.ADD_TO_AB]: false }

const TransferActions = ({ address, txInfo }: { address: string; txInfo: Transfer }): ReactElement => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | undefined>()
  const [open, setOpen] = useState<typeof defaultOpen>(defaultOpen)
  const isGranted = useIsGranted()
  const addressBook = useAddressBook()
  const name = addressBook?.[address]

  const handleOpenContextMenu = (e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => {
    setAnchorEl(e.currentTarget)
  }

  const handleCloseContextMenu = () => {
    setAnchorEl(undefined)
  }

  const handleOpenModal =
    (type: keyof typeof open, event?: typeof TX_LIST_EVENTS.ADDRESS_BOOK, label?: string) => () => {
      handleCloseContextMenu()
      setOpen((prev) => ({ ...prev, [type]: true }))

      if (event) {
        trackEvent({
          ...event,
          label,
        })
      }
    }

  const handleCloseModal = () => {
    setOpen(defaultOpen)
  }

  const recipient = txInfo.recipient.value
  const tokenAddress = isNativeTokenTransfer(txInfo.transferInfo) ? ZERO_ADDRESS : txInfo.transferInfo.tokenAddress

  const amount = isNativeTokenTransfer(txInfo.transferInfo)
    ? formatEther(txInfo.transferInfo.value)
    : isERC20Transfer(txInfo.transferInfo)
    ? formatUnits(txInfo.transferInfo.value, txInfo.transferInfo.decimals)
    : undefined

  const isOutgoingTx = txInfo.direction.toUpperCase() === TransferDirection.OUTGOING
  const canSendAgain =
    isOutgoingTx && (isNativeTokenTransfer(txInfo.transferInfo) || isERC20Transfer(txInfo.transferInfo))

  return (
    <>
      <IconButton edge="end" size="small" onClick={handleOpenContextMenu} sx={{ ml: '4px' }}>
        <MoreHorizIcon sx={({ palette }) => ({ color: palette.border.main })} fontSize="small" />
      </IconButton>
      <Menu
        className={css.menu}
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={handleCloseContextMenu}
        sx={({ palette }) => ({
          '.MuiMenuItem-root:hover': {
            backgroundColor: palette.primary.background,
          },
        })}
      >
        {canSendAgain && (
          <MenuItem onClick={handleOpenModal(ModalType.SEND_AGAIN, TX_LIST_EVENTS.SEND_AGAIN)} disabled={!isGranted}>
            <ListItemText>Send again</ListItemText>
          </MenuItem>
        )}

        <MenuItem onClick={handleOpenModal(ModalType.ADD_TO_AB, TX_LIST_EVENTS.ADDRESS_BOOK, 'Add')}>
          <ListItemText>Add to address book</ListItemText>
        </MenuItem>
      </Menu>

      {open[ModalType.SEND_AGAIN] && (
        <TokenTransferModal onClose={handleCloseModal} initialData={[{ recipient, tokenAddress, amount }]} />
      )}

      {open[ModalType.ADD_TO_AB] && (
        <EntryDialog handleClose={handleCloseModal} defaultValues={{ name, address }} disableAddressInput />
      )}
    </>
  )
}

export default TransferActions
