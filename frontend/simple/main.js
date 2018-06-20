import sbp from '../../shared/sbp.js'
import '../../shared/domains/okTurtles/events.js'
import '../../shared/domains/okTurtles/data.js'
import './controller/namespace.js'
import {createWebSocket} from './controller/backend.js'
// import SBP stuff before anything else so that domains register themselves before called
import Vue from 'vue'
import './views/utils/translations.js'
import './views/utils/transitions.js'
import router from './controller/router.js'
import * as db from './model/database.js'
import NavBar from './views/containers/NavBar.vue'
import store from './model/state.js'

console.log('NODE_ENV:', process.env.NODE_ENV)

// NOTE: we setup this global SBP filter and domain regs here
//       to get logging for all subsequent SBP calls.
//       In the future we might move it elsewhere.
if (process.env.NODE_ENV !== 'production') {
  sbp('sbp/filters/global/add', (domain, selector, data) => {
    console.log(`[sbp] CALL: ${selector}:`, data)
  })
}

async function startApp () {
  // TODO: handle any socket errors?
  createWebSocket(process.env.API_URL, {
    // TODO: verify these are good defaults
    timeout: 3000,
    strategy: ['disconnect', 'online', 'timeout']
  })

  let user = await db.loadCurrentUser()
  if (user) {
    try {
      let identityContractId = await sbp('namespace/lookup', user)
      await store.dispatch('login', {name: user, identityContractId})
    } catch (err) {
      console.log('lookup failed!')
      store.dispatch('logout')
      if (err.status === 404) {
        console.warn(`It looks like the local user does not exist anymore on the server 😱 If this is unexpected, contact us at https://gitter.im/okTurtles/group-income`)
        db.clearUser(user)
      }
    }
  }
  /* eslint-disable no-new */
  new Vue({
    router: router,
    components: {NavBar},
    store // make this and all child components aware of the new store
  }).$mount('#app')
  sbp('okTurtles.events/on', 'logout', () => router.push({path: '/'}))
}

startApp()
