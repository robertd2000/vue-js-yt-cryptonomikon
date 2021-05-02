const API_KEY =
  'cc9cbcd0bf91ff595b5e8d3f4dee816f40c535a48e9352c6f48b1ca34d8592c1';

const AGGREGATE_INDEX = '5';

const tickersHandlers = new Map(); // {}

const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

socket.addEventListener('message', (e) => {
  const { TYPE: type, FROMSYMBOL: currency, PRICE: newPrice } = JSON.parse(
    e.data
  );
  if (type !== AGGREGATE_INDEX) {
    return;
  }
  const handlers = tickersHandlers.get(currency) ?? [];
  handlers.forEach((fn) => fn(newPrice));
});
//TODO: refactor to use URLSearchParams

const sendToWsMessage = (message) => {
  const strigifiedMessage = JSON.stringify(message);

  if (socket.readyState === socket.OPEN) {
    socket.send(strigifiedMessage);
  }
  socket.addEventListener(
    'open',
    () => {
      socket.send(strigifiedMessage);
    },
    { once: true }
  );
};

const subscribeT0TickerOnWs = (ticker) => {
  sendToWsMessage({
    action: 'SubAdd',
    subs: [`5~CCCAGG~${ticker}~USD`],
  });
};

const unSubscribeT0TickerOnWs = (ticker) => {
  sendToWsMessage({
    action: 'SubRemove',
    subs: [`5~CCCAGG~${ticker}~USD`],
  });
};

export const subscribeToTickers = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || [];
  tickersHandlers.set(ticker, [...subscribers, cb]);
  subscribeT0TickerOnWs(ticker);
};

export const unsubscribeFromTickers = (ticker) => {
  tickersHandlers.delete(ticker);
  unSubscribeT0TickerOnWs(ticker);
};

window.tickers = tickersHandlers;

// получить стоимость криптовалютных пар с АПИшки?
// получать ОБНОВЛЕНИЯ стоимости криптовалютных пар с АПИШки
