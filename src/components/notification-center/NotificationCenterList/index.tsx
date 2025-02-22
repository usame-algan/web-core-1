import type { ReactElement } from 'react'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import Box from '@mui/material/Box'

import { NotificationState } from '@/store/notificationsSlice'
import NotificationCenterItem from '@/components/notification-center/NotificationCenterItem'
import Bell from '@/public/images/bell.svg'

import css from './styles.module.css'

type NotificationCenterListProps = {
  notifications: NotificationState
  handleClose: () => void
}

const NotificationCenterList = ({ notifications, handleClose }: NotificationCenterListProps): ReactElement => {
  if (!notifications.length) {
    return (
      <div className={css.wrapper}>
        <Bell alt="No notifications" />
        <Typography paddingTop="8px">No notifications</Typography>
      </div>
    )
  }

  return (
    <Box className={css.scrollContainer}>
      <List sx={{ p: 0 }}>
        {notifications.map((notification) => (
          <NotificationCenterItem key={notification.id} {...notification} handleClose={handleClose} />
        ))}
      </List>
    </Box>
  )
}

export default NotificationCenterList
