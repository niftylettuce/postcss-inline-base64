# PostCSS Inline Base64
[![Build Status][ci-img]][ci]
[![Coverage Status][cover-img]][cover]

[PostCSS] plugin for replace file to base64 encode.

[PostCSS]:   https://github.com/postcss/postcss
[ci-img]:    https://travis-ci.org/lagden/postcss-inline-base64.svg
[ci]:        https://travis-ci.org/lagden/postcss-inline-base64
[cover-img]: https://codecov.io/gh/lagden/postcss-inline-base64/branch/master/graph/badge.svg
[cover]:     https://codecov.io/gh/lagden/postcss-inline-base64


```css
@font-face {
  font-family: 'example';
  src: url(b64---../fonts/example.woff---) format('woff');
  font-weight: normal;
  font-style: normal;
}

body {
  background-color: gray;
  background-image: url("b64---http://cdn.lagden.in/xxx.png---")
}

.example {
  background-image: url('http://cdn.lagden.in/mask.png');
}

.invalid {
  background-image: url(b64---'http://invalid.com/err.png'---);
}
```

```css
@font-face {
  font-family: 'example';
  src: url(data:application/font-woff;charset=utf-8;base64,d09...eLAAAA==) format('woff');
  font-weight: normal;
  font-style: normal;
}

body {
  background-color: gray;
  background-image: url("data:image/png;charset=utf-8;base64,iVBORw0K...SuQmCC");
}

.example {
  background-image: url('http://cdn.lagden.in/mask.png');
}

.invalid {
  background-image: url(http://invalid.com/err.png)/* b64 error: invalid url or file */;
}
```

## Usage

See [syntax](https://github.com/lagden/postcss-inline-base64/blob/master/test/fixtures/syntax.css)

```js
postcss([ require('postcss-inline-base64')(options) ])
```

### Options

Type: `object`

#### baseDir

Type: `string`
Default: `./`

The directory where the css file are located.

---

See [PostCSS] docs for examples for your environment.


## License

MIT © [Thiago Lagden](http://lagden.in)
