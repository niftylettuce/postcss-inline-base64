# PostCSS Inline Base64
[![Build Status][ci-img]][ci]
[![Coverage Status][cover-img]][cover]

[PostCSS] plugin for replace file to base64 encode.

[PostCSS]:   https://github.com/postcss/postcss
[ci-img]:    https://travis-ci.org/lagden/postcss-inline-base64.svg
[ci]:        https://travis-ci.org/lagden/postcss-inline-base64
[cover-img]: https://codecov.io/github/lagden/utils/coverage.svg?branch=master
[cover]:     https://codecov.io/github/lagden/utils?branch=master

```css
@font-face {
  font-family: 'example';
  src: url(base64(../fonts/example.woff)) format('woff');
  font-weight: normal;
  font-style: normal;
}

body {
  background-color: gray;
  background-image: url(base64(http://cdn.lagden.in/xxx.png))
}

.example {
  background-image: url('http://cdn.lagden.in/mask.png');
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
  background-image: url(data:image/png;charset=utf-8;base64,iVBORw0K...SuQmCC);
}

.example {
  background-image: url('http://cdn.lagden.in/mask.png');
}
```

## Usage

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
