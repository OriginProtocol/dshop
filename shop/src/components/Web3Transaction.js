import React, { useReducer, useEffect } from 'react'
import omit from 'lodash/omit'
import pick from 'lodash/pick'
import uniq from 'lodash/uniq'
import fbt, { FbtParam, FbtPlural } from 'fbt'
import useConfig from 'utils/useConfig'
import useWallet from 'utils/useWallet'

import Modal from 'components/Modal'
import { Spinner } from 'components/icons/Admin'

const reducer = (state, newState) => {
  if (newState.reset) return omit(newState, 'reset')
  return { ...state, ...newState }
}

const Web3Transaction = ({
  shouldSubmit,
  execTx,
  awaitTx,
  onSuccess,
  onReset,
  account,
  dependencies
}) => {
  const { config } = useConfig()
  const [state, setState] = useReducer(reducer, {})
  const { status, signerStatus, signer, ...wallet } = useWallet()
  const isDisabled = status === 'disabled' || signerStatus === 'disabled'

  useEffect(() => {
    if (shouldSubmit) {
      setState({ submit: true })
    } else {
      setState({
        reset: true,
        ...pick(state, ['signerAddress', 'dependenciesOk'])
      })
    }
  }, [shouldSubmit])

  useEffect(() => {
    let isSubscribed = true
    async function doCreate() {
      if (isDisabled) {
        setState({
          modal: true,
          title: fbt(
            'Please enable your Web3 wallet',
            'component.Web3Transaction.enableWallet'
          ),
          spinner: true
        })

        const result = await wallet.enable()
        if (!isSubscribed) return
        if (!result) {
          setState({
            title: fbt(
              'You denied access to your Web3 wallet',
              'component.Web3Transaction.accessDenied'
            ),
            spinner: false
          })
        } else {
          setState({ submit: 'checkNetwork' })
        }
        return
      }

      if (!wallet.networkOk) {
        setState({
          modal: true,
          title: fbt(
            `Incorrect Network`,
            'component.Web3Transaction.incorrectNetwork'
          ),
          description: (
            <fbt desc="component.Web3Transaction.switchNetwork">
              Please switch your Web3 wallet to{' '}
              <FbtParam name="networkName">{config.netName}</FbtParam> to
              continue. If your wallet is already set to{' '}
              <FbtParam name="networkName2">{config.netName}</FbtParam>, please
              refresh the page and try again.
            </fbt>
          ),
          spinner: true
        })
        return
      }

      if (account) {
        const accounts = uniq(
          Array.isArray(account) ? account : [account]
        ).filter((a) => a)

        if (!accounts.some((a) => a === state.signerAddress)) {
          setState({
            modal: true,
            title: fbt(
              'Incorrect account',
              'component.Web3Transaction.incorrectAccount'
            ),
            description: (
              <fbt desc="compoent.Web3Transaction.switchAccount">
                Please set account to
                <FbtPlural
                  count={accounts.length}
                  name="validAccounts"
                  many="one of"
                >{` `}</FbtPlural>
                {` `}
                <FbtParam name="accounts">{accounts.join(', ')}</FbtParam>
              </fbt>
            ),

            spinner: false
          })
          return
        }
      }

      if (dependencies && dependencies.length && !state.dependenciesOk) {
        setState({
          modal: true,
          title: `${fbt('Loading', 'Loading')}...`,
          spinner: false
        })
        return
      }

      setState({
        modal: true,
        title: `${fbt(
          'Please approve the transaction',
          'component.Web3Transaction.approveTx'
        )}...`,
        description: '',
        spinner: true
      })

      try {
        const tx = await execTx({ config, signer })
        setState({
          modal: true,
          title: `${fbt(
            'Submitted to blockchain',
            'component.Web3Transaction.submitted'
          )}...`,
          description: fbt(
            'You can continue to monitor this transaction in your wallet',
            'component.Web3Transaction.monitorTx'
          ),
          spinner: true
        })

        const result = await awaitTx(tx)
        onSuccess(result)
        setState({ shouldClose: true })
      } catch (err) {
        console.error(err)
        if (!isSubscribed) return
        setState({
          modal: true,
          title: fbt('Error', 'Error'),
          description: err.message,
          spinner: false
        })
      }
    }
    if (state.submit) {
      doCreate()
    }
    return () => (isSubscribed = false)
  }, [
    state.submit,
    state.signerAddress,
    wallet.networkOk,
    state.dependenciesOk
  ])

  useEffect(() => {
    if (signer) {
      signer.getAddress().then((signerAddress) => setState({ signerAddress }))
    }
  }, [signer])

  useEffect(() => {
    if (dependencies && dependencies.length) {
      const dependenciesOk = dependencies.filter((d) => d).length ? true : false
      setState({ dependenciesOk })
    }
  }, [dependencies])

  if (!state.modal) {
    return null
  }

  return (
    <Modal onClose={onReset} shouldClose={state.shouldClose}>
      <div className="modal-body text-center p-5">
        <div className="text-lg">{state.title}</div>
        {!state.spinner ? null : (
          <div className="mt-4">
            <Spinner />
          </div>
        )}
        {!state.description ? null : (
          <div className="mt-3">{state.description}</div>
        )}
        <div className="actions">
          <button
            className="btn btn-outline-primary px-4"
            type="button"
            onClick={() => setState({ shouldClose: true })}
            children="Hide"
          />
        </div>
      </div>
    </Modal>
  )
}

export default Web3Transaction
