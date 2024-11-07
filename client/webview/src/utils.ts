export const isObjectEmpty = (object: Record<string, unknown>) => Object.keys(object).length === 0;
export const isNumberInRange = (n: number, min: number, max: number) => n >= min && n <= max;

/* eslint-disable @typescript-eslint/no-explicit-any */
export const debounce = (fn: (...args: any[]) => any, delay: number = 100) => {
  let timeoutId: number;

  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(fn, delay, ...args);
  };
};

export function throttle(fn: (...args: any[]) => any, delay: number = 100) {
  let isThrottled = false;
  let args: any[] | null;
  let that: any | null;

  return function wrapper(this: any, ...nextArgs: any[]) {
    if (isThrottled) {
      args = nextArgs;
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      that = this;
      return;
    }

    fn.apply(this, nextArgs);
    isThrottled = true;

    setTimeout(() => {
      isThrottled = false;

      if (args) {
        wrapper.apply(that, args);
        args = that = null;
      }
    }, delay);
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
