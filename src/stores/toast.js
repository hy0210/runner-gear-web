import { defineStore } from 'pinia';

const AUTO_HIDE_MS = 3500;
let nextId = 1;

// 畫面右下角的提示訊息
export const useToastStore = defineStore('toast', {
  state: () => ({ messages: [] }),
  actions: {
    // kind：success | error | info
    show(text, kind = 'success') {
      const id = nextId++;
      this.messages.push({ id, text, kind });
      setTimeout(() => this.dismiss(id), AUTO_HIDE_MS);
      return id;
    },
    dismiss(id) {
      this.messages = this.messages.filter((message) => message.id !== id);
    },
  },
});
