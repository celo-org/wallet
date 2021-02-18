import { SendOrigin } from 'src/analytics/types'
import { TokenTransactionType, TransactionFeedFragment } from 'src/apollo/types'
import { ExchangeConfirmationCardProps } from 'src/exchange/ExchangeConfirmationCard'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { NumberToRecipient } from 'src/recipients/recipient'
import { TransactionDataInput } from 'src/send/SendAmount'
import { TransferConfirmationCardProps } from 'src/transactions/TransferConfirmationCard'
import { StandbyTransaction } from 'src/transactions/types'

export enum Actions {
  ADD_STANDBY_TRANSACTION = 'TRANSACTIONS/ADD_STANDBY_TRANSACTION',
  REMOVE_STANDBY_TRANSACTION = 'TRANSACTIONS/REMOVE_STANDBY_TRANSACTION',
  RESET_STANDBY_TRANSACTIONS = 'TRANSACTIONS/RESET_STANDBY_TRANSACTIONS',
  ADD_HASH_TO_STANDBY_TRANSACTIONS = 'TRANSACTIONS/ADD_HASH_TO_STANDBY_TRANSACTIONS',
  TRANSACTION_CONFIRMED = 'TRANSACTIONS/TRANSACTION_CONFIRMED',
  TRANSACTION_FAILED = 'TRANSACTIONS/TRANSACTION_FAILED',
  NEW_TRANSACTIONS_IN_FEED = 'TRANSACTIONS/NEW_TRANSACTIONS_IN_FEED',
  REFRESH_RECENT_TX_RECIPIENTS = 'TRANSACTIONS/REFRESH_RECENT_TX_RECIPIENTS',
  UPDATE_RECENT_TX_RECIPIENT_CACHE = 'TRANSACTIONS/UPDATE_RECENT_TX_RECIPIENT_CACHE',
}

export interface AddStandbyTransactionAction {
  type: Actions.ADD_STANDBY_TRANSACTION
  transaction: StandbyTransaction
}

export interface RemoveStandbyTransactionAction {
  type: Actions.REMOVE_STANDBY_TRANSACTION
  idx: string
}

export interface ResetStandbyTransactionsAction {
  type: Actions.RESET_STANDBY_TRANSACTIONS
}

export interface AddHashToStandbyTransactionAction {
  type: Actions.ADD_HASH_TO_STANDBY_TRANSACTIONS
  idx: string
  hash: string
}

export interface TransactionConfirmedAction {
  type: Actions.TRANSACTION_CONFIRMED
  txId: string
}

export interface TransactionFailedAction {
  type: Actions.TRANSACTION_FAILED
  txId: string
}

export interface NewTransactionsInFeedAction {
  type: Actions.NEW_TRANSACTIONS_IN_FEED
  transactions: TransactionFeedFragment[]
}

export interface UpdatedRecentTxRecipientsCacheAction {
  type: Actions.UPDATE_RECENT_TX_RECIPIENT_CACHE
  recentTxRecipientsCache: NumberToRecipient
}

export type ActionTypes =
  | AddStandbyTransactionAction
  | RemoveStandbyTransactionAction
  | ResetStandbyTransactionsAction
  | AddHashToStandbyTransactionAction
  | NewTransactionsInFeedAction
  | UpdatedRecentTxRecipientsCacheAction

export const addStandbyTransaction = (
  transaction: StandbyTransaction
): AddStandbyTransactionAction => ({
  type: Actions.ADD_STANDBY_TRANSACTION,
  transaction,
})

export const removeStandbyTransaction = (idx: string): RemoveStandbyTransactionAction => ({
  type: Actions.REMOVE_STANDBY_TRANSACTION,
  idx,
})

export const updateRecentTxRecipientsCache = (
  recentTxRecipientsCache: NumberToRecipient
): UpdatedRecentTxRecipientsCacheAction => ({
  type: Actions.UPDATE_RECENT_TX_RECIPIENT_CACHE,
  recentTxRecipientsCache,
})

export const resetStandbyTransactions = (): ResetStandbyTransactionsAction => ({
  type: Actions.RESET_STANDBY_TRANSACTIONS,
})

export const transactionConfirmed = (txId: string): TransactionConfirmedAction => ({
  type: Actions.TRANSACTION_CONFIRMED,
  txId,
})

export const transactionFailed = (txId: string): TransactionFailedAction => ({
  type: Actions.TRANSACTION_FAILED,
  txId,
})

export const addHashToStandbyTransaction = (
  idx: string,
  hash: string
): AddHashToStandbyTransactionAction => ({
  type: Actions.ADD_HASH_TO_STANDBY_TRANSACTIONS,
  idx,
  hash,
})

export const newTransactionsInFeed = (
  transactions: TransactionFeedFragment[]
): NewTransactionsInFeedAction => ({
  type: Actions.NEW_TRANSACTIONS_IN_FEED,
  transactions,
})

export const navigateToPaymentTransferReview = (
  type: TokenTransactionType,
  timestamp: number,
  confirmationProps: TransferConfirmationCardProps
) => {
  navigate(Screens.TransactionReview, {
    reviewProps: {
      type,
      timestamp,
    },
    confirmationProps,
  })
}

export const navigateToExchangeReview = (
  timestamp: number,
  confirmationProps: ExchangeConfirmationCardProps
) => {
  navigate(Screens.TransactionReview, {
    reviewProps: {
      type: TokenTransactionType.Exchange,
      timestamp,
    },
    confirmationProps,
  })
}

export const navigateToRequestedPaymentReview = (transactionData: TransactionDataInput) => {
  navigate(Screens.SendConfirmation, { transactionData, origin: SendOrigin.AppRequestFlow })
}
