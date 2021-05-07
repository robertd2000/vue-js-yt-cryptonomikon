<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
    <div class="container">
      <template v-if="tickers.length > 0">
        <hr class="w-full border-t border-gray-600 my-4" />
        <add-ticker
          @add-ticker="add"
          :coins="coins"
          :tickerAdded="tickerAdded"
          :disabled="tooManyTickersAdded"
        />
        <div>
          Фильтер:
          <button
            v-if="page > 1"
            @click="page = page - 1"
            class="my-4 mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Назад
          </button>
          <button
            @click="page = page + 1"
            v-if="hasNextPage"
            class="my-4 mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Вперед</button
          ><input v-model="filter" @input="page = 1" type="text" />
        </div>
        <hr class="w-full border-t border-gray-600 my-4" />
        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div
            v-for="t in paginatedTickers"
            :key="t.name"
            @click="select(t)"
            :class="{
              'border-4': selectedTicker === t,
            }"
            class="bg-white overflow-hidden shadow rounded-lg border-purple-800 border-solid cursor-pointer"
          >
            <div
              :class="{
                'bg-red-100':
                  t.price === 'INVALID_SUB' || t.price === undefined,
              }"
              class="px-4 py-5 sm:p-6 text-center"
            >
              <dt class="text-sm font-medium text-gray-500 truncate">
                {{ t.name }} - USD
              </dt>
              <dd class="mt-1 text-3xl font-semibold text-gray-900">
                {{
                  t.price === 'INVALID_SUB' || t.price === undefined
                    ? '-'
                    : formatPrice(t.price)
                }}
              </dd>
            </div>
            <div class="w-full border-t border-gray-200"></div>
            <button
              @click.stop="handleDelete(t)"
              class="flex items-center justify-center font-medium w-full bg-gray-100 px-4 py-4 sm:px-6 text-md text-gray-500 hover:text-gray-600 hover:bg-gray-200 hover:opacity-20 transition-all focus:outline-none"
            >
              <svg
                class="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="#718096"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                ></path></svg
              >Удалить
            </button>
          </div>
        </dl>
        <hr class="w-full border-t border-gray-600 my-4" />
      </template>
      <graph-template
        :graph="graph"
        :selectedTicker="selectedTicker"
        @delete-graph="deleteGraph"
      />
    </div>
  </div>
</template>

<script>
import { subscribeToTickers, unsubscribeToTickers } from './api';
import AddTicker from './components/AddTicker';
import GraphTemplate from './components/GraphTemplate';

export default {
  name: 'App',

  data() {
    return {
      ticker: '',
      tickers: [],
      selectedTicker: null,
      graph: [],
      coins: [],
      currentCoins: [],
      tickerAdded: false,
      page: 1,
      filter: '',
      maxGraphElements: 1,
    };
  },

  components: {
    AddTicker,
    GraphTemplate,
  },

  created: async function() {
    const windowData = Object.fromEntries(
      new URL(window.location).searchParams.entries()
    );

    if (windowData.filter) {
      this.filter = windowData.filter;
    }

    if (windowData.page) {
      this.page = windowData.page;
    }
    const tickersData = localStorage.getItem('crypto');

    if (tickersData) {
      this.tickers = JSON.parse(tickersData);
      this.tickers.forEach((ticker) => {
        subscribeToTickers(ticker.name, (newPrice) => {
          if (!newPrice) {
            console.log(newPrice);
            // subscribeToTickers(ticker.name, 'BTC', (newPrice) => {
            //   console.log(newPrice);
            //   return;
            // });
          }
          return this.updateTicker(ticker.name, newPrice);
        });
        // console.log(this.tickers);
      });
    }
    setInterval(this.updateTickers, 5000);

    const response = await fetch(
      `https://min-api.cryptocompare.com/data/all/coinlist?summary=true`
    );
    const data = await response.json();
    this.coins = Object.keys(data.Data);
  },

  mounted() {
    window.addEventListener('resize', this.calculateMaxGraphElements);
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.calculateMaxGraphElements);
  },

  computed: {
    tooManyTickersAdded() {
      return this.tickers.length > 4;
    },

    startIndex() {
      return (this.page - 1) * 6;
    },

    endIndex() {
      return this.page * 6;
    },

    filteredTickers() {
      return this.tickers.filter((ticker) => ticker.name.includes(this.filter));
    },

    paginatedTickers() {
      return this.filteredTickers.slice(this.startIndex, this.endIndex);
    },

    hasNextPage() {
      return this.filteredTickers.length > this.endIndex;
    },

    pageStateOptions() {
      return {
        filter: this.filter,
        page: this.page,
      };
    },
  },

  methods: {
    calculateMaxGraphElements() {
      if (!this.$refs.graph) {
        return;
      }

      this.maxGraphElements = this.$refs.graph.clientWidth / 38;
    },

    updateTicker(tickerName, price) {
      this.tickers
        .filter((t) => t.name === tickerName)
        .forEach((t) => {
          if (t === this.selectedTicker) {
            this.graph.push(price);
            if (this.graph.length > this.maxGrathElements) {
              this.graph.shift();
            }
          }
          t.price = price;
        });
    },

    formatPrice(price) {
      if (price === '-' || price === 'INVALID_SUB' || price === undefined) {
        return price;
      }
      return price > 1 ? price.toFixed(2) : price.toPrecision(2);
    },

    async updateTickers() {
      // if (!this.tickers.length) {
      //   return;
      // }
      // const exchangeData = await loadTicker(this.tickers.map((t) => t.name));
      // console.log(exchangeData);
      // this.tickers.forEach((ticker) => {
      //   const price = exchangeData[ticker.name.toUpperCase()];
      //   ticker.price = price ?? '-';
      // });
      // this.ticker = '';
    },

    add(ticker) {
      const newTicker = {
        name: ticker,
        price: '-',
      };

      if (
        !this.tickers
          .map((i) => i.name.toLowerCase())
          .includes(ticker.toLowerCase())
      ) {
        this.tickers = [...this.tickers, newTicker];
        this.filter = '';
        subscribeToTickers(newTicker.name, (newPrice) =>
          this.updateTicker(newTicker.name, newPrice)
        );

        return (this.tickerAdded = false);
      } else {
        return (this.tickerAdded = true);
      }
    },
    select(ticker) {
      this.selectedTicker = ticker;
    },
    deleteGraph() {
      this.selectedTicker = null;
    },

    handleDelete(tickerToRemove) {
      this.tickers = this.tickers.filter((ticker) => ticker !== tickerToRemove);
      // localStorage.setItem('crypto', JSON.stringify(this.tickers));

      if (this.selectedTicker === tickerToRemove) {
        this.selectedTicker = null;
      }

      unsubscribeToTickers(tickerToRemove.name);
    },

    // validation() {
    //   return (this.currentCoins = this.coins.filter((coin) =>
    //     coin.includes(this.ticker.toUpperCase())
    //   ));
    // },
  },

  watch: {
    async selectedTicker() {
      this.graph = [];
      await this.$nextTick();
      this.calculateMaxGraphElements();
    },

    tickers() {
      localStorage.setItem('crypto', JSON.stringify(this.tickers));
    },

    paginatedTicker() {
      if (this.paginatedTickers.length === 0 && this.page > 1) {
        this.page -= 1;
      }
    },

    filter() {
      this.page = 1;
    },

    pageStateOptions(v) {
      window.history.pushState(
        null,
        document.title,
        `${window.location.pathname}?filter=${v.filter}&page=${v.page}`
      );
    },
  },
};
</script>
