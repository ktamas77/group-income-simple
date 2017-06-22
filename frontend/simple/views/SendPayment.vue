<template xmlns="http://www.w3.org/1999/html">
  <section class="section">
    <!-- main containers:
     .container  http://bulma.io/documentation/layout/container/
     .content    http://bulma.io/documentation/elements/content/
     .section    http://bulma.io/documentation/layout/section/
     .block      base/classes.sass (just adds 20px margin-bottom except for last)
    -->
    <div class="container">
      <form novalidate ref="form"
            name="formSend" class="container signup"
            @submit.prevent="submit"
      >
        <div class="box centered" style="max-width:400px">
          <p>
            Amount:
            <input id="amount" class="input" type="number" name="amount" placeholder="0.00" required/>
          </p>
          <p>
            Memo:
            <input id="memo" class="input" name="memo" placeholder="memo" required/>
          </p>
          <div class="level-right">
            <div class="level-item is-narrow">
              <button class="button submit is-success" type="submit">
                <i18n>Send Payment</i18n>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  </section>
</template>
<script>
  export default {
    name: 'SendPayment',
    data () {
      return {
        // note: changing this line won't causes changes
        // with hot-reload because the reloaded component
        // preserves its current state and we are modifying
        // its initial state.
        msg: 'Send Payment'
      }
    },
    methods: {
      submit () {
        console.log('send')
      }
    },
    mounted () {
//      const PluginHuman = require('ilp-plugin-human')
//
//      const plugin = new PluginHuman({
//        account: 'groupincome',
//        prefix: 'human.',
//        info: {
//          currencyCode: 'USD',
//          currencySymbol: '$',
//          precision: '15,',
//          scale: '2',
//          connectors: []
//        }
//      })
    }
  }
</script>
