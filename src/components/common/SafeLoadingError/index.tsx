import type { ReactElement, ReactNode } from 'react'
import { Button } from '@mui/material'
import useSafeInfo from '@/hooks/useSafeInfo'
import PagePlaceholder from '../PagePlaceholder'
import { AppRoutes } from '@/config/routes'

const SafeLoadingError = ({ children }: { children: ReactNode }): ReactElement => {
  const { safeError } = useSafeInfo()

  if (!safeError) return <>{children}</>

  return (
    <PagePlaceholder imageUrl="/images/error.png" text="This Safe couldn't be loaded">
      <Button variant="contained" color="primary" size="large" href={AppRoutes.welcome}>
        Go to the main page
      </Button>
    </PagePlaceholder>
  )
}

export default SafeLoadingError
