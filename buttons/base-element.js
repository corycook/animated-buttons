const when = type => {
  return new Promise(resolve => {
    const listener = event => {
      resolve(event);
      document.removeEventListener(type, listener);
    };
    document.addEventListener(type, listener);
  });
};

const debounce = fn => {
  let called = false;
  return (...args) => {
    if (!called) {
      called = true;
      requestAnimationFrame(() => {
        fn(...args);
        called = false;
      });
    }
  };
};

function BaseElement() {
  const scope = document.currentScript.ownerDocument;

  return class extends HTMLElement {
    get document() {
      return scope;
    }

    get template() {
      return this.document.querySelector("template");
    }

    constructor() {
      super();
      this.eventHandlers = [];
      const shadow = this.createShadowRoot();
      const content = this.template.content.cloneNode(true);
      shadow.appendChild(content);
    }

    on(type, method) {
      const handler = (...args) =>
        (typeof method === "string" &&
          method in this &&
          this[method](...args)) ||
        (typeof method === "function" && method(...args));
      this.addEventListener(type, handler);
      return () => this.removeEventListener(type, handler);
    }

    connectedCallback() {
      this.eventHandlers.push(
        this.on("mouseover", "onMouseOver"),
        this.on("mouseout", "onMouseOut"),
        this.on("mousemove", debounce(e => this.onMouseMove(e)))
      );
      return document.readyState === "loading"
        ? when("DOMContentLoaded").then(() => this.componentDidMount())
        : Promise.resolve(this.componentDidMount());
    }

    componentDidMount() {}

    onMouseMove() {}

    disconnectedCallback() {
      while (this.eventHandlers.length) {
        this.eventHandlers.pop()();
      }
    }
  };
}
