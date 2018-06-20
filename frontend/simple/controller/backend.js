/* global fetch */
'use strict'

import sbp from '../../../shared/sbp.js'
import {sign} from '../../../shared/functions.js'
import {GIMessage} from '../../../shared/events.js'
import {RESPONSE_TYPE} from '../../../shared/constants.js'
import pubsub from 'utils/pubsub.js'
import {handleFetchResult} from 'utils/misc.js'

// temporary identity for signing
const nacl = require('tweetnacl')
var buf2b64 = buf => Buffer.from(buf).toString('base64')
var persona = nacl.sign.keyPair()
var signature = signJSON('', persona)

function signJSON (json, keypair) {
  return sign({
    publicKey: buf2b64(keypair.publicKey),
    secretKey: buf2b64(keypair.secretKey)
  }, json)
}

var subscriptions = []
var primus

export function createWebSocket (url, options) {
  return new Promise((resolve, reject) => {
    primus = pubsub({
      url,
      options,
      handlers: {
        open: () => {
          console.log('websocket connection opened!')
          resolve(primus)
        },
        error: err => {
          console.log('websocket error:', err.message, err)
          reject(err)
        },
        data: msg => {
          console.log('websocket message:', msg)
          if (!msg.data) throw new Error('malformed message: ' + JSON.stringify(msg))
          switch (msg.type) {
            case RESPONSE_TYPE.ENTRY:
              // calling dispatch via SBP makes it simple to implement 'test/backend.js'
              sbp('state/vuex/dispatch', 'handleEvent', GIMessage.fromResponse(msg.data))
              break
            default:
              console.log('SOCKET UNHANDLED EVENT!', msg) // TODO: this
          }
        }
      }
      // TODO: handle going offline event
    })
    primus.on('reconnected', () => {
      console.log('websocket connection re-established. re-joining:', subscriptions)
      subscriptions.forEach(contractID => primus.sub(contractID))
    })
  })
}

// Keep pubsub in sync (logged into the right "rooms") with store.state.contracts
sbp('okTurtles.events/on', 'contractsModified', async ({data}) => {
  var contractID = data.add || data.remove
  var idx = subscriptions.indexOf(contractID)
  var method = data.add ? 'sub' : 'unsub'
  if ((data.add && idx > -1) || (data.remove && idx === -1)) {
    return // if already subscribed or already unsubscribed
  }
  if (data.add) {
    subscriptions.push(contractID)
  } else {
    subscriptions.splice(idx, 1)
  }
  var res = await primus[method](contractID)
  console.log(`[Backend] ${method}scribed ${contractID}:`, res)
})

sbp('sbp/selectors/register', {
  'backend/publishLogEntry': (entry: GIMessage) => {
    return fetch(`${process.env.API_URL}/event`, {
      method: 'POST',
      body: entry.serialize(),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `gi ${signature}`
      }
    }).then(handleFetchResult('json'))
  },
  // TODO: r.body is a stream.Transform, should we use a callback to process
  //       the events one-by-one instead of converting to giant json object?
  //       however, note if we do that they would be processed in reverse...
  'backend/eventsSince': async (contractID: string, since: string) => {
    var events = await fetch(`${process.env.API_URL}/events/${contractID}/${since}`)
      .then(handleFetchResult('json'))
    return events.reverse()
  },
  'backend/latestHash': (contractID: string) => {
    return fetch(`${process.env.API_URL}/latestHash/${contractID}`)
      .then(handleFetchResult('json'))
  }
})
