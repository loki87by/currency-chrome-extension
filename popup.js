let start = document.getElementById("select");

start.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: select,
  });
});

function select() {
  const apiKey = "fyhPyfOp46lGmGXaUivdBva7esLxo0A5";
  let rates = {};
  let localCurrency = "RUB";
  let targetCurrency = "USD";
  let baseValue = 0;
  let targetValue = 0;
  let allCurrencies = ["RUB", "BYN", "USD", "EUR", "BTC"];
  let basedCurrencies = ["RUB", "BYN", "USD", "EUR", "BTC"];
  let targetCurrencies = ["BYN", "USD", "EUR", "BTC"];
  let mouse;

  document.addEventListener("dblclick", (e) => {
    mouse = e;
  });
  document.addEventListener("mousemove", (e) => {
    mouse = e;
  });

  function getRates(currency) {
    let value = "USD";

    if (currency) {
      value = currency;
    }
    return fetch(
      `https://api.apilayer.com/exchangerates_data/latest?base=${value}`,
      {
        method: "GET",
        headers: {
          apikey: apiKey,
        },
      }
    )
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          alert(sorry);
        }
      })
      .catch((error) => console.log("error", error));
  }

  const createElement = (tagName, params, container, text) => {
    const element = document.createElement(tagName);

    if (text) {
      element.textContent = text;
    }

    Object.entries(params).forEach((param) => {
      element.setAttribute(String(param[0]), String(param[1]));
    });

    if (container) {
      container.appendChild(element);
    }

    return element;
  };

  function renderOptions(array, selector, target) {
    while (selector.firstChild) {
      selector.removeChild(selector.lastChild);
    }
    array.forEach((currency) => {
      const option = createElement(
        "option",
        { value: currency },
        selector,
        currency
      );

      if (option.value === target) {
        option.selected = true;
      }
    });
  }

  const stringifyBigValue = (num) => {
    const integer = Math.floor(num);
    const fraction = (Math.floor((integer - num) * 100) / 100 + "").split(".");
    const stringifyIntegerArray = `${integer}`.split("");

    if (stringifyIntegerArray.length < 4) {
      return num;
    }
    for (let i = stringifyIntegerArray.length - 4; i >= 0; i -= 3) {
      stringifyIntegerArray[i] += ",";
    }
    const intString = stringifyIntegerArray.join("");
    return `${intString}.${fraction[1]}`;
  };

  function renderTotalText(value, targetValue, currency) {
    const total = document.getElementById("total");
    total.textContent =
      value > 0 ? `Итого: ${stringifyBigValue(targetValue)} ${currency}` : "";
  }

  function changeTargetValue(args) {
    const { thisValue, thisCurrency, thisRates } = args;
    let currentValue = baseValue;
    let currentCurrency = localCurrency;
    let currentRates = rates;

    if (thisValue) {
      currentValue = thisValue;
    }

    if (thisCurrency) {
      currentCurrency = thisCurrency;
    }

    if (thisRates) {
      currentRates = thisRates;
    }
    const newValue =
      Math.floor((currentValue / currentRates[currentCurrency]) * 100) / 100;
    targetValue = newValue;
    renderTotalText(baseValue, targetValue, targetCurrency);
  }

  function changeTargetedCurrency(e) {
    const newValue = e.target.value;
    targetCurrency = newValue;
    getRates(newValue).then((res) => {
      rates = res.rates;
      changeTargetValue({ thisRates: res.rates });
    });
  }

  function changeBaseValue(e) {
    const newValue = e.target.value;
    baseValue = newValue;
    changeTargetValue({ thisValue: newValue });
  }

  function renderPlaceholder(currency) {
    const input = document.querySelector("input");
    input.placeholder = `Сколько у вас ${currency}`;
  }

  const getDistance = (current, max, size) => {
    return current <= max / 2 ? current + 20 : current - size - 20;
  };

  function changeCurrency(e) {
    const newValue = e.target.value;
    localCurrency = newValue;
    renderPlaceholder(newValue);
    changeTargetValue({ thisCurrency: newValue });
    targetCurrencies = allCurrencies.filter((cur) => cur !== localCurrency);
    const targetedSelect = document.getElementById("target-select");
    renderOptions(targetCurrencies, targetedSelect, targetCurrency);
  }

  function showPopup(num, position) {
    baseValue = num;
    const posX = position.clientX;
    const posY = position.clientY;
    const body = document.querySelector("body");
    const clientWidth = body.clientWidth;
    const clientHeight = body.clientHeight;
    let popup = document.getElementById("currency-popup");

    if (!popup) {
      popup = createElement("section", { id: "currency-popup" }, body);
      const close = createElement(
        "h2",
        {
          style:
            "position: absolute; top: -30px; right: -35px; transform: rotate(45deg); font-size: 45px; line-height: 0.7; backdrop-filter: blur(1px); cursor: pointer",
        },
        popup,
        "+"
      );
      close.addEventListener("click", () => {
        popup.remove();
      });
      createElement(
        "p",
        { style: "margin: 5px auto; text-align: center;" },
        popup,
        "Выберите вашу валюту"
      );
      const basedSelect = createElement(
        "select",
        { id: "based-select" },
        popup
      );
      renderOptions(basedCurrencies, basedSelect, localCurrency);
      const input = createElement(
        "input",
        {
          id: "start-value",
          type: "number",
          value: baseValue,
          placeholder: `Сколько у вас ${localCurrency}`,
        },
        popup
      );
      input.addEventListener("input", changeBaseValue);
      createElement(
        "p",
        { style: "margin: 5px auto; text-align: center;" },
        popup,
        "Выберите нужную валюту"
      );
      const targetedBlock = createElement(
        "div",
        { style: "display: flex; justify-content: space-between" },
        popup
      );
      createElement("select", { id: "target-select" }, targetedBlock);
      createElement("h3", { id: "total" }, targetedBlock, "");
    } else {
      const input = document.getElementById("start-value");
      input.value = num;
    }
    popup.setAttribute(
      "style",
      `position: fixed; z-index: 5; top: ${getDistance(
        posY,
        clientHeight,
        popup.clientHeight
      )}px; left: ${getDistance(
        posX,
        clientWidth,
        popup.clientWidth
      )}px; padding: 1vw; border: 4px solid #35c969; background: #f9e0ba;`
    );
    const basedSelect = document.getElementById("based-select");
    basedSelect.addEventListener("change", changeCurrency);
    const targetedSelect = document.getElementById("target-select");
    targetedSelect.addEventListener("change", changeTargetedCurrency);
    renderOptions(targetCurrencies, targetedSelect, targetCurrency);
    getRates(targetCurrency).then((res) => {
      rates = res.rates;
      changeTargetValue({ thisRates: res.rates });
    });
  }

  document.onselectionchange = function () {
    const selection = document.getSelection().toString();
    const isNumeric = (n) => !isNaN(n);
    if (selection.length > 0 && isNumeric(selection)) {
      baseValue = +selection;
      showPopup(+selection, mouse);
    }
  };
}
