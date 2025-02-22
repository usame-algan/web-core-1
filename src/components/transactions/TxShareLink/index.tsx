import { ReactElement, MouseEvent } from 'react'
import { IconButton, Link } from '@mui/material'
import ShareIcon from '@/public/images/share.svg'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'
import Track from '@/components/common/Track'
import { TX_LIST_EVENTS } from '@/services/analytics/events/txList'

const TxShareLink = ({ id }: { id: string }): ReactElement => {
  const router = useRouter()
  const { safe = '' } = router.query
  const href = AppRoutes.safe.transactions.tx.replace('/safe/', `/${safe}/`).replace(/$/, `?id=${id}`)

  const onClick = (e: MouseEvent) => {
    if (!e.ctrlKey && !e.metaKey) {
      e.preventDefault()
    }

    // copy href to clipboard
    navigator.clipboard.writeText(location.origin + href)
  }

  return (
    <Track {...TX_LIST_EVENTS.COPY_DEEPLINK}>
      <IconButton component={Link} aria-label="Share" href={href} onClick={onClick}>
        <ShareIcon width={16} height={16} />
      </IconButton>
    </Track>
  )
}

export default TxShareLink
