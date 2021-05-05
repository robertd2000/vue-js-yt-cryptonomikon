const API_KEY =
  'cc9cbcd0bf91ff595b5e8d3f4dee816f40c535a48e9352c6f48b1ca34d8592c1';

const AGGREGATE_INDEX = '5';

let valute = 'USD';

const tickersHandlers = new Map(); // {}
const valuteHandlers = new Map();

const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

socket.addEventListener('message', (e) => {
  let {
    TYPE: type,
    FROMSYMBOL: currency,
    PRICE: newPrice,
    PARAMETER: param,
    MESSAGE: message,
  } = JSON.parse(e.data);

  if (message === 'INVALID_SUB') {
    const p = param.split('~')[2];
    const handlers = tickersHandlers.get(p) ?? [];

    valute = 'BTC';

    valuteHandlers.set(p, 'BTC');

    handlers.forEach((fn) => {
      fn(newPrice, message);
    });
  }
  if (type !== AGGREGATE_INDEX || newPrice === undefined) {
    return;
  } else {
    const handlers = tickersHandlers.get(currency) ?? [];
    valute = 'USD';
    valuteHandlers.set(currency, 'USD');

    handlers.forEach((fn) => {
      fn(newPrice);
    });
  }
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

const subscribeT0TickerOnWs = (ticker, valute) => {
  sendToWsMessage({
    action: 'SubAdd',
    subs: [`5~CCCAGG~${ticker}~${valute}`],
  });
};

const unSubscribeT0TickerOnWs = (ticker, valute) => {
  sendToWsMessage({
    action: 'SubRemove',
    subs: [`5~CCCAGG~${ticker}~${valute}`],
  });
};

export const subscribeToTickers = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || [];
  valuteHandlers.set(ticker, valute);
  tickersHandlers.set(ticker, [...subscribers, cb]);
  //
  console.log(valuteHandlers);
  let currentVal = valuteHandlers.get(ticker);
  console.log(currentVal);

  if (currentVal === 'BTC') {
    subscribeT0TickerOnWs(ticker, 'BTC');
  }
  subscribeT0TickerOnWs(ticker, currentVal);
};

export const unsubscribeFromTickers = (ticker) => {
  tickersHandlers.delete(ticker);
  unSubscribeT0TickerOnWs(ticker, valute);
};

window.tickers = tickersHandlers;
window.val = valuteHandlers;

// получить стоимость криптовалютных пар с АПИшки?
// получать ОБНОВЛЕНИЯ стоимости криптовалютных пар с АПИШки
