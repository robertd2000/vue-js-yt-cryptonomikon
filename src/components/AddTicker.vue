<template>
  <section>
    <div class="flex">
      <div class="max-w-xs">
        <label for="wallet" class="block text-sm font-medium text-gray-700"
          >Тикер
        </label>
        <div class="mt-1 relative rounded-md shadow-md">
          <input
            v-model="ticker"
            v-on:keydown.enter="add"
            @change="validation"
            type="text"
            name="wallet"
            id="wallet"
            class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
            placeholder="Например DOGE"
          />
        </div>
        <div class="flex bg-white shadow-md p-1 rounded-md shadow-md flex-wrap">
          <span
            v-for="coin in validation().slice(0, 4)"
            :key="coin"
            @click="chooseTicker(coin)"
            class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-300 text-gray-800 cursor-pointer"
          >
            {{ coin }}
          </span>
        </div>
        <div v-if="tickerAdded" class="text-sm text-red-600">
          Такой тикер уже добавлен
        </div>
      </div>
    </div>
    <add-button @click="add" :disabled="disabled" />
  </section>
</template>

<script>
import AddButton from './AddButton';

//
export default {
  components: {
    AddButton,
  },

  data() {
    return {
      ticker: '',
    };
  },

  props: {
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    coins: {
      type: Array,
      required: true,
    },
    tickerAdded: {
      type: Boolean,
      required: true,
      default: false,
    },
  },

  emits: {
    'add-ticker': (value) => typeof value === 'string' && value.length > 0,
  },

  methods: {
    add() {
      if (this.ticker.length === 0) return;
      this.$emit('add-ticker', this.ticker);
      this.ticker = '';
    },

    chooseTicker(coin) {
      this.ticker = coin;
      this.add();
    },

    validation() {
      return (this.currentCoins = this.coins.filter((coin) =>
        coin.includes(this.ticker.toUpperCase())
      ));
    },
  },
};
</script>
