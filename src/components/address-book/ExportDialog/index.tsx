import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { useCSVDownloader } from 'react-papaparse'
import { SyntheticEvent, useMemo, type ReactElement } from 'react'

import ModalDialog from '@/components/common/ModalDialog'
import { type AddressBookState, selectAllAddressBooks } from '@/store/addressBookSlice'
import { useAppSelector } from '@/store'
import { trackEvent } from '@/services/analytics/analytics'
import { ADDRESS_BOOK_EVENTS } from '@/services/analytics/events/addressBook'

const COL_1 = 'address'
const COL_2 = 'name'
const COL_3 = 'chainId'

type CsvData = { [COL_1]: string; [COL_2]: string; [COL_3]: string }[]

export const _getCsvData = (addressBooks: AddressBookState): CsvData => {
  const csvData = Object.entries(addressBooks).reduce<CsvData>((acc, [chainId, entries]) => {
    Object.entries(entries).forEach(([address, name]) => {
      acc.push({
        [COL_1]: address,
        [COL_2]: name,
        [COL_3]: chainId,
      })
    })

    return acc
  }, [])

  return csvData
}

const ExportDialog = ({ handleClose }: { handleClose: () => void }): ReactElement => {
  const addressBooks: AddressBookState = useAppSelector(selectAllAddressBooks)
  const length = Object.values(addressBooks).reduce<number>((acc, entries) => acc + Object.keys(entries).length, 0)
  const { CSVDownloader } = useCSVDownloader()
  // safe-address-book-1970-01-01
  const filename = `safe-address-book-${new Date().toISOString().slice(0, 10)}`

  const csvData = useMemo(() => _getCsvData(addressBooks), [addressBooks])

  const onSubmit = (e: SyntheticEvent) => {
    e.preventDefault()

    trackEvent(ADDRESS_BOOK_EVENTS.EXPORT)

    setTimeout(() => {
      handleClose()
    }, 300)
  }

  return (
    <ModalDialog open onClose={handleClose} dialogTitle="Export address book" hideChainIndicator>
      <DialogContent sx={{ p: '24px !important' }}>
        <Typography>
          You&apos;re about to export a CSV file with{' '}
          <b>
            {length} address book {length === 1 ? 'entry' : 'entries'}
          </b>
          .
        </Typography>

        <Typography mt={1}>
          <Link
            href="https://help.gnosis-safe.io/en/articles/5299068-address-book-export-and-import"
            target="_blank"
            rel="noreferrer"
            title="Learn about the address book import and export"
          >
            Learn about the address book import and export
          </Link>
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <CSVDownloader filename={filename} bom config={{ delimiter: ',' }} data={csvData} style={{ order: 2 }}>
          <Button variant="contained" disableElevation onClick={onSubmit}>
            Export
          </Button>
        </CSVDownloader>
      </DialogActions>
    </ModalDialog>
  )
}

export default ExportDialog
