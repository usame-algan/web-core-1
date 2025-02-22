import {
  configureStore,
  combineReducers,
  type ThunkAction,
  type PreloadedState,
  type AnyAction,
} from '@reduxjs/toolkit'
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux'
import { chainsSlice } from './chainsSlice'
import { safeInfoSlice } from './safeInfoSlice'
import { balancesSlice } from './balancesSlice'
import { sessionSlice } from './sessionSlice'
import { txHistorySlice, txHistoryMiddleware } from './txHistorySlice'
import { txQueueSlice, txQueueMiddleware } from './txQueueSlice'
import { addressBookSlice } from './addressBookSlice'
import { notificationsSlice } from './notificationsSlice'
import { getPreloadedState, persistState } from './persistStore'
import { pendingTxsSlice } from './pendingTxsSlice'
import { addedSafesMiddleware, addedSafesSlice } from './addedSafesSlice'
import { settingsSlice } from './settingsSlice'
import { cookiesSlice, cookiesMiddleware } from './cookiesSlice'
import { popupSlice } from './popupSlice'
import { spendingLimitSlice } from '@/store/spendingLimitsSlice'
import { IS_PRODUCTION } from '@/config/constants'
import { createStoreHydrator, HYDRATE_ACTION } from './storeHydrator'

const rootReducer = combineReducers({
  [chainsSlice.name]: chainsSlice.reducer,
  [safeInfoSlice.name]: safeInfoSlice.reducer,
  [balancesSlice.name]: balancesSlice.reducer,
  [sessionSlice.name]: sessionSlice.reducer,
  [txHistorySlice.name]: txHistorySlice.reducer,
  [txQueueSlice.name]: txQueueSlice.reducer,
  [addressBookSlice.name]: addressBookSlice.reducer,
  [notificationsSlice.name]: notificationsSlice.reducer,
  [pendingTxsSlice.name]: pendingTxsSlice.reducer,
  [addedSafesSlice.name]: addedSafesSlice.reducer,
  [settingsSlice.name]: settingsSlice.reducer,
  [cookiesSlice.name]: cookiesSlice.reducer,
  [popupSlice.name]: popupSlice.reducer,
  [spendingLimitSlice.name]: spendingLimitSlice.reducer,
})

const persistedSlices: (keyof PreloadedState<RootState>)[] = [
  sessionSlice.name,
  addressBookSlice.name,
  pendingTxsSlice.name,
  addedSafesSlice.name,
  settingsSlice.name,
  cookiesSlice.name,
]

const middleware = [
  persistState(persistedSlices),
  txHistoryMiddleware,
  txQueueMiddleware,
  addedSafesMiddleware,
  cookiesMiddleware,
]

export const getPersistedState = () => {
  return getPreloadedState(persistedSlices)
}

const hydrationReducer: typeof rootReducer = (state, action) => {
  if (action.type === HYDRATE_ACTION) {
    return {
      ...state,
      ...action.payload,
    }
  }
  return rootReducer(state, action)
}

const makeStore = () => {
  return configureStore({
    reducer: hydrationReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(middleware),
    devTools: !IS_PRODUCTION,
  })
}

export const StoreHydrator = createStoreHydrator(makeStore)

export type AppDispatch = ReturnType<typeof makeStore>['dispatch']
export type RootState = ReturnType<typeof rootReducer>

export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, AnyAction>

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
