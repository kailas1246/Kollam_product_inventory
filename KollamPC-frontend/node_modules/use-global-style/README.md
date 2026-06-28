# use-global-style

<p align="center">
  <br>
  <br>
  <a href="#use-global-style">
    <img alt="" src=".assets/logo.svg" width="600">
  </a>
</p>

<p align="center">
  <br>
  <br>
  <br>
  <sup>
    <a href="https://github.com/ruslan-mart/use-global-style/actions/workflows/publish.yml">
      <img src="https://img.shields.io/github/workflow/status/ruslan-mart/use-global-style/CI" alt="npm downloads" />
    </a>
    <a href="https://www.npmjs.com/package/use-global-style">
       <img src="https://img.shields.io/npm/v/use-global-style.svg" alt="npm package" />
    </a>
    <a href="https://www.npmjs.com/package/use-global-style">
       <img src="https://img.shields.io/npm/dw/use-global-style" alt="npm package" />
    </a>
  </sup>
</p>

## Description

Use this hook if you need to control global styles inside React components.

## Installation

```bash
npm install use-global-style
```

or yarn

```bash
yarn add use-global-style
```

## Syntax

```
useGlobalStyle(
  selector: string | string[],
  styles: CSSProperties,
  options?: UseGlobalStyleOptions = {
    enabled?: boolean = true,
    importantAll?: boolean = false,
    media?: string,
  }
)
```

## API

### `useGlobalStyle` hook

#### Parameters

##### _`selector`_

Required parameter.

The value is `string` or `string[]`, that contains one or more selectors for matching. This value must be CSS selectors's allowed value; if it is not, then the `SYNTAX_ERR` exception is generated.

##### _`styles`_

Required parameter.

CSS properties's object that matches `React.CSSProperties` type.

##### _`options`_

Optional parameter.

Object with additional options that matches `UseGlobalStyleOptions` type.

List of possible options:

+ _`enabled`_ takes the `boolean` value. If the value is `false`, the styles will not be initialized in `CSSOM`. The default value is `true`.
+ _`importantAll`_ — takes the `boolean` value, that sets `!important` on each CSS prop. The default value is `false`.
+ _`media`_ — takes the `string` value. Sets media query for styles (for example: `"screen and (max-width: 640px)"`).

## Examples

### Hide body scroll

When you render the component, the scroll is hidden inside `body`.

```tsx
const SomeComponent = () => {
  useGlobalStyle('body', {
    overflow: 'hidden',
  });
  
  return (
    <div>Some text</div>
  );
};
```

### Toggle body scroll

When you click the button, it toggles the scroll inside `body`.

```tsx
const SomeComponent = () => {
  const [hiddenScroll, setHiddenScroll] = useState(false);
  
  useGlobalStyle('body', {
    overflow: 'hidden',
  }, {
    enabled: hiddenScroll,
  });
  
  const handleButtonClick = () => {
    setHiddenScroll((value) => !value);
  };
  
  return (
    <button onClick={handleButtonClick}>
      Toggle body scroll
    </button>
  );
};
```

### Change font size

When you render the component, you can change font size in rooted `html`, but only for smartphone displays.

```tsx
const SomeComponent = () => {
  useGlobalStyle(':root', {
    fontSize: '62.5%',
  }, {
    media: 'all and (max-width: 640px)',
  });
  
  return (
    <div style={{ fontSize: '16rem' }}>
      Some text
    </div>
  );
};
```

### Change styles of third-party plugins

When you render the component, the `.js-mart-slider` element changes its background color, its internal borders and other styles.

```tsx
const SomeComponent = () => {
  useGlobalStyle('.js-mart-slider', {
    backgroundColor: '#ffffff',
    borderColor: 'transparent',
  }, {
    importantAll: true,
  });

  useGlobalStyle('.js-mart-slider__content', {
    padding: '16px',
  }, {
    importantAll: true,
  });

  useGlobalStyle([
    '.js-mart-slider__content > img',
    '.js-mart-slider__content > video',
  ], {
    alignSelf: 'center',
    display: 'block',
    maxWidth: '100%',
  }, {
    importantAll: true,
  });

  return (
    <div>Some text</div>
  );
};
```
