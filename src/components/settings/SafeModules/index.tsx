import EthHashInfo from '@/components/common/EthHashInfo'
import useSafeInfo from '@/hooks/useSafeInfo'
import { Paper, Grid, Typography, Box, Link } from '@mui/material'

import css from './styles.module.css'
import { RemoveModule } from '@/components/settings/SafeModules/RemoveModule'
import useIsGranted from '@/hooks/useIsGranted'

const NoModules = () => {
  return (
    <Typography mt={2} color={(theme) => theme.palette.secondary.light}>
      No modules enabled
    </Typography>
  )
}

const ModuleDisplay = ({ moduleAddress, chainId }: { moduleAddress: string; chainId: string }) => {
  const isGranted = useIsGranted()

  return (
    <Box className={css.container}>
      <EthHashInfo
        shortAddress={false}
        address={moduleAddress}
        showCopyButton
        chainId={chainId}
        showAvatar={false}
        hasExplorer
      />
      {isGranted && <RemoveModule address={moduleAddress} />}
    </Box>
  )
}

const SafeModules = () => {
  const { safe } = useSafeInfo()
  const safeModules = safe.modules || []

  return (
    <Paper sx={{ padding: 4 }} variant="outlined">
      <Grid container direction="row" justifyContent="space-between" spacing={3}>
        <Grid item lg={4} xs={12}>
          <Typography variant="h4" fontWeight={700}>
            Safe modules
          </Typography>
        </Grid>

        <Grid item xs>
          <Box>
            <Typography>
              Modules allow you to customize the access-control logic of your Safe. Modules are potentially risky, so
              make sure to only use modules from trusted sources. Learn more about modules{' '}
              <Link href="https://docs.gnosis-safe.io/contracts/modules-1" rel="noreferrer noopener" target="_blank">
                here
              </Link>
            </Typography>
            {safeModules.length === 0 ? (
              <NoModules />
            ) : (
              safeModules.map((module) => (
                <ModuleDisplay key={module.value} chainId={safe.chainId} moduleAddress={module.value} />
              ))
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  )
}

export default SafeModules
