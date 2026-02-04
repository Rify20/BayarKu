const KEY = "bayarku_pos_v1";

export function defaultState() {
  return {
    store: {
      name: "Warung Kopi rifdev",
      phone: "+62 812-3456-7890",
      address: "Jl. Merdeka No. 45, Jakarta Selatan, Indonesia",
    },
    receipt: {
      headerText: "Welcome to {store_name}!\nPlease enjoy your stay.",
      footerText:
        "Thank you for your visit.\nFollow us @rifdevpos for more info!\nGoods once sold are not returnable.",
      options: {
        showLogo: true,
        showTxnId: true,
        compactMode: false,
        printQr: true,
      },
    },
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}
